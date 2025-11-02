import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💎 Minting Dirhamat for Liquidity\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const { DIRHAMAT } = deployment.contracts;
  
  const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT);
  
  // Need 370,000 DIRHAMAT total - mint 400k for buffer
  const amount = ethers.parseEther("400000");
  
  console.log(`Minting ${ethers.formatEther(amount)} DIRHAMAT...\n`);
  
  const tx = await dirhamat.mint(deployer.address, amount);
  await tx.wait();
  
  console.log("✅ Dirhamat minted successfully");
  
  const balance = await dirhamat.balanceOf(deployer.address);
  console.log(`New Dirhamat balance: ${ethers.formatEther(balance)}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Minting failed:");
    console.error(error);
    process.exit(1);
  });
