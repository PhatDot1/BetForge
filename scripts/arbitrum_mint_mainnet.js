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

// Main function to mint a 1-of-a-kind Trophy NFT
async function main() {
  // Path to your PNG Trophy image
  const pngPath = path.join(__dirname, 'Trophy.png'); // Update with the actual path to Trophy.png
  const pngBuffer = fs.readFileSync(pngPath);

  // Step 1: Upload PNG to Pinata
  const pngIpfsUrl = await uploadToPinata(pngBuffer, 'Trophy.png');
  console.log('PNG uploaded to Pinata:', pngIpfsUrl);

  // Step 2: Create JSON metadata pointing to the Trophy PNG's IPFS URL
  const metadata = {
    name: "Footium Haxball Champion Trophy",
    description: "This is a 1-of-a-kind trophy for winning the Footium Haxball Tournament",
    image: pngIpfsUrl, // IPFS URL for the Trophy PNG
    attributes: [
      {
        trait_type: "Trophy Type",
        value: "Footium Champion"
      },
      {
        trait_type: "Tournament",
        value: "Footium Haxball"
      },
      {
        trait_type: "Edition",
        value: "1 of 1"
      }
    ]
  };

  // Step 3: Upload JSON metadata to Pinata
  const metadataIpfsUrl = await uploadJsonToPinata(metadata, 'footium-trophy-metadata.json');
  console.log('Metadata uploaded to Pinata:', metadataIpfsUrl);

  // Step 4: Get the deployed contract to interact with
  const contractAddress = 'your-deployed-contract-address'; // Your deployed contract address
  const ArbitrumNFTMinter = await hre.ethers.getContractFactory('ArbitrumNFTMinterX101');
  const contract = await ArbitrumNFTMinter.attach(contractAddress);

  // Step 5: Mint the 1-of-a-kind Trophy NFT
  const quantity = 1; // Only 1 token as it's a 1-of-a-kind Trophy NFT
  const tx = await contract.mint(quantity, metadataIpfsUrl, { value: hre.ethers.utils.parseEther('0.01') }); // Adjust price if necessary
  const receipt = await tx.wait();

  const tokenId = receipt.events[0].args.tokenId.toString(); // Get the minted token ID

  console.log('Trophy NFT minted successfully with metadata URL:', metadataIpfsUrl);
  
  // Generate the Arbiscan URL for the minted Trophy NFT
  const nftUrl = `https://arbiscan.io/nft/${contractAddress}/${tokenId}`;
  console.log(`View the minted NFT here: ${nftUrl}`);

  // Step 6: Fetch the token URI from the contract
  const tokenMetadataURI = await contract.tokenURI(tokenId);
  console.log(`Metadata URI for token ${tokenId}:`, tokenMetadataURI);

  // Step 7: Fetch and log the metadata content
  const metadataResponse = await axios.get(tokenMetadataURI);
  console.log(`Metadata content for token ${tokenId}:`, metadataResponse.data);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
