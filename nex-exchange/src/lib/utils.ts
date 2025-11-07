import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Ethereum address to shortened version
 */
export function formatAddress(address: string | null | undefined): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format amount with appropriate decimals and units
 */
export function formatAmount(
  amount: string | number | bigint | null | undefined,
  decimals: number = 18
): string {
  if (!amount && amount !== 0) return "0";
  
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  
  if (isNaN(num) || num === 0) return "0";
  
  // Very small amounts
  if (num < 0.000001) {
    return "<0.000001";
  }
  
  // Small amounts - show 6 decimals
  if (num < 1) {
    return num.toFixed(6);
  }
  
  // Medium amounts - show 2 decimals
  if (num < 1000) {
    return num.toFixed(2);
  }
  
  // Large amounts - use K, M, B notation
  if (num < 1_000_000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  
  if (num < 1_000_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  
  return `${(num / 1_000_000_000).toFixed(2)}B`;
}

/**
 * Parse amount string to BigInt
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  if (!amount || amount === "") return 0n;
  
  const num = parseFloat(amount);
  if (isNaN(num)) return 0n;
  
  const multiplier = BigInt(10 ** decimals);
  return BigInt(Math.floor(num * Number(multiplier)));
}
