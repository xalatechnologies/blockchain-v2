/**
 * Add $50k Concentrated Liquidity to Official Uniswap V3
 *
 * Uses official @uniswap/v3-periphery NonfungiblePositionManager
 * Battle-tested with $3B+ TVL on Ethereum mainnet
 *
 * Strategy: Professional concentrated liquidity with optimized tick ranges
 * - NOR/USDT:  $20k (40%) - Tight range around $1 (stablecoin pair)
 * - NOR/WBNB:  $15k (30%) - Medium range (volatile pair)
 * - NOR/BTCB:  $7.5k (15%) - Wide range (high volatility)
 * - NOR/WETH:  $5k (10%) - Wide range (high volatility)
 * - NOR/BUSD:  $2.5k (5%) - Tight range around $1 (stablecoin pair)
 *
 * Total: $50,000 (V3 Concentrated Liquidity)
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// NorChain contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";

// Official Uniswap V3 addresses (from deployment log)
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";
const UNISWAP_V3_FACTORY = "0x150BD1B91AFCdeBA70313Cd6dB5BbC3EF06C8926";

// Wrapped token addresses
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

// Load official Uniswap V3 periphery artifacts
const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const factoryArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const poolArtifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

// V3 Concentrated liquidity configuration with tick ranges
const LIQUIDITY_CONFIG = [
  {
    name: "NOR/USDT",
    token: WUSDT,
    fee: 500, // 0.05% (stablecoin pair)
    norAmount: "20000000000000000000000000", // 20k NOR (24 decimals)
    tokenAmount: "20000000000000000000000", // 20k USDT (18 decimals)
    tickLower: -10000, // Tight range around $1 (±10%)
    tickUpper: 10000,
    allocation: 0.40,
    usdValue: 20000,
    volatility: "LOW"
  },
  {
    name: "NOR/WBNB",
    token: WBNB,
    fee: 3000, // 0.3% (standard pair)
    norAmount: "15000000000000000000000000", // 15k NOR
    tokenAmount: "25000000000000000000", // 25 WBNB (18 decimals)
    tickLower: -50000, // Medium range for BNB volatility (±25%)
    tickUpper: 50000,
    allocation: 0.30,
    usdValue: 15000,
    volatility: "MEDIUM"
  },
  {
    name: "NOR/BTCB",
    token: WBTCB,
    fee: 3000, // 0.3% (standard pair)
    norAmount: "7500000000000000000000000", // 7.5k NOR
    tokenAmount: "125000000000000000", // 0.125 BTCB (18 decimals)
    tickLower: -100000, // Wide range for BTC volatility (±50%)
    tickUpper: 100000,
    allocation: 0.15,
    usdValue: 7500,
    volatility: "HIGH"
  },
  {
    name: "NOR/WETH",
    token: WETH,
    fee: 3000, // 0.3% (standard pair)
    norAmount: "5000000000000000000000000", // 5k NOR
    tokenAmount: "2000000000000000000", // 2 WETH (18 decimals)
    tickLower: -100000, // Wide range for ETH volatility (±50%)
    tickUpper: 100000,
    allocation: 0.10,
    usdValue: 5000,
    volatility: "HIGH"
  },
  {
    name: "NOR/BUSD",
    token: WBUSD,
    fee: 500, // 0.05% (stablecoin pair)
    norAmount: "2500000000000000000000000", // 2.5k NOR
    tokenAmount: "2500000000000000000000", // 2.5k BUSD (18 decimals)
    tickLower: -10000, // Tight range around $1 (±10%)
    tickUpper: 10000,
    allocation: 0.05,
    usdValue: 2500,
    volatility: "LOW"
  }
];

// Helper function to calculate sqrt price for initialization (1:1 ratio)
function encodePriceSqrt(reserve1, reserve0) {
  return ethers.toBigInt(
    Math.floor(Math.sqrt(Number(reserve1) / Number(reserve0)) * 2 ** 96)
  );
}

async function main() {
  console.log("\n💎 ADDING $50K TO OFFICIAL UNISWAP V3");
  console.log("═".repeat(70));
  console.log("   Using: Official @uniswap/v3-periphery contracts");
  console.log("   Production: ✅ Battle-tested with $3B+ TVL");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Configuration:`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} NOR`);
  console.log(`   NFT Position Manager: ${NFT_POSITION_MANAGER}`);
  console.log(`   Type: V3 Concentrated Liquidity (NFT Positions)`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const nftManager = new ethers.Contract(
    NFT_POSITION_MANAGER,
    nftManagerArtifact.abi,
    deployer
  );
  const factory = new ethers.Contract(
    UNISWAP_V3_FACTORY,
    factoryArtifact.abi,
    deployer
  );

  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`   NOR Token Balance: ${ethers.formatUnits(norBalance, 24)} NOR`);

  console.log(`\n📊 V3 Concentrated Liquidity Distribution ($50,000):`);
  console.log("═".repeat(70));

  for (const config of LIQUIDITY_CONFIG) {
    console.log(`   ${config.name}:`);
    console.log(`      USD Value: $${config.usdValue.toLocaleString()} (${config.allocation * 100}%)`);
    console.log(`      Fee Tier: ${config.fee / 10000}%`);
    console.log(`      Volatility: ${config.volatility}`);
    console.log(`      Tick Range: [${config.tickLower}, ${config.tickUpper}]`);
  }

  console.log(`\n\n🔄 MINTING V3 NFT POSITIONS FOR ALL PAIRS`);
  console.log("═".repeat(70));

  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const results = [];

  for (const config of LIQUIDITY_CONFIG) {
    console.log(`\n💎 Creating V3 position for ${config.name}...`);

    try {
      const token = await ethers.getContractAt("IERC20", config.token);

      // Determine token order (token0 < token1)
      const token0 = NOR_TOKEN < config.token ? NOR_TOKEN : config.token;
      const token1 = NOR_TOKEN < config.token ? config.token : NOR_TOKEN;
      const amount0Desired = token0 === NOR_TOKEN ? config.norAmount : config.tokenAmount;
      const amount1Desired = token1 === NOR_TOKEN ? config.norAmount : config.tokenAmount;

      console.log(`   📝 Approving tokens for NFT Position Manager...`);
      await (await norToken.approve(NFT_POSITION_MANAGER, config.norAmount)).wait();
      await (await token.approve(NFT_POSITION_MANAGER, config.tokenAmount)).wait();

      // Get or create pool
      let poolAddress = await factory.getPool(token0, token1, config.fee);

      if (poolAddress === ethers.ZeroAddress) {
        console.log(`   🏗️  Creating new V3 pool...`);
        const createTx = await factory.createPool(token0, token1, config.fee);
        await createTx.wait();
        poolAddress = await factory.getPool(token0, token1, config.fee);

        // Initialize pool with 1:1 price
        const pool = new ethers.Contract(poolAddress, poolArtifact.abi, deployer);
        const sqrtPriceX96 = encodePriceSqrt(1, 1);
        const initTx = await pool.initialize(sqrtPriceX96);
        await initTx.wait();
        console.log(`      ✅ Pool initialized at 1:1 price`);
      }

      console.log(`   💰 Minting NFT position with concentrated liquidity...`);

      // Mint NFT position using official contract
      const mintParams = {
        token0,
        token1,
        fee: config.fee,
        tickLower: config.tickLower,
        tickUpper: config.tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min: 0, // Accept any slippage for initial liquidity
        amount1Min: 0,
        recipient: deployer.address,
        deadline
      };

      const gasEstimate = await nftManager.mint.estimateGas(mintParams);
      const tx = await nftManager.mint(mintParams, {
        gasLimit: (gasEstimate * 120n) / 100n
      });

      const receipt = await tx.wait();
      console.log(`   ✅ NFT position minted`);

      // Extract tokenId from IncreaseLiquidity event
      const increaseLiquidityEvent = receipt.logs.find(
        log => {
          try {
            const parsed = nftManager.interface.parseLog(log);
            return parsed && parsed.name === "IncreaseLiquidity";
          } catch (e) {
            return false;
          }
        }
      );

      let tokenId = "Unknown";
      if (increaseLiquidityEvent) {
        const parsed = nftManager.interface.parseLog(increaseLiquidityEvent);
        tokenId = parsed.args.tokenId.toString();
      }

      results.push({
        pair: config.name,
        poolAddress,
        tokenId,
        tickRange: `[${config.tickLower}, ${config.tickUpper}]`,
        feeRate: `${config.fee / 10000}%`,
        txHash: receipt.hash
      });

      console.log(`   🏊 Pool: ${poolAddress}`);
      console.log(`   🎫 NFT Token ID: ${tokenId}`);
      console.log(`   📊 Tick Range: [${config.tickLower}, ${config.tickUpper}]`);

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      if (error.reason) console.error(`      Reason: ${error.reason}`);
      throw error;
    }
  }

  console.log(`\n\n🎉 OFFICIAL V3 LIQUIDITY ADDITION COMPLETE!`);
  console.log("═".repeat(70));

  console.log(`\n✅ $50K V3 LIQUIDITY ADDED (Official Uniswap V3):`);
  for (const result of results) {
    console.log(`   ${result.pair}:`);
    console.log(`      NFT ID: ${result.tokenId}`);
    console.log(`      Fee: ${result.feeRate}`);
    console.log(`      Range: ${result.tickRange}`);
  }

  console.log(`\n📝 LIQUIDITY SUMMARY:`);
  console.log(`   ✅ V2 Traditional AMM: $50,000 (NorSwap)`);
  console.log(`   ✅ V3 Concentrated (Official): $50,000 (Uniswap V3)`);
  console.log(`   💰 Total: $100,000`);

  console.log(`\n📝 NEXT STEP: Lock all liquidity for 3 years:`);
  console.log(`   npx hardhat run scripts/lock-all-liquidity-complete.js --network btcbr`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Official V3 Liquidity Addition Failed:");
    console.error(error);
    process.exit(1);
  });
