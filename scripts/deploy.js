const hre = require("hardhat");

async function main() {
  // Deployment of RootstockMinter contract
  const RootstockMinter = await hre.ethers.getContractFactory("RootstockMinter");
  const rootstockMinter = await RootstockMinter.deploy("0xYourClaimingContractAddress");  // Set the claiming contract address here
  await rootstockMinter.deployed();
  console.log("RootstockMinter deployed to:", rootstockMinter.address);

  // Deployment of RootstockNFTClaim contract
  const RootstockNFTClaim = await hre.ethers.getContractFactory("RootstockNFTClaim");
  const rootstockNFTClaim = await RootstockNFTClaim.deploy(rootstockMinter.address);  // Set the minting contract address here
  await rootstockNFTClaim.deployed();
  console.log("RootstockNFTClaim deployed to:", rootstockNFTClaim.address);

  // Optionally set the claiming contract address in the minting contract
  await rootstockMinter.setClaimingContractAddress(rootstockNFTClaim.address);
  console.log("Claiming contract address set in RootstockMinter:", rootstockNFTClaim.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
