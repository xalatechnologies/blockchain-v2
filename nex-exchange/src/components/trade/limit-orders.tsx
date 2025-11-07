"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

interface LimitOrder {
  id: string;
  type: "buy" | "sell";
  tokenIn: string;
  tokenOut: string;
  amount: number;
  priceLimit: number;
  filled: boolean;
  expiry: number;
}

export function LimitOrders() {
  const { address } = useAccount();
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["limitOrders", address],
    queryFn: async () => {
      if (!address) return [];
      // TODO: Fetch from API
      return [] as LimitOrder[];
    },
    enabled: !!address,
  });

  if (!address) {
    return (
      <div className="text-center py-8 text-foreground/70">
        Connect your wallet to view limit orders
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Limit Orders</h3>
        <Button onClick={() => setShowPlaceOrder(!showPlaceOrder)}>
          {showPlaceOrder ? "Cancel" : "Place Order"}
        </Button>
      </div>

      {showPlaceOrder && (
        <div className="bg-background border border-border rounded-lg p-6 space-y-4">
          <h4 className="font-semibold">Place Limit Order</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <select className="w-full h-10 rounded-md border border-border bg-background px-3">
                <option>Buy</option>
                <option>Sell</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Price Limit</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <Input type="datetime-local" />
            </div>
          </div>
          <Button className="w-full">Place Order</Button>
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="text-center py-8 text-foreground/70">
          No limit orders yet
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border"
              >
                <div>
                  <div className="font-semibold">
                    {order.type.toUpperCase()} {order.amount} @ {order.priceLimit}
                  </div>
                  <div className="text-sm text-foreground/70">
                    Expires: {new Date(order.expiry).toLocaleString()}
                  </div>
                </div>
                <div>
                  {order.filled ? (
                    <span className="text-success text-sm">Filled</span>
                  ) : (
                    <Button variant="outline" size="sm">Cancel</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

