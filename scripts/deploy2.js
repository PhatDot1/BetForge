const hre = require("hardhat");

async function main() {
  // Deployment of Trading contract with the Wormhole Relayer address
  const Trading = await hre.ethers.getContractFactory("Trading");
  const trading = await Trading.deploy("0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470");
  await trading.deployed();
  console.log("Trading deployed to:", trading.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
