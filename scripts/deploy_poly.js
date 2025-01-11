const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const PolygonNFTMinter = await hre.ethers.getContractFactory("PolygonNFTMinterX");
  const polygonNFTMinter = await PolygonNFTMinter.deploy();

  // Wait for the contract to be deployed
  await polygonNFTMinter.deployed();

  console.log("PolygonNFTMinterX deployed to:", polygonNFTMinter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
