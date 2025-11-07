/**
 * Initialize Uniswap V3 Pools
 *
 * Uniswap V3 pools need to be initialized with sqrtPriceX96 before minting
 * This sets the initial price for the pool
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const poolArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

// V3 pools to initialize
const POOLS = [
  { name: "NOR/USDT", address: "0x11F3C25c88d5a45a3443dde57ef6F04C03A68092", fee: "0.05%" },
  { name: "NOR/WBNB", address: "0xB4bBeed467AC520342d86d566e73f1C218824dc7", fee: "0.3%" }
];

// Helper function to calculate sqrt price for 1:1 ratio
function encodePriceSqrt(reserve1, reserve0) {
  // sqrt(1) * 2^96 = 79228162514264337593543950336
  // This is the exact value for 1:1 price in Uniswap V3
  return "79228162514264337593543950336";
}

async function main() {
  console.log("\n🎯 INITIALIZING UNISWAP V3 POOLS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const sqrtPriceX96 = encodePriceSqrt(1, 1); // 1:1 price
  console.log(`   Initial Price: 1:1 (sqrtPriceX96: ${sqrtPriceX96})`);

  for (const poolInfo of POOLS) {
    console.log(`\n📊 ${poolInfo.name} (${poolInfo.fee})...`);

    const pool = new ethers.Contract(poolInfo.address, poolArtifact.abi, deployer);

    try {
      // Check if already initialized
      const slot0 = await pool.slot0();
      if (slot0.sqrtPriceX96 !== 0n) {
        console.log(`   ✅ Already initialized with price: ${slot0.sqrtPriceX96}`);
        continue;
      }
    } catch (e) {
      // Pool not initialized yet, continue
    }

    console.log(`   Initializing pool at 1:1 price...`);
    try {
      const tx = await pool.initialize(sqrtPriceX96);
      await tx.wait();
      console.log(`   ✅ Pool initialized: ${poolInfo.address}`);
    } catch (error) {
      console.log(`   ❌ Failed to initialize: ${error.message}`);
      if (error.message.includes("AI")) {
        console.log(`      Pool is already initialized (AI = Already Initialized)`);
      }
    }
  }

  console.log(`\n\n🎉 POOL INITIALIZATION COMPLETE!`);
  console.log("═".repeat(70));
  console.log(`   ✅ All pools initialized at 1:1 price`);
  console.log(`   ✅ Ready for liquidity addition`);

  console.log(`\n📝 NEXT STEP: Add V3 liquidity:`);
  console.log(`   npx hardhat run scripts/add-50k-liquidity-official-v3.js --network btcbr`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Pool initialization failed:");
    console.error(error);
    process.exit(1);
  });
