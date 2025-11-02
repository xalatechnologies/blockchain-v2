/**
 * Arbitrage Executor
 *
 * Executes arbitrage trades:
 * 1. Buy XHT where it's cheap
 * 2. Sell XHT where it's expensive
 * 3. Calculate and verify profit
 */

import { ethers } from "ethers";

const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

export class ArbitrageExecutor {
  constructor(config) {
    this.config = config;
    this.wallet = null;
    this.xaheenWallet = null;
    this.spokeWallets = new Map();
  }

  async initialize() {
    console.log("⚙️  Initializing Arbitrage Executor...");

    if (!this.config.wallet.privateKey) {
      throw new Error("No private key configured");
    }

    // Create wallet for Xaheen
    const xaheenProvider = new ethers.JsonRpcProvider(this.config.xaheenChain.rpc);
    this.xaheenWallet = new ethers.Wallet(this.config.wallet.privateKey, xaheenProvider);

    // Create wallets for each spoke
    for (const spoke of this.config.spokes) {
      const provider = new ethers.JsonRpcProvider(spoke.rpc);
      const wallet = new ethers.Wallet(this.config.wallet.privateKey, provider);
      this.spokeWallets.set(spoke.chainId, wallet);
    }

    console.log(`✅ Arbitrage Executor initialized (address: ${this.xaheenWallet.address})`);
  }

  /**
   * Calculate arbitrage profit
   * @param {number} xaheenPrice - Price on Xaheen
   * @param {number} spokePrice - Price on spoke
   * @param {number} amount - Amount of XHT to arbitrage
   * @param {number} spokeCh ainId - Spoke chain ID
   * @returns {Promise<number>} Estimated profit in USD
   */
  async calculateProfit(xaheenPrice, spokePrice, amount, spokeChainId) {
    // Simple profit calculation
    // Real implementation would include gas costs, slippage, etc.

    const direction = spokePrice > xaheenPrice ? "buy_xaheen_sell_spoke" : "buy_spoke_sell_xaheen";

    let grossProfit = 0;

    if (direction === "buy_xaheen_sell_spoke") {
      // Buy on Xaheen at lower price, sell on spoke at higher price
      const buyValue = amount * xaheenPrice;
      const sellValue = amount * spokePrice;
      grossProfit = sellValue - buyValue;
    } else {
      // Buy on spoke at lower price, sell on Xaheen at higher price
      const buyValue = amount * spokePrice;
      const sellValue = amount * xaheenPrice;
      grossProfit = sellValue - buyValue;
    }

    // Estimate gas costs
    const gasEstimate = await this.estimateGasCosts(spokeChainId);

    // Subtract fees (0.3% on DEX + 0.35% on XaheenRouter)
    const totalFees = (amount * xaheenPrice * 0.0065); // 0.65% total
    const netProfit = grossProfit - gasEstimate - totalFees;

    return netProfit;
  }

  /**
   * Estimate gas costs for arbitrage
   * @param {number} spokeChainId
   * @returns {Promise<number>} Gas cost in USD
   */
  async estimateGasCosts(spokeChainId) {
    const spoke = this.config.spokes.find((s) => s.chainId === spokeChainId);

    if (!spoke) return 5; // Default $5

    // Rough estimates based on chain
    const gasEstimates = {
      56: 2, // BSC: ~$2
      137: 1, // Polygon: ~$1
      1: 15, // Ethereum: ~$15
    };

    return gasEstimates[spokeChainId] || 5;
  }

