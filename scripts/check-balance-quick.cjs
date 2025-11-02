const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const address = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
  const balance = await ethers.provider.getBalance(address);
  console.log("Balance:", ethers.formatEther(balance), "BNB");
}

main().catch(console.error);
