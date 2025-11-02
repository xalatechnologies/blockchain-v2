import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🌉 Deploying Bridge Tokens (WBNB, WETH)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);

  // Load existing deployment
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));

  // Deploy WBNB
  console.log("\n1️⃣ Deploying WBNB...");
  const WBNBToken = await ethers.getContractFactory("WBNBToken");
  const wbnb = await WBNBToken.deploy();
  await wbnb.waitForDeployment();
  const wbnbAddress = await wbnb.getAddress();
  console.log("✅ WBNB deployed to:", wbnbAddress);

  // Mint initial WBNB for liquidity
  console.log("   Minting 500 WBNB for liquidity...");
  const mintWBNBTx = await wbnb.mint(deployer.address, ethers.parseEther("500"));
  await mintWBNBTx.wait();
  const wbnbBalance = await wbnb.balanceOf(deployer.address);
  console.log("   WBNB Balance:", ethers.formatEther(wbnbBalance), "WBNB");

  // Deploy WETH
  console.log("\n2️⃣ Deploying WETH...");
  const WETHToken = await ethers.getContractFactory("WETHToken");
  const weth = await WETHToken.deploy();
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("✅ WETH deployed to:", wethAddress);

  // Mint initial WETH for liquidity
  console.log("   Minting 100 WETH for liquidity...");
  const mintWETHTx = await weth.mint(deployer.address, ethers.parseEther("100"));
  await mintWETHTx.wait();
  const wethBalance = await weth.balanceOf(deployer.address);
  console.log("   WETH Balance:", ethers.formatEther(wethBalance), "WETH");

  // Update deployment file
  deployment.contracts.WBNB = wbnbAddress;
  deployment.contracts.WETH = wethAddress;
  deployment.timestamp = new Date().toISOString();

  fs.writeFileSync(
    "./deployments/dex-infrastructure.json",
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log("✅ BRIDGE TOKENS DEPLOYED SUCCESSFULLY");
  console.log("=".repeat(70));
  console.log("\n📋 Token Addresses:");
  console.log("  WBNB:", wbnbAddress);
  console.log("  WETH:", wethAddress);
  console.log("\n💾 Updated deployment file: ./deployments/dex-infrastructure.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
