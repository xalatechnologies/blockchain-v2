/**
 * Deploy Official Uniswap V3 to NorChain
 *
 * Uses the official @uniswap/v3-core and @uniswap/v3-periphery contracts
 * Battle-tested with $3B+ TVL on Ethereum mainnet
 *
 * Deployment Order:
 * 1. UniswapV3Factory (core)
 * 2. SwapRouter (periphery)
 * 3. NonfungiblePositionManager (periphery)
 * 4. QuoterV2 (periphery - optional but useful)
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WNOR = "0x121910c86B08765d6d3884Efe8661b2Fd6328dB9";

// Wrapped token addresses (from 100k infrastructure deployment)
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";

// Load official Uniswap V3 artifacts
const factoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const swapRouterArtifact = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");
const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const quoterArtifact = require("@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json");

async function main() {
  console.log("\n🦄 DEPLOYING OFFICIAL UNISWAP V3 TO NORCHAIN");
  console.log("═".repeat(70));
  console.log("   Package: @uniswap/v3-core + @uniswap/v3-periphery");
  console.log("   Production-Ready: ✅ Battle-tested with $3B+ TVL");
  console.log("   Full Features: ✅ Multi-hop routing, Oracle, Flash swaps");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Configuration:`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} NOR`);
  console.log(`   Network: NorChain (Chain ID: 65001)`);

  const deployed = {
    timestamp: new Date().toISOString(),
    network: "NorChain",
    chainId: 65001,
    deployer: deployer.address,
    norToken: NOR_TOKEN,
    wnor: WNOR
  };

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Deploy UniswapV3Factory (Core)
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📦 STEP 1: Deploying UniswapV3Factory (Core)`);
  console.log("═".repeat(70));

  const UniswapV3Factory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    deployer
  );

  console.log(`   Deploying factory...`);
  const factory = await UniswapV3Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  deployed.factory = factoryAddress;

  console.log(`   ✅ UniswapV3Factory deployed: ${factoryAddress}`);

  console.log(`\n   ✅ Fee tiers (enabled by default in official factory):`);
  console.log(`      0.05% (500) - Tick spacing: 10`);
  console.log(`      0.3% (3000) - Tick spacing: 60`);
  console.log(`      1% (10000) - Tick spacing: 200`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Deploy SwapRouter (Periphery)
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📦 STEP 2: Deploying SwapRouter (Periphery)`);
  console.log("═".repeat(70));

  const SwapRouter = new ethers.ContractFactory(
    swapRouterArtifact.abi,
    swapRouterArtifact.bytecode,
    deployer
  );

  console.log(`   Deploying SwapRouter with factory and WNOR...`);
  const swapRouter = await SwapRouter.deploy(factoryAddress, WNOR);
  await swapRouter.waitForDeployment();
  const swapRouterAddress = await swapRouter.getAddress();

  deployed.swapRouter = swapRouterAddress;

  console.log(`   ✅ SwapRouter deployed: ${swapRouterAddress}`);
  console.log(`      Features: Single-hop, Multi-hop, Exact input/output`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Deploy NonfungiblePositionManager (Periphery)
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📦 STEP 3: Deploying NonfungiblePositionManager (Periphery)`);
  console.log("═".repeat(70));

  const NonfungiblePositionManager = new ethers.ContractFactory(
    nftManagerArtifact.abi,
    nftManagerArtifact.bytecode,
    deployer
  );

  console.log(`   Deploying NFT Position Manager...`);
  const nftManager = await NonfungiblePositionManager.deploy(
    factoryAddress,
    WNOR,
    ethers.ZeroAddress // Token descriptor (optional, can add later)
  );
  await nftManager.waitForDeployment();
  const nftManagerAddress = await nftManager.getAddress();

  deployed.nftPositionManager = nftManagerAddress;

  console.log(`   ✅ NonfungiblePositionManager deployed: ${nftManagerAddress}`);
  console.log(`      Features: ERC-721 LP positions, SVG rendering, Metadata`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Deploy QuoterV2 (Periphery - Price Quotes)
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📦 STEP 4: Deploying QuoterV2 (Periphery)`);
  console.log("═".repeat(70));

  const QuoterV2 = new ethers.ContractFactory(
    quoterArtifact.abi,
    quoterArtifact.bytecode,
    deployer
  );

  console.log(`   Deploying QuoterV2...`);
  const quoter = await QuoterV2.deploy(factoryAddress, WNOR);
  await quoter.waitForDeployment();
  const quoterAddress = await quoter.getAddress();

  deployed.quoter = quoterAddress;

  console.log(`   ✅ QuoterV2 deployed: ${quoterAddress}`);
  console.log(`      Features: Price quotes, Gas estimates, Multi-hop quotes`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: Create Initial Pools
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📦 STEP 5: Creating Initial V3 Pools`);
  console.log("═".repeat(70));

  const pools = [];

  // Create NOR/USDT pool (0.05% fee - stablecoin pair)
  console.log(`\n   Creating NOR/USDT pool (0.05% fee)...`);
  const norUsdtTx = await factory.createPool(NOR_TOKEN, WUSDT, 500);
  await norUsdtTx.wait();
  const norUsdtPool = await factory.getPool(NOR_TOKEN, WUSDT, 500);
  pools.push({ pair: "NOR/USDT", address: norUsdtPool, fee: "0.05%" });
  console.log(`      ✅ Pool created: ${norUsdtPool}`);

  // Create NOR/WBNB pool (0.3% fee - standard pair)
  console.log(`\n   Creating NOR/WBNB pool (0.3% fee)...`);
  const norWbnbTx = await factory.createPool(NOR_TOKEN, WBNB, 3000);
  await norWbnbTx.wait();
  const norWbnbPool = await factory.getPool(NOR_TOKEN, WBNB, 3000);
  pools.push({ pair: "NOR/WBNB", address: norWbnbPool, fee: "0.3%" });
  console.log(`      ✅ Pool created: ${norWbnbPool}`);

  deployed.pools = pools;

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOYMENT COMPLETE
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n🎉 OFFICIAL UNISWAP V3 DEPLOYMENT COMPLETE!`);
  console.log("═".repeat(70));

  console.log(`\n✅ Core Contracts:`);
  console.log(`   UniswapV3Factory: ${deployed.factory}`);

  console.log(`\n✅ Periphery Contracts:`);
  console.log(`   SwapRouter: ${deployed.swapRouter}`);
  console.log(`   NonfungiblePositionManager: ${deployed.nftPositionManager}`);
  console.log(`   QuoterV2: ${deployed.quoter}`);

  console.log(`\n✅ Initial Pools:`);
  for (const pool of pools) {
    console.log(`   ${pool.pair} (${pool.fee}): ${pool.address}`);
  }

  console.log(`\n✅ Enabled Fee Tiers:`);
  console.log(`   0.05% (500) - Stablecoin pairs - Tick spacing: 10`);
  console.log(`   0.3% (3000) - Standard pairs - Tick spacing: 60`);
  console.log(`   1% (10000) - Exotic pairs - Tick spacing: 200`);

  // Save deployment info
  const logPath = path.join(__dirname, "..", "docs", "deployment-logs", `official-uniswap-v3-${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(deployed, null, 2));
  console.log(`\n📝 Deployment log saved: ${logPath}`);

  console.log(`\n📝 NEXT STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. Add $50k concentrated liquidity:`);
  console.log(`   npx hardhat run scripts/add-50k-liquidity-official-v3.js --network btcbr`);
  console.log(`\n2. Verify contracts on explorer (optional)`);
  console.log(`\n3. Lock all liquidity for 3 years`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ Official Uniswap V3 is ready for production use!`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Official Uniswap V3 Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
