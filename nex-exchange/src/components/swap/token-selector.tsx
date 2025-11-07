"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import type { Token } from "@/types/token";
import { formatAmount } from "@/lib/utils";
import { isShariaCompliant } from "@/lib/sharia-compliance";
import { useShariaFilter } from "@/hooks/use-sharia-filter";
import { getAllTokens } from "@/config/tokens";

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelect: (token: Token | null) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  balance?: string | null;
  readOnly?: boolean;
}

export function TokenSelector({
  selectedToken,
  onSelect,
  amount,
  onAmountChange,
  balance,
  readOnly = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { halalOnly } = useShariaFilter();

  // Get tokens from registry
  const allTokens = getAllTokens();

  // Filter tokens based on Sharia compliance
  const tokens = halalOnly
    ? allTokens.filter((token) => isShariaCompliant(token).isHalal)
    : allTokens;

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <div className="flex items-center justify-between mb-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d*\.?\d*$/.test(value) || value === "") {
              onAmountChange(value);
            }
          }}
          placeholder="0.0"
          readOnly={readOnly}
          className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-foreground/30"
        />
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2"
          >
            {selectedToken ? (
              <>
                <span className="font-medium">{selectedToken.symbol}</span>
                {isShariaCompliant(selectedToken).isHalal && (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                )}
                <ChevronDown className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Select token</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-10">
              <div className="p-2 max-h-64 overflow-y-auto">
                {tokens.length === 0 ? (
                  <div className="p-3 text-sm text-foreground/70 text-center">
                    No halal tokens available
                  </div>
                ) : (
                  tokens.map((token) => {
                    const compliance = isShariaCompliant(token);
                    return (
                      <button
                        key={token.address}
                        onClick={() => {
                          onSelect(token);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/10 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{token.symbol}</span>
                            {compliance.isHalal && (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            )}
                          </div>
                          <div className="text-sm text-foreground/70">{token.name}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {balance !== null && balance !== undefined && (
        <div className="text-sm text-foreground/70">
          Balance: {formatAmount(balance, selectedToken?.decimals || 18)}
        </div>
      )}
    </div>
  );
}
