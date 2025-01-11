const hre = require("hardhat");

async function main() {
  // Set the deployed contract address
  const contractAddress = '0x28F6D4Fe5648BbF2506E56a5b7f9D5522C3999f1'; // Replace with your deployed contract address
  const tokenId = 0; // Replace with the tokenId of the NFT you want to check

  // Get the deployed contract
  const ArbitrumNFTMinter = await hre.ethers.getContractFactory('ArbitrumNFTMinterX');
  const contract = await ArbitrumNFTMinter.attach(contractAddress);

  // Fetch the token URI
  const tokenMetadataURI = await contract.tokenURI(tokenId);
  console.log(`Metadata URI for token ${tokenId}:`, tokenMetadataURI);

  // If you want to fetch and display the metadata content from the token URI:
  const axios = require('axios');
  const metadataResponse = await axios.get(tokenMetadataURI);
  console.log(`Metadata content for token ${tokenId}:`, metadataResponse.data);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
