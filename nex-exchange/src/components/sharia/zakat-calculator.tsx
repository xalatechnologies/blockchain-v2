"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Info } from "lucide-react";
import { formatAmount } from "@/lib/utils";

const ZAKAT_RATE = 0.025; // 2.5% annual zakat

export function ZakatCalculator() {
  const [totalAssets, setTotalAssets] = useState<string>("");
  const [zakatAmount, setZakatAmount] = useState<string>("");

  const calculateZakat = () => {
    const assets = parseFloat(totalAssets);
    if (isNaN(assets) || assets <= 0) {
      setZakatAmount("");
      return;
    }

    // Zakat is 2.5% of total assets above nisab threshold
    // Nisab threshold is typically equivalent to 85g of gold
    // For simplicity, assuming assets are above nisab
    const zakat = assets * ZAKAT_RATE;
    setZakatAmount(zakat.toFixed(2));
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Calculator className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold">Zakat Calculator</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="total-assets">Total Assets (NOK)</Label>
        <Input
          id="total-assets"
          type="number"
          placeholder="Enter total assets"
          value={totalAssets}
          onChange={(e) => setTotalAssets(e.target.value)}
        />
      </div>

      <Button onClick={calculateZakat} className="w-full">
        Calculate Zakat
      </Button>

      {zakatAmount && (
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/70">Annual Zakat (2.5%)</span>
            <span className="text-lg font-semibold text-accent">
              {formatAmount(zakatAmount)} NOK
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start space-x-2 text-xs text-foreground/60">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Zakat is calculated at 2.5% of total assets above the nisab threshold 
          (equivalent to 85g of gold). This calculator provides an estimate. 
          Please consult with a qualified Islamic scholar for accurate calculation.
        </p>
      </div>
    </div>
  );
}

