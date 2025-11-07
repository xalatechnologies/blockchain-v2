/**
 * Compare NOR/USDT (working) vs NOR/WBNB (not working)
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const UNISWAP_V3_FACTORY = "0x150BD1B91AFCdeBA70313Cd6dB5BbC3EF06C8926";

const factoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const poolArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

async function checkPool(name, tokenA, tokenB, fee) {
  console.log(`\n📊 ${name}:`);

  const [deployer] = await ethers.getSigners();
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryArtifact.abi, deployer);
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  const token0 = tokenA < tokenB ? tokenA : tokenB;
  const token1 = tokenA < tokenB ? tokenB : tokenA;

  const poolAddress = await factory.getPool(token0, token1, fee);
  console.log(`   Address: ${poolAddress}`);

  if (poolAddress === ethers.ZeroAddress) {
    console.log(`   ❌ Pool does not exist!`);
    return;
  }

  // Check whitelisting
  const isWhitelisted = await norToken.isWhitelisted(poolAddress);
  console.log(`   Whitelisted: ${isWhitelisted ? '✅' : '❌'}`);

  // Get pool contract
  const pool = new ethers.Contract(poolAddress, poolArtifact.abi, deployer);

  try {
    const slot0 = await pool.slot0();
    console.log(`   Initialized: ${slot0.sqrtPriceX96 > 0 ? '✅' : '❌'}`);
    console.log(`   sqrtPriceX96: ${slot0.sqrtPriceX96}`);
    console.log(`   tick: ${slot0.tick}`);
    console.log(`   observationIndex: ${slot0.observationIndex}`);
    console.log(`   observationCardinality: ${slot0.observationCardinality}`);
    console.log(`   observationCardinalityNext: ${slot0.observationCardinalityNext}`);
    console.log(`   feeProtocol: ${slot0.feeProtocol}`);
    console.log(`   unlocked: ${slot0.unlocked}`);
  } catch (e) {
    console.log(`   ❌ slot0() failed: ${e.message}`);
  }

  try {
    const liquidity = await pool.liquidity();
    console.log(`   Liquidity: ${liquidity}`);
  } catch (e) {
    console.log(`   ❌ liquidity() failed: ${e.message}`);
  }

  try {
    const token0Contract = await pool.token0();
    const token1Contract = await pool.token1();
    const feeContract = await pool.fee();
    console.log(`   token0 (from pool): ${token0Contract}`);
    console.log(`   token1 (from pool): ${token1Contract}`);
    console.log(`   fee (from pool): ${feeContract}`);
  } catch (e) {
    console.log(`   ❌ token/fee getters failed: ${e.message}`);
  }
}

async function main() {
  console.log("\n🔍 COMPARING WORKING VS NON-WORKING POOLS");
  console.log("═".repeat(70));

  await checkPool("NOR/USDT (✅ Working - has NFT #1)", NOR_TOKEN, WUSDT, 500);
  await checkPool("NOR/WBNB (❌ Not Working)", NOR_TOKEN, WBNB, 3000);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
