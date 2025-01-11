const hre = require("hardhat");

async function main() {
  // Get the contract to deploy
  const PPPolygonEncodeMinter = await hre.ethers.getContractFactory("PPPolygonEncodeMinter");

  // Deploy the contract without constructor arguments
  const contract = await PPPolygonEncodeMinter.deploy();
  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
