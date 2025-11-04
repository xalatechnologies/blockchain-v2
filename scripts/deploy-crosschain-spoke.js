/**
 * Deploy Cross-Chain DEX Spoke Contracts (BSC, Polygon, Ethereum)
 *
 * Deploys:
 * 1. NorRouter - Dual-mode router (LP + hot inventory)
 * 2. SettlementInbox - Fill logging and event emission
 */

import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("🚀 Deploying Cross-Chain DEX Spoke Contracts...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("📝 Deploying with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("🌐 Chain ID:", chainId);
  console.log();

  // ============ Configuration ============

  // Map chain IDs to network names and DEX router addresses
  const chainConfig = {
    56: {
      name: "BSC",
      dexRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2
      xhtToken:
        process.env.NOR_BSC_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      usdt: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
      busd: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BSC BUSD
    },
    137: {
      name: "Polygon",
      dexRouter: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
      xhtToken:
        process.env.NOR_POLYGON_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon USDT
      usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
    },
    1: {
      name: "Ethereum",
      dexRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
      xhtToken:
        process.env.NOR_ETH_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // ETH USDT
      usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // ETH USDC
    },
  };

  const config = chainConfig[chainId];
  if (!config) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported: 56 (BSC), 137 (Polygon), 1 (Ethereum)`
    );
  }

  console.log("📋 Configuration:");
  console.log("   Network:", config.name);
  console.log("   DEX Router:", config.dexRouter);
  console.log("   NOR Token:", config.xhtToken);
  console.log();

  // PriceAuthority signer from Nor hub
  const PRICE_AUTHORITY_SIGNER =
    process.env.PRICE_AUTHORITY_SIGNER || deployer.address;

  // ============ Deploy SettlementInbox ============

  console.log("📮 Deploying SettlementInbox...");
  // Deploy with placeholder router address, will update after deploying router
  const SettlementInbox = await ethers.getContractFactory("SettlementInbox");
  const settlementInbox = await SettlementInbox.deploy(
    "0x0000000000000000000000000000000000000001" // Temporary address
  );
  await settlementInbox.waitForDeployment();
  const settlementInboxAddress = await settlementInbox.getAddress();
  console.log("✅ SettlementInbox deployed at:", settlementInboxAddress);
  console.log();

  // ============ Deploy NorRouter ============

  console.log("🔀 Deploying NorRouter...");
  const NorRouter = await ethers.getContractFactory("NorRouter");
  const xaheenRouter = await NorRouter.deploy(
    config.xhtToken,
    settlementInboxAddress,
    PRICE_AUTHORITY_SIGNER,
    config.dexRouter
  );
  await xaheenRouter.waitForDeployment();
  const xaheenRouterAddress = await xaheenRouter.getAddress();
  console.log("✅ NorRouter deployed at:", xaheenRouterAddress);
  console.log();

  // ============ Configure SettlementInbox ============

  console.log("⚙️  Updating SettlementInbox router address...");
  await settlementInbox.updateRouter(xaheenRouterAddress);
  console.log("✅ Router address updated");
  console.log();

  // ============ Configure Payment Tokens ============

  console.log("💵 Adding payment tokens to NorRouter...");

  if (chainId === 56) {
    // BSC: Add USDT and BUSD
    console.log("   Adding USDT:", config.usdt);
    await xaheenRouter.addPaymentToken(config.usdt);
    console.log("   Adding BUSD:", config.busd);
    await xaheenRouter.addPaymentToken(config.busd);
  } else if (chainId === 137) {
    // Polygon: Add USDT and USDC
    console.log("   Adding USDT:", config.usdt);
    await xaheenRouter.addPaymentToken(config.usdt);
    console.log("   Adding USDC:", config.usdc);
    await xaheenRouter.addPaymentToken(config.usdc);
  } else if (chainId === 1) {
    // Ethereum: Add USDT and USDC
    console.log("   Adding USDT:", config.usdt);
    await xaheenRouter.addPaymentToken(config.usdt);
    console.log("   Adding USDC:", config.usdc);
    await xaheenRouter.addPaymentToken(config.usdc);
  }

  console.log("✅ Payment tokens configured");
  console.log();

  // ============ Summary ============

  console.log("🎉 Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Spoke Contracts (${config.name}):`);
  console.log("   NorRouter:      ", xaheenRouterAddress);
  console.log("   SettlementInbox:   ", settlementInboxAddress);
  console.log("═══════════════════════════════════════════════════════════");
  console.log();

  console.log("📝 Next Steps:");
  console.log("1. Replenish hot inventory: xaheenRouter.replenishInventory()");
  console.log(
    "2. Register public LPs (if available): xaheenRouter.registerPublicLP()"
  );
  console.log(
    "3. Configure relayer to monitor Fill events from SettlementInbox"
  );
  console.log("4. Test with small trades");
  console.log();

  console.log("💾 Save these addresses:");
  console.log(
    `XAHEEN_ROUTER_${config.name.toUpperCase()}_ADDRESS=${xaheenRouterAddress}`
  );
  console.log(
    `SETTLEMENT_INBOX_${config.name.toUpperCase()}_ADDRESS=${settlementInboxAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
