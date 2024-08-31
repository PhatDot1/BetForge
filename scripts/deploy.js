const hre = require("hardhat");

async function main() {
  // Deployment of WrappedNFT contract
  const WrappedNFT = await hre.ethers.getContractFactory("WrappedNFT");
  const wrappedNFT = await WrappedNFT.deploy();
  await wrappedNFT.deployed();
  console.log("WrappedNFT deployed to:", wrappedNFT.address);

  // Deployment of Trading contract with the Wormhole Relayer address
  const Trading = await hre.ethers.getContractFactory("Trading");
  const trading = await Trading.deploy("0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470");
  await trading.deployed();
  console.log("Trading deployed to:", trading.address);

  // Deployment of WormholeGreeter contract with the Wormhole Relayer address
  const WormholeGreeter = await hre.ethers.getContractFactory("WormholeGreeter");
  const wormholeGreeter = await WormholeGreeter.deploy("0x7B1bD7a6b4E61c2a123AC6BC2cbfC614437D0470");
  await wormholeGreeter.deployed();
  console.log("WormholeGreeter deployed to:", wormholeGreeter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
