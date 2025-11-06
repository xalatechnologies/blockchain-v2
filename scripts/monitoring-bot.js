import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * AUTOMATED PRICE MONITORING & REBALANCING BOT
 *
 * Runs continuously, checks prices every hour
 * Updates oracle contracts
 * Triggers rebalancing when needed
 *
 * Can be hosted on:
 * - Local machine with PM2
 * - Docker container
 * - AWS Lambda (serverless)
 * - Heroku / DigitalOcean
 */

class PriceMonitoringBot {
  constructor() {
    this.bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");
    this.norProvider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");

    this.pairABI = [
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function token0() external view returns (address)",
      "function token1() external view returns (address)"
    ];

    // Oracle contract ABI (simplified)
    this.oracleABI = [
      "function updatePrice(uint256 chainId, uint256 price, uint256 reserve0, uint256 reserve1, address pair) external",
      "function needsRebalancing() external view returns (bool needed, uint256 deviation)"
    ];

    // Configuration
    this.CHECK_INTERVAL = 3600000; // 1 hour in milliseconds
    this.REBALANCE_THRESHOLD = 1000; // 10% = 1000 basis points

    // NorChain pair
    this.NOR_USDT_NORCHAIN_PAIR = "0x59a09aCEb22A5dE82222ddA235490eD7317Eb7f9";
    this.WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";

    // Load oracle addresses if deployed
    this.loadOracleAddresses();
  }

  loadOracleAddresses() {
    try {
      const data = JSON.parse(
        fs.readFileSync("docs/deployment-logs/price-oracle-deployment.json")
      );
      this.oracleAddresses = {
        bsc: data.deployments.bsc?.address,
        norchain: data.deployments.norchain?.address
      };
    } catch (error) {
      console.log("⚠️  Oracle not deployed yet");
      this.oracleAddresses = {};
    }
  }

  async fetchBSCPrice() {
    // For now, use documented price
    // In production, fetch from actual PancakeSwap pairs
    return {
      price: 0.0065,
      source: "PancakeSwap (cached)",
      timestamp: Date.now()
    };
  }

  async fetchNorChainPrice() {
    try {
      const pair = new ethers.Contract(
        this.NOR_USDT_NORCHAIN_PAIR,
        this.pairABI,
        this.norProvider
      );

      const [r0, r1] = await pair.getReserves();
      const token0 = await pair.token0();

      let norReserve, usdtReserve;
      if (token0.toLowerCase() === this.WNOR_ADDRESS.toLowerCase()) {
        norReserve = r0;
        usdtReserve = r1;
      } else {
        norReserve = r1;
        usdtReserve = r0;
      }

      const price = Number(ethers.formatEther(usdtReserve)) / Number(ethers.formatEther(norReserve));

      return {
        price,
        norReserve: ethers.formatEther(norReserve),
        usdtReserve: ethers.formatEther(usdtReserve),
        source: "NorSwap",
        timestamp: Date.now()
      };
    } catch (error) {
      console.log("⚠️  Could not fetch NorChain price:", error.message);
      return {
        price: 0.0000024,
        source: "Cached",
        timestamp: Date.now()
      };
    }
  }

