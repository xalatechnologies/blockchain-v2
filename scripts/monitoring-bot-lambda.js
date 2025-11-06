import { ethers } from "ethers";

// Fix SSL for NorChain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * LAMBDA-COMPATIBLE PRICE MONITORING BOT
 *
 * Designed for AWS Lambda serverless execution
 * - No file system dependencies
 * - Single execution per invocation
 * - Uses CloudWatch for logging
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

    // Configuration
    this.REBALANCE_THRESHOLD = 10; // 10% deviation

    // NorChain pair
    this.NOR_USDT_NORCHAIN_PAIR = "0x59a09aCEb22A5dE82222ddA235490eD7317Eb7f9";
    this.WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";
  }

  async fetchBSCPrice() {
    try {
      // BSC NOR/BNB pair from PancakeSwap
      const NOR_BNB_PAIR = "0x7CF8c3D6e2d8ECe1d3C1B9d8A51c1C5813A6c342";

      const pair = new ethers.Contract(
        NOR_BNB_PAIR,
        this.pairABI,
        this.bscProvider
      );

      const [r0, r1] = await pair.getReserves();
      const token0 = await pair.token0();

      // Determine which reserve is NOR
      const NOR_BSC_ADDRESS = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
      let norReserve, bnbReserve;

      if (token0.toLowerCase() === NOR_BSC_ADDRESS.toLowerCase()) {
        norReserve = r0;
        bnbReserve = r1;
      } else {
        norReserve = r1;
        bnbReserve = r0;
      }

      // BNB price in USD (approximate)
      const BNB_USD_PRICE = 600; // You could fetch this from an oracle

      // Calculate NOR price
      const bnbPerNor = Number(ethers.formatEther(bnbReserve)) / Number(ethers.formatEther(norReserve));
      const price = bnbPerNor * BNB_USD_PRICE;

      return {
        price,
        norReserve: ethers.formatEther(norReserve),
        bnbReserve: ethers.formatEther(bnbReserve),
        source: "PancakeSwap",
        timestamp: Date.now()
      };
    } catch (error) {
      console.log("⚠️  Could not fetch BSC price, using cached:", error.message);
      return {
        price: 0.0065,
        source: "Cached",
        timestamp: Date.now()
      };
    }
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

    // Calculate arbitrage opportunity
    const higherPrice = Math.max(bscData.price, norData.price);
    const lowerPrice = Math.min(bscData.price, norData.price);
    const arbPercent = ((higherPrice - lowerPrice) / lowerPrice) * 100;

    console.log(`  Arbitrage: ${arbPercent.toFixed(2)}%`);

    // Check if rebalancing needed
    let rebalanceNeeded = false;
    if (priceDiffPercent > this.REBALANCE_THRESHOLD) {
      console.log(`\n  ⚠️  REBALANCING NEEDED! (>${this.REBALANCE_THRESHOLD}% threshold)`);
      rebalanceNeeded = true;

      // Provide recommendation
      if (bscData.price > norData.price) {
        console.log(`\n  💡 RECOMMENDATION:`);
        console.log(`     Prices will naturally converge via arbitrage bots`);
        console.log(`     Bots will buy cheap on NorChain, sell on BSC`);
        console.log(`     Expected convergence: 24-72 hours`);
      } else {
        console.log(`\n  💡 RECOMMENDATION:`);
        console.log(`     BSC price lower than NorChain`);
        console.log(`     Consider adding liquidity on BSC`);
      }

      // Auto-rebalance if enabled (for future)
      if (process.env.AUTO_REBALANCE === "true") {
        console.log(`\n  🔄 Auto-rebalance enabled but not implemented yet`);
        console.log(`     Manual rebalancing required`);
      }
    } else {
      console.log(`\n  ✅ Prices within acceptable range`);
    }

    console.log("\n" + "=".repeat(70));

    // Return result for Lambda response
    return {
      success: true,
      timestamp: new Date().toISOString(),
      prices: {
        bsc: bscData.price,
        norchain: norData.price
      },
      deviation: priceDiffPercent,
      rebalanceNeeded,
      arbitrageOpportunity: arbPercent
    };
  }
}

export default PriceMonitoringBot;
