const axios = require('axios');
const fs = require('fs');
const path = require('path');
const hre = require("hardhat");
const FormData = require('form-data');

// Pinata API keys
const PINATA_API_KEY = '22176c283b41e5f0a39a';
const PINATA_SECRET_API_KEY = 'b0f729cbd31536d2f71dd69b8f375121bebe7b5f40716805a8c8fbcadfb18663';

// Function to upload image to Pinata
async function uploadToPinata(imageBuffer, filename) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const data = new FormData();
  data.append('file', imageBuffer, filename);

  const response = await axios.post(url, data, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
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

// Main function to mint NFT
async function main() {
  // Path to your GIF
  const gifPath = path.join(__dirname, 'shiny.gif'); // Update with your GIF path
  const gifBuffer = fs.readFileSync(gifPath);

  // Step 1: Upload GIF to Pinata
  const gifIpfsUrl = await uploadToPinata(gifBuffer, 'shiny.gif');
  console.log('GIF uploaded to Pinata:', gifIpfsUrl);

  // Step 2: Create JSON metadata pointing to the GIF's IPFS URL
  const metadata = {
    name: "Polygon Test NFT Token",
    description: "This is an NFT with a GIF",
    image: gifIpfsUrl, 
    attributes: [
      {
        trait_type: "Background",
        value: "Blue"
      },
      {
        trait_type: "Rarity",
        value: "Common"
      }
    ]
  };

  // Step 3: Upload JSON metadata to Pinata
  const metadataIpfsUrl = await uploadJsonToPinata(metadata, 'nft-metadata.json');
  console.log('Metadata uploaded to Pinata:', metadataIpfsUrl);

  // Step 4: Get the deployed contract to interact with
  const contractAddress = '0xC0933C5440c656464D1Eb1F886422bE3466B1459'; // Polygon contract address
  const PolygonNFTMinter = await hre.ethers.getContractFactory('PolygonNFTMinterX');
  const contract = await PolygonNFTMinter.attach(contractAddress);

  // Step 5: Mint the NFT with the full metadata URI
  const quantity = 1;
  const tx = await contract.mint(quantity, metadataIpfsUrl, { value: hre.ethers.utils.parseEther('0.01') });
  const receipt = await tx.wait();

  // Log the full receipt to inspect the structure
  console.log('Transaction receipt:', receipt);

  // Find the Mint event and extract tokenId
  const mintEvent = receipt.events.find((event) => event.event === 'Mint');
  
  if (mintEvent && mintEvent.args) {
    const tokenId = mintEvent.args.tokenId.toString();
    console.log('NFT minted successfully with metadata URL:', metadataIpfsUrl);
    
    // Generate the PolygonScan URL for the minted NFT
    const nftUrl = `https://mumbai.polygonscan.com/nft/${contractAddress}/${tokenId}`;
    console.log(`View the minted NFT here: ${nftUrl}`);

    // Step 6: Fetch the token URI from the contract
    const tokenMetadataURI = await contract.tokenURI(tokenId);
    console.log(`Metadata URI for token ${tokenId}:`, tokenMetadataURI);

    // Step 7: Fetch and log the metadata content
    const metadataResponse = await axios.get(tokenMetadataURI);
    console.log(`Metadata content for token ${tokenId}:`, metadataResponse.data);
  } else {
    console.error('No Mint event or tokenId found in the transaction receipt:', receipt);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