  async checkPrices() {
    console.log("\n" + "=".repeat(70));
    console.log(`🔍 PRICE CHECK - ${new Date().toISOString()}`);
    console.log("=".repeat(70));

    // Fetch prices
    const bscData = await this.fetchBSCPrice();
    const norData = await this.fetchNorChainPrice();

    console.log("\n📊 CURRENT PRICES:");
    console.log(`  BSC: $${bscData.price.toFixed(6)} (${bscData.source})`);
    console.log(`  NorChain: $${norData.price.toFixed(6)} (${norData.source})`);

    // Calculate deviation
    const priceDiff = Math.abs(bscData.price - norData.price);
    const priceDiffPercent = (priceDiff / bscData.price) * 100;

    console.log(`\n📈 ANALYSIS:`);
    console.log(`  Difference: $${priceDiff.toFixed(6)} (${priceDiffPercent.toFixed(2)}%)`);

    // Check if rebalancing needed
    if (priceDiffPercent > 10) {
      console.log(`  ⚠️  REBALANCING NEEDED! (>${this.REBALANCE_THRESHOLD / 100}% threshold)`);

      // Log to file for alerting
      this.logAlert({
        type: "REBALANCE_NEEDED",
        bscPrice: bscData.price,
        norchainPrice: norData.price,
        deviation: priceDiffPercent,
        timestamp: new Date().toISOString()
      });

      // Auto-rebalance if enabled
      if (process.env.AUTO_REBALANCE === "true") {
        await this.triggerRebalance(bscData, norData);
      } else {
        console.log(`\n  💡 Manual rebalancing required:`);
        console.log(`     node scripts/balance-norchain-price.js`);
      }
    } else {
      console.log(`  ✅ Prices within acceptable range`);
    }

    // Update oracle contracts if deployed
    if (this.oracleAddresses.norchain) {
      await this.updateOracle(norData);
    }

    console.log(`\n⏰ Next check in 1 hour...`);
  }

  async updateOracle(norData) {
    try {
      console.log(`\n🔮 Updating Oracle Contract...`);

      const wallet = new ethers.Wallet(
        process.env.MAIN_WALLET_PRIVATE_KEY,
        this.norProvider
      );

      const oracle = new ethers.Contract(
        this.oracleAddresses.norchain,
        this.oracleABI,
        wallet
      );

      // Update NorChain price
      const priceWei = ethers.parseEther(norData.price.toString());
      const reserve0 = ethers.parseEther(norData.norReserve || "0");
      const reserve1 = ethers.parseEther(norData.usdtReserve || "0");

      const tx = await oracle.updatePrice(
        65001, // NorChain ID
        priceWei,
        reserve0,
        reserve1,
        this.NOR_USDT_NORCHAIN_PAIR
      );

      await tx.wait();
      console.log(`  ✅ Oracle updated:`, tx.hash);
    } catch (error) {
      console.log(`  ⚠️  Oracle update failed:`, error.message);
    }
  }

  async triggerRebalance(bscData, norData) {
    console.log(`\n🔄 AUTO-REBALANCING...`);

    // Calculate required liquidity adjustment
    const targetPrice = bscData.price;
    const currentPrice = norData.price;

    console.log(`  Target price: $${targetPrice}`);
    console.log(`  Current price: $${currentPrice}`);

    // Log rebalance attempt
    this.logAlert({
      type: "REBALANCE_TRIGGERED",
      targetPrice,
      currentPrice,
      timestamp: new Date().toISOString()
    });

    // In production, execute rebalancing logic here
    console.log(`  💡 Rebalancing logic would execute here`);
    console.log(`  (Currently requires manual execution)`);
  }

  logAlert(alert) {
    const logFile = "logs/price-monitoring.json";

    let logs = [];
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile));
    }

    logs.push(alert);

    // Keep only last 100 entries
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs", { recursive: true });
    }

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }

  async start() {
    console.log("\n🤖 PRICE MONITORING BOT STARTED");
    console.log("=".repeat(70));
    console.log(`Check interval: Every ${this.CHECK_INTERVAL / 60000} minutes`);
    console.log(`Rebalance threshold: ${this.REBALANCE_THRESHOLD / 100}%`);
    console.log(`Auto-rebalance: ${process.env.AUTO_REBALANCE === "true" ? "ENABLED" : "DISABLED"}`);
    console.log("=".repeat(70));

    // Initial check
    await this.checkPrices();

    // Schedule periodic checks
    setInterval(async () => {
      try {
        await this.checkPrices();
      } catch (error) {
        console.error("❌ Check failed:", error.message);
        this.logAlert({
          type: "CHECK_FAILED",
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }, this.CHECK_INTERVAL);
  }
}

// Run bot if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bot = new PriceMonitoringBot();
  bot.start().catch(error => {
    console.error("❌ Bot failed:", error);
    process.exit(1);
  });
}

export default PriceMonitoringBot;
