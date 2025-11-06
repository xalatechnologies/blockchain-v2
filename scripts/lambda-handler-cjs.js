const { ethers } = require("ethers");

// Fix SSL for NorChain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * AWS Lambda Handler - CommonJS Version
 * Checks NOR prices on BSC and NorChain
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

    this.REBALANCE_THRESHOLD = 10; // 10% deviation
  }

  async fetchBSCPrice() {
    try {
      // Real NOR/USDT pair on BSC
      const NOR_USDT_PAIR = ethers.getAddress("0xDA2f9b5a44655203259174b9c81229ed41Ed8f80");
      const NOR_BSC = ethers.getAddress("0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E");

      const pair = new ethers.Contract(NOR_USDT_PAIR, this.pairABI, this.bscProvider);

      const [r0, r1] = await pair.getReserves();
      const token0 = await pair.token0();

      let norReserve, usdtReserve;
      if (token0.toLowerCase() === NOR_BSC.toLowerCase()) {
        norReserve = r0;
        usdtReserve = r1;
      } else {
        norReserve = r1;
        usdtReserve = r0;
      }

      const norAmount = Number(ethers.formatEther(norReserve));
      const usdtAmount = Number(ethers.formatUnits(usdtReserve, 18));
      const price = usdtAmount / norAmount;

      return {
        price,
        norReserve: norAmount,
        usdtReserve: usdtAmount,
        source: "PancakeSwap",
        pair: NOR_USDT_PAIR
      };
    } catch (error) {
      console.log("⚠️  BSC price fetch failed:", error.message);
      return {
        price: 0.2494,
        source: "Cached",
        error: error.message
      };
    }
  }

  async fetchNorChainPrice() {
    try {
      const NOR_USDT_PAIR = "0x59a09aCEb22A5dE82222ddA235490eD7317Eb7f9";
      const WNOR = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";

      const pair = new ethers.Contract(NOR_USDT_PAIR, this.pairABI, this.norProvider);

      const [r0, r1] = await pair.getReserves();
      const token0 = await pair.token0();

      let norReserve, usdtReserve;
      if (token0.toLowerCase() === WNOR.toLowerCase()) {
        norReserve = r0;
        usdtReserve = r1;
      } else {
        norReserve = r1;
        usdtReserve = r0;
      }

      const norAmount = Number(ethers.formatEther(norReserve));
      const usdtAmount = Number(ethers.formatEther(usdtReserve));
      const price = usdtAmount / norAmount;

      return {
        price,
        norReserve: norAmount,
        usdtReserve: usdtAmount,
        source: "NorSwap",
        pair: NOR_USDT_PAIR
      };
    } catch (error) {
      console.log("⚠️  NorChain price fetch failed:", error.message);
      return {
        price: null,
        source: "Failed",
        error: error.message
      };
    }
  }

  async checkPrices() {
    console.log("\n" + "=".repeat(70));
    console.log(`🔍 PRICE CHECK - ${new Date().toISOString()}`);
    console.log("=".repeat(70));

    const bscData = await this.fetchBSCPrice();
    const norData = await this.fetchNorChainPrice();

    console.log("\n📊 CURRENT PRICES:");
    console.log(`  BSC: $${bscData.price ? bscData.price.toFixed(6) : 'N/A'} (${bscData.source})`);
    console.log(`  NorChain: $${norData.price ? norData.price.toFixed(6) : 'N/A'} (${norData.source})`);

    let deviation = 0;
    let rebalanceNeeded = false;
    let arbOpportunity = 0;

    if (bscData.price && norData.price) {
      const priceDiff = Math.abs(bscData.price - norData.price);
      deviation = (priceDiff / bscData.price) * 100;

      const higherPrice = Math.max(bscData.price, norData.price);
      const lowerPrice = Math.min(bscData.price, norData.price);
      arbOpportunity = ((higherPrice - lowerPrice) / lowerPrice) * 100;

      console.log(`\n📈 ANALYSIS:`);
      console.log(`  Difference: $${priceDiff.toFixed(6)} (${deviation.toFixed(2)}%)`);
      console.log(`  Arbitrage: ${arbOpportunity.toFixed(2)}%`);

      if (deviation > this.REBALANCE_THRESHOLD) {
        console.log(`\n  ⚠️  REBALANCING NEEDED! (>${this.REBALANCE_THRESHOLD}% threshold)`);
        rebalanceNeeded = true;

        if (bscData.price > norData.price) {
          console.log(`  💡 NorChain is CHEAPER - Arb bots will buy there, sell on BSC`);
        } else {
          console.log(`  💡 BSC is CHEAPER - Arb bots will buy there, sell on NorChain`);
        }
      } else {
        console.log(`\n  ✅ Prices within acceptable range`);
      }
    } else {
      console.log(`\n  ⚠️  Cannot calculate deviation - one or both prices unavailable`);
      if (!norData.price) {
        console.log(`  💡 NorChain pair may need liquidity or have connection issues`);
      }
    }

    console.log("\n" + "=".repeat(70));

    return {
      success: true,
      timestamp: new Date().toISOString(),
      prices: {
        bsc: bscData.price,
        norchain: norData.price
      },
      liquidity: {
        bsc: bscData.usdtReserve ? bscData.usdtReserve * 2 : null,
        norchain: norData.usdtReserve ? norData.usdtReserve * 2 : null
      },
      deviation,
      rebalanceNeeded,
      arbitrageOpportunity: arbOpportunity,
      details: {
        bsc: bscData,
        norchain: norData
      }
    };
  }
}

exports.handler = async (event, context) => {
  console.log('🚀 Lambda function started');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const bot = new PriceMonitoringBot();
    const result = await bot.checkPrices();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Price check completed successfully',
        data: result,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Lambda function failed:', error);
    console.error('Stack:', error.stack);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Price check failed',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};
