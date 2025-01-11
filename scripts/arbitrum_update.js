const axios = require('axios');
const hre = require("hardhat");

// Pinata API keys
const PINATA_API_KEY = '22176c283b41e5f0a39a';
const PINATA_SECRET_API_KEY = 'b0f729cbd31536d2f71dd69b8f375121bebe7b5f40716805a8c8fbcadfb18663';

// Function to upload JSON metadata to Pinata
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

// Function to update NFT metadata
async function updateNFTMetadata(tokenId, newMetadata) {
  // Step 1: Upload the new JSON metadata to Pinata
  const metadataIpfsUrl = await uploadJsonToPinata(newMetadata, `nft-metadata-${tokenId}.json`);
  console.log('New metadata uploaded to Pinata:', metadataIpfsUrl);

  // Step 2: Get the deployed contract to interact with
  const contractAddress = '0x236B54bd3A9D8ad8aEa3C05b56e9d1265dA3cD5F'; // Replace with Ethereum Sepolia contract address
  const EthereumNFTMinter = await hre.ethers.getContractFactory('EthereumNFTMinterX');
  const contract = await EthereumNFTMinter.attach(contractAddress);

  // Step 3: Call updateTokenURI function to update the metadata on-chain
  const tx = await contract.updateTokenURI(tokenId, metadataIpfsUrl);
  const receipt = await tx.wait();
  
  console.log('NFT metadata updated successfully:', receipt);
}

// Example usage to update metadata for a specific token
async function main() {
  const tokenId = 1; // ID of the NFT you want to update

  // Updated metadata
  const updatedMetadata = {
    name: "Updated Ethereum Test NFT Token",
    description: "This is an updated NFT with a new GIF",
    image: "https://ipfs.io/ipfs/<NEW_IPFS_HASH>", // Update the IPFS link to a new image if needed
    attributes: [
      {
        trait_type: "Background",
        value: "Red" // Updated trait value
      },
      {
        trait_type: "Rarity",
        value: "Rare" // Updated trait value
      }
    ]
  };

  // Update the NFT metadata
  await updateNFTMetadata(tokenId, updatedMetadata);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
