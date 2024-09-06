import hre, { ethers } from "hardhat";
import { CONTRACTS } from "./contracts/deployed-contracts"; // Adjust the import path according to your setup

async function main() {
  console.log("👟 Start script 'mint-and-list'");

  const network = hre.network.name;

  // Ensure the contracts are correctly configured in your deployment data
  const wrappedNFTAddress = CONTRACTS[network].wrappedNFT as `0x${string}`;
  const marketAddress = CONTRACTS[network].market as `0x${string}`;

  // Ensure ABIs match your deployed contract interfaces
  const wrappedNFT = await ethers.getContractAt("WrappedNFT", wrappedNFTAddress);
  const market = await ethers.getContractAt("Market", marketAddress);

  // Step 1: Mint the NFT with the provided JSON metadata URI
  const metadataURI = "https://ipfs.io/ipfs/QmWckzbQChX6TKBpbDMo92a4XMmMMTyEpAPedyUSgdQShN";
  console.log("Minting NFT with metadata URI:", metadataURI);
  
  const mintTx = await wrappedNFT.mint(metadataURI);
  const mintReceipt = await mintTx.wait();
  
  const tokenId = mintReceipt.events[0].args.tokenId.toNumber(); // Extract tokenId from the first event emitted

  console.log(`NFT Minted with Token ID: ${tokenId}`);

  // Step 2: Approve the Market contract to transfer the NFT on behalf of the owner
  console.log(`Approving Market contract to handle NFT with Token ID ${tokenId}...`);
  const approveTx = await wrappedNFT.approve(marketAddress, tokenId);
  await approveTx.wait();
  console.log(`NFT with Token ID ${tokenId} approved for trading on Market.`);

  // Step 3: List the NFT on the Market contract
  const listingPrice = ethers.utils.parseEther("0.03"); // Set your desired price
  console.log(`Listing NFT with Token ID ${tokenId} for price: ${ethers.utils.formatEther(listingPrice)} ETH...`);

  const listTx = await market.listItem(wrappedNFTAddress, tokenId, listingPrice);
  await listTx.wait();
  
  console.log("NFT Listed on Market! Transaction Hash:", listTx.hash);

  // Step 4: Optionally, print the listing details for verification
  const listing = await market.getListing(wrappedNFTAddress, tokenId);
  console.log(`Listing Details:`, listing);
}

main().catch((error) => {
  console.error("Error in minting and listing NFT:", error);
  process.exitCode = 1;
});
