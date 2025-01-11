const hre = require("hardhat");

async function main() {
  // Replace this with the deployed contract address
  const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

  // Get the contract instance
  const ArbitrumNFTMinter = await hre.ethers.getContractFactory("ArbitrumNFTMinter");
  const contract = await ArbitrumNFTMinter.attach(contractAddress);

  // Define the quantity of tokens to mint
  const quantity = 1;

  // Define mint price (should match contract mint price)
  const mintPrice = hre.ethers.utils.parseEther("0.01");

  // Mint the token(s)
  const tx = await contract.mint(quantity, { value: mintPrice });
  await tx.wait();

  console.log("NFT minted successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
