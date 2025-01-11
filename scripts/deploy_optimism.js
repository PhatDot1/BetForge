const hre = require("hardhat");

async function main() {
  const OptimismNFTMinterX = await hre.ethers.getContractFactory("OptimismNFTMinterX");

  // Deploy the contract without constructor arguments since the contract doesn't need them
  const contract = await OptimismNFTMinterX.deploy();
  await contract.deployed();

  console.log("OptimismNFTMinterX Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
