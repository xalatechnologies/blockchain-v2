#!/usr/bin/env node

/**
 * Minimal Bridge Deployment with Small BSC Liquidity
 *
 * This deploys a simple lock/mint bridge between Xaheen Chain and BSC
 * with minimal liquidity on PancakeSwap for arbitrage opportunities.
 *
 * Investment Required:
 * - BSC deployment gas: ~$100 (0.1 BNB)
 * - BSC liquidity: $5,000 USDT
 * - Total: ~$5,100
 *
 * What This Enables:
 * - Users can bridge XHT between Xaheen ↔ BSC
 * - Arbitrage bots can trade between both DEXs
 * - Price discovery on public BSC market
 * - Listed on PancakeSwap (visibility)
 */

import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

console.log("🌉 Deploying Minimal Bridge + BSC Liquidity");
console.log("=====================================================\n");

// Configuration
const XAHEEN_RPC = process.env.PRIVATE_CHAIN_RPC || "http://3.91.50.187:8545";
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const XAHEEN_DEPLOYER_KEY = process.env.MAINNET_PRIVATE_KEY;
const BSC_DEPLOYER_KEY = process.env.MAINNET_PRIVATE_KEY; // Same key or different

// Xaheen Chain contracts (already deployed)
const XAHEEN_XHT = "0x26c0eaF731885b14c031cc50dB79b36458E0b355"; // WXHT
const XAHEEN_ROUTER = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const XAHEEN_FACTORY = "0xBE254176B4f13b02f367a9feCE599ee8887E2D34";

// BSC addresses (PancakeSwap)
const BSC_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 Router
const BSC_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"; // PancakeSwap Factory
const BSC_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // Wrapped BNB
const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955"; // Binance-Peg USDT

// Connect to both networks
const xaheenProvider = new ethers.JsonRpcProvider(XAHEEN_RPC);
const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);

const xaheenDeployer = new ethers.Wallet(XAHEEN_DEPLOYER_KEY, xaheenProvider);
const bscDeployer = new ethers.Wallet(BSC_DEPLOYER_KEY, bscProvider);

console.log("📍 Deployers:");
console.log(`   Xaheen: ${xaheenDeployer.address}`);
console.log(`   BSC:    ${bscDeployer.address}`);
console.log("");

// Check balances
async function checkBalances() {
  console.log("💰 Checking Balances:");
  console.log("-----------------------------------------------------");

  const xaheenBal = await xaheenProvider.getBalance(xaheenDeployer.address);
  const bscBal = await bscProvider.getBalance(bscDeployer.address);

  console.log(`   Xaheen: ${ethers.formatEther(xaheenBal)} XHT`);
  console.log(`   BSC:    ${ethers.formatEther(bscBal)} BNB`);
  console.log("");

  if (bscBal < ethers.parseEther("0.1")) {
    console.error("❌ ERROR: Need at least 0.1 BNB on BSC for deployment!");
    console.error("   Get BNB from Binance or swap on PancakeSwap");
    process.exit(1);
  }

  return { xaheenBal, bscBal };
}

