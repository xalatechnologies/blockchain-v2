import hre from "hardhat";
const { ethers } = hre;

/**
 * BOT BEHAVIOR SIMULATOR
 * Simulates realistic bot trading patterns to determine optimal launch strategy
 */

class TradingBotSimulator {
  constructor(poolState) {
    this.pool = poolState;
    this.priceHistory = [];
    this.volumeHistory = [];
    this.holderCount = 1; // Just you initially
  }

  // AMM price calculation (constant product formula)
  calculatePrice() {
    return this.pool.xht / this.pool.xhn;
  }

  // Calculate price impact of a buy
  calculateBuyImpact(xhtAmount) {
    const k = this.pool.xht * this.pool.xhn;
    const newXht = this.pool.xht + xhtAmount;
    const newXhn = k / newXht;
    const xhnReceived = this.pool.xhn - newXhn;
    const newPrice = newXht / newXhn;
    const oldPrice = this.pool.xht / this.pool.xhn;
    const priceImpact = ((newPrice - oldPrice) / oldPrice) * 100;

    return {
      xhnReceived,
      newPrice,
      priceImpact,
      newState: { xht: newXht, xhn: newXhn },
    };
  }

  // Execute a buy and update pool state
  executeBuy(xhtAmount, buyer) {
    const impact = this.calculateBuyImpact(xhtAmount);
    this.pool = impact.newState;

    this.priceHistory.push({
      time: Date.now(),
      price: impact.newPrice,
      change: impact.priceImpact,
    });

    this.volumeHistory.push({
      time: Date.now(),
      amount: xhtAmount,
      buyer,
    });

    if (buyer !== "deployer") {
      this.holderCount++;
    }

    return impact;
  }

  // Get current metrics
  getMetrics() {
    const currentPrice = this.calculatePrice();
    const initialPrice = 1000 / 100000; // 1 NOR = 100 XHN initially
    const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;

    const volume24h = this.volumeHistory.reduce((sum, v) => sum + v.amount, 0);
    const marketCap = 100000000 * currentPrice * 0.0001; // Assuming 0.0001 USD per NOR

    return {
      currentPrice,
      priceChange,
      volume24h,
      marketCap,
      holders: this.holderCount,
      liquidity: this.pool.xht + this.pool.xhn * currentPrice,
    };
  }
}

// Bot personality types
class SniperBot {
  constructor(name) {
    this.name = name;
    this.type = "Sniper";
    this.active = true;
  }

  // Sniper bots buy within first 3 minutes if conditions are met
  shouldBuy(metrics, timeElapsed) {
    if (timeElapsed > 180) return false; // Only active first 3 minutes

    const conditions = {
      lowMarketCap: metrics.marketCap < 50000,
      earlyTiming: timeElapsed < 60,
      liquidityPresent: metrics.liquidity > 500,
      priceRising: metrics.priceChange > 0,
    };

    const score = Object.values(conditions).filter(Boolean).length;
    return score >= 3; // Need 3/4 conditions
  }

  getBuyAmount(metrics) {
    // Snipers buy 5-20 NOR
    return 5 + Math.random() * 15;
  }
}

class TrendFollowerBot {
  constructor(name) {
    this.name = name;
    this.type = "Trend Follower";
    this.active = true;
  }

  shouldBuy(metrics, timeElapsed, simulator) {
    if (timeElapsed < 300) return false; // Wait 5 minutes for trend

    // Check if price is consistently rising
    const recentPrices = simulator.priceHistory.slice(-5);
    if (recentPrices.length < 5) return false;

    const allRising = recentPrices.every(
      (p, i) => i === 0 || p.price > recentPrices[i - 1].price
    );

    const conditions = {
      consistentRise: allRising,
      strongMomentum: metrics.priceChange > 10,
      volumePresent: metrics.volume24h > 50,
      multipleHolders: metrics.holders > 5,
    };

    const score = Object.values(conditions).filter(Boolean).length;
    return score >= 3;
  }

  getBuyAmount(metrics) {
    // Trend followers buy 10-50 NOR
    return 10 + Math.random() * 40;
  }
}

