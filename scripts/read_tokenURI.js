const hre = require("hardhat");

async function main() {
  // Reference the correct contract name (ArbitrumNFTMinter) and the deployed contract address
  const NFTMinter = await hre.ethers.getContractAt("ArbitrumNFTMinter", "0x8fa300Faf24b9B764B0D7934D8861219Db0626e5");

  // Specify the token ID
  const tokenId = 0; // Adjust this if you want to check a different token ID

  // Fetch the tokenURI for the given token ID
  const tokenURI = await NFTMinter.tokenURI(tokenId);
  console.log(`Token URI for token ID ${tokenId}: ${tokenURI}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