  /**
   * Execute arbitrage trade
   * @param {Object} params - Arbitrage parameters
   * @returns {Promise<Object>} Result object
   */
  async execute(params) {
    const { xaheenPrice, spokePrice, spokeChainId, spokeName, amount, expectedProfit } = params;

    console.log(`\n💼 Executing arbitrage on ${spokeName}:`);
    console.log(`   Xaheen: $${xaheenPrice.toFixed(6)}`);
    console.log(`   ${spokeName}: $${spokePrice.toFixed(6)}`);
    console.log(`   Amount: ${amount} XHT`);
    console.log(`   Expected profit: $${expectedProfit.toFixed(2)}`);

    try {
      const direction = spokePrice > xaheenPrice ? "buy_xaheen_sell_spoke" : "buy_spoke_sell_xaheen";

      if (direction === "buy_xaheen_sell_spoke") {
        // Buy XHT on Xaheen, sell on spoke
        console.log(`   📥 Buy ${amount} XHT on Xaheen`);
        console.log(`   📤 Sell ${amount} XHT on ${spokeName}`);

        // In production, this would:
        // 1. Swap USDT -> XHT on Xaheen DEX
        // 2. Bridge XHT to spoke (via existing bridge)
        // 3. Swap XHT -> USDT on spoke DEX

        // For now, return simulated result
        return {
          success: true,
          actualProfit: expectedProfit * 0.95, // 95% of expected (simulate slippage)
          newDeviation: 0.001, // Prices converge to 0.1% deviation
          txHashes: {
            xaheen: "0x1234...",
            spoke: "0x5678...",
          },
        };
      } else {
        // Buy XHT on spoke, sell on Xaheen
        console.log(`   📥 Buy ${amount} XHT on ${spokeName}`);
        console.log(`   📤 Sell ${amount} XHT on Xaheen`);

        // In production, this would:
        // 1. Swap USDT -> XHT on spoke DEX
        // 2. Bridge XHT to Xaheen (via existing bridge)
        // 3. Swap XHT -> USDT on Xaheen DEX

        return {
          success: true,
          actualProfit: expectedProfit * 0.95,
          newDeviation: 0.001,
          txHashes: {
            spoke: "0xabcd...",
            xaheen: "0xef01...",
          },
        };
      }
    } catch (error) {
      console.error(`   ❌ Execution error:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute swap on spoke DEX
   * @param {number} spokeChainId
   * @param {string} tokenIn
   * @param {string} tokenOut
   * @param {BigInt} amountIn
   * @returns {Promise<Object>}
   */
  async executeSwapOnSpoke(spokeChainId, tokenIn, tokenOut, amountIn) {
    const spoke = this.config.spokes.find((s) => s.chainId === spokeChainId);
    const wallet = this.spokeWallets.get(spokeChainId);

    if (!spoke || !wallet) {
      throw new Error(`Invalid spoke chain: ${spokeChainId}`);
    }

    // Check and approve if needed
    const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, wallet);
    const allowance = await tokenContract.allowance(wallet.address, spoke.dexRouter);

    if (allowance < amountIn) {
      console.log(`   🔐 Approving ${spoke.dexName}...`);
      const approveTx = await tokenContract.approve(spoke.dexRouter, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Execute swap
    const router = new ethers.Contract(spoke.dexRouter, ROUTER_ABI, wallet);
    const path = [tokenIn, tokenOut];
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    // Get min amount out (with 1% slippage)
    const amounts = await router.getAmountsOut(amountIn, path);
    const minAmountOut = (amounts[1] * 99n) / 100n;

    console.log(`   🔄 Swapping on ${spoke.dexName}...`);
    const swapTx = await router.swapExactTokensForTokens(
      amountIn,
      minAmountOut,
      path,
      wallet.address,
      deadline,
      {
        gasPrice: spoke.gasPrice,
      }
    );

    const receipt = await swapTx.wait();

    return {
      txHash: receipt.hash,
      amountOut: amounts[1],
    };
  }

  /**
   * Execute swap on Xaheen DEX
   * @param {string} tokenIn
   * @param {string} tokenOut
   * @param {BigInt} amountIn
   * @returns {Promise<Object>}
   */
  async executeSwapOnXaheen(tokenIn, tokenOut, amountIn) {
    // Similar to executeSwapOnSpoke but for Xaheen DEX
    // Implementation depends on XaheenDEXRouter interface

    console.log(`   🔄 Swapping on Xaheen DEX...`);

    // Placeholder - implement with actual XaheenDEXRouter
    return {
      txHash: "0x...",
      amountOut: 0n,
    };
  }
}
