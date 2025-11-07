"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Repeat } from "lucide-react";

interface DCASchedule {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountPerOrder: number;
  frequency: "daily" | "weekly" | "monthly";
  nextExecution: number;
  totalExecuted: number;
  totalSpent: number;
  active: boolean;
}

export function DCAScheduler() {
  const { address } = useAccount();
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);

  const { data: schedules } = useQuery({
    queryKey: ["dcaSchedules", address],
    queryFn: async () => {
      if (!address) return [];
      // TODO: Fetch from API
      return [] as DCASchedule[];
    },
    enabled: !!address,
  });

  if (!address) {
    return (
      <div className="text-center py-8 text-foreground/70">
        Connect your wallet to create DCA schedules
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Repeat className="h-5 w-5" />
            <span>Dollar-Cost Averaging (DCA)</span>
          </h3>
          <p className="text-sm text-foreground/70">
            Automatically buy tokens at regular intervals to reduce market timing risk
          </p>
        </div>
        <Button onClick={() => setShowCreateSchedule(!showCreateSchedule)}>
          {showCreateSchedule ? "Cancel" : "Create DCA Schedule"}
        </Button>
      </div>

      {showCreateSchedule && (
        <div className="bg-background border border-border rounded-lg p-6 space-y-4">
          <h4 className="font-semibold">Create DCA Schedule</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token to Buy</Label>
              <select className="w-full h-10 rounded-md border border-border bg-background px-3">
                <option>NOR</option>
                <option>BTCBR</option>
                <option>DRHT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Payment Token</Label>
              <select className="w-full h-10 rounded-md border border-border bg-background px-3">
                <option>USDT</option>
                <option>DRHT</option>
                <option>NOR</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount Per Order</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <select className="w-full h-10 rounded-md border border-border bg-background px-3">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input type="date" />
            </div>
          </div>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="text-sm text-foreground/70">
              <strong>Estimated:</strong> This schedule will execute approximately{" "}
              <strong>30 orders</strong> over the selected period, spending approximately{" "}
              <strong>3,000 NOK</strong> total.
            </div>
          </div>
          <Button className="w-full">Create DCA Schedule</Button>
        </div>
      )}

      {schedules && schedules.length === 0 && (
        <div className="text-center py-8 text-foreground/70">
          No DCA schedules active
        </div>
      )}

      {schedules && schedules.length > 0 && (
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border"
              >
                <div>
                  <div className="font-semibold">
                    Buy {schedule.tokenOut} with {schedule.tokenIn}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {schedule.amountPerOrder} per {schedule.frequency} | Next:{" "}
                    {new Date(schedule.nextExecution).toLocaleString()}
                  </div>
                  <div className="text-xs text-foreground/60 mt-1">
                    Executed: {schedule.totalExecuted} orders | Spent:{" "}
                    {schedule.totalSpent.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {schedule.active ? (
                    <>
                      <span className="text-success text-sm">Active</span>
                      <Button variant="outline" size="sm">
                        Pause
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-foreground/50 text-sm">Paused</span>
                      <Button variant="outline" size="sm">
                        Resume
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

