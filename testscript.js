const { ethers } = require("ethers");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Pinata API keys
const PINATA_API_KEY = '22176c283b41e5f0a39a';
const PINATA_SECRET_API_KEY = 'b0f729cbd31536d2f71dd69b8f375121bebe7b5f40716805a8c8fbcadfb18663';

// Ethereum RPC and private key
const provider = new ethers.providers.JsonRpcProvider("https://arbitrum-sepolia.infura.io/v3/0d4aa52670ca4855b637394cb6d0f9ab");
const privateKey = "0x2f17a67d0e7ef884b0358c81f6273b7fa1a137687eb79619cdf5d0a403bc040b"; // Replace with your wallet's private key
const wallet = new ethers.Wallet(privateKey, provider);

// Contract addresses and ABI
const wrappedNFTAddress = "0xC0933C5440c656464D1Eb1F886422bE3466B1459";
const tradingAddress = "0x9D6E64d6dE2251c1121c1f1f163794EbA5Cf97F1";
const wrappedNFTAbi = [
  "function mint(string memory uri) public",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];
const tradingAbi = [
  "function listItem(address nftAddress, uint256 tokenId, uint256 price) public"
];
const wrappedNFTContract = new ethers.Contract(wrappedNFTAddress, wrappedNFTAbi, wallet);
const tradingContract = new ethers.Contract(tradingAddress, tradingAbi, wallet);

async function uploadImageToPinata() {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const data = new FormData();
  data.append('file', fs.createReadStream(path.resolve('placeholder.png')));

  const response = await axios.post(url, data, {
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      ...data.getHeaders(),
    },
  });

  if (response.status === 200) {
    const imageUrl = `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
    console.log('Uploaded image to IPFS:', imageUrl);
    return imageUrl;
  } else {
    throw new Error('Failed to upload image to Pinata');
  }
}

async function uploadJsonToPinata(metadata) {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  const response = await axios.post(url, metadata, {
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const metadataUrl = `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
    console.log('Uploaded JSON metadata to IPFS:', metadataUrl);
    return metadataUrl;
  } else {
    throw new Error('Failed to upload JSON metadata to Pinata');
  }
}

async function mintAndListNFT() {
  try {
    // Step 1: Upload image to Pinata
    const imageUrl = await uploadImageToPinata();

    // Step 2: Create JSON metadata
    const metadata = {
      name: "Placeholder NFT",
      description: "This is a placeholder NFT",
      image: imageUrl,
      attributes: [
        { trait_type: "Rarity", value: "Common" }
      ]
    };

    // Step 3: Upload JSON metadata to Pinata
    const tokenURI = await uploadJsonToPinata(metadata);

    // Step 4: Mint the NFT with the tokenURI
    console.log("Minting NFT...");
    const gasLimit = 500000; // Adjust this value as needed
    const mintTx = await wrappedNFTContract.mint(tokenURI, { gasLimit });
    const mintReceipt = await mintTx.wait();
    console.log("NFT Minted! Transaction Hash:", mintTx.hash);

    // Step 5: Get the tokenId from the minting event
    const tokenId = mintReceipt.events[0].args.tokenId.toNumber(); 

    // Step 6: Approve the Trading contract to transfer the NFT on your behalf
    const approveTx = await wrappedNFTContract.approve(tradingAddress, tokenId);
    await approveTx.wait();
    console.log(`NFT with Token ID ${tokenId} approved for trading.`);

    // Step 7: List the NFT on the Trading contract
    const price = ethers.utils.parseEther("0.03"); // Set your desired price
    console.log("Listing NFT...");
    const listTx = await tradingContract.listItem(wrappedNFTAddress, tokenId, price);
    await listTx.wait();
    console.log("NFT Listed! Transaction Hash:", listTx.hash);

  } catch (error) {
    console.error("Error minting and listing NFT:", error);
  }
}

mintAndListNFT();
