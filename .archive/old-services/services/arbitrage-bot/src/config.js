/**
 * Arbitrage Bot Configuration
 */

export const config = {
  // Monitoring interval (30 seconds)
  monitoringIntervalMs: 30000,

  // Arbitrage thresholds
  thresholds: {
    deviationTrigger: 0.003, // 0.3% deviation triggers arbitrage
    minProfit: 5, // $5 minimum profit (covers gas)
    maxDeviation: 0.03, // 3% max deviation (circuit breaker)
  },

  // Arbitrage amount (10,000 NOR per trade)
  arbitrageAmountNOR: 10000,

  // Nor Chain (Hub)
  xaheenChain: {
    rpc: process.env.PRIVATE_CHAIN_RPC || "https://rpc.xaheen.org",
    chainId: 65001,
    priceAuthorityAddress: process.env.PRICE_AUTHORITY_ADDRESS || "",
    xaheenPairAddress: process.env.XAHEEN_PAIR_ADDRESS || "",
    xhtTokenAddress: process.env.NOR_TOKEN_ADDRESS || "",
  },

  // Spoke chains
  spokes: [
    {
      chainId: 56,
      name: "BSC",
      rpc: process.env.BSC_MAINNET_RPC || "https://bsc.publicnode.com",
      dexRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2
      dexName: "PancakeSwap",
      xhtAddress: process.env.NOR_BSC_ADDRESS || "",
      usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
      xaheenRouterAddress: process.env.XAHEEN_ROUTER_BSC_ADDRESS || "",
      gasPrice: ethers.parseUnits("3", "gwei"), // 3 gwei
    },
    {
      chainId: 137,
      name: "Polygon",
      rpc: process.env.POLYGON_RPC || "https://polygon-rpc.com",
      dexRouter: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
      dexName: "QuickSwap",
      xhtAddress: process.env.NOR_POLYGON_ADDRESS || "",
      usdtAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      xaheenRouterAddress: process.env.XAHEEN_ROUTER_POLYGON_ADDRESS || "",
      gasPrice: ethers.parseUnits("50", "gwei"), // 50 gwei
    },
    {
      chainId: 1,
      name: "Ethereum",
      rpc: process.env.ETH_RPC || "https://eth.llamarpc.com",
      dexRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
      dexName: "Uniswap",
      xhtAddress: process.env.NOR_ETH_ADDRESS || "",
      usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      xaheenRouterAddress: process.env.XAHEEN_ROUTER_ETH_ADDRESS || "",
      gasPrice: ethers.parseUnits("20", "gwei"), // 20 gwei
    },
  ],

  // Wallet configuration
  wallet: {
    privateKey:
      process.env.ARBITRAGE_BOT_PRIVATE_KEY ||
      process.env.MAIN_WALLET_PRIVATE_KEY,
  },

  // Flashbots (MEV protection)
  flashbots: {
    enabled: false, // Disable for now, enable for production
    relayUrl: "https://relay.flashbots.net",
  },

  // Logging
  logging: {
    verbose: process.env.VERBOSE_LOGGING === "true",
  },
};

// Validate configuration
function validateConfig() {
  const errors = [];

  if (!config.xaheenChain.priceAuthorityAddress) {
    errors.push("Missing PRICE_AUTHORITY_ADDRESS");
  }

  if (!config.wallet.privateKey) {
    errors.push("Missing ARBITRAGE_BOT_PRIVATE_KEY or MAIN_WALLET_PRIVATE_KEY");
  }

  config.spokes.forEach((spoke) => {
    if (!spoke.xhtAddress) {
      errors.push(`Missing NOR_${spoke.name.toUpperCase()}_ADDRESS`);
    }
    if (!spoke.xaheenRouterAddress) {
      errors.push(`Missing XAHEEN_ROUTER_${spoke.name.toUpperCase()}_ADDRESS`);
    }
  });

  if (errors.length > 0) {
    console.error("❌ Configuration errors:");
    errors.forEach((err) => console.error(`   - ${err}`));
    console.error("\nPlease check your .env file");
    process.exit(1);
  }
}

// Validate on import
validateConfig();

// Import ethers for config
import { ethers } from "ethers";
