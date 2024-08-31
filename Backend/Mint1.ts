import express from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import GIFEncoder from "gif-encoder-2";

// Constants and configurations
const QUICKNODE_RPC = "https://api.devnet.solana.com";
const PINATA_API_KEY = "";
const PINATA_SECRET_API_KEY = "";
const SECRET_KEY_PATH = "";
const BASE_BACKGROUND_PATH = path.join(__dirname, "assets", "BaseBackground.png");

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: "finalized" });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), "utf8"));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

async function uploadToPinata(imageBuffer, filename) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const data = new FormData();
  data.append("file", imageBuffer, filename);

  const response = await axios.post(url, data, {
    headers: {
      ...data.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_API_KEY,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (response.status === 200) {
    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
  } else {
    throw new Error(`Failed to upload image to Pinata: ${response.statusText}`);
  }
}

async function createAndMintNFT(name, imageSrc, walletAddress) {
  try {
    const background = await Jimp.read(BASE_BACKGROUND_PATH);
    const athleteImage = await Jimp.read(imageSrc);
    athleteImage.resize(300, 300);
    background.composite(athleteImage, 100, 100); // Position the athlete image on the background

    const gifEncoder = new GIFEncoder(background.bitmap.width, background.bitmap.height);
    gifEncoder.start();
    gifEncoder.setRepeat(0);
    gifEncoder.setDelay(500);

    // Creating a GIF with a single frame
    gifEncoder.addFrame(background.bitmap.data);
    gifEncoder.finish();

    const buffer = gifEncoder.out.getData();
    fs.writeFileSync("athlete.gif", buffer);

    const imageUrl = await uploadToPinata(buffer, `${name}.gif`);

    const metadata = {
      name,
      description: `A unique ${name} NFT.`,
      image: imageUrl,
    };

    const metadataUrl = await uploadToPinata(Buffer.from(JSON.stringify(metadata)), `${name}_metadata.json`);

    const toPublicKey = new PublicKey(walletAddress);
    const { nft } = await METAPLEX.nfts().create({
      uri: metadataUrl,
      name,
      sellerFeeBasisPoints: 500,
      symbol: "OLYMPICS",
      creators: [{ address: WALLET.publicKey, share: 100 }],
    });

    const mintAddress = nft.address.toString();
    const { blockhash, lastValidBlockHeight } = await SOLANA_CONNECTION.getLatestBlockhash();
    const transferTransaction = METAPLEX.nfts().builders().transfer({
      nftOrSft: nft,
      toOwner: toPublicKey,
      authority: WALLET,
    }).toTransaction({ blockhash, lastValidBlockHeight });

    transferTransaction.feePayer = WALLET.publicKey;
    const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION, transferTransaction, [WALLET]);

    console.log(`✅ - Minted and transferred NFT: ${mintAddress}`);
    console.log(`     Transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    return { mintAddress, metadataUrl };
  } catch (error) {
    console.error("Minting failed:", error);
    return { mintAddress: "default_mint_address", metadataUrl: "default_metadata_url" };
  }
}

app.post("/mintWormholeNFT", async (req, res) => {
  const { name, imageSrc, walletAddress } = req.body;
  try {
    const result = await createAndMintNFT(name, imageSrc, walletAddress);
    res.status(200).json({
      success: true,
      message: "NFT minted successfully!",
      mintAddress: result.mintAddress,
      metadataUrl: result.metadataUrl,
    });
  } catch (error) {
    console.error("Minting failed:", error);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
