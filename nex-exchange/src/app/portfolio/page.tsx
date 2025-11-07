"use client";

import { useAccount, useBalance } from "wagmi";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { formatAmount, formatAddress } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Fetch portfolio data
  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: async () => {
      if (!address) return null;
      
      // TODO: Fetch from API
      return {
        totalValue: 125450,
        change24h: 12.5,
        assets: [
          { symbol: "NOR", amount: "45000", value: 45000, change24h: 15.2 },
          { symbol: "BTCBR", amount: "60000", value: 60000, change24h: 2.5 },
          { symbol: "DRHT", amount: "20450", value: 20450, change24h: 0.1 },
        ],
      };
    },
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Wallet className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-foreground/70">
              Connect your wallet to view your portfolio
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
            <p className="text-foreground/70">{formatAddress(address!)}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="text-sm text-foreground/70 mb-1">Total Value</div>
              <div className="text-3xl font-bold">
                {portfolio?.totalValue.toLocaleString("no-NO", {
                  style: "currency",
                  currency: "NOK",
                })}
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="text-sm text-foreground/70 mb-1">24h Change</div>
              <div className={`text-3xl font-bold flex items-center space-x-2 ${
                (portfolio?.change24h || 0) >= 0 ? "text-success" : "text-error"
              }`}>
                {(portfolio?.change24h || 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
                <span>{(portfolio?.change24h || 0).toFixed(2)}%</span>
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="text-sm text-foreground/70 mb-1">Native Balance</div>
              <div className="text-3xl font-bold">
                {balance ? formatAmount(balance.formatted) : "0"} NOR
              </div>
            </div>
          </div>

          {/* Assets List */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Assets</h2>
            <div className="space-y-4">
              {portfolio?.assets.map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border"
                >
                  <div>
                    <div className="font-semibold">{asset.symbol}</div>
                    <div className="text-sm text-foreground/70">
                      {formatAmount(asset.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {asset.value.toLocaleString("no-NO", {
                        style: "currency",
                        currency: "NOK",
                      })}
                    </div>
                    <div
                      className={`text-sm ${
                        asset.change24h >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {asset.change24h >= 0 ? "+" : ""}
                      {asset.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

