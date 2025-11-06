console.log("\n📊 CURRENT BSC LIQUIDITY ANALYSIS\n");
console.log("=".repeat(70));

const pairs = [
  { name: "NOR/USDT", price: 0.2494, liquidity: 245.02, volume24h: 110.53 },
  { name: "NOR/ETH", price: 0.2575, liquidity: 129.64, volume24h: 54.62 },
  { name: "NOR/WBNB", price: 0.2479, liquidity: 97.30, volume24h: 65.35 }
];

const totalLiquidity = pairs.reduce((sum, p) => sum + p.liquidity, 0);
const totalVolume = pairs.reduce((sum, p) => sum + p.volume24h, 0);

console.log("Current State:");
pairs.forEach(p => {
  console.log(`  ${p.name}: $${p.liquidity.toFixed(2)} liquidity, $${p.price.toFixed(4)} price`);
});
console.log(`\nTotal Liquidity: $${totalLiquidity.toFixed(2)}`);
console.log(`Total 24h Volume: $${totalVolume.toFixed(2)}`);

console.log("\n" + "=".repeat(70));
console.log("💰 ADDING $10,000 LIQUIDITY - SCENARIOS\n");

// Scenario 1: Split proportionally
console.log("SCENARIO 1: Split Proportionally by Current Liquidity");
console.log("-".repeat(70));

pairs.forEach(p => {
  const proportion = p.liquidity / totalLiquidity;
  const newLiquidity = 10000 * proportion;
  const totalNew = p.liquidity + newLiquidity;
  const increase = ((totalNew / p.liquidity) - 1) * 100;

  console.log(`\n${p.name}:`);
  console.log(`  Current: $${p.liquidity.toFixed(2)}`);
  console.log(`  Add: $${newLiquidity.toFixed(2)}`);
  console.log(`  New Total: $${totalNew.toFixed(2)}`);
  console.log(`  Increase: ${increase.toFixed(0)}%`);
});

console.log(`\nNew Total Liquidity: $${(totalLiquidity + 10000).toFixed(2)}`);
console.log(`Liquidity Increase: ${((10000 / totalLiquidity) * 100).toFixed(0)}x`);

// Scenario 2: All in NOR/USDT (most liquid)
console.log("\n" + "=".repeat(70));
console.log("SCENARIO 2: All $10k into NOR/USDT (Recommended)");
console.log("-".repeat(70));

const mainPair = pairs[0];
const newMainLiquidity = mainPair.liquidity + 10000;
const increase = ((newMainLiquidity / mainPair.liquidity) - 1) * 100;

console.log(`\nNOR/USDT:`);
console.log(`  Current: $${mainPair.liquidity.toFixed(2)}`);
console.log(`  Add: $10,000.00`);
console.log(`  New Total: $${newMainLiquidity.toFixed(2)}`);
console.log(`  Increase: ${increase.toFixed(0)}x`);

console.log("\n" + "=".repeat(70));
console.log("📈 PRICE IMPACT ANALYSIS\n");

// Calculate slippage for different trade sizes
const calculatePriceImpact = (tradeSize, liquidity) => {
  // AMM formula: Δy = (x * Δx) / (X + Δx)
  // Price impact ≈ tradeSize / (liquidity + tradeSize)
  return (tradeSize / (liquidity + tradeSize)) * 100;
};

const tradeSizes = [100, 500, 1000, 5000];

console.log("Slippage for Different Trade Sizes:\n");
console.log("Current NOR/USDT ($245 liquidity):");
tradeSizes.forEach(size => {
  const impact = calculatePriceImpact(size, mainPair.liquidity);
  console.log(`  $${size} trade: ${impact.toFixed(2)}% slippage`);
});

console.log("\nAfter Adding $10k ($10,245 liquidity):");
tradeSizes.forEach(size => {
  const impact = calculatePriceImpact(size, newMainLiquidity);
  console.log(`  $${size} trade: ${impact.toFixed(2)}% slippage`);
});

console.log("\n" + "=".repeat(70));
console.log("💡 PRICE STABILITY IMPACT\n");

// Calculate how much someone could buy/sell with < 5% slippage
const maxTradeWithSlippage = (liquidity, maxSlippage = 5) => {
  // Solve: tradeSize / (liquidity + tradeSize) = maxSlippage / 100
  // tradeSize = (liquidity * maxSlippage) / (100 - maxSlippage)
  return (liquidity * maxSlippage) / (100 - maxSlippage);
};

const currentMax = maxTradeWithSlippage(mainPair.liquidity);
const newMax = maxTradeWithSlippage(newMainLiquidity);
const improvement = ((newMax / currentMax) - 1) * 100;

console.log("Maximum trade size with <5% slippage:");
console.log(`  Current: $${currentMax.toFixed(2)}`);
console.log(`  After $10k: $${newMax.toFixed(2)}`);
console.log(`  Improvement: ${improvement.toFixed(0)}%`);

console.log("\n" + "=".repeat(70));
console.log("✅ RECOMMENDATION\n");

console.log("1. Add ALL $10k to NOR/USDT pair (most volume)");
console.log("2. This will:");
console.log("   - Increase liquidity from $245 → $10,245 (41x)");
console.log("   - Reduce slippage for $1k trades from 80% → 9%");
console.log("   - Allow trades up to $540 with <5% slippage (vs $12 now)");
console.log("   - Make price much more stable");
console.log("   - Attract more traders and volume");
console.log("\n3. Current price ($0.2494) will NOT change");
console.log("   (Adding liquidity maintains the ratio, doesn't move price)");

console.log("\n⚠️  IMPORTANT: Add liquidity at CURRENT ratio!");
console.log("   Current ratio: 491 NOR per 122.5 USDT");
console.log("   Price: $0.2494 per NOR");
console.log("   To add $10k liquidity:");
console.log("   Need: ~40,080 NOR + $10,000 USDT");
console.log("   Total value: ~$20,000 (50% NOR, 50% USDT)");

console.log("\n" + "=".repeat(70));
console.log("🤔 NORCHAIN SITUATION\n");

console.log("NorChain pair appears to have NO liquidity or broken:");
console.log("  - Pair address exists but returns empty data");
console.log("  - Need to verify if pair was deployed correctly");
console.log("  - May need to redeploy or add initial liquidity");
console.log("\nRecommendation: Fix NorChain first, then add $10k there too");
