import { ethers } from "ethers";
import type { Token } from "@/types/token";

interface GasEstimate {
  nativeGas: bigint; // Gas in native token (BNB, ETH, etc.)
  nativeGasPrice: bigint; // Gas price in gwei
  norEquivalent: bigint; // Equivalent NOR amount
  norPrice: number; // NOR price in USD
  nativePrice: number; // Native token price in USD
  savings: number; // Percentage savings using NOR
}

/**
 * Estimate gas cost and convert to NOR equivalent
 */
export async function estimateGasInNOR(
  chainId: number,
  gasLimit: bigint,
  norPriceUSD: number
): Promise<GasEstimate> {
  // Get native token price and gas price
  const { nativePrice, gasPrice } = await getNativeGasInfo(chainId);

  // Calculate native gas cost
  const nativeGas = (gasLimit * gasPrice) / 1_000_000_000n; // Convert from gwei

  // Convert to USD
  const nativeGasUSD = Number(nativeGas) * nativePrice;

  // Convert to NOR equivalent
  const norEquivalent = BigInt(Math.floor((nativeGasUSD / norPriceUSD) * 1e18));

  // Calculate savings (NOR gas is typically cheaper)
  const savings = ((nativePrice - norPriceUSD) / nativePrice) * 100;

  return {
    nativeGas,
    nativeGasPrice: gasPrice,
    norEquivalent,
    norPrice: norPriceUSD,
    nativePrice,
    savings: Math.max(0, savings),
  };
}

/**
 * Get native token gas information
 */
async function getNativeGasInfo(chainId: number): Promise<{
  nativePrice: number;
  gasPrice: bigint;
}> {
  // In production, fetch from price oracle
  const prices: Record<number, number> = {
    1: 3000, // ETH price
    56: 600, // BNB price
    137: 0.8, // MATIC price
    65001: 0.006, // NOR price (on NorChain)
  };

  const gasPrices: Record<number, bigint> = {
    1: 30_000_000_000n, // 30 gwei
    56: 3_000_000_000n, // 3 gwei
    137: 50_000_000_000n, // 50 gwei
    65001: 1_000_000_000n, // 1 gwei
  };

  return {
    nativePrice: prices[chainId] || 1,
    gasPrice: gasPrices[chainId] || 1_000_000_000n,
  };
}

/**
 * Calculate optimal gas payment method
 */
export async function calculateOptimalGasPayment(
  chainId: number,
  gasLimit: bigint,
  norBalance: bigint,
  norPriceUSD: number
): Promise<{
  shouldUseNOR: boolean;
  reason: string;
  savings: number;
  norRequired: bigint;
}> {
  const estimate = await estimateGasInNOR(chainId, gasLimit, norPriceUSD);

  // Check if user has enough NOR
  const hasEnoughNOR = norBalance >= estimate.norEquivalent;

  // Determine if NOR payment is beneficial
  const shouldUseNOR = hasEnoughNOR && estimate.savings > 5; // At least 5% savings

  return {
    shouldUseNOR,
    reason: shouldUseNOR
      ? `Save ${estimate.savings.toFixed(1)}% by paying in NOR`
      : hasEnoughNOR
      ? "Native token payment is cheaper"
      : "Insufficient NOR balance",
    savings: estimate.savings,
    norRequired: estimate.norEquivalent,
  };
}

/**
 * Format gas estimate for display
 */
export function formatGasEstimate(estimate: GasEstimate): {
  native: string;
  nor: string;
  savings: string;
} {
  return {
    native: `${ethers.formatEther(estimate.nativeGas)} ${getNativeSymbol(estimate.nativePrice)}`,
    nor: `${ethers.formatEther(estimate.norEquivalent)} NOR`,
    savings: `${estimate.savings.toFixed(1)}%`,
  };
}

function getNativeSymbol(price: number): string {
  if (price > 2000) return "ETH";
  if (price > 500) return "BNB";
  if (price < 1) return "MATIC";
  return "NOR";
}

