import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💎 Setting up Dirhamat for Liquidity\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const { DIRHAMAT } = deployment.contracts;
  
  const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT);
  
  // Need 400,000 DIRHAMAT for liquidity
  const mintAmount = ethers.parseEther("400000");
  
  // Grant RESERVE_MANAGER_ROLE
  const RESERVE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESERVE_MANAGER_ROLE"));
  console.log("1. Granting RESERVE_MANAGER_ROLE...");
  await (await dirhamat.grantRole(RESERVE_MANAGER_ROLE, deployer.address)).wait();
  console.log("   ✅ Role granted\n");
  
  // Update reserves (400k AED worth, ~10,000 grams of gold)
  console.log("2. Updating reserves...");
  const reserveValue = ethers.parseEther("400000"); // $400k USD equivalent
  const goldGrams = ethers.parseUnits("10000", 0); // 10,000 grams (~$650k worth at $65/g)
  await (await dirhamat.updateReserve(reserveValue, goldGrams)).wait();
  console.log("   ✅ Reserves updated\n");
  
  // Mint Dirhamat
  console.log("3. Minting Dirhamat...");
  await (await dirhamat.mint(deployer.address, mintAmount)).wait();
  console.log("   ✅ Minted ${ethers.formatEther(mintAmount)} DIRHAMAT\n");
  
  const balance = await dirhamat.balanceOf(deployer.address);
  console.log(`📊 Final Dirhamat balance: ${ethers.formatEther(balance)}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });
