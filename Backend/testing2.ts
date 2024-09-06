import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import FormData from 'form-data';
import { wormhole } from "@wormhole-foundation/sdk";
import { signSendWait } from "@wormhole-foundation/sdk-connect";  // Assuming you're using this utility

const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const PINATA_API_KEY = '22176c283b41e5f0a39a';
const PINATA_SECRET_API_KEY = 'b0f729cbd31536d2f71dd69b8f375121bebe7b5f40716805a8c8fbcadfb18663';
const SECRET_KEY_PATH = 'C:/Users/Patri/cm-v3-demo/my-devnet-wallet.json';

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

const wormholeSDK = await wormhole("Testnet", [solana, evm]);

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

// Mint NFT - Solana (without sending the transaction)
async function createAndMintNFTWithoutTransfer(name, metadataUrl) {
  try {
    const { nft } = await METAPLEX.nfts().create({
      uri: metadataUrl,
      name: name,
      sellerFeeBasisPoints: 500,
      symbol: "WNFT",
      creators: [{ address: WALLET.publicKey, share: 100 }]
    });

    const mintAddress = nft.address.toString();

    console.log(`✅ - Minted NFT: ${mintAddress}`);
    return { mintAddress, nft };
  } catch (error) {
    console.error("Minting failed:", error);
    throw error;
  }
}

// Attest the NFT on Solana
async function attestNFT(nftAddress) {
  try {
    const tokenBridge = await wormholeSDK.getChain("Solana").getTokenBridge();
    const nftPublicKey = new PublicKey(nftAddress);
    
    const attestationTxGenerator = tokenBridge.createAttestation(nftPublicKey.toString());
    
    // Sign and send attestation
    const txids = await signSendWait(wormholeSDK.getChain("Solana"), attestationTxGenerator, WALLET);
    console.log(`✅ - Attestation Transaction ID: ${txids.join(', ')}`);
    
    // Fetch the attestation message
    const messageId = await tokenBridge.getTransferMessage(wormholeSDK.getChain("Solana"), txids[0], 60000);
    console.log(`✅ - Attestation Message ID: ${messageId.sequence}`);

    console.log(`Transaction link: https://explorer.solana.com/tx/${txids[0]}?cluster=devnet`);
    return { success: true, messageId };
  } catch (error) {
    console.error('Attestation failed:', error);
    throw error;
  }
}

// Endpoint to handle NFT creation, minting, and attestation
app.post('/mintWormholeNFT', async (req, res) => {
  const { name, imageSrc } = req.body;

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

    const metadataUrl = await uploadJsonToPinata(metadata, `${name}_metadata.json`);

    // Step 1: Mint the NFT
    const { mintAddress, nft } = await createAndMintNFTWithoutTransfer(name, metadataUrl);

    // Step 2: Attest the NFT
    const { messageId } = await attestNFT(mintAddress);

    res.status(200).json({
      success: true,
      mintAddress,
      metadataUrl,
      messageId
    });
  } catch (error) {
    console.error("Minting or attestation failed:", error);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
