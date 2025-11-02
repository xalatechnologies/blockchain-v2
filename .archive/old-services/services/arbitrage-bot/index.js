/**
 * Xaheen Cross-Chain Arbitrage Bot
 *
 * Purpose: Maintain ±0.5% price tolerance across all spoke chains
 *
 * How it works:
 * 1. Monitor TWAP price from Xaheen DEX (canonical price)
 * 2. Monitor spoke prices from BSC/Polygon/ETH DEXs
 * 3. When deviation >0.3%, execute arbitrage
 * 4. Only execute if profit >$5 (covers gas)
 * 5. Use Flashbots for MEV protection
 */

import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { PriceMonitor } from "./src/PriceMonitor.js";
import { ArbitrageExecutor } from "./src/ArbitrageExecutor.js";
import { config } from "./src/config.js";

dotenvConfig({ path: "../../.env" });

class ArbitrageBot {
  constructor() {
    this.priceMonitor = new PriceMonitor(config);
    this.arbitrageExecutor = new ArbitrageExecutor(config);
    this.isRunning = false;
    this.monitoringInterval = null;
  }

  async start() {
    console.log("🤖 Xaheen Arbitrage Bot Starting...\n");

    // Initialize connections
    await this.priceMonitor.initialize();
    await this.arbitrageExecutor.initialize();

    this.isRunning = true;
    console.log("✅ Bot initialized successfully");
    console.log(`📊 Monitoring ${config.spokes.length} spoke chains`);
    console.log(`⚙️  Deviation threshold: ${config.thresholds.deviationTrigger * 100}%`);
    console.log(`💰 Minimum profit: $${config.thresholds.minProfit}`);
    console.log();

    // Start monitoring loop (every 30 seconds)
    this.monitoringInterval = setInterval(
      () => this.monitorAndArbitrage(),
      config.monitoringIntervalMs
    );

    // Run immediately on start
    await this.monitorAndArbitrage();
  }

  async monitorAndArbitrage() {
    if (!this.isRunning) return;

    try {
      console.log(`[${new Date().toISOString()}] Monitoring prices...`);

      // 1. Get canonical price from Xaheen
      const xaheenPrice = await this.priceMonitor.getXaheenPrice();
      console.log(`   Xaheen TWAP: $${xaheenPrice.toFixed(6)}`);

      // 2. Check each spoke chain
      for (const spoke of config.spokes) {
        const spokePrice = await this.priceMonitor.getSpokePrice(spoke.chainId);

        if (!spokePrice) {
          console.log(`   ${spoke.name}: No liquidity`);
          continue;
        }

        const deviation = Math.abs(spokePrice - xaheenPrice) / xaheenPrice;
        const deviationPct = (deviation * 100).toFixed(2);

        console.log(
          `   ${spoke.name}: $${spokePrice.toFixed(6)} (${deviation > 0 ? "+" : ""}${deviationPct}%)`
        );

        // 3. Check if arbitrage is needed
        if (deviation > config.thresholds.deviationTrigger) {
          console.log(`   ⚠️  Deviation above threshold!`);

          // Calculate potential profit
          const arbitrageAmount = config.arbitrageAmountXHT;
          const profit = await this.arbitrageExecutor.calculateProfit(
            xaheenPrice,
            spokePrice,
            arbitrageAmount,
            spoke.chainId
          );

          console.log(`   💰 Estimated profit: $${profit.toFixed(2)}`);

          // 4. Execute if profitable
          if (profit > config.thresholds.minProfit) {
            console.log(`   🚀 Executing arbitrage...`);

            const result = await this.arbitrageExecutor.execute({
              xaheenPrice,
              spokePrice,
              spokeCh ainId: spoke.chainId,
              spokeName: spoke.name,
              amount: arbitrageAmount,
              expectedProfit: profit,
            });

            if (result.success) {
              console.log(`   ✅ Arbitrage successful!`);
              console.log(`   💵 Actual profit: $${result.actualProfit.toFixed(2)}`);
              console.log(`   📈 New deviation: ${result.newDeviation.toFixed(4)}%`);
            } else {
              console.log(`   ❌ Arbitrage failed: ${result.error}`);
            }
          } else {
            console.log(`   ⏭️  Profit too low, skipping`);
          }
        }
      }

      console.log();
    } catch (error) {
      console.error("❌ Error in monitoring loop:", error.message);
    }
  }

  async stop() {
    console.log("\n🛑 Stopping arbitrage bot...");
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log("✅ Bot stopped");
  }
}

// Start the bot
const bot = new ArbitrageBot();

// Graceful shutdown
process.on("SIGINT", async () => {
  await bot.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await bot.stop();
  process.exit(0);
});

bot.start().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
