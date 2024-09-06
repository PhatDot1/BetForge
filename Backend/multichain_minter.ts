import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionSignature } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import FormData from 'form-data';
import {
    transferFromSolana,
    CHAIN_ID_SOLANA,
    CHAIN_ID_ARBITRUM,
    getEmitterAddressEth,
    getSignedVAAWithRetry,
    parseSequenceFromLogSolana,
    redeemOnEth
} from '@certusone/wormhole-sdk';
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const PINATA_API_KEY = '';
const PINATA_SECRET_API_KEY = '';
const SECRET_KEY_PATH = '';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(fs.readFileSync(path.resolve(SECRET_KEY_PATH), 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));
const ARBITRUM_ADDRESS = '0xe8640fDe22B40684394a16Dd564c89ecF619c41D';

const solanaTokenBridgeAddress = "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe"; 
const arbitrumTokenBridgeAddress = "0x902bfa0A51644bD9D2A55B1D8E4aBFF6b17F3aFF"; 
const ethProviderUrl = "https://arbitrum-sepolia.infura.io/v3/[redacted]"; 

const app = express();
app.use(express.json());

// Utility function to log messages with timestamp
function log(message: string) {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
}

// Upload image to Pinata
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

// Upload JSON metadata to Pinata
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

// Mint NFT - Solana
async function createAndMintNFT(name: string, metadataUrl: string): Promise<string> {
    try {
        const { nft } = await METAPLEX.nfts().create({
            uri: metadataUrl,
            name: name,
            sellerFeeBasisPoints: 500,
            symbol: "WNFT",
            creators: [{ address: WALLET.publicKey, share: 100 }]
        });

        const mintAddress = nft.address.toString();
        log(`NFT minted with address: ${mintAddress}`);

        return mintAddress;
    } catch (error) {
        console.error("Minting failed:", error);
        throw error;
    }
}

// Function to lock and transfer NFT with Wormhole
async function wrapAndTransferNFT(mintAddress: string): Promise<string> {
    log(`Starting wrap and transfer of NFT: ${mintAddress}`);

    log('Loading Ethereum private key');
    const ethWalletPath = path.resolve('redacted');
    const ethWalletData = JSON.parse(fs.readFileSync(ethWalletPath, 'utf8'));
    const ethPrivateKey = ethWalletData.privateKey;

    const fromWallet = WALLET;

    // 1. Lock the NFT on Solana using Wormhole
    log('Locking NFT on Solana...');
    const tokenMint = new PublicKey(mintAddress);
    const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        fromWallet.publicKey
    );

    const transaction = new Transaction().add(
        await transferFromSolana(
            SOLANA_CONNECTION,
            solanaTokenBridgeAddress,
            solanaTokenBridgeAddress,
            fromWallet.publicKey,
            fromTokenAccount,
            tokenMint,
            BigInt(1),
            Buffer.from(ARBITRUM_ADDRESS.slice(2), 'hex'),
            CHAIN_ID_ARBITRUM
        )
    );

    transaction.feePayer = fromWallet.publicKey;

    log('Fetching recent blockhash');
    const { blockhash } = await SOLANA_CONNECTION.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    log('Signing and sending transaction');
    let signedTransaction: TransactionSignature;
    try {
        signedTransaction = await sendAndConfirmTransaction(SOLANA_CONNECTION, transaction, [fromWallet]);
        log(`NFT lock transaction signature: ${signedTransaction}`);
    } catch (error) {
        log(`Transaction failed: ${error}`);
        throw error;
    }

    log('Waiting for transaction confirmation');
    const confirmation = await SOLANA_CONNECTION.getTransaction(signedTransaction);
    if (!confirmation) throw new Error('Transaction confirmation failed');

    log('Fetching sequence number from confirmed transaction');
    const sequence = parseSequenceFromLogSolana(confirmation);
    if (!sequence) throw new Error("Sequence number not found in transaction details");

    // 2. Fetch the signed VAA from Wormhole Guardians
    const emitterAddress = await getEmitterAddressEth(solanaTokenBridgeAddress);

    log('Fetching signed VAA with retry');
    const { vaaBytes } = await getSignedVAAWithRetry(
        ['https://wormhole-v2-mainnet-api.certus.one'],
        CHAIN_ID_SOLANA,
        emitterAddress,
        sequence
    );

    // 3. Redeem the VAA on Arbitrum to mint the wrapped NFT
    log('Setting up Ethereum provider and wallet');
    const provider = new JsonRpcProvider(ethProviderUrl);
    const wallet = new ethers.Wallet(ethPrivateKey, provider);

    log('Redeeming on Arbitrum');
    await redeemOnEth(arbitrumTokenBridgeAddress, wallet, Uint8Array.from(vaaBytes));

    log(`NFT successfully wrapped and transferred to address: ${ARBITRUM_ADDRESS}`);
    return ARBITRUM_ADDRESS;
}

// Endpoint to handle NFT creation, minting, and bridging
app.post('/mintAndBridgeNFT', async (req, res) => {
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

        const metadataUrl = await uploadJsonToPinata(metadata, `${name}_metadata.json`);

        const mintAddress = await createAndMintNFT(name, metadataUrl);

        let response;

        if (walletAddress.startsWith('0x')) {
            // If the wallet address starts with "0x", bridge the NFT to Arbitrum
            const arbitrumAddress = await wrapAndTransferNFT(mintAddress);
            response = { mintAddress, metadataUrl, arbitrumAddress };
        } else {
            // Otherwise, transfer the NFT to the Solana wallet
            const toPublicKey = new PublicKey(walletAddress);

            // Fetch the NFT details including tokenStandard
            const nftOrSft = await METAPLEX.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });

            if (!nftOrSft) {
                throw new Error(`NFT or SFT not found for mint address: ${mintAddress}`);
            }

            // Transfer NFT or SFT to user's wallet
            const transactionBuilder = METAPLEX.nfts().builders().transfer({
                nftOrSft: {
                    address: nftOrSft.address,
                    tokenStandard: nftOrSft.tokenStandard as TokenStandard,
                },
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

            log(`✅ - Minted and transferred NFT: ${mintAddress} to Solana wallet: ${walletAddress}`);
            log(`Transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

            response = { mintAddress, metadataUrl, solanaTxSignature: signature };
        }

        res.status(200).json({ success: true, ...response });
    } catch (error) {
        console.error("Minting and bridging failed:", error);
        res.status(500).json({ success: false, error: error.toString() });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
