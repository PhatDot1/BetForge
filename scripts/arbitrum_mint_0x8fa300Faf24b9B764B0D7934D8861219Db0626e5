const hre = require("hardhat");

async function main() {
  const contractAddress = "0x8fa300Faf24b9B764B0D7934D8861219Db0626e5"; 
  const NFTMinter = await hre.ethers.getContractAt("ArbitrumNFTMinter", contractAddress);

  // Mint 1 NFT (change the quantity as needed)
  const quantity = 1;
  const mintPrice = hre.ethers.utils.parseEther("0.01"); // 0.01 ETH per NFT
  const totalPrice = mintPrice.mul(quantity);

  const tx = await NFTMinter.mint(quantity, { value: totalPrice });
  await tx.wait();

  console.log(`Minted ${quantity} NFT(s) successfully!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
