const hre = require("hardhat");

async function main() {
  const ArbitrumNFTMinter = await hre.ethers.getContractFactory("ArbitrumNFTMinterX");

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
