import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { ethers } from 'ethers';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import {
    attestFromSolana,
    getEmitterAddressSolana,
    getSignedVAAWithRetry,
    parseSequenceFromLogSolana,
    transferFromSolana,
    createWrappedOnEth,
    redeemOnEth
} from '@certusone/wormhole-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import FormData from 'form-data';

const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const PINATA_API_KEY = '';
const PINATA_SECRET_API_KEY = '';
const SECRET_KEY_PATH = '';
const ARBITRUM_RPC_URL = 'https://arbitrum-sepolia.infura.io/v3/[redacted]';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

const ARBITRUM_PRIVATE_KEY = ''; // Your Arbitrum private key
const ARBITRUM_BRIDGE_ADDRESS = '0xC7A204bDBFe983FCD8d8E61D02b475D4073fF97e'; // Arbitrum Sepolia Token Bridge Address

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

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

// Mint NFT on Solana
async function createAndMintNFT(name, metadataUrl) {
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
        
        // Now, attest, lock, bridge and transfer the NFT to Arbitrum
        return mintAddress;
    } catch (error) {
        console.error("Minting failed:", error);
        throw error;
    }
}

// Attest, Lock, and Bridge the NFT to Arbitrum
async function bridgeNFTToArbitrum(mintAddress: string, userArbitrumAddress: string) {
    // Step 1: Attest the NFT on Solana
    const solanaBridgeAddress = new PublicKey("DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe"); // Solana Devnet Token Bridge Address
    const transaction = await attestFromSolana(SOLANA_CONNECTION, solanaBridgeAddress, WALLET.publicKey, mintAddress, TOKEN_PROGRAM_ID);
    
    const signedTransaction = await sendAndConfirmTransaction(SOLANA_CONNECTION, transaction, [WALLET]);
    console.log(`Attestation transaction signature: ${signedTransaction}`);
    
    const confirmedTransaction = await SOLANA_CONNECTION.getConfirmedTransaction(signedTransaction, "finalized");
    if (!confirmedTransaction) {
        throw new Error('Failed to confirm the transaction');
    }

    // Casting to match expected type
    const { meta, transaction: confirmedTx } = confirmedTransaction as any;

    // Step 2: Fetch the VAA from Wormhole
    const emitterAddress = await getEmitterAddressSolana(solanaBridgeAddress.toString());
    const sequence = parseSequenceFromLogSolana({ meta, transaction: confirmedTx });

    const { vaaBytes } = await getSignedVAAWithRetry(
        ['https://wormhole-v2-mainnet-api.certus.one'],
        1,  // Solana Chain ID
        emitterAddress,
        sequence
    );

    // Step 3: Post VAA on Arbitrum to finalize the attestation
    const provider = new JsonRpcProvider(ARBITRUM_RPC_URL);
    const wallet = new ethers.Wallet(ARBITRUM_PRIVATE_KEY, provider);

    await createWrappedOnEth(
        ARBITRUM_BRIDGE_ADDRESS, // Arbitrum Sepolia Token Bridge Address
        wallet,
        vaaBytes
    );

    console.log('NFT attested and ready to be bridged to Arbitrum.');

    // Step 4: Lock and transfer NFT on Solana
    const solanaTokenBridgeAddress = "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe";
    const transactionLock = await transferFromSolana(
        SOLANA_CONNECTION,
        solanaTokenBridgeAddress,
        solanaTokenBridgeAddress,
        WALLET.publicKey,
        await getAssociatedTokenAddress(new PublicKey(mintAddress), WALLET.publicKey),
        new PublicKey(mintAddress),
        BigInt(1),
        Buffer.from(userArbitrumAddress.slice(2), 'hex'),  // User's Arbitrum Address
        10003  // Arbitrum Chain ID
    );

    const signedLockTransaction = await sendAndConfirmTransaction(SOLANA_CONNECTION, transactionLock, [WALLET]);
    console.log(`NFT lock transaction signature: ${signedLockTransaction}`);

    const confirmedLockTransaction = await SOLANA_CONNECTION.getConfirmedTransaction(signedLockTransaction, "finalized");
    if (!confirmedLockTransaction) {
        throw new Error('Failed to confirm the transaction');
    }

    // Casting to match expected type
    const { meta: lockMeta, transaction: lockTx } = confirmedLockTransaction as any;
    const lockSequence = parseSequenceFromLogSolana({ meta: lockMeta, transaction: lockTx });

    // Step 5: Fetch the VAA for locking
    const { vaaBytes: lockVaaBytes } = await getSignedVAAWithRetry(
        ['https://wormhole-v2-mainnet-api.certus.one'],
        1,  // Solana Chain ID - mainnet and testnet same
        emitterAddress,
        lockSequence
    );

    // Step 6: Redeem the VAA on Arbitrum to mint the wrapped NFT to user's address
    await redeemOnEth(
        ARBITRUM_BRIDGE_ADDRESS,  // Arbitrum Sepolia Token Bridge Address
        wallet,
        Uint8Array.from(lockVaaBytes)
    );

    console.log(`NFT successfully wrapped and transferred to user's Arbitrum address: ${userArbitrumAddress}`);
}

// Endpoint to handle NFT creation, minting, and bridging
app.post('/mintWormholeNFT', async (req, res) => {
    const { name, imageSrc, userArbitrumAddress } = req.body;

    try {
        const imageBuffer = fs.readFileSync(path.resolve(imageSrc));
        const imageUrl = await uploadToPinata(imageBuffer, `${name}.jpg`);

        const metadata = {
            name: name,
            description: `A unique ${name} NFT.`,
            image: imageUrl,
            attributes: [
                { trait_type: "Event", value: name },
                { trait_type: "Condition", value: "If the conditions are met, the NFT will increase in value." }
            ]
        };

        const metadataUrl = await uploadJsonToPinata(metadata, `${name}_metadata.json`);
        const mintAddress = await createAndMintNFT(name, metadataUrl);

        await bridgeNFTToArbitrum(mintAddress, userArbitrumAddress);

        res.status(200).json({ success: true, mintAddress, metadataUrl });
    } catch (error) {
        console.error("Minting failed:", error);
        res.status(500).json({ success: false, error: error.toString() });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
