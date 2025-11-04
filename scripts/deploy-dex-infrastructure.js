import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Deploy DEX Infrastructure
 *
 * This script deploys all required infrastructure for the Nor Chain DEX:
 * 1. WNOR (Wrapped NOR) - ERC-20 wrapper for native NOR
 * 2. Mock USDT - Test USDT token (6 decimals)
 * 3. NorSwapRouter (if not already deployed)
 * 4. LiquidityLock - LP token time-lock vault
 *
 * Requirements:
 * - NorSwapFactory must be deployed at: 0xbbb1ec421b156f0442D435A875E5267B8A2FDc39
 * - NOR Token must be deployed at: 0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c
 * - Dirhamat must be deployed at: 0x7857D6a475498e535969121f1B7B96151E422813
 */

// Known deployed addresses
const NOR_TOKEN = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";
const NOORSWAP_FACTORY = "0xbbb1ec421b156f0442D435A875E5267B8A2FDc39";
const DIRHAMAT = "0x7857D6a475498e535969121f1B7B96151E422813";

async function main() {
  console.log("🚀 Deploying Nor Chain DEX Infrastructure...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  console.log(
    "💰 Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "NOR\n"
  );

  // Track deployed contracts
  const deployedContracts = {
    NOR_TOKEN,
    NOORSWAP_FACTORY,
    DIRHAMAT,
  };

  // ======================
  // 1. Deploy WNOR
  // ======================
  console.log("1️⃣ Deploying WNOR (Wrapped NOR)...");
  const WNOR = await ethers.getContractFactory("WNOR");
  const wnor = await WNOR.deploy();
  await wnor.waitForDeployment();
  const wnorAddress = await wnor.getAddress();
  console.log("✅ WNOR deployed to:", wnorAddress);
  deployedContracts.WNOR = wnorAddress;

  // Verify WNOR works by depositing 1 NOR
  console.log("   Testing WNOR deposit...");
  const depositTx = await wnor.deposit({ value: ethers.parseEther("1") });
  await depositTx.wait();
  const wnorBalance = await wnor.balanceOf(deployer.address);
  console.log("   WNOR Balance:", ethers.formatEther(wnorBalance), "WNOR ✓\n");

  // ======================
  // 2. Deploy WUSDT (Wrapped USDT - Bridgeable)
  // ======================
  console.log("2️⃣ Deploying WUSDT (Wrapped USDT for Bridge)...");
  const WUSDTToken = await ethers.getContractFactory("WUSDTToken");
  const wusdt = await WUSDTToken.deploy();
  await wusdt.waitForDeployment();
  const usdtAddress = await wusdt.getAddress();
  console.log("✅ WUSDT deployed to:", usdtAddress);
  deployedContracts.WUSDT = usdtAddress;

  // Grant deployer MINTER_ROLE for initial liquidity setup
  // In production, only the bridge contract should have this role
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const grantTx = await wusdt.grantRole(MINTER_ROLE, deployer.address);
  await grantTx.wait();
  console.log("   ✓ Granted MINTER_ROLE to deployer for initial setup");

  // Mint initial supply for liquidity ($275k USDT needed for $800k total liquidity)
  // Note: WUSDT uses 18 decimals (BSC USDT standard)
  const initialSupply = ethers.parseEther("300000"); // 300k USDT for liquidity + buffer
  const mintTx = await wusdt.mint(deployer.address, initialSupply, 0);
  await mintTx.wait();

  const usdtBalance = await wusdt.balanceOf(deployer.address);
  console.log("   WUSDT Balance:", ethers.formatEther(usdtBalance), "WUSDT");
  console.log("   ⚠️  NOTE: This is WUSDT (Wrapped USDT) - bridge-compatible");
  console.log("   📝 For production: Bridge real USDT from BSC → Nor Chain\n");

  // ======================
  // 3. Check/Deploy Router
  // ======================
  console.log("3️⃣ Checking NorSwapRouter...");

  // Try to find existing router
  let router;
  let routerAddress;

  try {
    // Check if router exists by querying factory
    const factory = await ethers.getContractAt(
      "NorSwapFactory",
      NOORSWAP_FACTORY
    );
    // Router might be stored in factory or we need to deploy
    console.log("   Deploying new NorSwapRouter...");

    const NorSwapRouter = await ethers.getContractFactory("NorSwapRouter");
    router = await NorSwapRouter.deploy(NOORSWAP_FACTORY, wnorAddress);
    await router.waitForDeployment();
    routerAddress = await router.getAddress();
    console.log("✅ NorSwapRouter deployed to:", routerAddress);
    deployedContracts.NOORSWAP_ROUTER = routerAddress;
  } catch (error) {
    console.error("   ❌ Error with router:", error.message);
    throw error;
  }
  console.log("");

  // ======================
  // 4. Deploy LiquidityLock
  // ======================
  console.log("4️⃣ Deploying LiquidityLock...");
  const LiquidityLock = await ethers.getContractFactory("LiquidityLock");
  const liquidityLock = await LiquidityLock.deploy();
  await liquidityLock.waitForDeployment();
  const lockAddress = await liquidityLock.getAddress();
  console.log("✅ LiquidityLock deployed to:", lockAddress);
  deployedContracts.LIQUIDITY_LOCK = lockAddress;
  console.log("");

  // ======================
  // Summary
  // ======================
  console.log("=".repeat(70));
  console.log("✅ DEX INFRASTRUCTURE DEPLOYMENT COMPLETE");
  console.log("=".repeat(70));
  console.log("\n📋 Deployed Contracts:\n");

  console.log("Core Tokens:");
  console.log(
    `  NOR Token:        ${deployedContracts.NOR_TOKEN} (pre-deployed)`
  );
  console.log(
    `  WNOR:             ${deployedContracts.WNOR} ⭐ NEW (18 decimals)`
  );
  console.log(
    `  WUSDT:            ${deployedContracts.WUSDT} ⭐ NEW (18 decimals, bridge-ready)`
  );
  console.log(
    `  Dirhamat:         ${deployedContracts.DIRHAMAT} (pre-deployed)`
  );
  console.log("");

  console.log("DEX Contracts:");
  console.log(
    `  NorSwapFactory:  ${deployedContracts.NOORSWAP_FACTORY} (pre-deployed)`
  );
  console.log(`  NorSwapRouter:   ${deployedContracts.NOORSWAP_ROUTER} ⭐ NEW`);
  console.log(`  LiquidityLock:    ${deployedContracts.LIQUIDITY_LOCK} ⭐ NEW`);
  console.log("");

  console.log("🎯 Next Steps:");
  console.log(
    "  1. Run: npx hardhat run scripts/add-initial-liquidity.js --network btcbr"
  );
  console.log("     → This will add $800k liquidity across 3 pairs");
  console.log("");
  console.log(
    "  2. Run: npx hardhat run scripts/lock-lp-tokens.js --network btcbr"
  );
  console.log("     → This will lock all LP tokens for 12 months");
  console.log("");

  // Save deployment info to file
  const fs = await import("fs");
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: deployedContracts,
  };

  const deploymentPath = "./deployments/dex-infrastructure.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentPath}\n`);

  return deployedContracts;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
