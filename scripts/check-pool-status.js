/**
 * Check V3 Pool Status
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const UNISWAP_V3_FACTORY = "0x150BD1B91AFCdeBA70313Cd6dB5BbC3EF06C8926";

const factoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const poolArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

async function main() {
  console.log("\n🔍 CHECKING NOR/WBNB POOL STATUS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryArtifact.abi, deployer);

  // Get pool address
  const token0 = NOR_TOKEN < WBNB ? NOR_TOKEN : WBNB;
  const token1 = NOR_TOKEN < WBNB ? WBNB : NOR_TOKEN;
  const fee = 3000;

  const poolAddress = await factory.getPool(token0, token1, fee);
  console.log(`   Pool Address: ${poolAddress}`);

  if (poolAddress === ethers.ZeroAddress) {
    console.log(`   ❌ Pool does not exist!`);
    return;
  }

  // Check if pool is whitelisted
  const isWhitelisted = await norToken.isWhitelisted(poolAddress);
  console.log(`   Whitelisted: ${isWhitelisted ? '✅' : '❌'}`);

  // Check pool initialization
  const pool = new ethers.Contract(poolAddress, poolArtifact.abi, deployer);
  try {
    const slot0 = await pool.slot0();
    console.log(`   Initialized: ${slot0.sqrtPriceX96 > 0 ? '✅' : '❌'}`);
    console.log(`   sqrtPriceX96: ${slot0.sqrtPriceX96}`);
  } catch (e) {
    console.log(`   ❌ Pool not initialized: ${e.message}`);
  }

  // Check liquidity
  try {
    const liquidity = await pool.liquidity();
    console.log(`   Current Liquidity: ${liquidity}`);
  } catch (e) {
    console.log(`   ❌ Cannot read liquidity: ${e.message}`);
  }

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
