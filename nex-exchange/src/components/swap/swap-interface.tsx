"use client";

import { useState } from "react";
import { TokenSelector } from "./token-selector";
import { SwapButton } from "./swap-button";
import { PriceInfo } from "./price-info";
import { HalalFilter } from "@/components/sharia/halal-filter";
import { ComplianceBadge } from "@/components/sharia/compliance-badge";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import { useShariaFilter } from "@/hooks/use-sharia-filter";
import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Token } from "@/types/token";

export function SwapInterface() {
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState<string>("");
  const [payGasInNOR, setPayGasInNOR] = useState<boolean>(false);
  
  const { halalOnly, setHalalOnly } = useShariaFilter();

  const { quote, isLoading, error } = useSwapQuote({
    tokenIn,
    tokenOut,
    amountIn,
  });

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn("");
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
      {/* Sharia Compliance Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <ComplianceBadge />
        <HalalFilter enabled={halalOnly} onToggle={setHalalOnly} />
      </div>

      <div className="space-y-4">
        {/* Token In */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/70">From</label>
          <TokenSelector
            selectedToken={tokenIn}
            onSelect={setTokenIn}
            amount={amountIn}
            onAmountChange={setAmountIn}
            balance={null} // TODO: Fetch balance
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/70">To</label>
          <TokenSelector
            selectedToken={tokenOut}
            onSelect={setTokenOut}
            amount={quote?.amountOut || ""}
            onAmountChange={() => {}} // Read-only
            balance={null} // TODO: Fetch balance
            readOnly
          />
        </div>

        {/* Price Info */}
        {quote && (
          <PriceInfo
            quote={quote}
            payGasInNOR={payGasInNOR}
            onPayGasInNORChange={setPayGasInNOR}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-md text-sm text-error">
            {error}
          </div>
        )}

        {/* Swap Button */}
        <SwapButton
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountIn={amountIn}
          amountOutMin={quote?.amountOutMin || "0"}
          payGasInNOR={payGasInNOR}
          disabled={!tokenIn || !tokenOut || !amountIn || isLoading || !!error}
        />
      </div>
    </div>
  );
}
