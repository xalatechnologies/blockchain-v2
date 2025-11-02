/**
 * Deploy Cross-Chain DEX to Testnet
 *
 * Deployment order:
 * 1. Hub contracts (on BSC Testnet as "Xaheen Chain" for testing)
 * 2. Spoke contracts (on BSC Testnet)
 * 3. Configuration and initialization
 *
 * Usage:
 * npx hardhat run scripts/deploy-dex-testnet.js --network bscTestnet
 */

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("\n🚀 Deploying Cross-Chain DEX to Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  // Check minimum balance
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance < ethers.parseEther("0.005")) {
    throw new Error("Insufficient testnet BNB. Get testnet BNB from: https://testnet.binance.org/faucet-smart");
  }

  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  WARNING: Low balance. Deployment may fail if gas costs exceed", ethers.formatEther(balance), "BNB");
    console.log("    Recommended: Get more testnet BNB from https://testnet.binance.org/faucet-smart\n");
  }

  // ========== PHASE 1: Deploy Hub Contracts ==========
  console.log("📍 PHASE 1: Deploying Hub Contracts (Xaheen Chain simulation)...\n");

  // 1.1: Deploy XHT Token (mock for testnet)
  console.log("1.1: Deploying XHT Token...");
  const XHTToken = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
  const xhtToken = await XHTToken.deploy("Xaheen Token", "XHT", 18);
  await xhtToken.waitForDeployment();
  const xhtAddress = await xhtToken.getAddress();
  console.log("   ✅ XHT Token deployed:", xhtAddress);

  // Mint initial supply to deployer
  await xhtToken.mint(deployer.address, ethers.parseEther("1000000")); // 1M XHT for testing
  console.log("   ✅ Minted 1M XHT to deployer\n");

  // 1.2: Deploy Mock DEX Pair (for TWAP oracle)
  console.log("1.2: Deploying Mock DEX infrastructure...");

  // Deploy mock DEX router for token swaps
  const MockDEXRouter = await ethers.getContractFactory("contracts/test/MockDEXRouter.sol:MockDEXRouter");
  const mockDexRouter = await MockDEXRouter.deploy();
  await mockDexRouter.waitForDeployment();
  const mockDexRouterAddress = await mockDexRouter.getAddress();
  console.log("   ✅ Mock DEX Router deployed:", mockDexRouterAddress);

  // Deploy USDT mock token
  const USDTToken = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
  const usdtToken = await USDTToken.deploy("Tether USD", "USDT", 6);
  await usdtToken.waitForDeployment();
  const usdtAddress = await usdtToken.getAddress();
  console.log("   ✅ USDT Token deployed:", usdtAddress);

  // Mint USDT for testing
  await usdtToken.mint(deployer.address, 100000 * 1e6); // 100K USDT
  console.log("   ✅ Minted 100K USDT to deployer");

  // Deploy Mock DEX Pair for TWAP oracle
  const MockDEXPair = await ethers.getContractFactory("contracts/test/MockDEXPair.sol:MockDEXPair");
  const mockDexPair = await MockDEXPair.deploy(xhtAddress, usdtAddress);
  await mockDexPair.waitForDeployment();
  const mockDexPairAddress = await mockDexPair.getAddress();
  console.log("   ✅ Mock DEX Pair deployed:", mockDexPairAddress);

  // Set exchange rate in mock DEX router (1 USDT = 10 XHT for testing)
  await mockDexRouter.setExchangeRate(usdtAddress, xhtAddress, ethers.parseEther("10"));
  console.log("   ✅ Set exchange rate: 1 USDT = 10 XHT\n");

  // Add liquidity to mock DEX router
  console.log("   Approving tokens for liquidity...");
  const approveTx1 = await usdtToken.approve(mockDexRouterAddress, 50000 * 1e6);
  await approveTx1.wait();
  const approveTx2 = await xhtToken.approve(mockDexRouterAddress, ethers.parseEther("500000"));
  await approveTx2.wait();
  console.log("   ✅ Tokens approved");

  const liqTx1 = await mockDexRouter.addLiquidity(usdtAddress, 50000 * 1e6);
  await liqTx1.wait();
  const liqTx2 = await mockDexRouter.addLiquidity(xhtAddress, ethers.parseEther("500000"));
  await liqTx2.wait();
  console.log("   ✅ Added liquidity to mock DEX router\n");

  // 1.3: Deploy PriceAuthority
  console.log("1.3: Deploying PriceAuthority...");
  const PriceAuthority = await ethers.getContractFactory("contracts/crosschain/PriceAuthority.sol:PriceAuthority");
  const priceAuthority = await PriceAuthority.deploy(
    mockDexPairAddress, // Mock pair for TWAP
    deployer.address // Quote signer (deployer for testnet)
  );
  await priceAuthority.waitForDeployment();
  const priceAuthorityAddress = await priceAuthority.getAddress();
  console.log("   ✅ PriceAuthority deployed:", priceAuthorityAddress, "\n");

  // 1.4: Deploy SupplyController
  console.log("1.4: Deploying SupplyController...");
  const SupplyController = await ethers.getContractFactory("contracts/crosschain/SupplyController.sol:SupplyController");
  const supplyController = await SupplyController.deploy(
    xhtAddress,
    deployer.address // Treasury (deployer for testnet)
  );
  await supplyController.waitForDeployment();
  const supplyControllerAddress = await supplyController.getAddress();
  console.log("   ✅ SupplyController deployed:", supplyControllerAddress, "\n");

  // 1.5: Deploy SettlementHub
  console.log("1.5: Deploying SettlementHub...");
  const SettlementHub = await ethers.getContractFactory("contracts/crosschain/SettlementHub.sol:SettlementHub");
  const settlementHub = await SettlementHub.deploy(
    supplyControllerAddress,
    priceAuthorityAddress,
    deployer.address // Relayer (deployer for testnet)
  );
  await settlementHub.waitForDeployment();
  const settlementHubAddress = await settlementHub.getAddress();
  console.log("   ✅ SettlementHub deployed:", settlementHubAddress, "\n");

  // ========== PHASE 2: Deploy Spoke Contracts ==========
  console.log("📍 PHASE 2: Deploying Spoke Contracts (BSC Testnet)...\n");

  // 2.1: Deploy Wrapped XHT
  console.log("2.1: Deploying Wrapped XHT for spoke...");
  const WrappedXHT = await ethers.getContractFactory("contracts/XHTBridgeToken.sol:XHTBridgeToken");
  const wrappedXHT = await WrappedXHT.deploy();
  await wrappedXHT.waitForDeployment();
  const wrappedXHTAddress = await wrappedXHT.getAddress();
  console.log("   ✅ Wrapped XHT deployed:", wrappedXHTAddress, "\n");

  // 2.2: Deploy SettlementInbox (with deployer as temporary router)
  console.log("2.2: Deploying SettlementInbox...");
  const SettlementInbox = await ethers.getContractFactory("contracts/crosschain/spokes/SettlementInbox.sol:SettlementInbox");
  const settlementInbox = await SettlementInbox.deploy(deployer.address); // Temporary router
  await settlementInbox.waitForDeployment();
  const settlementInboxAddress = await settlementInbox.getAddress();
  console.log("   ✅ SettlementInbox deployed:", settlementInboxAddress);

  // 2.3: Deploy XaheenRouter
  console.log("2.3: Deploying XaheenRouter...");
  const XaheenRouter = await ethers.getContractFactory("contracts/crosschain/spokes/XaheenRouter.sol:XaheenRouter");
  const xaheenRouter = await XaheenRouter.deploy(
    wrappedXHTAddress,
    settlementInboxAddress,
    deployer.address, // Quote signer (same as PriceAuthority)
    mockDexRouterAddress // Public DEX router for fallback routing
  );
  await xaheenRouter.waitForDeployment();
  const xaheenRouterAddress = await xaheenRouter.getAddress();
  console.log("   ✅ XaheenRouter deployed:", xaheenRouterAddress);

  // 2.4: Update SettlementInbox router to XaheenRouter
  console.log("2.4: Configuring SettlementInbox router...");
  await settlementInbox.updateRouter(xaheenRouterAddress);
  console.log("   ✅ SettlementInbox router set to XaheenRouter\n");

  // ========== PHASE 3: Configuration ==========
  console.log("📍 PHASE 3: Configuration...\n");

  // 3.1: Add BSC Testnet chain to SupplyController
  console.log("3.1: Adding BSC Testnet chain to SupplyController...");
  const BSC_TESTNET_CHAIN_ID = 97;
  const INVENTORY_CAP = ethers.parseEther("100000"); // 100K XHT cap
  const MAX_INVENTORY_PERCENTAGE = 300; // 3% of total supply
  const DAILY_LIMIT = ethers.parseEther("10000"); // $10K daily limit for testing

  await supplyController.addChain(
    BSC_TESTNET_CHAIN_ID,
    INVENTORY_CAP,
    MAX_INVENTORY_PERCENTAGE,
    DAILY_LIMIT
  );
  console.log("   ✅ Added BSC Testnet (Chain ID: 97) to SupplyController");
  console.log("      - Inventory Cap: 100K XHT");
  console.log("      - Max Percentage: 3%");
  console.log("      - Daily Limit: $10K\n");

  // 3.2: Grant roles
  console.log("3.2: Granting roles...");

  // Grant ADMIN_ROLE to deployer on SupplyController
  const ADMIN_ROLE = await supplyController.ADMIN_ROLE();
  await supplyController.grantRole(ADMIN_ROLE, deployer.address);
  console.log("   ✅ Granted ADMIN_ROLE to deployer");

  // Grant RELAYER_ROLE to deployer on SettlementHub
  const RELAYER_ROLE = await settlementHub.RELAYER_ROLE();
  await settlementHub.grantRole(RELAYER_ROLE, deployer.address);
  console.log("   ✅ Granted RELAYER_ROLE to deployer");

  // Grant MINTER_ROLE to SupplyController on XHT Token
  const MINTER_ROLE = await xhtToken.MINTER_ROLE();
  await xhtToken.grantRole(MINTER_ROLE, supplyControllerAddress);
  console.log("   ✅ Granted MINTER_ROLE to SupplyController\n");

  // 3.3: Initialize inventory on spoke
  console.log("3.3: Initializing inventory on spoke...");
  const INITIAL_INVENTORY = ethers.parseEther("10000"); // 10K XHT

  // Mint wrapped XHT to XaheenRouter
  await wrappedXHT.mint(xaheenRouterAddress, INITIAL_INVENTORY);
  console.log("   ✅ Minted 10K wrapped XHT to XaheenRouter\n");

  // Authorize topup on hub (record inventory)
  await supplyController.authorizeTopup(BSC_TESTNET_CHAIN_ID, INITIAL_INVENTORY);
  console.log("   ✅ Authorized 10K XHT topup for BSC Testnet\n");

  // ========== PHASE 4: Summary ==========
  console.log("📍 PHASE 4: Deployment Summary\n");

  console.log("═══════════════════════════════════════════════════════");
  console.log("         CROSS-CHAIN DEX TESTNET DEPLOYMENT");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("🏦 HUB CONTRACTS (Xaheen Chain - Simulated on BSC Testnet):");
  console.log("   XHT Token:", xhtAddress);
  console.log("   PriceAuthority:", priceAuthorityAddress);
  console.log("   SupplyController:", supplyControllerAddress);
  console.log("   SettlementHub:", settlementHubAddress);
  console.log("");

  console.log("🌐 SPOKE CONTRACTS (BSC Testnet - Chain ID: 97):");
  console.log("   Wrapped XHT:", wrappedXHTAddress);
  console.log("   SettlementInbox:", settlementInboxAddress);
  console.log("   XaheenRouter:", xaheenRouterAddress);
  console.log("");

  console.log("🧪 TEST TOKENS:");
  console.log("   USDT (Mock):", usdtAddress);
  console.log("   Mock DEX Pair:", mockDexPairAddress);
  console.log("   Mock DEX Router:", mockDexRouterAddress);
  console.log("");

  console.log("⚙️  CONFIGURATION:");
  console.log("   Chain ID: 97 (BSC Testnet)");
  console.log("   Initial Inventory: 10,000 XHT");
  console.log("   Inventory Cap: 100,000 XHT");
  console.log("   Daily Limit: $10,000");
  console.log("   Exchange Rate: 1 USDT = 10 XHT");
  console.log("");

  console.log("👤 ROLES:");
  console.log("   Admin:", deployer.address);
  console.log("   Relayer:", deployer.address);
  console.log("   Quote Signer:", deployer.address);
  console.log("");

  console.log("═══════════════════════════════════════════════════════\n");

  // Save deployment addresses to file
  const deploymentInfo = {
    network: "BSC Testnet",
    chainId: 97,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    hub: {
      xhtToken: xhtAddress,
      priceAuthority: priceAuthorityAddress,
      supplyController: supplyControllerAddress,
      settlementHub: settlementHubAddress,
    },
    spoke: {
      wrappedXHT: wrappedXHTAddress,
      settlementInbox: settlementInboxAddress,
      xaheenRouter: xaheenRouterAddress,
    },
    testTokens: {
      usdt: usdtAddress,
      mockDexPair: mockDexPairAddress,
      mockDexRouter: mockDexRouterAddress,
    },
    configuration: {
      chainId: BSC_TESTNET_CHAIN_ID,
      initialInventory: ethers.formatEther(INITIAL_INVENTORY),
      inventoryCap: ethers.formatEther(INVENTORY_CAP),
      dailyLimit: ethers.formatEther(DAILY_LIMIT),
      exchangeRate: "1 USDT = 10 XHT",
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-testnet.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to: deployment-testnet.json\n");

  // ========== NEXT STEPS ==========
  console.log("🎯 NEXT STEPS:\n");
  console.log("1. Fund your wallet with testnet BNB from faucet:");
  console.log("   https://testnet.binance.org/faucet-smart\n");

  console.log("2. Get test USDT from the mock token:");
  console.log("   await usdtToken.mint(yourAddress, 1000 * 1e6); // 1000 USDT\n");

  console.log("3. Execute a test trade (buy XHT):");
  console.log("   - Approve USDT to XaheenRouter");
  console.log("   - Get signed quote from PriceAuthority");
  console.log("   - Call xaheenRouter.buyXHT(...)\n");

  console.log("4. Start relayer service:");
  console.log("   cd services/relayer");
  console.log("   Update .env with deployed addresses");
  console.log("   npm start\n");

  console.log("5. Monitor Fill events:");
  console.log("   - Check SettlementInbox for Fill events");
  console.log("   - Verify relayer forwards to SettlementHub");
  console.log("   - Confirm settlement on SupplyController\n");

  console.log("✅ Testnet deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
