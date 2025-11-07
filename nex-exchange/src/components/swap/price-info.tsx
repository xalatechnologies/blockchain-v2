"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";
import { calculateOptimalGasPayment, formatGasEstimate } from "@/lib/nor-gas-optimizer";
import type { SwapQuote } from "@/types/token";
import { formatAmount } from "@/lib/utils";
import { Info } from "lucide-react";

interface PriceInfoProps {
  quote: SwapQuote;
  payGasInNOR: boolean;
  onPayGasInNORChange: (value: boolean) => void;
}

export function PriceInfo({ quote, payGasInNOR, onPayGasInNORChange }: PriceInfoProps) {
  const { address } = useAccount();
  const [gasOptimization, setGasOptimization] = useState<{
    shouldUseNOR: boolean;
    reason: string;
    savings: number;
  } | null>(null);

  useEffect(() => {
    // Calculate gas optimization
    const calculateOptimization = async () => {
      if (!address || !quote.gasEstimate) return;

      try {
        // TODO: Get actual NOR balance and chain ID
        const optimization = await calculateOptimalGasPayment(
          65001, // Chain ID
          BigInt(Math.floor(parseFloat(quote.gasEstimate) * 1e18)),
          0n, // NOR balance - would fetch from contract
          0.006 // NOR price USD
        );

        setGasOptimization(optimization);
        
        // Auto-enable if beneficial
        if (optimization.shouldUseNOR && !payGasInNOR) {
          onPayGasInNORChange(true);
        }
      } catch (error) {
        console.error("Gas optimization error:", error);
      }
    };

    calculateOptimization();
  }, [address, quote.gasEstimate, payGasInNOR, onPayGasInNORChange]);

  return (
    <div className="space-y-3 p-4 bg-background/50 rounded-lg border border-border">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/70">Price Impact</span>
        <span className={quote.priceImpact > 1 ? "text-warning" : "text-success"}>
          {quote.priceImpact.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/70">Min. Received</span>
        <span className="font-mono">{formatAmount(quote.amountOutMin)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/70">Gas Estimate</span>
        <span className="font-mono">{formatAmount(quote.gasEstimate)}</span>
      </div>
      
      {/* Gas Optimization Info */}
      {gasOptimization && gasOptimization.savings > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center space-x-2 text-xs text-foreground/60">
            <Info className="h-3 w-3" />
            <span>{gasOptimization.reason}</span>
          </div>
        </div>
      )}

      {/* Pay Gas in NOR Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex flex-col">
          <Label htmlFor="pay-gas-nor" className="text-sm cursor-pointer">
            Pay Gas in NOR
          </Label>
          {gasOptimization && gasOptimization.savings > 0 && (
            <span className="text-xs text-success mt-0.5">
              Save {gasOptimization.savings.toFixed(1)}%
            </span>
          )}
        </div>
        <Switch
          id="pay-gas-nor"
          checked={payGasInNOR}
          onCheckedChange={onPayGasInNORChange}
        />
      </div>
    </div>
  );
}
