const { ethers } = require("ethers");

// Your seed phrase
const seedPhrase = "behave today finger ski upon boy assault summer exhaust beauty stereo over";

// Create a wallet instance from the seed phrase
const wallet = ethers.Wallet.fromMnemonic(seedPhrase);

// Display the wallet address and other details
console.log("Wallet address:", wallet.address);
console.log("Private key:", wallet.privateKey);
