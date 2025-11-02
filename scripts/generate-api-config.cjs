/**
 * Generate API Configuration
 *
 * This script generates the .env configuration for xaheen-sdk API
 * based on the deployed contract addresses.
 *
 * Prerequisites:
 * - deployment-mainnet.json must exist
 *
 * Output:
 * - api-config.env (copy this to xaheen-sdk/apps/api/.env)
 */

const fs = require("fs");

async function main() {
  console.log("\n📝 Generating API Configuration...\n");

  // Load deployment info
  if (!fs.existsSync("deployment-mainnet.json")) {
    throw new Error("deployment-mainnet.json not found. Deploy contracts first!");
  }

  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-mainnet.json", "utf8"));

  if (!deploymentInfo.hub || !deploymentInfo.spoke) {
    throw new Error("Incomplete deployment info. Both hub and spoke must be deployed!");
  }

  console.log("✅ Loaded deployment info\n");

  // Generate configuration
  const config = `# ============================================
# XAHEEN BRIDGE CONFIGURATION - MAINNET
# ============================================
# Generated: ${new Date().toISOString()}
# Deployment: ${deploymentInfo.lastUpdated}

# Relayer wallet private key (needs gas on all chains)
# UPDATE THIS with a dedicated relayer wallet!
RELAYER_PRIVATE_KEY=YOUR_RELAYER_PRIVATE_KEY_HERE

# ============================================
# HUB CHAIN (Xaheen Chain - Chain ID: 65001)
# ============================================

XAHEEN_CHAIN_RPC=${process.env.XAHEEN_CHAIN_RPC || 'https://rpc.xaheen.org'}

# Hub Contracts
HUB_SETTLEMENT_HUB=${deploymentInfo.hub.hub.settlementHub}
HUB_SUPPLY_CONTROLLER=${deploymentInfo.hub.hub.supplyController}
HUB_PRICE_AUTHORITY=${deploymentInfo.hub.hub.priceAuthority}
HUB_XHT_TOKEN=${deploymentInfo.hub.hub.xhtToken}

# ============================================
# SPOKE CHAINS - BSC MAINNET (Chain ID: 56)
# ============================================

BSC_MAINNET_RPC=${process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed.binance.org'}

# BSC Spoke Contracts
SPOKE_BSC_SETTLEMENT_INBOX=${deploymentInfo.spoke.contracts.settlementInbox}
SPOKE_BSC_XAHEEN_ROUTER=${deploymentInfo.spoke.contracts.xaheenRouter}
SPOKE_BSC_WRAPPED_XHT=${deploymentInfo.spoke.contracts.wrappedXHT}

# ============================================
# RELAYER SETTINGS
# ============================================

# Number of block confirmations required before forwarding (mainnet: 15)
CONFIRMATIONS_REQUIRED=15

# Poll interval for checking new blocks (milliseconds)
POLL_INTERVAL=5000

# Maximum gas price willing to pay (gwei)
MAX_GAS_PRICE=20

# ============================================
# EXTERNAL CONTRACTS
# ============================================

# PancakeSwap V2 Router
PANCAKESWAP_ROUTER=${deploymentInfo.spoke.externalContracts.pancakeswapRouter}

# BTCBR Token (if using BTCBR bridge)
BTCBR_TOKEN=${deploymentInfo.spoke.externalContracts.btcbrToken}

# ============================================
# DEPLOYMENT INFO
# ============================================

# Deployer address
DEPLOYER_ADDRESS=${deploymentInfo.hub.deployer}

# Hub chain ID
HUB_CHAIN_ID=65001

# Spoke chain IDs (comma-separated)
SPOKE_CHAIN_IDS=56

# ============================================
# NOTES
# ============================================

# 1. Update RELAYER_PRIVATE_KEY with a dedicated wallet
# 2. Fund relayer wallet with gas on both chains:
#    - BSC: ~0.1 BNB for ongoing operations
#    - Xaheen: ~10 XHT for ongoing operations
# 3. Copy this file to xaheen-sdk/apps/api/.env
# 4. Run database migration: npm run db:generate && npm run db:migrate
# 5. Start API: npm run dev

# ============================================
# END OF CONFIGURATION
# ============================================
`;

  // Write to file
  fs.writeFileSync("api-config.env", config);
  console.log("✅ Configuration generated: api-config.env\n");

  // Display summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("         API CONFIGURATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📄 Configuration file: api-config.env");
  console.log("");

  console.log("🏦 HUB CONTRACTS (Xaheen Chain):");
  console.log("   SettlementHub:", deploymentInfo.hub.hub.settlementHub);
  console.log("   SupplyController:", deploymentInfo.hub.hub.supplyController);
  console.log("   PriceAuthority:", deploymentInfo.hub.hub.priceAuthority);
  console.log("   XHT Token:", deploymentInfo.hub.hub.xhtToken);
  console.log("");

  console.log("🌐 SPOKE CONTRACTS (BSC Mainnet):");
  console.log("   SettlementInbox:", deploymentInfo.spoke.contracts.settlementInbox);
  console.log("   XaheenRouter:", deploymentInfo.spoke.contracts.xaheenRouter);
  console.log("   Wrapped XHT:", deploymentInfo.spoke.contracts.wrappedXHT);
  console.log("");

  console.log("═══════════════════════════════════════════════════════\n");

  console.log("🎯 NEXT STEPS:\n");

  console.log("1. Update RELAYER_PRIVATE_KEY in api-config.env");
  console.log("   (Use a dedicated wallet, NOT your deployer wallet!)\n");

  console.log("2. Fund relayer wallet:");
  console.log("   - BSC Mainnet: ~0.1 BNB for gas");
  console.log("   - Xaheen Chain: ~10 XHT for gas\n");

  console.log("3. Copy configuration to xaheen-sdk API:");
  console.log("   cat api-config.env >> /Volumes/Development/sahalat/private\\ server/xaheen-sdk/apps/api/.env\n");

  console.log("4. Follow BRIDGE_INTEGRATION.md steps:\n");
  console.log("   cd /Volumes/Development/sahalat/private\\ server/xaheen-sdk/apps/api");
  console.log("");
  console.log("   # Export schema");
  console.log("   # Add to src/db/schema/index.ts:");
  console.log("   export * from './bridge';");
  console.log("");
  console.log("   # Run migration");
  console.log("   npm run db:generate");
  console.log("   npm run db:migrate");
  console.log("");
  console.log("   # Register routes");
  console.log("   # Add to src/index.ts:");
  console.log("   import bridgeRoutes from './routes/bridge';");
  console.log("   import { startRelayer, stopRelayer } from './services/relayer.init';");
  console.log("   app.use('/api/bridge', bridgeRoutes);");
  console.log("   await startRelayer();");
  console.log("");
  console.log("   # Start API");
  console.log("   npm run dev\n");

  console.log("✅ Configuration ready!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to generate configuration:", error);
    process.exit(1);
  });
