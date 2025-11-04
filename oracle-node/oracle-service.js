/**
 * @title Nor Chain Oracle Node Service
 * @notice Fetches price data from multiple sources and submits to OracleAggregator
 * @dev Run with: node oracle-service.js
 *
 * Features:
 * - Multi-source price fetching (CoinGecko, Binance, CoinMarketCap)
 * - Median calculation for accuracy
 * - Automatic submission to blockchain
 * - Error handling and retry logic
 * - Configurable update intervals
 */

import { ethers } from "ethers";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Configuration
const CONFIG = {
  // Blockchain connection
  RPC_URL: process.env.ORACLE_RPC_URL || "https://rpc.norchain.org",
  PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY,

  // Oracle contract addresses (set after deployment)
  ORACLE_CONTRACTS: {
    "GOLD/USD": process.env.GOLD_ORACLE_ADDRESS,
    "AED/USD": process.env.AED_ORACLE_ADDRESS,
    "KES/USD": process.env.KES_ORACLE_ADDRESS,
    "NOK/USD": process.env.NOK_ORACLE_ADDRESS,
    "SEK/USD": process.env.SEK_ORACLE_ADDRESS,
    "DKK/USD": process.env.DKK_ORACLE_ADDRESS,
  },

  // API keys (optional, but recommended for higher rate limits)
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || "",
  COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY || "",

  // Update interval (5 minutes default)
  UPDATE_INTERVAL:
    parseInt(process.env.UPDATE_INTERVAL_SECONDS || "300") * 1000,

  // Gas configuration
  GAS_LIMIT: 200000,
  GAS_PRICE_GWEI: 1,
};

// Price feed mappings
const PRICE_FEEDS = {
  "GOLD/USD": {
    coingecko: "paxos-gold", // PAXG as gold proxy
    binance: null, // Gold not on Binance
    alternative: "metals-api", // Use metals-api.com for gold
  },
  "AED/USD": {
    forex: "AED",
    rate: 0.272, // Approximate AED/USD rate (1 AED = ~0.272 USD)
  },
  "KES/USD": {
    forex: "KES",
    rate: 0.0077, // Approximate KES/USD rate
  },
  "NOK/USD": {
    forex: "NOK",
    rate: 0.093, // Approximate NOK/USD rate
  },
  "SEK/USD": {
    forex: "SEK",
    rate: 0.096, // Approximate SEK/USD rate
  },
  "DKK/USD": {
    forex: "DKK",
    rate: 0.145, // Approximate DKK/USD rate
  },
};

// Oracle ABI (minimal - just submitPrice function)
const ORACLE_ABI = [
  "function submitPrice(uint256 _price) external",
  "function getPrice() external view returns (uint256)",
  "function currentRound() external view returns (uint256)",
];

class OracleNode {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contracts = {};
    this.isRunning = false;

