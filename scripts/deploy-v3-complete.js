/**
 * Deploy Complete V3 DEX Infrastructure
 *
 * This script deploys:
 * 1. Uniswap V3 (Factory, Pool, NFT Position Manager, SwapRouter)
 * 2. PancakeSwap V3 (Factory, Pool with CAKE rewards)
 * 3. Tron Bridge (NorChain ↔ Tron cross-chain)
 *
 * Usage:
 *   npx hardhat run scripts/deploy-v3-complete.js --network btcbr
 */

import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// NorChain configuration
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WNOR = "0x121910c86B08765d6d3884Efe8661b2Fd6328dB9";

// Validator addresses for Tron bridge (3 validators)
const VALIDATORS = [
    "0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE",
    "0x689CF2C189781d9bB6859A830acbF64044E4432f",
    "0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"
];

async function main() {
    console.log("\n🚀 DEPLOYING V3 DEX INFRASTRUCTURE");
    console.log("═".repeat(70));

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`\n📋 Deployment Configuration:`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} NOR`);
    console.log(`   Network: NorChain (Chain ID: 65001)`);
    console.log(`   NOR Token: ${NOR_TOKEN}`);
    console.log(`   WNOR: ${WNOR}`);

    const deployed = {
        timestamp: new Date().toISOString(),
        network: "NorChain",
        chainId: 65001,
        deployer: deployer.address,
        uniswapV3: {},
        pancakeV3: {},
        tronBridge: {}
    };

    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: DEPLOY UNISWAP V3
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n📦 STEP 1: DEPLOYING UNISWAP V3`);
    console.log("═".repeat(70));

    // Deploy Uniswap V3 Factory
    console.log(`\n   🏭 Deploying UniswapV3Factory...`);
    const UniswapV3Factory = await ethers.getContractFactory("UniswapV3Factory");
    const uniswapFactory = await UniswapV3Factory.deploy();
    await uniswapFactory.waitForDeployment();
    deployed.uniswapV3.factory = await uniswapFactory.getAddress();
    console.log(`   ✅ UniswapV3Factory: ${deployed.uniswapV3.factory}`);

    // Deploy Nonfungible Position Manager
    console.log(`\n   🎨 Deploying NonfungiblePositionManager...`);
    const NonfungiblePositionManager = await ethers.getContractFactory("NonfungiblePositionManager");
    const nftPositionManager = await NonfungiblePositionManager.deploy(deployed.uniswapV3.factory);
    await nftPositionManager.waitForDeployment();
    deployed.uniswapV3.nftPositionManager = await nftPositionManager.getAddress();
    console.log(`   ✅ NonfungiblePositionManager: ${deployed.uniswapV3.nftPositionManager}`);

    // Deploy Swap Router
    console.log(`\n   🔄 Deploying SwapRouter...`);
    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy(deployed.uniswapV3.factory, WNOR);
    await swapRouter.waitForDeployment();
    deployed.uniswapV3.swapRouter = await swapRouter.getAddress();
    console.log(`   ✅ SwapRouter: ${deployed.uniswapV3.swapRouter}`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: DEPLOY PANCAKESWAP V3
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🥞 STEP 2: DEPLOYING PANCAKESWAP V3`);
    console.log("═".repeat(70));

    // Deploy PancakeSwap V3 Factory
    console.log(`\n   🏭 Deploying PancakeV3Factory...`);
    const PancakeV3Factory = await ethers.getContractFactory("PancakeV3Factory");
    const pancakeFactory = await PancakeV3Factory.deploy();
    await pancakeFactory.waitForDeployment();
    deployed.pancakeV3.factory = await pancakeFactory.getAddress();
    console.log(`   ✅ PancakeV3Factory: ${deployed.pancakeV3.factory}`);

    console.log(`\n   💡 Note: PancakeV3Pool is created by factory on demand`);
    console.log(`   💡 Pool creation: pancakeFactory.createPool(token0, token1, fee)`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: DEPLOY TRON BRIDGE
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🌉 STEP 3: DEPLOYING TRON BRIDGE`);
    console.log("═".repeat(70));

    // Deploy Tron Bridge
    console.log(`\n   🌐 Deploying NorTronBridge...`);
    const NorTronBridge = await ethers.getContractFactory("NorTronBridge");
    const tronBridge = await NorTronBridge.deploy(
        NOR_TOKEN,
        deployer.address, // Fee collector
        VALIDATORS
    );
    await tronBridge.waitForDeployment();
    deployed.tronBridge.bridge = await tronBridge.getAddress();
    console.log(`   ✅ NorTronBridge: ${deployed.tronBridge.bridge}`);

    console.log(`\n   👥 Validators:`);
    for (let i = 0; i < VALIDATORS.length; i++) {
        console.log(`      ${i + 1}. ${VALIDATORS[i]}`);
    }

    console.log(`\n   ⚙️  Bridge Configuration:`);
    console.log(`      Min Amount: 100 NOR`);
    console.log(`      Max Amount: 1,000,000 NOR`);
    console.log(`      Daily Limit: 5,000,000 NOR`);
    console.log(`      Bridge Fee: 0.1%`);
    console.log(`      Required Signatures: 2 of 3`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: CREATE SAMPLE V3 POOLS
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🏊 STEP 4: CREATING SAMPLE V3 POOLS`);
    console.log("═".repeat(70));

    // Get wrapped token addresses from previous deployment
    const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
    const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";

    // Create Uniswap V3 pools
    console.log(`\n   📝 Creating Uniswap V3 NOR/USDT pool (0.3% fee)...`);
    const createUniswapPoolTx1 = await uniswapFactory.createPool(NOR_TOKEN, WUSDT, 3000);
    await createUniswapPoolTx1.wait();
    const uniswapNorUsdtPool = await uniswapFactory.getPool(NOR_TOKEN, WUSDT, 3000);
    deployed.uniswapV3.norUsdtPool = uniswapNorUsdtPool;
    console.log(`   ✅ NOR/USDT Pool: ${uniswapNorUsdtPool}`);

    console.log(`\n   📝 Creating Uniswap V3 NOR/WBNB pool (0.3% fee)...`);
    const createUniswapPoolTx2 = await uniswapFactory.createPool(NOR_TOKEN, WBNB, 3000);
    await createUniswapPoolTx2.wait();
    const uniswapNorWbnbPool = await uniswapFactory.getPool(NOR_TOKEN, WBNB, 3000);
    deployed.uniswapV3.norWbnbPool = uniswapNorWbnbPool;
    console.log(`   ✅ NOR/WBNB Pool: ${uniswapNorWbnbPool}`);

    // Create PancakeSwap V3 pools
    console.log(`\n   📝 Creating PancakeSwap V3 NOR/USDT pool (0.25% fee)...`);
    const createPancakePoolTx1 = await pancakeFactory.createPool(NOR_TOKEN, WUSDT, 2500);
    await createPancakePoolTx1.wait();
    const pancakeNorUsdtPool = await pancakeFactory.getPool(NOR_TOKEN, WUSDT, 2500);
    deployed.pancakeV3.norUsdtPool = pancakeNorUsdtPool;
    console.log(`   ✅ NOR/USDT Pool: ${pancakeNorUsdtPool}`);

    console.log(`\n   📝 Creating PancakeSwap V3 NOR/WBNB pool (0.25% fee)...`);
    const createPancakePoolTx2 = await pancakeFactory.createPool(NOR_TOKEN, WBNB, 2500);
    await createPancakePoolTx2.wait();
    const pancakeNorWbnbPool = await pancakeFactory.getPool(NOR_TOKEN, WBNB, 2500);
    deployed.pancakeV3.norWbnbPool = pancakeNorWbnbPool;
    console.log(`   ✅ NOR/WBNB Pool: ${pancakeNorWbnbPool}`);

    // ═══════════════════════════════════════════════════════════════════
    // SUCCESS SUMMARY
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🎉 V3 DEX INFRASTRUCTURE DEPLOYMENT COMPLETE!`);
    console.log("═".repeat(70));

    console.log(`\n✅ UNISWAP V3 DEPLOYED:`);
    console.log(`   Factory: ${deployed.uniswapV3.factory}`);
    console.log(`   NFT Position Manager: ${deployed.uniswapV3.nftPositionManager}`);
    console.log(`   Swap Router: ${deployed.uniswapV3.swapRouter}`);
    console.log(`   NOR/USDT Pool (0.3%): ${deployed.uniswapV3.norUsdtPool}`);
    console.log(`   NOR/WBNB Pool (0.3%): ${deployed.uniswapV3.norWbnbPool}`);

    console.log(`\n✅ PANCAKESWAP V3 DEPLOYED:`);
    console.log(`   Factory: ${deployed.pancakeV3.factory}`);
    console.log(`   NOR/USDT Pool (0.25%): ${deployed.pancakeV3.norUsdtPool}`);
    console.log(`   NOR/WBNB Pool (0.25%): ${deployed.pancakeV3.norWbnbPool}`);

    console.log(`\n✅ TRON BRIDGE DEPLOYED:`);
    console.log(`   Bridge Contract: ${deployed.tronBridge.bridge}`);
    console.log(`   Validators: 3 (2-of-3 multi-sig)`);

    console.log(`\n📝 NEXT STEPS:`);
    console.log("═".repeat(70));
    console.log(`\n1. Add V3 liquidity using concentrated positions:`);
    console.log(`   - Uniswap V3: Use NFT Position Manager`);
    console.log(`   - PancakeSwap V3: Use concentrated liquidity`);
    console.log(`\n2. Deploy TRC-20 NOR token on Tron:`);
    console.log(`   - Use NorTokenTRC20.sol contract`);
    console.log(`   - Configure bridge on Tron side`);
    console.log(`\n3. Test bridge functionality:`);
    console.log(`   npx hardhat run scripts/test-tron-bridge.js --network btcbr`);

    // Save deployment info
    const deploymentLog = `docs/deployment-logs/v3-infrastructure-${Date.now()}.json`;
    fs.mkdirSync("docs/deployment-logs", { recursive: true });
    fs.writeFileSync(deploymentLog, JSON.stringify(deployed, null, 2));

    console.log(`\n💾 Deployment info saved: ${deploymentLog}`);

    console.log(`\n═`.repeat(70));
    console.log(`✅ V3 DEX Infrastructure Ready!`);
    console.log(`═`.repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ V3 Infrastructure Deployment Failed:");
        console.error(error);
        process.exit(1);
    });
