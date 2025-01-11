const hre = require("hardhat");

async function main() {
  // Deployment of NFT contract
  const NFTMinter = await hre.ethers.getContractFactory("ArbitrumNFTMinter");

  // Set the base URI to the IPFS version of your link
  const baseURI = "ipfs://Qmedyre1SDz6XNFFcMiFRsSXbB26j6sfLSTES9AnpxU4S6";

  const nftMinter = await NFTMinter.deploy(baseURI);
  await nftMinter.deployed();

  console.log("NFTMinter deployed to:", nftMinter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