class VolumeBot {
  constructor(name) {
    this.name = name;
    this.type = "Volume Bot";
    this.active = true;
  }

  shouldBuy(metrics, timeElapsed, simulator) {
    if (timeElapsed < 600) return false; // Wait 10 minutes

    const recentVolume = simulator.volumeHistory
      .filter((v) => Date.now() - v.time < 600000) // Last 10 min
      .reduce((sum, v) => sum + v.amount, 0);

    const conditions = {
      highVolume: recentVolume > 100,
      activeTrading: simulator.volumeHistory.length > 20,
      established: metrics.holders > 10,
      liquidEnough: metrics.liquidity > 2000,
    };

    const score = Object.values(conditions).filter(Boolean).length;
    return score >= 3;
  }

  getBuyAmount(metrics) {
    // Volume bots buy 20-100 NOR
    return 20 + Math.random() * 80;
  }
}

class WhaleBot {
  constructor(name) {
    this.name = name;
    this.type = "Whale";
    this.active = true;
    this.hasBought = false;
  }

  shouldBuy(metrics, timeElapsed) {
    if (this.hasBought) return false;
    if (timeElapsed < 1800) return false; // Wait 30 minutes

    const conditions = {
      provenSafety: metrics.holders > 20,
      goodMomentum: metrics.priceChange > 50,
      sustainedVolume: metrics.volume24h > 500,
      reasonableMarketCap: metrics.marketCap < 100000,
    };

    const score = Object.values(conditions).filter(Boolean).length;

    if (score >= 3) {
      this.hasBought = true;
      return true;
    }
    return false;
  }

  getBuyAmount(metrics) {
    // Whales buy 100-500 NOR
    return 100 + Math.random() * 400;
  }
}

// Human trader simulation
class HumanTrader {
  constructor(name, fomLevel) {
    this.name = name;
    this.type = "Human";
    this.fomoLevel = fomLevel; // 0-1, how susceptible to FOMO
    this.hasBought = false;
  }

  shouldBuy(metrics, timeElapsed) {
    if (this.hasBought) return Math.random() < 0.1; // 10% chance to buy more

    // Humans react to different signals based on FOMO level
    const fomTrigger = metrics.priceChange * this.fomoLevel;

    const conditions = {
      significantPump: metrics.priceChange > 50 / this.fomoLevel,
      seeActivity: metrics.holders > 5,
      notTooLate: metrics.priceChange < 500, // Fear it's too expensive
      volumeConfirms: metrics.volume24h > 100,
    };

    const score = Object.values(conditions).filter(Boolean).length;
    return score >= 3 && Math.random() < this.fomoLevel;
  }

  getBuyAmount(metrics) {
    // Humans buy 1-30 NOR (more conservative)
    return 1 + Math.random() * 29;
  }
}

