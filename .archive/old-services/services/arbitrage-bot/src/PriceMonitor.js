/**
 * Price Monitor
 *
 * Monitors prices from:
 * 1. Xaheen DEX (canonical TWAP)
 * 2. Spoke DEXs (PancakeSwap, QuickSwap, Uniswap)
 */

import { ethers } from "ethers";

// ABI for reading prices
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function price0CumulativeLast() external view returns (uint256)",
  "function price1CumulativeLast() external view returns (uint256)",
];

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

const PRICE_AUTHORITY_ABI = [
  "function currentQuote() external view returns (uint256 price, uint256 timestamp)",
];

export class PriceMonitor {
  constructor(config) {
    this.config = config;
    this.xaheenProvider = null;
    this.spokeProviders = new Map();
    this.priceAuthority = null;
    this.spokeDexRouters = new Map();
  }

  async initialize() {
    console.log("📊 Initializing Price Monitor...");

    // Connect to Xaheen
    this.xaheenProvider = new ethers.JsonRpcProvider(this.config.xaheenChain.rpc);
    this.priceAuthority = new ethers.Contract(
      this.config.xaheenChain.priceAuthorityAddress,
      PRICE_AUTHORITY_ABI,
      this.xaheenProvider
    );

    // Connect to spokes
    for (const spoke of this.config.spokes) {
      const provider = new ethers.JsonRpcProvider(spoke.rpc);
      this.spokeProviders.set(spoke.chainId, provider);

      const dexRouter = new ethers.Contract(spoke.dexRouter, ROUTER_ABI, provider);
      this.spokeDexRouters.set(spoke.chainId, dexRouter);
    }

    console.log("✅ Price Monitor initialized");
  }

  /**
   * Get canonical price from Xaheen PriceAuthority
   * @returns {Promise<number>} Price in USD
   */
  async getXaheenPrice() {
    try {
      const [priceWei, timestamp] = await this.priceAuthority.currentQuote();

      // Convert from 18 decimals to USD
      const priceUSD = Number(ethers.formatEther(priceWei));

      return priceUSD;
    } catch (error) {
      console.error("Error getting Xaheen price:", error.message);
      throw error;
    }
  }

  /**
   * Get price from spoke DEX (PancakeSwap, QuickSwap, Uniswap)
   * @param {number} chainId - Spoke chain ID
   * @returns {Promise<number|null>} Price in USD or null if no liquidity
   */
  async getSpokePrice(chainId) {
    try {
      const spoke = this.config.spokes.find((s) => s.chainId === chainId);
      if (!spoke) {
        throw new Error(`Unknown chain ID: ${chainId}`);
      }

      const router = this.spokeDexRouters.get(chainId);

      // Get price by querying DEX router for 1 XHT -> USDT
      const amountIn = ethers.parseEther("1"); // 1 XHT
      const path = [spoke.xhtAddress, spoke.usdtAddress];

      try {
        const amounts = await router.getAmountsOut(amountIn, path);
        const usdtOut = amounts[1];

        // USDT has 6 decimals on BSC/Polygon, 6 on Ethereum
        const decimals = chainId === 1 ? 6 : chainId === 137 ? 6 : 18;
        const priceUSD = Number(ethers.formatUnits(usdtOut, decimals));

        return priceUSD;
      } catch (error) {
        // No liquidity or pair doesn't exist
        if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error getting ${chainId} price:`, error.message);
      return null;
    }
  }

  /**
   * Get prices from all spokes
   * @returns {Promise<Map<number, number>>} Map of chainId -> price
   */
  async getAllSpokePrices() {
    const prices = new Map();

    await Promise.all(
      this.config.spokes.map(async (spoke) => {
        const price = await this.getSpokePrice(spoke.chainId);
        if (price !== null) {
          prices.set(spoke.chainId, price);
        }
      })
    );

    return prices;
  }

  /**
   * Calculate price deviation
   * @param {number} xaheenPrice - Canonical price from Xaheen
   * @param {number} spokePrice - Price on spoke chain
   * @returns {number} Deviation as decimal (0.03 = 3%)
   */
  calculateDeviation(xaheenPrice, spokePrice) {
    return Math.abs(spokePrice - xaheenPrice) / xaheenPrice;
  }

  /**
   * Get arbitrage direction
   * @param {number} xaheenPrice
   * @param {number} spokePrice
   * @returns {"buy_xaheen_sell_spoke" | "buy_spoke_sell_xaheen"}
   */
  getArbitrageDirection(xaheenPrice, spokePrice) {
    if (spokePrice > xaheenPrice) {
      // Spoke is more expensive → buy on Xaheen, sell on spoke
      return "buy_xaheen_sell_spoke";
    } else {
      // Xaheen is more expensive → buy on spoke, sell on Xaheen
      return "buy_spoke_sell_xaheen";
    }
  }
}
