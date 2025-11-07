/**
 * Add $50k Liquidity to V2 NorSwap (Traditional AMM)
 *
 * Strategy: Simple full-range liquidity across all pairs
 * - NOR/USDT:  $20k (40%)
 * - NOR/WBNB:  $15k (30%)
 * - NOR/BTCB:  $7.5k (15%)
 * - NOR/WETH:  $5k (10%)
 * - NOR/BUSD:  $2.5k (5%)
 *
 * Total: $50,000 (V2 Traditional AMM)
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// NorChain contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const NORSWAP_ROUTER = "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84";

// Wrapped token addresses
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

// $50k liquidity allocation (half of original $100k)
const LIQUIDITY_CONFIG = [
  {
    name: "NOR/USDT",
    token: WUSDT,
    norAmount: "20000000000000000000000000", // 20k NOR (24 decimals)
    tokenAmount: "20000000000000000000000", // 20k USDT (18 decimals)
    allocation: 0.40,
    usdValue: 20000
  },
  {
    name: "NOR/WBNB",
    token: WBNB,
    norAmount: "15000000000000000000000000", // 15k NOR
    tokenAmount: "25000000000000000000", // 25 WBNB (18 decimals)
    allocation: 0.30,
    usdValue: 15000
  },
  {
    name: "NOR/BTCB",
    token: WBTCB,
    norAmount: "7500000000000000000000000", // 7.5k NOR
    tokenAmount: "125000000000000000", // 0.125 BTCB (18 decimals)
    allocation: 0.15,
    usdValue: 7500
  },
  {
    name: "NOR/WETH",
    token: WETH,
    norAmount: "5000000000000000000000000", // 5k NOR
    tokenAmount: "2000000000000000000", // 2 WETH (18 decimals)
    allocation: 0.10,
    usdValue: 5000
  },
  {
    name: "NOR/BUSD",
    token: WBUSD,
    norAmount: "2500000000000000000000000", // 2.5k NOR
    tokenAmount: "2500000000000000000000", // 2.5k BUSD (18 decimals)
    allocation: 0.05,
    usdValue: 2500
  }
];

async function main() {
  console.log("\n💧 ADDING $50K V2 LIQUIDITY (TRADITIONAL AMM)");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Configuration:`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} NOR`);
  console.log(`   Router: ${NORSWAP_ROUTER}`);
  console.log(`   Type: V2 Traditional AMM (Full-Range Liquidity)`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const router = await ethers.getContractAt("IPancakeRouter02", NORSWAP_ROUTER);

  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`   NOR Token Balance: ${ethers.formatUnits(norBalance, 24)} NOR`);

  console.log(`\n📊 V2 Liquidity Distribution ($50,000):`);
  console.log("═".repeat(70));

  for (const config of LIQUIDITY_CONFIG) {
    console.log(`   ${config.name}: $${config.usdValue.toLocaleString()} (${config.allocation * 100}%)`);
  }

  console.log(`\n\n🔄 ADDING V2 LIQUIDITY TO ALL PAIRS`);
  console.log("═".repeat(70));

  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const results = [];

  for (const config of LIQUIDITY_CONFIG) {
    console.log(`\n💧 Adding V2 liquidity to ${config.name}...`);

    try {
      const token = await ethers.getContractAt("IERC20", config.token);

      console.log(`   📝 Approving tokens...`);
      await (await norToken.approve(NORSWAP_ROUTER, config.norAmount)).wait();
      await (await token.approve(NORSWAP_ROUTER, config.tokenAmount)).wait();

      console.log(`   💰 Adding liquidity...`);

      const gasEstimate = await router.addLiquidity.estimateGas(
        NOR_TOKEN,
        config.token,
        config.norAmount,
        config.tokenAmount,
        0,
        0,
        deployer.address,
        deadline
      );

      const tx = await router.addLiquidity(
        NOR_TOKEN,
        config.token,
        config.norAmount,
        config.tokenAmount,
        0,
        0,
        deployer.address,
        deadline,
        { gasLimit: (gasEstimate * 120n) / 100n }
      );

      const receipt = await tx.wait();
      console.log(`   ✅ V2 liquidity added`);

      const factory = await router.factory();
      const factoryContract = await ethers.getContractAt("IPancakeFactory", factory);
      const pairAddress = await factoryContract.getPair(NOR_TOKEN, config.token);

      const pair = await ethers.getContractAt("IERC20", pairAddress);
      const lpBalance = await pair.balanceOf(deployer.address);

      results.push({
        pair: config.name,
        pairAddress,
        lpTokens: ethers.formatEther(lpBalance),
        txHash: receipt.hash
      });

      console.log(`   🏊 Pair: ${pairAddress}`);
      console.log(`   💎 LP Tokens: ${ethers.formatEther(lpBalance)}`);

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  console.log(`\n\n🎉 V2 LIQUIDITY ADDITION COMPLETE!`);
  console.log("═".repeat(70));

  console.log(`\n✅ $50K V2 LIQUIDITY ADDED:`);
  for (const result of results) {
    console.log(`   ${result.pair}: ${result.lpTokens} LP tokens`);
  }

  console.log(`\n📝 NEXT STEP: Add V3 concentrated liquidity:`);
  console.log(`   npx hardhat run scripts/add-50k-liquidity-v3.js --network btcbr`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ V2 Liquidity Addition Failed:");
    console.error(error);
    process.exit(1);
  });
