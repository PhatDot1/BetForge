const hre = require("hardhat");

async function main() {
  const EthereumNFTMinterX = await hre.ethers.getContractFactory("EthereumNFTMinterX");

  // Deploy the contract without constructor arguments since your contract doesn't need them
  const contract = await EthereumNFTMinterX.deploy();
  await contract.deployed();

  console.log("EthereumNFTMinterX Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