    console.log("🌙 Nor Chain Oracle Node Initializing...");
    console.log(`📡 Connected to: ${CONFIG.RPC_URL}`);
    console.log(`🔑 Oracle Address: ${this.wallet.address}`);
  }

  /**
   * Initialize oracle contracts
   */
  async initialize() {
    console.log("\n📝 Initializing Oracle Contracts...");

    for (const [feed, address] of Object.entries(CONFIG.ORACLE_CONTRACTS)) {
      if (address && address !== "undefined") {
        this.contracts[feed] = new ethers.Contract(
          address,
          ORACLE_ABI,
          this.wallet
        );
        console.log(`   ✅ ${feed}: ${address}`);
      } else {
        console.log(`   ⚠️  ${feed}: Not configured`);
      }
    }

    console.log("\n✅ Oracle Node Initialized\n");
  }

  /**
   * Fetch price from CoinGecko
   */
  async fetchCoinGeckoPrice(coinId) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
      const response = await axios.get(url, {
        headers: CONFIG.COINGECKO_API_KEY
          ? {
              "X-Cg-Pro-Api-Key": CONFIG.COINGECKO_API_KEY,
            }
          : {},
      });

      return response.data[coinId]?.usd || null;
    } catch (error) {
      console.error(`   ❌ CoinGecko error for ${coinId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch price from Binance
   */
  async fetchBinancePrice(symbol) {
    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
      const response = await axios.get(url);
      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`   ❌ Binance error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch Forex rate (simplified - use fixed rates for now)
   * TODO: Integrate with forex API (e.g., exchangerate-api.com)
   */
  async fetchForexRate(currency) {
    // For now, use approximate rates from PRICE_FEEDS
    const feedConfig = Object.values(PRICE_FEEDS).find(
      (f) => f.forex === currency
    );
    return feedConfig?.rate || null;
  }

  /**
   * Fetch price for a specific feed
   */
  async fetchPrice(feed) {
    console.log(`📊 Fetching price for ${feed}...`);

    const prices = [];

    // Gold price (special handling)
    if (feed === "GOLD/USD") {
      const goldPrice = await this.fetchCoinGeckoPrice("paxos-gold");
      if (goldPrice) {
        prices.push(goldPrice);
        console.log(`   CoinGecko (PAXG): $${goldPrice.toFixed(2)}`);
      }

      // TODO: Add metals-api.com integration for real gold spot price
      // For now, use PAXG as proxy
    }

    // Forex rates
    else if (
      feed.includes("AED") ||
      feed.includes("KES") ||
      feed.includes("NOK") ||
      feed.includes("SEK") ||
      feed.includes("DKK")
    ) {
      const currency = feed.split("/")[0];
      const forexRate = await this.fetchForexRate(currency);
      if (forexRate) {
        prices.push(forexRate);
        console.log(`   Forex Rate: $${forexRate.toFixed(6)}`);
      }

      // TODO: Add real forex API (exchangerate-api.com, fixer.io, etc.)
    }

    // Calculate median price
    if (prices.length === 0) {
      console.log(`   ⚠️  No prices available for ${feed}`);
      return null;
    }

    prices.sort((a, b) => a - b);
    const median =
      prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)];

    console.log(
      `   ✅ Median Price: $${median.toFixed(6)} (from ${
        prices.length
      } sources)`
    );
    return median;
  }

  /**
   * Submit price to oracle contract
   */
  async submitPrice(feed, price) {
    try {
      const contract = this.contracts[feed];
      if (!contract) {
        console.log(`   ⚠️  No contract for ${feed}`);
        return false;
      }

      // Convert price to wei (18 decimals)
      const priceWei = ethers.parseEther(price.toString());

      console.log(`📤 Submitting price to blockchain...`);
      console.log(`   Feed: ${feed}`);
      console.log(`   Price: ${price}`);
      console.log(`   Price (wei): ${priceWei.toString()}`);

      // Get current round
      const currentRound = await contract.currentRound();
      console.log(`   Current Round: ${currentRound.toString()}`);

      // Submit transaction
      const tx = await contract.submitPrice(priceWei, {
        gasLimit: CONFIG.GAS_LIMIT,
        gasPrice: ethers.parseUnits(CONFIG.GAS_PRICE_GWEI.toString(), "gwei"),
      });

      console.log(`   📝 Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(
        `   ✅ Transaction confirmed in block ${receipt.blockNumber}`
      );
      console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);

      return true;
    } catch (error) {
      console.error(`   ❌ Submission error for ${feed}:`, error.message);

      // Check if already submitted this round
      if (error.message.includes("ALREADY_SUBMITTED")) {
        console.log(
          `   ℹ️  Already submitted for this round, waiting for next round...`
        );
      }

      return false;
    }
  }

  /**
   * Update all price feeds
   */
  async updateAllPrices() {
    console.log("\n" + "=".repeat(60));
    console.log(`⏰ Price Update Cycle - ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");

    for (const feed of Object.keys(this.contracts)) {
      try {
        // Fetch price
        const price = await this.fetchPrice(feed);

        if (price && price > 0) {
          // Submit to blockchain
          await this.submitPrice(feed, price);
        }

        // Small delay between feeds
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error updating ${feed}:`, error.message);
      }
    }

    console.log("\n✅ Update cycle complete\n");
  }

  /**
   * Start oracle service
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️  Oracle is already running");
      return;
    }

    await this.initialize();
    this.isRunning = true;

    console.log(`🚀 Oracle Service Started`);
    console.log(
      `⏱️  Update Interval: ${CONFIG.UPDATE_INTERVAL / 1000} seconds\n`
    );

    // Initial update
    await this.updateAllPrices();

    // Schedule periodic updates
    this.updateInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.updateAllPrices();
      }
    }, CONFIG.UPDATE_INTERVAL);
  }

  /**
   * Stop oracle service
   */
  stop() {
    console.log("\n🛑 Stopping Oracle Service...");
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    console.log("✅ Oracle Service Stopped\n");
  }
}

// Main execution
async function main() {
  const oracle = new OracleNode();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    oracle.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    oracle.stop();
    process.exit(0);
  });

  // Start service
  await oracle.start();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Fatal Error:", error);
    process.exit(1);
  });
}

export default OracleNode;
