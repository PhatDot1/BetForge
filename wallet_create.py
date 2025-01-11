const { ethers } = require("ethers");

// Create a random wallet
const wallet = ethers.Wallet.createRandom();

console.log("Address: ", wallet.address);
console.log("Private Key: ", wallet.privateKey);
console.log("Mnemonic: ", wallet.mnemonic.phrase);
