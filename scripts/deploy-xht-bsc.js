#!/usr/bin/env node

/**
 * Deploy NOR Bridge Token on BSC
 *
 * This deploys the BSC side of the bridge - the "World 2" token
 * that will be traded on PancakeSwap and connected to Nor Chain.
 *
 * Cost: ~$50 (BSC gas fees)
 */

import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("🌉 Deploying NOR Bridge Token on BSC");
  console.log("=====================================================\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BNB\n");

  if (balance < ethers.parseEther("0.05")) {
    console.error("❌ ERROR: Need at least 0.05 BNB for deployment!");
    console.error("   Get BNB from Binance or PancakeSwap");
    process.exit(1);
  }

  // Deploy NOR Bridge Token
  console.log("📦 Deploying NOR Bridge Token...");
  const NORBridgeToken = await ethers.getContractFactory("NORBridgeToken");
  const xht = await NORBridgeToken.deploy();
  await xht.waitForDeployment();

  const xhtAddress = await xht.getAddress();
  console.log("✅ NOR Bridge Token deployed:", xhtAddress);
  console.log("");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const name = await xht.name();
  const symbol = await xht.symbol();
  const decimals = await xht.decimals();
  const totalSupply = await xht.totalSupply();

  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "NOR");
  console.log("");

  // Mint initial supply for liquidity
  console.log("💎 Minting initial supply for liquidity...");
  const liquidityAmount = ethers.parseEther("10000000"); // 10M NOR
  const mintTx = await xht.mint(deployer.address, liquidityAmount);
  await mintTx.wait();
  console.log("✅ Minted 10,000,000 NOR for PancakeSwap liquidity");
  console.log("");

  // Save deployment info
  console.log("📝 Deployment Summary:");
  console.log("=====================================================");
  console.log("NOR Token (BSC):", xhtAddress);
  console.log("Deployer:", deployer.address);
  console.log("Initial Supply: 10,000,000 NOR");
  console.log("");

  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("");

  console.log("📋 Next Steps:");
  console.log("-----------------------------------------------------");
  console.log("1. Add liquidity on PancakeSwap:");
  console.log("   https://pancakeswap.finance/add/" + xhtAddress);
  console.log("");
  console.log("2. Pair with USDT:");
  console.log("   - NOR: 10,000,000");
  console.log("   - USDT: 5,000");
  console.log("   - Price: $0.0005 per NOR");
  console.log("");
  console.log("3. Configure bridge validators:");
  console.log("   node scripts/setup-bridge.js");
  console.log("");
  console.log("4. Test bridge transfer:");
  console.log("   node scripts/test-bridge.js");
  console.log("");

  // Save to file
  const fs = await import("fs");
  const deploymentInfo = {
    network: "BSC Mainnet",
    chainId: 56,
    xhtToken: xhtAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    initialSupply: "10000000",
    pancakeSwapRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
  };

  fs.writeFileSync(
    "deployment-bsc-bridge.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to: deployment-bsc-bridge.json");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
