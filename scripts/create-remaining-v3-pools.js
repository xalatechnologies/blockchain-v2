/**
 * Create and Initialize Remaining V3 Pools
 * Creates pools for: NOR/BTCB, NOR/WETH, NOR/BUSD
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

const UNISWAP_V3_FACTORY = "0x150BD1B91AFCdeBA70313Cd6dB5BbC3EF06C8926";

const factoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const poolArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

const POOLS_TO_CREATE = [
  { name: "NOR/BTCB", token: WBTCB, fee: 3000 },  // 0.3%
  { name: "NOR/WETH", token: WETH, fee: 3000 },   // 0.3%
  { name: "NOR/BUSD", token: WBUSD, fee: 500 }    // 0.05%
];

async function main() {
  console.log("\n🏗️  CREATING REMAINING V3 POOLS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryArtifact.abi, deployer);
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  const sqrtPriceX96 = "79228162514264337593543950336"; // 1:1 price

  const createdPools = [];

  for (const poolConfig of POOLS_TO_CREATE) {
    console.log(`\n📊 ${poolConfig.name} (${poolConfig.fee / 10000}% fee)...`);

    // Determine token order
    const token0 = NOR_TOKEN < poolConfig.token ? NOR_TOKEN : poolConfig.token;
    const token1 = NOR_TOKEN < poolConfig.token ? poolConfig.token : NOR_TOKEN;

    // Check if pool exists
    let poolAddress = await factory.getPool(token0, token1, poolConfig.fee);

    if (poolAddress === ethers.ZeroAddress) {
      console.log(`   Creating pool...`);
      const createTx = await factory.createPool(token0, token1, poolConfig.fee);
      await createTx.wait();
      poolAddress = await factory.getPool(token0, token1, poolConfig.fee);
      console.log(`   ✅ Pool created: ${poolAddress}`);
    } else {
      console.log(`   ✅ Pool exists: ${poolAddress}`);
    }

    // Initialize pool
    const pool = new ethers.Contract(poolAddress, poolArtifact.abi, deployer);

    try {
      const slot0 = await pool.slot0();
      if (slot0.sqrtPriceX96 === 0n) {
        console.log(`   Initializing pool...`);
        const initTx = await pool.initialize(sqrtPriceX96);
        await initTx.wait();
        console.log(`   ✅ Pool initialized`);
      } else {
        console.log(`   ✅ Already initialized`);
      }
    } catch (e) {
      console.log(`   Initializing pool...`);
      const initTx = await pool.initialize(sqrtPriceX96);
      await initTx.wait();
      console.log(`   ✅ Pool initialized`);
    }

    // Whitelist pool in NorToken
    console.log(`   Whitelisting pool...`);
    await (await norToken.whitelist(poolAddress)).wait();
    console.log(`   ✅ Pool whitelisted`);

    createdPools.push({
      name: poolConfig.name,
      address: poolAddress,
      fee: `${poolConfig.fee / 10000}%`
    });
  }

  console.log(`\n\n🎉 ALL POOLS CREATED AND INITIALIZED!`);
  console.log("═".repeat(70));

  console.log(`\n✅ Created Pools:`);
  for (const pool of createdPools) {
    console.log(`   ${pool.name} (${pool.fee}): ${pool.address}`);
  }

  console.log(`\n📝 NEXT STEP: Mint remaining V3 positions:`);
  console.log(`   npx hardhat run scripts/add-50k-liquidity-official-v3.js --network btcbr`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
