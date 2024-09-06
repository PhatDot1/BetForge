import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import FormData from 'form-data';
import { ethers } from 'ethers';
import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
  getSignedVAAWithRetry,
  ChainId,
} from '@certusone/wormhole-sdk';
import {
  attestFromEth,
  getNFTBridgeAddressForChain,
} from '@certusone/wormhole-sdk/lib/esm/nft_bridge';

// Your configuration variables
const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const PINATA_API_KEY = '22176c283b41e5f0a39a';
const PINATA_SECRET_API_KEY = 'b0f729cbd31536d2f71dd69b8f375121bebe7b5f40716805a8c8fbcadfb18663';
const SECRET_KEY_PATH = 'C:/Users/Patri/cm-v3-demo/my-devnet-wallet.json';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Upload image to Pinata
async function uploadToPinata(imageBuffer: Buffer, filename: string) {
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
async function uploadJsonToPinata(jsonData: object, filename: string) {
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
async function createAndMintNFT(name: string, metadataUrl: string, walletAddress: string) {
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

// Attest NFT to Wormhole
async function attestNFTToWormhole(nftAddress: string, signer: ethers.Signer, chainId: ChainId) {
  try {
    const wormholeNFTBridgeAddress = getNFTBridgeAddressForChain(chainId);
    const attestTx = await attestFromEth(wormholeNFTBridgeAddress, signer, nftAddress);
    const attestReceipt = await attestTx.wait();

    console.log('✅ - Attestation transaction mined:', attestReceipt.transactionHash);

    // Parse the sequence number
    const emitterAddress = getEmitterAddressEth(wormholeNFTBridgeAddress);
    const sequence = parseSequenceFromLogEth(attestReceipt, wormholeNFTBridgeAddress);

    console.log(`✅ - Sequence: ${sequence}`);

    // Fetch the signed VAA
    const { vaaBytes } = await getSignedVAAWithRetry(
      ["https://wormhole-v2-mainnet-api.certus.one"], // Wormhole guardian RPC endpoints
      chainId,
      emitterAddress,
      sequence
    );

    console.log('✅ - Successfully fetched signed VAA:', vaaBytes);
  } catch (error) {
    console.error('Attestation failed:', error);
    throw error;
  }
}

// Endpoint to handle NFT creation, minting, and attestation
app.post('/mintWormholeNFT', async (req, res) => {
  const { name, imageSrc, walletAddress, chainId, signerPrivateKey } = req.body;

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

    // Attest the NFT to Wormhole
    const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_RPC);
    const signer = new ethers.Wallet(signerPrivateKey, provider);

    await attestNFTToWormhole(mintAddress, signer, chainId);

    res.status(200).json({ success: true, mintAddress, metadataUrl });
  } catch (error) {
    console.error("Minting or attestation failed:", error);
    res.status(500).json({ success: false, error: error.toString() });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));


// https://chatgpt.com/c/989b421c-dcaf-44fb-9057-b7d73eb7e3a3