// Main simulation
async function runSimulation() {
  console.log("🤖 BOT BEHAVIOR SIMULATION");
  console.log("=".repeat(70));
  console.log("\nSimulating realistic bot and human trading patterns...\n");

  // Initialize pool state (after your initial liquidity)
  const poolState = {
    xht: 1000,
    xhn: 100000,
  };

  const simulator = new TradingBotSimulator(poolState);

  // Create bot army
  const bots = [
    new SniperBot("SniperBot_1"),
    new SniperBot("SniperBot_2"),
    new SniperBot("SniperBot_3"),
    new TrendFollowerBot("TrendBot_1"),
    new TrendFollowerBot("TrendBot_2"),
    new VolumeBot("VolumeBot_1"),
    new WhaleBot("Whale_1"),
    // Humans with different FOMO levels
    new HumanTrader("FOMO_Chad", 0.9),
    new HumanTrader("FOMO_Mid", 0.6),
    new HumanTrader("FOMO_Low", 0.3),
    new HumanTrader("Degen_1", 1.0),
    new HumanTrader("Normie_1", 0.4),
    new HumanTrader("Normie_2", 0.4),
  ];

  console.log("👥 PARTICIPANTS:");
  console.log("  3 Sniper Bots (buy within first 3 min)");
  console.log("  2 Trend Following Bots (buy on momentum)");
  console.log("  1 Volume Bot (buy on high volume)");
  console.log("  1 Whale Bot (big buy after confirmation)");
  console.log("  6 Human Traders (various FOMO levels)");
  console.log("\n" + "=".repeat(70));

  // Simulate 2 hours of trading
  const totalMinutes = 120;
  const events = [];

  console.log("\n⏰ SIMULATION START\n");

  // Phase 1: Your launch script buys
  console.log("🚀 PHASE 1: LAUNCH SCRIPT EXECUTION");
  const launchBuys = [1, 2, 5, 10, 20]; // Your staircase buys

  for (let i = 0; i < launchBuys.length; i++) {
    const amount = launchBuys[i];
    const impact = simulator.executeBuy(amount, "deployer");
    const metrics = simulator.getMetrics();

    events.push({
      minute: 0,
      buyer: "YOU (Launch Script)",
      amount,
      price: impact.newPrice,
      priceChange: metrics.priceChange,
    });

    console.log(`  [0:${i}] YOU buy ${amount.toFixed(2)} NOR`);
    console.log(`      → Price: ${impact.newPrice.toFixed(6)} NOR per XHN`);
    console.log(`      → Impact: +${impact.priceImpact.toFixed(2)}%`);
    console.log(`      → Total change: ${metrics.priceChange.toFixed(2)}%\n`);
  }

  // Phase 2: Bot reactions
  console.log("=".repeat(70));
  console.log("🤖 PHASE 2: BOT REACTIONS\n");

  for (let minute = 1; minute <= totalMinutes; minute++) {
    const timeElapsed = minute * 60; // seconds
    const metrics = simulator.getMetrics();

    // Check each bot
    for (const bot of bots) {
      if (!bot.active) continue;

      const shouldBuy = bot.shouldBuy(metrics, timeElapsed, simulator);

      if (shouldBuy) {
        const amount = bot.getBuyAmount(metrics);
        const impact = simulator.executeBuy(amount, bot.name);
        const newMetrics = simulator.getMetrics();

        events.push({
          minute,
          buyer: `${bot.name} (${bot.type})`,
          amount,
          price: impact.newPrice,
          priceChange: newMetrics.priceChange,
        });

        console.log(`  [${minute} min] ${bot.type}: ${bot.name}`);
        console.log(`      → Buys: ${amount.toFixed(2)} NOR`);
        console.log(`      → Price: ${impact.newPrice.toFixed(6)}`);
        console.log(`      → Change: ${newMetrics.priceChange.toFixed(2)}%`);
        console.log(`      → Holders: ${newMetrics.holders}`);
        console.log(`      → Volume: ${newMetrics.volume24h.toFixed(2)} NOR\n`);
      }
    }

    // Every 10 minutes, show summary
    if (minute % 10 === 0) {
      const metrics = simulator.getMetrics();
      console.log(`\n📊 [${minute} MIN MARK]`);
      console.log(`  Price Change: +${metrics.priceChange.toFixed(2)}%`);
      console.log(`  Market Cap: $${metrics.marketCap.toFixed(2)}`);
      console.log(`  24h Volume: ${metrics.volume24h.toFixed(2)} NOR`);
      console.log(`  Holders: ${metrics.holders}`);
      console.log(`  Trades: ${simulator.volumeHistory.length}`);
      console.log("");
    }
  }

  // Final results
  console.log("=".repeat(70));
  console.log("📊 FINAL SIMULATION RESULTS");
  console.log("=".repeat(70));

  const finalMetrics = simulator.getMetrics();

  console.log("\n💰 PRICE PERFORMANCE:");
  console.log(`  Initial Price: ${(1000 / 100000).toFixed(6)} NOR per XHN`);
  console.log(
    `  Final Price: ${finalMetrics.currentPrice.toFixed(6)} NOR per XHN`
  );
  console.log(`  Change: +${finalMetrics.priceChange.toFixed(2)}%`);
  console.log(
    `  Multiplier: ${(finalMetrics.priceChange / 100 + 1).toFixed(2)}x`
  );

  console.log("\n📈 TRADING ACTIVITY:");
  console.log(`  Total Trades: ${simulator.volumeHistory.length}`);
  console.log(`  Total Volume: ${finalMetrics.volume24h.toFixed(2)} NOR`);
  console.log(`  Final Holders: ${finalMetrics.holders}`);
  console.log(`  Market Cap: $${finalMetrics.marketCap.toFixed(2)}`);

  console.log("\n👥 BUYER BREAKDOWN:");
  const buyerTypes = {};
  events.forEach((e) => {
    const type = e.buyer.includes("(")
      ? e.buyer.split("(")[1].replace(")", "")
      : "Launch";
    buyerTypes[type] = (buyerTypes[type] || 0) + 1;
  });

  Object.entries(buyerTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} buys`);
  });

  console.log("\n💵 YOUR EARNINGS:");
  const feesEarned = finalMetrics.volume24h * 0.003 * 0.9999; // 0.3% fee, you own 99.99%
  console.log(
    `  LP Fees: ${feesEarned.toFixed(4)} NOR (~$${(feesEarned * 0.0001).toFixed(
      2
    )})`
  );
  console.log(
    `  Your LP Value: ${(finalMetrics.liquidity * 0.9999).toFixed(2)} NOR`
  );

  const yourXhnValue =
    (100000 - 100 - simulator.pool.xhn) * finalMetrics.currentPrice * 0.0001;
  console.log(`  Your XHN Value: $${yourXhnValue.toFixed(2)}`);

  console.log("\n🎯 KEY INSIGHTS:");

  const sniperBuys = events.filter((e) => e.buyer.includes("Sniper")).length;
  const trendBuys = events.filter((e) => e.buyer.includes("Trend")).length;
  const volumeBuys = events.filter((e) => e.buyer.includes("Volume")).length;
  const whaleBuys = events.filter((e) => e.buyer.includes("Whale")).length;
  const humanBuys = events.filter(
    (e) =>
      e.buyer.includes("Human") ||
      e.buyer.includes("FOMO") ||
      e.buyer.includes("Degen") ||
      e.buyer.includes("Normie")
  ).length;

  console.log(
    `  ✅ Sniper bots activated: ${
      sniperBuys > 0 ? "YES" : "NO"
    } (${sniperBuys} buys)`
  );
  console.log(
    `  ✅ Trend bots activated: ${
      trendBuys > 0 ? "YES" : "NO"
    } (${trendBuys} buys)`
  );
  console.log(
    `  ✅ Volume bots activated: ${
      volumeBuys > 0 ? "YES" : "NO"
    } (${volumeBuys} buys)`
  );
  console.log(
    `  ✅ Whale activated: ${whaleBuys > 0 ? "YES" : "NO"} (${whaleBuys} buys)`
  );
  console.log(
    `  ✅ Human FOMO triggered: ${
      humanBuys > 0 ? "YES" : "NO"
    } (${humanBuys} buys)`
  );

  console.log("\n📋 RECOMMENDATIONS:");

  if (finalMetrics.priceChange > 100) {
    console.log("  ✅ EXCELLENT! Your launch strategy is highly effective");
    console.log("     - Continue with current approach");
    console.log("     - Bots are definitely attracted");
  } else if (finalMetrics.priceChange > 50) {
    console.log("  ✅ GOOD! Strategy works but can be improved");
    console.log("     - Consider larger initial buys");
    console.log("     - Add more marketing");
  } else {
    console.log("  ⚠️  NEEDS IMPROVEMENT");
    console.log("     - Increase initial momentum");
    console.log("     - Add aggressive marketing");
    console.log("     - Consider announced launch");
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎬 SIMULATION COMPLETE");
  console.log("=".repeat(70));

  return {
    finalMetrics,
    events,
    botActivation: {
      snipers: sniperBuys,
      trends: trendBuys,
      volume: volumeBuys,
      whale: whaleBuys,
      humans: humanBuys,
    },
  };
}

// Run simulation
runSimulation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ SIMULATION ERROR:");
    console.error(error);
    process.exit(1);
  });
