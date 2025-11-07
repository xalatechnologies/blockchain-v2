import { aggregatePrices } from "./price-aggregator";
import { getToken } from "@/config/tokens";
import { getCache, setCache } from "./cache";
import type { SwapQuote } from "@/types/token";

interface GetSwapQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  chainId: number;
}

const CACHE_TTL = 10; // 10 seconds cache for quotes

export async function getSwapQuote({
  tokenIn,
  tokenOut,
  amountIn,
  chainId,
}: GetSwapQuoteParams): Promise<SwapQuote> {
  // Create cache key
  const cacheKey = `quote:${tokenIn}:${tokenOut}:${amountIn}:${chainId}`;
  
  // Try to get from cache
  const cached = await getCache<SwapQuote>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get token info from registry
  const tokenInObj = getToken(tokenIn);
  const tokenOutObj = getToken(tokenOut);

  if (!tokenInObj || !tokenOutObj) {
    throw new Error("Token not found in registry");
  }

  // Aggregate prices from all DEXs
  const quote = await aggregatePrices(tokenInObj, tokenOutObj, amountIn);

  if (!quote) {
    throw new Error("No liquidity found for this pair");
  }

  // Cache the result
  await setCache(cacheKey, quote, CACHE_TTL);

  return quote;
}