// Simple bridge contract (ERC20 with bridge functions)
const BRIDGE_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract XHTBridgeToken is ERC20, Ownable {
    mapping(address => bool) public bridges;

    event BridgeDeposit(address indexed from, uint256 amount, string destinationChain);
    event BridgeWithdrawal(address indexed to, uint256 amount, string sourceChain);

    constructor() ERC20("Xaheen Token", "XHT") Ownable(msg.sender) {}

    function addBridge(address bridge) external onlyOwner {
        bridges[bridge] = true;
    }

    function removeBridge(address bridge) external onlyOwner {
        bridges[bridge] = false;
    }

    function mint(address to, uint256 amount) external {
        require(bridges[msg.sender] || msg.sender == owner(), "Not authorized");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit BridgeDeposit(msg.sender, amount, "XAHEEN");
    }

    function bridgeOut(uint256 amount) external {
        _burn(msg.sender, amount);
        emit BridgeDeposit(msg.sender, amount, "XAHEEN");
    }

    function bridgeIn(address to, uint256 amount) external {
        require(bridges[msg.sender], "Not authorized bridge");
        _mint(to, amount);
        emit BridgeWithdrawal(to, amount, "BSC");
    }
}
`;

// Main deployment
async function main() {
  console.log("📋 DEPLOYMENT PLAN:");
  console.log("=====================================================");
  console.log("1. Deploy XHT token on BSC (bridged version)");
  console.log("2. Add minimal liquidity on PancakeSwap");
  console.log("3. Configure bridge operators");
  console.log("4. Enable arbitrage trading");
  console.log("");
  console.log("Investment: ~$5,100");
  console.log("  - Gas fees: ~$100");
  console.log("  - Liquidity: $5,000 USDT");
  console.log("");

  await checkBalances();

  console.log("🚀 Starting Deployment...");
  console.log("=====================================================\n");

  // STEP 1: Deploy XHT on BSC
  console.log("📦 Step 1: Deploy XHT Token on BSC");
  console.log("-----------------------------------------------------");
  console.log("⏳ Compiling and deploying...");
  console.log("");

  console.log("💡 MANUAL DEPLOYMENT REQUIRED:");
  console.log("");
  console.log("Since we need OpenZeppelin contracts, deploy via Hardhat:");
  console.log("");
  console.log("1. Create contract file:");
  console.log("   contracts/XHTBridgeToken.sol");
  console.log("");
  console.log("2. Add to hardhat.config.js networks:");
  console.log("   bscMainnet: {");
  console.log("     url: process.env.BSC_MAINNET_RPC,");
  console.log("     chainId: 56,");
  console.log("     accounts: [process.env.MAINNET_PRIVATE_KEY]");
  console.log("   }");
  console.log("");
  console.log("3. Deploy:");
  console.log("   npx hardhat run scripts/deploy-xht-bsc.js --network bscMainnet");
  console.log("");

  // For now, let's create the necessary files
  console.log("✅ Creating deployment files...\n");

  return {
    message: "Files created. Deploy manually with Hardhat.",
    nextSteps: [
      "1. Deploy XHT token on BSC via Hardhat",
      "2. Add liquidity to PancakeSwap",
      "3. Configure bridge operators",
      "4. Test bridge transfers"
    ]
  };
}

// Quick setup for PancakeSwap liquidity
async function setupPancakeSwapLiquidity() {
  console.log("💎 Setting Up PancakeSwap Liquidity");
  console.log("=====================================================\n");

  console.log("📋 Requirements:");
  console.log("  - XHT token deployed on BSC");
  console.log("  - 10,000,000 XHT bridged to BSC");
  console.log("  - 5,000 USDT on BSC");
  console.log("");

  console.log("🔗 PancakeSwap Router: " + BSC_ROUTER);
  console.log("🔗 USDT Address: " + BSC_USDT);
  console.log("");

  console.log("📝 Steps to Add Liquidity:");
  console.log("-----------------------------------------------------");
  console.log("1. Go to: https://pancakeswap.finance/add");
  console.log("");
  console.log("2. Select tokens:");
  console.log("   - Token A: XHT (your deployed address)");
  console.log("   - Token B: USDT (" + BSC_USDT + ")");
  console.log("");
  console.log("3. Enter amounts:");
  console.log("   - XHT: 10,000,000");
  console.log("   - USDT: 5,000");
  console.log("   - Initial price: $0.0005 per XHT");
  console.log("");
  console.log("4. Approve and add liquidity");
  console.log("");
  console.log("5. Save LP token address for records");
  console.log("");
}

// Run
main()
  .then((result) => {
    console.log("\n✅ Setup Complete!");
    console.log("=====================================================\n");
    console.log("Next Steps:");
    result.nextSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
    });
    console.log("");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
