import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { ethers } from 'ethers';
import { CHAIN_ID_SOLANA, CHAIN_ID_ETH, getEmitterAddressSolana, getSignedVAAWithRetry, createWrappedOnEth, attestFromSolana } from '@certusone/wormhole-sdk';

const GIFEncoder = require('gif-encoder-2');

// Constants and configurations
const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const PINATA_API_KEY = '22176c283b41e5f0a39a';
const PINATA_SECRET_API_KEY = 'b0f729cbd31536d2f71dd69b8f375121bebe7b5f40716805a8c8fbcadfb18663';
const SECRET_KEY_PATH = 'C:/Users/Patri/cm-v3-demo/my-devnet-wallet.json';
const ETH_SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY'; // Replace with your Alchemy Sepolia API Key

// Initialize Solana connection and Metaplex
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

// Function to upload image to Pinata
async function uploadToPinata(imageBuffer: Buffer, filename: string): Promise<string> {
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

// Function to upload JSON metadata to Pinata
async function uploadJsonToPinata(jsonData: any, filename: string): Promise<string> {
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

// Function to create and mint the NFT
async function createAndMintNFT(
  name: string,
  stats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number },
  gender: string,
  nature: string,
  shiny: string,
  types: string[],
  walletAddress: string
): Promise<{ mintAddress: string; metadataUrl: string }> {
  try {
    const finalName = name || 'Test Name';
    const finalStats = stats || { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 };
    const finalGender = gender || 'Test Gender';
    const finalNature = nature || 'Test Nature';
    const finalShiny = shiny || 'No';
    const finalTypes = types.length ? types : ['normal'];

    const gifEncoder = new GIFEncoder(400, 400);  // Arbitrary size for the GIF
    gifEncoder.start();
    gifEncoder.setRepeat(0);

    const buffer = gifEncoder.out.getData();
    fs.writeFileSync('test001.gif', buffer);

    const imageUrl = await uploadToPinata(buffer, `${finalName}.gif`);
    const metadata = {
      name: finalName,
      description: `A unique ${finalName} Pokémon with custom stats.`,
      image: imageUrl,
      attributes: [
        { trait_type: "HP", value: finalStats.hp },
        { trait_type: "Attack", value: finalStats.attack },
        { trait_type: "Defense", value: finalStats.defense },
        { trait_type: "Special Attack", value: finalStats.specialAttack },
        { trait_type: "Special Defense", value: finalStats.specialDefense },
        { trait_type: "Speed", value: finalStats.speed },
        { trait_type: "Gender", value: finalGender },
        { trait_type: "Nature", value: finalNature },
        { trait_type: "Shiny", value: finalShiny },
        ...finalTypes.map((type: string) => ({ trait_type: "Type", value: type }))
      ]
    };

    const metadataUrl = await uploadJsonToPinata(metadata, `${finalName}_metadata.json`);

    const toPublicKey = new PublicKey(walletAddress);
    const { nft } = await METAPLEX.nfts().create({
      uri: metadataUrl,
      name: finalName,
      sellerFeeBasisPoints: 500,
      symbol: "WNFT",
      creators: [{ address: WALLET.publicKey, share: 100 }]
    });

    const mintAddress = nft.address.toString();

    console.log(`✅ - Minted NFT: ${mintAddress}`);
    return { mintAddress, metadataUrl };
  } catch (error) {
    console.error('Minting failed:', error);
    return { mintAddress: 'default_mint_address', metadataUrl: 'default_metadata_url' };
  }
}

// Function to attest and bridge the NFT
async function attestAndBridgeNFT(nftAddress: string, walletAddress: string) {
  try {
    console.log('Starting NFT Attestation process...');

    const tokenBridgeAddress = "Token Bridge Address for Solana";  // Replace this with actual Token Bridge address
    const connection = new Connection(QUICKNODE_RPC);

    const emitterAddressSolana = await getEmitterAddressSolana(tokenBridgeAddress);

    console.log('Attesting NFT on Solana...');
    const transaction = await attestFromSolana(
      connection,  
      tokenBridgeAddress,  
      nftAddress,             // Mint address of the NFT
      WALLET.publicKey,       // Public key of the wallet
      WALLET.publicKey        // Payer address (same as wallet public key)
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [WALLET]);
    console.log(`✅ - Attestation submitted on Solana with tx: ${signature}`);

    console.log('Fetching the signed VAA for attestation...');
    const signedVAA = await getSignedVAAWithRetry(
      ["https://wormhole-v2-testnet-api.certus.one"],
      CHAIN_ID_SOLANA,
      emitterAddressSolana,
      signature
    );

    const vaaBytes = signedVAA.vaaBytes;  // Extract the vaaBytes

    console.log('✅ - Successfully fetched the signed VAA for attestation.');

    const provider = new ethers.providers.JsonRpcProvider(ETH_SEPOLIA_RPC);
    const ethWallet = new ethers.Wallet('YOUR_ETH_PRIVATE_KEY', provider); // Replace with your private key

    console.log('Creating wrapped NFT on Ethereum Sepolia...');
    const tx = await createWrappedOnEth(
      tokenBridgeAddress,
      ethWallet,
      vaaBytes
    );
    console.log(`✅ - Successfully created wrapped NFT on Ethereum Sepolia. Transaction hash: ${tx.transactionHash}`);

    return {
      success: true,
      txId: tx.transactionHash,
      message: 'NFT attested and bridged successfully!',
    };
  } catch (error) {
    console.error('❌ - Error during the attestation and bridge process:', error);
    return { success: false, error: error.message };
  }
}

// Express server setup
const app = express();
app.use(express.json());

app.post('/mintAndBridgeNFT', async (req, res) => {
  const { name, stats, gender, nature, shiny, types, walletAddress } = req.body;
  try {
    const mintResult = await createAndMintNFT(name, stats, gender, nature, shiny, types, walletAddress);

    if (!mintResult.mintAddress) {
      throw new Error('Failed to mint the NFT.');
    }

    const bridgeResult = await attestAndBridgeNFT(mintResult.mintAddress, walletAddress);

    if (!bridgeResult.success) {
      throw new Error('Failed to bridge the NFT.');
    }

    res.status(200).json({
      success: true,
      message: 'NFT minted and bridged successfully!',
      mintAddress: mintResult.mintAddress,
      bridgeTx: bridgeResult.txId,
    });
  } catch (error) {
    console.error('Error during minting and bridging:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
// https://chatgpt.com/c/66d8bf0b-d5a8-8009-82d4-8fed63d9b991