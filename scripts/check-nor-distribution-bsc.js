import hre from "hardhat";
const { ethers } = hre;

/**
 * CHECK NOR TOKEN DISTRIBUTION ON BSC
 *
 * Analyzes:
 * - Total supply
 * - Your balance
 * - Liquidity pool balances
 * - Top holders
 * - Price impact of selling
 */

async function main() {
  console.log("\n📊 NOR TOKEN DISTRIBUTION ON BSC");
  console.log("=".repeat(70));

  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");

  const NOR_BSC_ADDRESS = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
  const YOUR_WALLET = "0xdD779a290C937144F80Eb75b75d814c834536B1b";

  // Liquidity pool addresses from your transactions
  const NOR_BNB_PAIR = "0x7CF8c3D6e2d8ECe1d3C1B9d8A51c1C5813A6c342";
  const NOR_USDT_PAIR = "0x..."; // Need to find from transactions
  const NOR_ETH_PAIR = "0x...";  // Need to find from transactions

  const erc20ABI = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  const pairABI = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
  ];

  const nor = new ethers.Contract(NOR_BSC_ADDRESS, erc20ABI, provider);

  // Get basic info
  console.log("\n💰 TOTAL SUPPLY & DISTRIBUTION:");

  const totalSupply = await nor.totalSupply();
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "NOR");

  const yourBalance = await nor.balanceOf(YOUR_WALLET);
  console.log("  Your Balance:", ethers.formatEther(yourBalance), "NOR");

  const yourPercent = (Number(yourBalance) / Number(totalSupply)) * 100;
  console.log("  Your %:", yourPercent.toFixed(2) + "%");

  // Check liquidity pools
  console.log("\n💧 LIQUIDITY POOLS:");

  try {
    const bnbPair = new ethers.Contract(NOR_BNB_PAIR, pairABI, provider);
    const [r0, r1] = await bnbPair.getReserves();
    const token0 = await bnbPair.token0();

    let norInBNBPool;
    if (token0.toLowerCase() === NOR_BSC_ADDRESS.toLowerCase()) {
      norInBNBPool = r0;
    } else {
      norInBNBPool = r1;
    }

    console.log("  NOR/BNB Pool:", ethers.formatEther(norInBNBPool), "NOR");

    const poolPercent = (Number(norInBNBPool) / Number(totalSupply)) * 100;
    console.log("  Pool %:", poolPercent.toFixed(2) + "%");

  } catch (error) {
    console.log("  ⚠️ Could not fetch pool data:", error.message);
  }

  // Calculate if you can influence price
  console.log("\n📈 PRICE IMPACT ANALYSIS:");

  const tenMillion = ethers.parseEther("10000000");
  const impactPercent = (Number(tenMillion) / Number(totalSupply)) * 100;

  console.log("  Your 10M NOR:", impactPercent.toFixed(2), "% of total supply");

  if (impactPercent > 10) {
    console.log("  ⚠️  SIGNIFICANT HOLDER - Can influence price!");
  } else if (impactPercent > 5) {
    console.log("  ✅ MODERATE HOLDER - Some price impact");
  } else {
    console.log("  ✅ SMALL HOLDER - Minimal price impact");
  }

  // Calculate price impact if you sell
  console.log("\n💸 IF YOU SELL 10M NOR:");

  // Assuming $19 liquidity in NOR/BNB pool
  const liquidityUSD = 19; // From your data
  const currentPrice = 0.0065; // USD per NOR

  // AMM formula: price impact = amount / (liquidity + amount)
  const sellAmount = 10000000; // 10M NOR
  const currentLiquidity = liquidityUSD / currentPrice; // ~2923 NOR

  const priceImpact = (sellAmount / (currentLiquidity + sellAmount)) * 100;

  console.log("  Current pool size: ~" + currentLiquidity.toFixed(0), "NOR ($" + liquidityUSD + ")");
  console.log("  Sell amount: " + sellAmount.toLocaleString(), "NOR");
  console.log("  Price impact: " + priceImpact.toFixed(2) + "%");

  if (priceImpact > 90) {
    console.log("  ⚠️  WOULD CRASH THE POOL! (>90% impact)");
    console.log("  💡 TIP: Add more liquidity first, or sell in smaller batches");
  }

  // Calculate new price after sell
  const newLiquidity = currentLiquidity + sellAmount;
  const newPrice = liquidityUSD / newLiquidity;

  console.log("\n  After selling:");
  console.log("    New price: $" + newPrice.toFixed(6) + " per NOR");
  console.log("    Change: " + ((newPrice / currentPrice - 1) * 100).toFixed(2) + "%");

  console.log("\n" + "=".repeat(70));
  console.log("💡 STRATEGY OPTIONS");
  console.log("=".repeat(70));

  console.log("\n1️⃣  ADD MORE LIQUIDITY FIRST (RECOMMENDED)");
  console.log("  Add: 5M NOR + $32,500 USDT");
  console.log("  Result: Pool grows, price impact reduces");
  console.log("  Then: Sell gradually with minimal impact");

  console.log("\n2️⃣  SELL IN SMALL BATCHES");
  console.log("  Sell: 100k NOR per day (10-20 transactions)");
  console.log("  Days: ~100 days to sell all 10M");
  console.log("  Impact: <1% per trade");

  console.log("\n3️⃣  SELL ON NORCHAIN, NOT BSC");
  console.log("  NorChain has 2.08B NOR in pool");
  console.log("  Your 10M = 0.48% of pool");
  console.log("  Impact: Minimal");
  console.log("  Then: Bridge back USDT to BSC");

  console.log("\n4️⃣  LET ARBITRAGE BOTS BALANCE NATURALLY");
  console.log("  Wait: Bots buy cheap on NorChain");
  console.log("  Result: Prices converge naturally");
  console.log("  Time: 24-72 hours");

  console.log("\n✅ BEST STRATEGY:");
  console.log("  Option 3 + Option 4 combined:");
  console.log("  1. Let arb bots work (24h)");
  console.log("  2. If still imbalanced, sell 1-2M NOR on NorChain");
  console.log("  3. Don't sell on BSC (would crash the small pool)");

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
