"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface StopLossOrder {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  stopPrice: number;
  currentPrice: number;
  triggered: boolean;
}

export function StopLossOrders() {
  const { address } = useAccount();
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["stopLossOrders", address],
    queryFn: async () => {
      if (!address) return [];
      // TODO: Fetch from API
      return [] as StopLossOrder[];
    },
    enabled: !!address,
    refetchInterval: 5000, // Check every 5 seconds
  });

  if (!address) {
    return (
      <div className="text-center py-8 text-foreground/70">
        Connect your wallet to manage stop-loss orders
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stop-Loss Orders</h3>
          <p className="text-sm text-foreground/70">
            Automatically sell when price drops below your stop price
          </p>
        </div>
        <Button onClick={() => setShowPlaceOrder(!showPlaceOrder)}>
          {showPlaceOrder ? "Cancel" : "Place Stop-Loss"}
        </Button>
      </div>

      {showPlaceOrder && (
        <div className="bg-background border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="text-sm text-foreground/70">
              <strong>Warning:</strong> Stop-loss orders execute at market price when triggered. 
              The actual sale price may be lower than your stop price due to slippage.
            </div>
          </div>
          
          <h4 className="font-semibold">Place Stop-Loss Order</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token to Sell</Label>
              <select className="w-full h-10 rounded-md border border-border bg-background px-3">
                <option>NOR</option>
                <option>BTCBR</option>
                <option>DRHT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Stop Price</Label>
              <Input type="number" placeholder="0.00" />
              <p className="text-xs text-foreground/60">
                Order triggers when price drops below this level
              </p>
            </div>
            <div className="space-y-2">
              <Label>Current Price</Label>
              <Input type="number" placeholder="0.00" disabled />
            </div>
          </div>
          <Button className="w-full">Place Stop-Loss Order</Button>
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="text-center py-8 text-foreground/70">
          No stop-loss orders active
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  order.triggered
                    ? "bg-error/10 border-error/20"
                    : order.currentPrice <= order.stopPrice
                    ? "bg-warning/10 border-warning/20"
                    : "bg-background/50 border-border"
                }`}
              >
                <div>
                  <div className="font-semibold">
                    Sell {order.amount} @ Stop: {order.stopPrice}
                  </div>
                  <div className="text-sm text-foreground/70">
                    Current: {order.currentPrice} | Status:{" "}
                    {order.triggered ? (
                      <span className="text-error">Triggered</span>
                    ) : order.currentPrice <= order.stopPrice ? (
                      <span className="text-warning">Near Trigger</span>
                    ) : (
                      <span className="text-success">Active</span>
                    )}
                  </div>
                </div>
                <div>
                  {order.triggered ? (
                    <span className="text-error text-sm">Executed</span>
                  ) : (
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
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

