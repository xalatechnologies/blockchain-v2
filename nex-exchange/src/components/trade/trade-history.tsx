"use client";

import { useQuery } from "@tanstack/react-query";
import { formatAddress } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Trade {
  id: string;
  timestamp: number;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  trader: string;
}

export function TradeHistory() {
  const { data: trades } = useQuery({
    queryKey: ["tradeHistory"],
    queryFn: async () => {
      // TODO: Fetch from API
      return [
        {
          id: "1",
          timestamp: Date.now() - 60000,
          type: "buy" as const,
          price: 0.0061,
          amount: 1000,
          total: 6.1,
          trader: "0x1234...5678",
        },
        {
          id: "2",
          timestamp: Date.now() - 120000,
          type: "sell" as const,
          price: 0.0060,
          amount: 500,
          total: 3.0,
          trader: "0xabcd...efgh",
        },
      ] as Trade[];
    },
    refetchInterval: 5000,
  });

  if (!trades) {
    return <div className="text-center py-8 text-foreground/70">Loading trade history...</div>;
  }

  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-4">Recent Trades</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-2 text-xs text-foreground/70 mb-2 pb-2 border-b border-border">
          <div>Time</div>
          <div>Type</div>
          <div>Price</div>
          <div>Amount</div>
          <div>Total</div>
        </div>
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="grid grid-cols-5 gap-2 text-sm hover:bg-background/50 rounded p-2"
          >
            <div className="text-foreground/70">
              {new Date(trade.timestamp).toLocaleTimeString()}
            </div>
            <div className={`flex items-center space-x-1 ${
              trade.type === "buy" ? "text-success" : "text-error"
            }`}>
              {trade.type === "buy" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span className="uppercase">{trade.type}</span>
            </div>
            <div className="font-mono">{trade.price.toFixed(6)}</div>
            <div className="font-mono">{trade.amount.toLocaleString()}</div>
            <div className="font-mono">{trade.total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

