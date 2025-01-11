const hre = require("hardhat");

async function main() {
  // Get the contract to deploy
  const ArbitrumNFTMinter = await hre.ethers.getContractFactory("ArbitrumNFTMinterX101");

  // Deploy the contract on Arbitrum mainnet
  const contract = await ArbitrumNFTMinter.deploy();
  await contract.deployed();

  console.log("Contract deployed to Arbitrum Mainnet at:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
