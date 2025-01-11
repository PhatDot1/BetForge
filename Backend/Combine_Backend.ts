const express = require('express');
const { Connection, Keypair, PublicKey, sendAndConfirmTransaction } = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");
const axios = require('axios');

// Initialize Solana connection and Metaplex
const QUICKNODE_RPC = 'https://api.devnet.solana.com';
const SECRET_KEY_PATH = 'C:/Users/Patri/cm-v3-demo/my-devnet-wallet.json';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });
const secretKey = JSON.parse(require('fs').readFileSync(SECRET_KEY_PATH, 'utf8'));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

const app = express();
app.use(express.json());

// Function to burn NFT
async function burnNFT(mintAddress) {
    try {
        const nft = await METAPLEX.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });

        const { blockhash, lastValidBlockHeight } = await SOLANA_CONNECTION.getLatestBlockhash();
        const burnTransaction = METAPLEX.nfts().builders().burn({
            mintAddress: new PublicKey(mintAddress),
            authority: WALLET,
        }).toTransaction({ blockhash, lastValidBlockHeight });

        burnTransaction.feePayer = WALLET.publicKey;
        const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION, burnTransaction, [WALLET]);

        console.log(`NFT burned: ${mintAddress}`);
        return signature;
    } catch (error) {
        console.error('Error burning NFT:', error);
        throw new Error('Failed to burn NFT');
    }
}

// Function to update NFT metadata
async function updateNFTMetadata(mintAddress) {
    try {
        const nft = await METAPLEX.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });

        // Updated metadata
        const updatedMetadata = {
            name: nft.name,
            description: "This NFT has been upgraded!",
            image: nft.uri, // Keeping the same image for simplicity
            attributes: [
                { trait_type: "Rarity", value: "Legendary" },
                { trait_type: "Upgrade Status", value: "Upgraded" }
            ]
        };

        // Upload updated metadata to IPFS
        const updatedMetadataUrl = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            pinataContent: updatedMetadata,
            pinataMetadata: { name: nft.name + '_upgraded' }
        }, {
            headers: {
                'pinata_api_key': 'your-pinata-api-key',
                'pinata_secret_api_key': 'your-pinata-secret-key',
                'Content-Type': 'application/json'
            }
        });

        const metadataUri = `https://ipfs.io/ipfs/${updatedMetadataUrl.data.IpfsHash}`;

        // Update the NFT metadata on-chain
        const { blockhash, lastValidBlockHeight } = await SOLANA_CONNECTION.getLatestBlockhash();
        const updateTransaction = METAPLEX.nfts().builders().update({
            nftOrSft: nft,
            uri: metadataUri,
            updateAuthority: WALLET,
        }).toTransaction({ blockhash, lastValidBlockHeight });

        updateTransaction.feePayer = WALLET.publicKey;
        const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION, updateTransaction, [WALLET]);

        console.log(`NFT updated: ${mintAddress}`);
        return signature;
    } catch (error) {
        console.error('Error updating NFT:', error);
        throw new Error('Failed to update NFT');
    }
}

// Route to handle upgrade request
app.post('/api/upgrade', async (req, res) => {
    const { burnNft, upgradeNft, walletAddress } = req.body;

    if (!burnNft || !upgradeNft) {
        return res.status(400).json({ error: 'Both burnNft and upgradeNft are required' });
    }

    try {
        // Burn the selected NFT
        await burnNFT(burnNft);

        // Update the selected NFT's metadata
        const transactionSignature = await updateNFTMetadata(upgradeNft);

        res.status(200).json({ transactionSignature });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
