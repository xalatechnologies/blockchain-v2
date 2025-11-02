/**
 * Relayer Service Configuration
 */

export const config = {
  // Xaheen Chain (Hub)
  xaheenChain: {
    rpc: process.env.PRIVATE_CHAIN_RPC || "https://rpc.xaheen.org",
    chainId: 65001,
    settlementHubAddress: process.env.SETTLEMENT_HUB_ADDRESS || "",
    priceAuthorityAddress: process.env.PRICE_AUTHORITY_ADDRESS || "",
  },

  // Spoke chains with finality requirements
  spokes: [
    {
      chainId: 56,
      name: "BSC",
      rpc: process.env.BSC_MAINNET_RPC || "https://bsc.publicnode.com",
      settlementInboxAddress: process.env.SETTLEMENT_INBOX_BSC_ADDRESS || "",
      requiredConfirmations: 15, // ~45 seconds on BSC
      blockTime: 3000, // 3 seconds
    },
    {
      chainId: 137,
      name: "Polygon",
      rpc: process.env.POLYGON_RPC || "https://polygon-rpc.com",
      settlementInboxAddress: process.env.SETTLEMENT_INBOX_POLYGON_ADDRESS || "",
      requiredConfirmations: 128, // ~4 minutes on Polygon
      blockTime: 2000, // 2 seconds
    },
    {
      chainId: 1,
      name: "Ethereum",
      rpc: process.env.ETH_RPC || "https://eth.llamarpc.com",
      settlementInboxAddress: process.env.SETTLEMENT_INBOX_ETH_ADDRESS || "",
      requiredConfirmations: 12, // ~2.5 minutes on Ethereum
      blockTime: 12000, // 12 seconds
    },
  ],

  // Relayer wallet (must have RELAYER_ROLE on SettlementHub)
  wallet: {
    privateKey: process.env.RELAYER_PRIVATE_KEY || process.env.MAIN_WALLET_PRIVATE_KEY,
  },

  // Retry configuration
  retry: {
    maxAttempts: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 60000, // 1 minute
    backoffMultiplier: 2, // Exponential backoff
  },

  // Monitoring
  monitoring: {
    healthCheckIntervalMs: 60000, // 1 minute
    logLevel: process.env.LOG_LEVEL || "info", // debug, info, warn, error
  },

  // Performance
  batchSize: 10, // Max receipts to process in single tx
  pollIntervalMs: 5000, // Check for new events every 5 seconds
};

// Validate configuration
function validateConfig() {
  const errors = [];

  if (!config.xaheenChain.settlementHubAddress) {
    errors.push("Missing SETTLEMENT_HUB_ADDRESS");
  }

  if (!config.wallet.privateKey) {
    errors.push("Missing RELAYER_PRIVATE_KEY or MAIN_WALLET_PRIVATE_KEY");
  }

  config.spokes.forEach((spoke) => {
    if (!spoke.settlementInboxAddress) {
      errors.push(`Missing SETTLEMENT_INBOX_${spoke.name.toUpperCase()}_ADDRESS`);
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
