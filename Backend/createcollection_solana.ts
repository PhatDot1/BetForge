import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import * as fs from 'fs';
import * as path from 'path';

// Load wallet key from local file
const secretKey = JSON.parse(fs.readFileSync(path.resolve('redacted'), 'utf8'));

const QUICKNODE_RPC = 'https://api.devnet.solana.com';

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });

const WALLET = Keypair.fromSecretKey(new Uint8Array(secretKey));
const NFT_METADATA = 'https://mfp2m2qzszjbowdjl2vofmto5aq6rtlfilkcqdtx2nskls2gnnsa.arweave.net/YV-mahmWUhdYaV6q4rJu6CHozWVC1CgOd9NkpctGa2Q'; 
let COLLECTION_NFT_MINT = ''; 
let CANDY_MACHINE_ID = '';

const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

async function checkConnection() {
    try {
        const balance = await SOLANA_CONNECTION.getBalance(WALLET.publicKey);
        console.log(`Balance: ${balance}`);
        if (balance === 0) {
            console.warn("Wallet balance is zero. Consider airdropping SOL for transaction fees.");
        }
    } catch (error) {
        console.error('Error checking connection:', error);
    }
}

async function createCollectionNft() {
    try {
        console.log('Creating Collection NFT with the following metadata:');
        console.log(`Name: BetForge: Bet NFTs`);
        console.log(`URI: ${NFT_METADATA}`);
        console.log(`Update Authority: ${WALLET.publicKey.toString()}`);

        const { nft: collectionNft } = await METAPLEX.nfts().create({
            name: "BetForge NFT: Bet NFTs",
            uri: NFT_METADATA,
            sellerFeeBasisPoints: 500, 
            isCollection: true,
            updateAuthority: WALLET, 
        });

        console.log(`✅ - Minted Collection NFT: ${collectionNft.address.toString()}`);
        console.log(`     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`);

        // Update COLLECTION_NFT_MINT with the newly created NFT's mint address
        COLLECTION_NFT_MINT = collectionNft.address.toString();
    } catch (error) {
        console.error('Error creating collection NFT:', error);
        if (error instanceof Error && 'logs' in error) {
            console.error('Transaction Logs:', (error as any).logs);
        }
    }
}

// First, check connection and balance
checkConnection().then(() => {
    // Then, create the collection NFT
    createCollectionNft();
});
