import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import FormData from 'form-data';

const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const PINATA_API_KEY = '';
const PINATA_SECRET_API_KEY = '';
const SECRET_KEY_PATH = '';

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Upload image to Pinata
async function uploadToPinata(imageBuffer, filename) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const data = new FormData();
  data.append('file', imageBuffer, filename);

  const response = await axios.post(url, data, {
    headers: {
      ...data.getHeaders(),
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
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

// Upload JSON metadata to Pinata
async function uploadJsonToPinata(jsonData, filename) {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  const response = await axios.post(url, {
    pinataContent: jsonData,
    pinataMetadata: { name: filename }
  }, {
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 200) {
    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
  } else {
    throw new Error(`Failed to upload JSON to Pinata: ${response.statusText}`);
  }
}

// Mint NFT - Solana
async function createAndMintNFT(name, metadataUrl, walletAddress) {
  try {
    const toPublicKey = new PublicKey(walletAddress);
    const { nft } = await METAPLEX.nfts().create({
      uri: metadataUrl,
      name: name,
      sellerFeeBasisPoints: 500,
      symbol: "WNFT",
      creators: [{ address: WALLET.publicKey, share: 100 }]
    });

    const mintAddress = nft.address.toString();

    // Transfer NFT to user's wallet
    const transactionBuilder = METAPLEX.nfts().builders().transfer({
      nftOrSft: nft,
      toOwner: toPublicKey,
      authority: WALLET,
    });

    // Get latest blockhash and block height
    const { blockhash, lastValidBlockHeight } = await SOLANA_CONNECTION.getLatestBlockhash();

    // Build transaction
    const transaction = transactionBuilder.toTransaction({
      blockhash,
      lastValidBlockHeight,
    });

    const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION, transaction, [WALLET]);

    console.log(`✅ - Minted and transferred NFT: ${mintAddress}`);
    console.log(`Transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    return { mintAddress, metadataUrl };
  } catch (error) {
    console.error("Minting failed:", error);
    throw error;
  }
}

// Endpoint to handle NFT creation and minting
app.post('/mintWormholeNFT', async (req, res) => {
  const { name, imageSrc, walletAddress } = req.body;

  try {
    const dynamicDescription = `Bet on ${name}. If conditions are met, the NFT will increase in value and can be redeemed.`;

    const imageBuffer = fs.readFileSync(path.resolve(imageSrc));

    const imageUrl = await uploadToPinata(imageBuffer, `${name}.jpg`);

    const metadata = {
      name: name,
      description: dynamicDescription,
      image: imageUrl,
      attributes: [
        { trait_type: "Event", value: name },
        { trait_type: "Condition", value: "If the conditions are met, the NFT will increase in value." }
      ]
    };

    // Upload metadata to Pinata
    const metadataUrl = await uploadJsonToPinata(metadata, `${name}_metadata.json`);

    // Mint the NFT using the Metaplex SDK
    const { mintAddress } = await createAndMintNFT(name, metadataUrl, walletAddress);

    res.status(200).json({ success: true, mintAddress, metadataUrl });
  } catch (error) {
    console.error("Minting failed:", error);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
