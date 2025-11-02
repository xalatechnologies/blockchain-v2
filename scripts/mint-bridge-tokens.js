import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💰 Minting Bridge Tokens (WBNB, more WUSDT)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);

  // Load deployment
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));

  // WBNB - Grant minter role and mint
  console.log("\n1️⃣ Setting up WBNB...");
  const wbnb = await ethers.getContractAt("WBNBToken", deployment.contracts.WBNB);

  // Check if we have MINTER_ROLE
  const MINTER_ROLE = await wbnb.MINTER_ROLE();
  const hasMinterRole = await wbnb.hasRole(MINTER_ROLE, deployer.address);

  if (!hasMinterRole) {
    console.log("   Granting MINTER_ROLE...");
    const DEFAULT_ADMIN_ROLE = await wbnb.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await wbnb.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);

    if (hasAdminRole) {
      const grantRoleTx = await wbnb.grantRole(MINTER_ROLE, deployer.address);
      await grantRoleTx.wait();
      console.log("   ✅ MINTER_ROLE granted");
    } else {
      console.log("   ❌ Cannot grant role - not admin");
      return;
    }
  }

  // Mint WBNB
  console.log("   Minting 500 WBNB...");
  const mintWBNBTx = await wbnb.mint(deployer.address, ethers.parseEther("500"));
  await mintWBNBTx.wait();
  const wbnbBalance = await wbnb.balanceOf(deployer.address);
  console.log("   ✅ WBNB Balance:", ethers.formatEther(wbnbBalance));

  // WUSDT - Mint more
  console.log("\n2️⃣ Minting more WUSDT...");
  const wusdt = await ethers.getContractAt("WUSDTToken", deployment.contracts.WUSDT);
  const mintWUSDTTx = await wusdt.mint(deployer.address, ethers.parseEther("100000"));
  await mintWUSDTTx.wait();
  const wusdtBalance = await wusdt.balanceOf(deployer.address);
  console.log("   ✅ WUSDT Balance:", ethers.formatEther(wusdtBalance));

  console.log("\n" + "=".repeat(70));
  console.log("✅ Bridge tokens minted successfully!");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });