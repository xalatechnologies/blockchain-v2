/**
 * Deploy Spoke Contracts to BSC Mainnet
 *
 * This script deploys the spoke infrastructure to BSC Mainnet:
 * - Wrapped XHT Token (bridge representation of XHT)
 * - SettlementInbox (receives Fill events)
 * - XaheenRouter (user-facing router for trades)
 *
 * Prerequisites:
 * - Hub contracts must be deployed first (deploy-hub-mainnet.cjs)
 * - deployment-mainnet.json must exist with hub addresses
 *
 * Usage:
 * npx hardhat run scripts/deploy-spoke-mainnet.cjs --network bsc
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");

async function main() {
  console.log("\n🚀 Deploying Spoke Contracts to BSC Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "BNB\n");

  // Check minimum balance for deployment
  if (balance < ethers.parseEther("0.005")) {
    throw new Error("Insufficient BNB for deployment. Need at least 0.005 BNB for gas.");
  }

  // Verify we're on BSC Mainnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 56n) {
    throw new Error(`Wrong network! Expected BSC Mainnet (56), got ${network.chainId}`);
  }

  console.log("✅ Network verified: BSC Mainnet (56)\n");

  // Load hub deployment info
  if (!fs.existsSync("deployment-mainnet.json")) {
    throw new Error("deployment-mainnet.json not found. Deploy hub contracts first!");
  }

  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-mainnet.json", "utf8"));
  if (!deploymentInfo.hub) {
    throw new Error("Hub deployment info not found. Deploy hub contracts first!");
  }

  console.log("✅ Loaded hub deployment info\n");
  console.log("   Hub chain: Xaheen Chain (65001)");
  console.log("   SettlementHub:", deploymentInfo.hub.hub.settlementHub);
  console.log("   SupplyController:", deploymentInfo.hub.hub.supplyController, "\n");

  // ========== PHASE 1: Deploy Wrapped XHT ==========
  console.log("📍 PHASE 1: Deploying Wrapped XHT...\n");

  const WrappedXHT = await ethers.getContractFactory("contracts/XHTBridgeToken.sol:XHTBridgeToken");
  const wrappedXHT = await WrappedXHT.deploy();
  await wrappedXHT.waitForDeployment();
  const wrappedXHTAddress = await wrappedXHT.getAddress();
  console.log("   ✅ Wrapped XHT deployed:", wrappedXHTAddress);
  console.log("   Name:", await wrappedXHT.name());
  console.log("   Symbol:", await wrappedXHT.symbol(), "\n");

  // ========== PHASE 2: Deploy SettlementInbox ==========
  console.log("📍 PHASE 2: Deploying SettlementInbox...\n");

  // Deploy with deployer as temporary router (will update after XaheenRouter deployment)
  const SettlementInbox = await ethers.getContractFactory("contracts/crosschain/spokes/SettlementInbox.sol:SettlementInbox");
  const settlementInbox = await SettlementInbox.deploy(deployer.address);
  await settlementInbox.waitForDeployment();
  const settlementInboxAddress = await settlementInbox.getAddress();
  console.log("   ✅ SettlementInbox deployed:", settlementInboxAddress);
  console.log("   Temporary router:", deployer.address, "\n");

  // ========== PHASE 3: Deploy XaheenRouter ==========
  console.log("📍 PHASE 3: Deploying XaheenRouter...\n");

  // PancakeSwap V2 Router on BSC Mainnet
  const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  const XaheenRouter = await ethers.getContractFactory("contracts/crosschain/spokes/XaheenRouter.sol:XaheenRouter");
  const xaheenRouter = await XaheenRouter.deploy(
    wrappedXHTAddress,
    settlementInboxAddress,
    deployer.address, // Quote signer (same as PriceAuthority on hub)
    PANCAKESWAP_ROUTER // PancakeSwap V2 router for fallback routing
  );
  await xaheenRouter.waitForDeployment();
  const xaheenRouterAddress = await xaheenRouter.getAddress();
  console.log("   ✅ XaheenRouter deployed:", xaheenRouterAddress);
  console.log("   Wrapped XHT:", wrappedXHTAddress);
  console.log("   SettlementInbox:", settlementInboxAddress);
  console.log("   Quote signer:", deployer.address);
  console.log("   Public DEX:", PANCAKESWAP_ROUTER, "\n");

  // ========== PHASE 4: Configuration ==========
  console.log("📍 PHASE 4: Configuring Spoke...\n");

  // Update SettlementInbox router to XaheenRouter
  console.log("4.1: Updating SettlementInbox router...");
  await settlementInbox.updateRouter(xaheenRouterAddress);
  console.log("   ✅ SettlementInbox router set to XaheenRouter\n");

  // Grant MINTER_ROLE to XaheenRouter on Wrapped XHT
  console.log("4.2: Granting MINTER_ROLE to XaheenRouter...");
  const MINTER_ROLE = await wrappedXHT.MINTER_ROLE();
  await wrappedXHT.grantRole(MINTER_ROLE, xaheenRouterAddress);
  console.log("   ✅ Granted MINTER_ROLE to XaheenRouter on Wrapped XHT\n");

  // ========== PHASE 5: Deployment Summary ==========
  console.log("═══════════════════════════════════════════════════════");
  console.log("        SPOKE CONTRACTS DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("🌐 SPOKE CONTRACTS (BSC Mainnet - Chain ID: 56):");
  console.log("   Wrapped XHT:", wrappedXHTAddress);
  console.log("   SettlementInbox:", settlementInboxAddress);
  console.log("   XaheenRouter:", xaheenRouterAddress);
  console.log("");

  console.log("🏦 HUB CONTRACTS (Xaheen Chain - Chain ID: 65001):");
  console.log("   SettlementHub:", deploymentInfo.hub.hub.settlementHub);
  console.log("   SupplyController:", deploymentInfo.hub.hub.supplyController);
  console.log("   PriceAuthority:", deploymentInfo.hub.hub.priceAuthority);
  console.log("   XHT Token:", deploymentInfo.hub.hub.xhtToken);
  console.log("");

  console.log("🔗 EXTERNAL INTEGRATIONS:");
  console.log("   PancakeSwap Router:", PANCAKESWAP_ROUTER);
  console.log("   BTCBR Token:", "0x0cF8e180350253271f4b917CcFb0aCCc4862F262");
  console.log("");

  console.log("👤 ROLES:");
  console.log("   Quote Signer:", deployer.address);
  console.log("   Router Admin:", deployer.address);
  console.log("");

  console.log("═══════════════════════════════════════════════════════\n");

  // Update deployment file
  deploymentInfo.spoke = {
    network: "BSC Mainnet",
    chainId: 56,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      wrappedXHT: wrappedXHTAddress,
      settlementInbox: settlementInboxAddress,
      xaheenRouter: xaheenRouterAddress,
    },
    externalContracts: {
      pancakeswapRouter: PANCAKESWAP_ROUTER,
      btcbrToken: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
    },
    roles: {
      quoteSigner: deployer.address,
      routerAdmin: deployer.address,
    },
  };

  deploymentInfo.lastUpdated = new Date().toISOString();

  fs.writeFileSync(
    "deployment-mainnet.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info updated in: deployment-mainnet.json\n");

  // ========== NEXT STEPS ==========
  console.log("🎯 NEXT STEPS:\n");

  console.log("1. Initialize inventory on spoke:");
  console.log("   - Mint wrapped XHT to XaheenRouter for initial liquidity");
  console.log("   - Call supplyController.authorizeTopup(56, amount) on hub\n");

  console.log("2. Update xaheen-sdk API .env with deployed addresses:");
  console.log("   BSC_MAINNET_RPC=https://bsc-dataseed.binance.org");
  console.log("   SPOKE_BSC_SETTLEMENT_INBOX=" + settlementInboxAddress);
  console.log("   SPOKE_BSC_XAHEEN_ROUTER=" + xaheenRouterAddress);
  console.log("   SPOKE_BSC_WRAPPED_XHT=" + wrappedXHTAddress + "\n");

  console.log("3. Start relayer service:");
  console.log("   cd /Volumes/Development/sahalat/private\\ server/xaheen-sdk/apps/api");
  console.log("   Update .env with all deployed addresses");
  console.log("   npm run db:generate && npm run db:migrate");
  console.log("   npm run dev\n");

  console.log("4. Execute test transfer:");
  console.log("   - Get signed quote from PriceAuthority");
  console.log("   - Call xaheenRouter.buyXHT() or sellXHT()");
  console.log("   - Verify Fill event emitted");
  console.log("   - Check relayer forwards to SettlementHub\n");

  console.log("5. Deploy BTCBR Bridge (optional):");
  console.log("   npx hardhat run scripts/deploy-btcbr-bridge-mainnet.cjs --network bsc\n");

  console.log("✅ Spoke deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Spoke deployment failed:", error);
    process.exit(1);
  });
