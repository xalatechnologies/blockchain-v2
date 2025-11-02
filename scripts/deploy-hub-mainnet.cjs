/**
 * Deploy Hub Contracts to Xaheen Chain Mainnet
 *
 * This script deploys the core hub infrastructure to Xaheen Chain:
 * - XHT Token (native token)
 * - PriceAuthority (TWAP oracle)
 * - SupplyController (cross-chain inventory management)
 * - SettlementHub (cross-chain settlement)
 *
 * Usage:
 * npx hardhat run scripts/deploy-hub-mainnet.cjs --network btcbr
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");

async function main() {
  console.log("\n🚀 Deploying Hub Contracts to Xaheen Chain Mainnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "XHT\n");

  // Check minimum balance for deployment
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient XHT for deployment. Need at least 0.1 XHT for gas.");
  }

  // Verify we're on Xaheen Chain
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 65001n) {
    throw new Error(`Wrong network! Expected Xaheen Chain (65001), got ${network.chainId}`);
  }

  console.log("✅ Network verified: Xaheen Chain (65001)\n");

  // ========== PHASE 1: Deploy XHT ERC20 Token ==========
  console.log("📍 PHASE 1: Deploying XHT ERC20 Token...\n");
  console.log("   Note: This is the ERC20 XHT token for cross-chain DEX");
  console.log("   (separate from native XHT gas token in genesis)\n");

  const XHTToken = await ethers.getContractFactory("contracts/crosschain/XHTToken.sol:XHTToken");
  const xhtToken = await XHTToken.deploy();
  await xhtToken.waitForDeployment();
  const xhtAddress = await xhtToken.getAddress();
  console.log("   ✅ XHT ERC20 Token deployed:", xhtAddress);
  console.log("   Initial supply:", ethers.formatEther(await xhtToken.totalSupply()), "XHT");
  console.log("   (Supply will be minted by SupplyController as needed)\n");

  // ========== PHASE 2: Deploy PriceAuthority ==========
  console.log("📍 PHASE 2: Deploying PriceAuthority...\n");

  // For mainnet, we'll use PancakeSwap on BSC for TWAP oracle
  // The actual DEX pair address will be updated after spoke deployment
  // For now, use a placeholder that will be updated
  const PLACEHOLDER_PAIR = "0x0000000000000000000000000000000000000001"; // Placeholder

  const PriceAuthority = await ethers.getContractFactory("contracts/crosschain/PriceAuthority.sol:PriceAuthority");
  const priceAuthority = await PriceAuthority.deploy(
    PLACEHOLDER_PAIR, // Will be updated to real PancakeSwap pair
    deployer.address // Quote signer (deployer for now, can be updated)
  );
  await priceAuthority.waitForDeployment();
  const priceAuthorityAddress = await priceAuthority.getAddress();
  console.log("   ✅ PriceAuthority deployed:", priceAuthorityAddress);
  console.log("   Quote signer:", deployer.address);
  console.log("   ⚠️  DEX pair is placeholder, update after spoke deployment\n");

  // ========== PHASE 3: Deploy SupplyController ==========
  console.log("📍 PHASE 3: Deploying SupplyController...\n");

  const SupplyController = await ethers.getContractFactory("contracts/crosschain/SupplyController.sol:SupplyController");
  const supplyController = await SupplyController.deploy(
    xhtAddress,
    deployer.address // Treasury (deployer for now)
  );
  await supplyController.waitForDeployment();
  const supplyControllerAddress = await supplyController.getAddress();
  console.log("   ✅ SupplyController deployed:", supplyControllerAddress);
  console.log("   Treasury:", deployer.address, "\n");

  // ========== PHASE 4: Deploy SettlementHub ==========
  console.log("📍 PHASE 4: Deploying SettlementHub...\n");

  const SettlementHub = await ethers.getContractFactory("contracts/crosschain/SettlementHub.sol:SettlementHub");
  const settlementHub = await SettlementHub.deploy(
    supplyControllerAddress,
    priceAuthorityAddress,
    deployer.address // Relayer (deployer for now, will be xaheen-sdk API)
  );
  await settlementHub.waitForDeployment();
  const settlementHubAddress = await settlementHub.getAddress();
  console.log("   ✅ SettlementHub deployed:", settlementHubAddress);
  console.log("   Relayer:", deployer.address, "\n");

  // ========== PHASE 5: Configuration ==========
  console.log("📍 PHASE 5: Configuring Hub...\n");

  // Grant roles
  console.log("5.1: Granting roles...");

  // Grant ADMIN_ROLE to deployer on SupplyController
  const ADMIN_ROLE = await supplyController.ADMIN_ROLE();
  await supplyController.grantRole(ADMIN_ROLE, deployer.address);
  console.log("   ✅ Granted ADMIN_ROLE to deployer on SupplyController");

  // Grant RELAYER_ROLE to deployer on SettlementHub
  const RELAYER_ROLE = await settlementHub.RELAYER_ROLE();
  await settlementHub.grantRole(RELAYER_ROLE, deployer.address);
  console.log("   ✅ Granted RELAYER_ROLE to deployer on SettlementHub");

  // Grant MINTER_ROLE to SupplyController on XHT Token
  const MINTER_ROLE = await xhtToken.MINTER_ROLE();
  await xhtToken.grantRole(MINTER_ROLE, supplyControllerAddress);
  console.log("   ✅ Granted MINTER_ROLE to SupplyController on XHT Token\n");

  // Add BSC Mainnet chain to SupplyController
  console.log("5.2: Adding BSC Mainnet chain...");
  const BSC_MAINNET_CHAIN_ID = 56;
  const INVENTORY_CAP = ethers.parseEther("1000000"); // 1M XHT cap
  const MAX_INVENTORY_PERCENTAGE = 500; // 5% of total supply
  const DAILY_LIMIT = ethers.parseEther("100000"); // $100K daily limit

  await supplyController.addChain(
    BSC_MAINNET_CHAIN_ID,
    INVENTORY_CAP,
    MAX_INVENTORY_PERCENTAGE,
    DAILY_LIMIT
  );
  console.log("   ✅ Added BSC Mainnet (Chain ID: 56) to SupplyController");
  console.log("      - Inventory Cap: 1M XHT");
  console.log("      - Max Percentage: 5%");
  console.log("      - Daily Limit: $100K\n");

  // ========== PHASE 6: Deployment Summary ==========
  console.log("═══════════════════════════════════════════════════════");
  console.log("         HUB CONTRACTS DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("🏦 HUB CONTRACTS (Xaheen Chain - Chain ID: 65001):");
  console.log("   XHT Token:", xhtAddress);
  console.log("   PriceAuthority:", priceAuthorityAddress);
  console.log("   SupplyController:", supplyControllerAddress);
  console.log("   SettlementHub:", settlementHubAddress);
  console.log("");

  console.log("⚙️  CONFIGURATION:");
  console.log("   Chain ID: 65001 (Xaheen Chain)");
  console.log("   Supported Spokes: BSC Mainnet (56)");
  console.log("   Inventory Cap: 1,000,000 XHT");
  console.log("   Daily Limit: $100,000");
  console.log("   Max Inventory: 5% of total supply");
  console.log("");

  console.log("👤 ROLES:");
  console.log("   Admin:", deployer.address);
  console.log("   Relayer:", deployer.address, "(update to xaheen-sdk API)");
  console.log("   Quote Signer:", deployer.address);
  console.log("   Treasury:", deployer.address);
  console.log("");

  console.log("═══════════════════════════════════════════════════════\n");

  // Save deployment addresses
  const deploymentInfo = {
    network: "Xaheen Chain Mainnet",
    chainId: 65001,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    hub: {
      xhtToken: xhtAddress,
      priceAuthority: priceAuthorityAddress,
      supplyController: supplyControllerAddress,
      settlementHub: settlementHubAddress,
    },
    configuration: {
      bscMainnetChainId: BSC_MAINNET_CHAIN_ID,
      inventoryCap: ethers.formatEther(INVENTORY_CAP),
      maxInventoryPercentage: MAX_INVENTORY_PERCENTAGE / 100,
      dailyLimit: ethers.formatEther(DAILY_LIMIT),
    },
    roles: {
      admin: deployer.address,
      relayer: deployer.address,
      quoteSigner: deployer.address,
      treasury: deployer.address,
    },
  };

  // Load existing deployment info if it exists
  let fullDeployment = {};
  if (fs.existsSync("deployment-mainnet.json")) {
    fullDeployment = JSON.parse(fs.readFileSync("deployment-mainnet.json", "utf8"));
  }

  // Merge with existing spoke deployment if present
  fullDeployment.hub = deploymentInfo;
  fullDeployment.lastUpdated = new Date().toISOString();

  fs.writeFileSync(
    "deployment-mainnet.json",
    JSON.stringify(fullDeployment, null, 2)
  );
  console.log("📄 Deployment info saved to: deployment-mainnet.json\n");

  // ========== NEXT STEPS ==========
  console.log("🎯 NEXT STEPS:\n");
  console.log("1. Deploy spoke contracts to BSC Mainnet:");
  console.log("   npx hardhat run scripts/deploy-spoke-mainnet.cjs --network bsc\n");

  console.log("2. Update PriceAuthority with real PancakeSwap pair address\n");

  console.log("3. Authorize initial inventory topup:");
  console.log("   await supplyController.authorizeTopup(56, amount)\n");

  console.log("4. Update xaheen-sdk API .env with deployed addresses:");
  console.log("   HUB_SETTLEMENT_HUB=" + settlementHubAddress);
  console.log("   HUB_SUPPLY_CONTROLLER=" + supplyControllerAddress);
  console.log("   HUB_PRICE_AUTHORITY=" + priceAuthorityAddress + "\n");

  console.log("✅ Hub deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Hub deployment failed:", error);
    process.exit(1);
  });
