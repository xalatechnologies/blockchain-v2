/**
 * Add $100k Liquidity Across All Pairs on NorSwap
 *
 * Professional Launch Strategy:
 * - NOR/USDT:  $40k (40%) - Primary trading pair
 * - NOR/WBNB:  $30k (30%) - BSC bridge compatibility
 * - NOR/BTCB:  $15k (15%) - Bitcoin exposure
 * - NOR/WETH:  $10k (10%) - Ethereum exposure
 * - NOR/BUSD:  $5k (5%)   - Stable alternative
 *
 * Total: $100,000
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// NorChain contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const NORSWAP_ROUTER = "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84";

// Wrapped token addresses (from infrastructure deployment)
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

// Liquidity allocation ($100k total)
const LIQUIDITY_CONFIG = [
  {
    name: "NOR/USDT",
    token: WUSDT,
    norAmount: "40000000000000000000000000", // 40k NOR (24 decimals)
    tokenAmount: "40000000000000000000000", // 40k USDT (18 decimals)
    allocation: 0.40,
    priority: "PRIMARY"
  },
  {
    name: "NOR/WBNB",
    token: WBNB,
    norAmount: "30000000000000000000000000", // 30k NOR
    tokenAmount: "50000000000000000000", // 50 WBNB (18 decimals)
    allocation: 0.30,
    priority: "HIGH"
  },
  {
    name: "NOR/BTCB",
    token: WBTCB,
    norAmount: "15000000000000000000000000", // 15k NOR
    tokenAmount: "250000000000000000", // 0.25 BTCB (18 decimals)
    allocation: 0.15,
    priority: "MEDIUM"
  },
  {
    name: "NOR/WETH",
    token: WETH,
    norAmount: "10000000000000000000000000", // 10k NOR
    tokenAmount: "4000000000000000000", // 4 WETH (18 decimals)
    allocation: 0.10,
    priority: "MEDIUM"
  },
  {
    name: "NOR/BUSD",
    token: WBUSD,
    norAmount: "5000000000000000000000000", // 5k NOR
    tokenAmount: "5000000000000000000000", // 5k BUSD (18 decimals)
    allocation: 0.05,
    priority: "LOW"
  }
];

async function main() {
  console.log("\n💰 ADDING $100K LIQUIDITY TO NORSWAP - ALL PAIRS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Configuration:`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} NOR`);
  console.log(`   Router: ${NORSWAP_ROUTER}`);

  // Get contracts
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const router = await ethers.getContractAt("IPancakeRouter02", NORSWAP_ROUTER);

  // Check NOR balance
  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`   NOR Token Balance: ${ethers.formatUnits(norBalance, 24)} NOR`);

  // Verify trading is disabled
  const tradingEnabled = await norToken.tradingEnabled();
  console.log(`   Trading Enabled: ${tradingEnabled}`);

  console.log(`\n📊 Liquidity Distribution Strategy ($100,000):`);
  console.log("═".repeat(70));

  for (const config of LIQUIDITY_CONFIG) {
    console.log(`\n   ${config.name}:`);
    console.log(`      Allocation: $${(100000 * config.allocation).toLocaleString()} (${config.allocation * 100}%)`);
    console.log(`      Priority: ${config.priority}`);
  }

  console.log(`\n\n🔄 ADDING LIQUIDITY TO ALL PAIRS`);
  console.log("═".repeat(70));

  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  for (const config of LIQUIDITY_CONFIG) {
    console.log(`\n💧 Adding liquidity to ${config.name}...`);

    try {
      // Get token contract
      const token = await ethers.getContractAt("IERC20", config.token);

      // Check balances
      const norBal = await norToken.balanceOf(deployer.address);
      const tokenBal = await token.balanceOf(deployer.address);

      console.log(`   NOR Balance: ${ethers.formatUnits(norBal, 24)}`);
      console.log(`   ${config.name.split('/')[1]} Balance: ${ethers.formatEther(tokenBal)}`);

      // Approve tokens
      console.log(`   📝 Approving tokens...`);
      const approveNorTx = await norToken.approve(NORSWAP_ROUTER, config.norAmount);
      await approveNorTx.wait();

      const approveTokenTx = await token.approve(NORSWAP_ROUTER, config.tokenAmount);
      await approveTokenTx.wait();
      console.log(`   ✅ Tokens approved`);

      // Add liquidity
      console.log(`   💰 Adding liquidity...`);

      // Estimate gas
      const gasEstimate = await router.addLiquidity.estimateGas(
        NOR_TOKEN,
        config.token,
        config.norAmount,
        config.tokenAmount,
        0, // min NOR (accept any slippage for initial liquidity)
        0, // min token (accept any slippage for initial liquidity)
        deployer.address,
        deadline
      );

      const gasLimit = (gasEstimate * 120n) / 100n; // +20% buffer

      const addLiquidityTx = await router.addLiquidity(
        NOR_TOKEN,
        config.token,
        config.norAmount,
        config.tokenAmount,
        0,
        0,
        deployer.address,
        deadline,
        { gasLimit }
      );

      const receipt = await addLiquidityTx.wait();
      console.log(`   ✅ Liquidity added successfully`);
      console.log(`   📝 Transaction: ${receipt.hash}`);

      // Get pair address
      const factory = await router.factory();
      const factoryContract = await ethers.getContractAt("IPancakeFactory", factory);
      const pairAddress = await factoryContract.getPair(NOR_TOKEN, config.token);

      console.log(`   🏊 Pair Address: ${pairAddress}`);

      // Get LP token balance
      const pair = await ethers.getContractAt("IERC20", pairAddress);
      const lpBalance = await pair.balanceOf(deployer.address);
      console.log(`   💎 LP Tokens Received: ${ethers.formatEther(lpBalance)}`);

    } catch (error) {
      console.error(`   ❌ Failed to add liquidity to ${config.name}:`);
      console.error(`      ${error.message}`);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUCCESS SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n🎉 LIQUIDITY ADDITION COMPLETE!`);
  console.log("═".repeat(70));

  console.log(`\n✅ $100K LIQUIDITY ADDED ACROSS ALL PAIRS:`);
  console.log(`   NOR/USDT: $40,000 (40%)`);
  console.log(`   NOR/WBNB: $30,000 (30%)`);
  console.log(`   NOR/BTCB: $15,000 (15%)`);
  console.log(`   NOR/WETH: $10,000 (10%)`);
  console.log(`   NOR/BUSD: $5,000 (5%)`);

  console.log(`\n📝 NEXT STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. Lock all liquidity for 3 years:`);
  console.log(`   npx hardhat run scripts/lock-all-liquidity.js --network btcbr`);
  console.log(`\n2. Verify all locks created (Lock IDs 1-5):`);
  console.log(`   npx hardhat run scripts/verify-all-locks.js --network btcbr`);
  console.log(`\n3. Enable trading (AFTER locking):`);
  console.log(`   npx hardhat run scripts/enable-trading.js --network btcbr`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ Ready for Liquidity Locking!`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Liquidity Addition Failed:");
    console.error(error);
    process.exit(1);
  });
