"use client";

import { useQuery } from "@tanstack/react-query";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export function OrderBook() {
  const { data: orderBook } = useQuery({
    queryKey: ["orderBook"],
    queryFn: async () => {
      // TODO: Fetch from API
      return {
        bids: [
          { price: 0.0061, amount: 10000, total: 61 },
          { price: 0.0060, amount: 5000, total: 30 },
          { price: 0.0059, amount: 8000, total: 47.2 },
        ] as OrderBookEntry[],
        asks: [
          { price: 0.0062, amount: 12000, total: 74.4 },
          { price: 0.0063, amount: 6000, total: 37.8 },
          { price: 0.0064, amount: 9000, total: 57.6 },
        ] as OrderBookEntry[],
      };
    },
    refetchInterval: 2000, // Update every 2 seconds
  });

  if (!orderBook) {
    return <div className="text-center py-8 text-foreground/70">Loading order book...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Bids */}
      <div className="bg-background border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-success mb-3">Bids (Buy Orders)</h3>
        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-2 text-xs text-foreground/70 mb-2 pb-2 border-b border-border">
            <div>Price</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Total</div>
          </div>
          {orderBook.bids.map((bid, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-2 text-sm hover:bg-background/50 rounded p-1"
            >
              <div className="text-success font-mono">{bid.price.toFixed(6)}</div>
              <div className="text-right font-mono">{bid.amount.toLocaleString()}</div>
              <div className="text-right font-mono">{bid.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Asks */}
      <div className="bg-background border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-error mb-3">Asks (Sell Orders)</h3>
        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-2 text-xs text-foreground/70 mb-2 pb-2 border-b border-border">
            <div>Price</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Total</div>
          </div>
          {orderBook.asks.map((ask, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-2 text-sm hover:bg-background/50 rounded p-1"
            >
              <div className="text-error font-mono">{ask.price.toFixed(6)}</div>
              <div className="text-right font-mono">{ask.amount.toLocaleString()}</div>
              <div className="text-right font-mono">{ask.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

