import { ethers } from "ethers";
import { getCache, setCache } from "./cache";
import type { Token, SwapQuote } from "@/types/token";

interface PriceSource {
  name: string;
  chainId: number;
  router: string;
  factory?: string;
  rpcUrl: string;
}

interface Route {
  source: PriceSource;
  path: string[];
  amountOut: bigint;
  gasEstimate: bigint;
  priceImpact: number;
}

const CACHE_TTL = 5; // 5 seconds cache for price aggregation

// Configured price sources
const PRICE_SOURCES: PriceSource[] = [
  {
    name: "NorSwap",
    chainId: 65001,
    router: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
    factory: "0x5DAB997112119BeCf715607CaA0A94f020AE2Da3",
    rpcUrl: process.env.NEXT_PUBLIC_NORCHAIN_RPC || "https://rpc.norchain.org",
  },
  {
    name: "PancakeSwap",
    chainId: 56,
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    rpcUrl: "https://bsc-dataseed1.binance.org",
  },
  {
    name: "Uniswap V2",
    chainId: 1,
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    rpcUrl: "https://eth.llamarpc.com",
  },
  {
    name: "QuickSwap",
    chainId: 137,
    router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
    rpcUrl: "https://polygon-rpc.com",
  },
];

// Uniswap V2 Router ABI (simplified)
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)",
];

/**
 * Get quote from a single DEX
 */
async function getQuoteFromDEX(
  source: PriceSource,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<Route | null> {
  try {
    const provider = new ethers.JsonRpcProvider(source.rpcUrl);
    const router = new ethers.Contract(source.router, ROUTER_ABI, provider);

    const path = [tokenIn, tokenOut];
    const amounts = await router.getAmountsOut(amountIn, path);

    if (!amounts || amounts.length < 2) {
      return null;
    }

    const amountOut = amounts[1];
    
    // Estimate gas (simplified - would need actual estimation)
    const gasEstimate = 150000n; // Base estimate
    
    // Calculate price impact (simplified)
    const priceImpact = 0.5; // Would need reserves to calculate accurately

    return {
      source,
      path,
      amountOut,
      gasEstimate,
      priceImpact,
    };
  } catch (error) {
    console.error(`Error getting quote from ${source.name}:`, error);
    return null;
  }
}

/**
 * Aggregate prices from all DEXs and find best route
 */
export async function aggregatePrices(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string
): Promise<SwapQuote | null> {
  // Create cache key
  const cacheKey = `aggregate:${tokenIn.address}:${tokenOut.address}:${amountIn}`;
  
  // Try cache first
  const cached = await getCache<SwapQuote>(cacheKey);
  if (cached) {
    return cached;
  }

  const amountInBigInt = ethers.parseUnits(amountIn, tokenIn.decimals);

  // Get quotes from all sources
  const quotes = await Promise.all(
    PRICE_SOURCES.map((source) =>
      getQuoteFromDEX(source, tokenIn.address, tokenOut.address, amountInBigInt)
    )
  );

  // Filter out null results
  const validQuotes = quotes.filter((q): q is Route => q !== null);

  if (validQuotes.length === 0) {
    return null;
  }

  // Find best quote (highest amountOut, considering gas costs)
  // For cross-chain, we'd need to factor in bridge costs
  const bestRoute = validQuotes.reduce((best, current) => {
    // Simple comparison - in production, factor in gas costs and bridge fees
    if (current.amountOut > best.amountOut) {
      return current;
    }
    return best;
  });

  // Convert to SwapQuote format
  const amountOut = ethers.formatUnits(bestRoute.amountOut, tokenOut.decimals);
  const slippageTolerance = 0.02; // 2% slippage tolerance
  const amountOutMin = ethers.formatUnits(
    (bestRoute.amountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000))) / 10000n,
    tokenOut.decimals
  );

  const quote: SwapQuote = {
    amountOut,
    amountOutMin,
    priceImpact: bestRoute.priceImpact,
    gasEstimate: ethers.formatEther(bestRoute.gasEstimate),
    route: [tokenIn, tokenOut], // Simplified - would include full path
  };

  // Cache the result
  await setCache(cacheKey, quote, CACHE_TTL);

  return quote;
}

/**
 * Get best route across all chains
 */
export async function getBestRoute(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string
): Promise<{
  route: Route | null;
  allRoutes: Route[];
}> {
  const amountInBigInt = ethers.parseUnits(amountIn, tokenIn.decimals);

  const quotes = await Promise.all(
    PRICE_SOURCES.map((source) =>
      getQuoteFromDEX(source, tokenIn.address, tokenOut.address, amountInBigInt)
    )
  );

  const validQuotes = quotes.filter((q): q is Route => q !== null);

  if (validQuotes.length === 0) {
    return { route: null, allRoutes: [] };
  }

  // Find best route considering:
  // 1. Amount out
  // 2. Gas costs
  // 3. Bridge fees (if cross-chain)
  const bestRoute = validQuotes.reduce((best, current) => {
    // Simplified: prefer same-chain swaps, then compare amounts
    if (current.source.chainId === tokenIn.chainId && best.source.chainId !== tokenIn.chainId) {
      return current;
    }
    if (best.source.chainId === tokenIn.chainId && current.source.chainId !== tokenIn.chainId) {
      return best;
    }
    // Same chain or both cross-chain - compare amounts
    return current.amountOut > best.amountOut ? current : best;
  });

  return {
    route: bestRoute,
    allRoutes: validQuotes,
  };
}
