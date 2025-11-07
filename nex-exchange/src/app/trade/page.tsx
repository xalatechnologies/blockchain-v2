"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderBook } from "@/components/trade/order-book";
import { TradeHistory } from "@/components/trade/trade-history";
import { LimitOrders } from "@/components/trade/limit-orders";
import { StopLossOrders } from "@/components/trade/stop-loss-orders";
import { DCAScheduler } from "@/components/trade/dca-scheduler";

export default function TradePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Advanced Trading</h1>
          
          <Tabs defaultValue="orderbook" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orderbook">Order Book</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
              <TabsTrigger value="limit">Limit Orders</TabsTrigger>
              <TabsTrigger value="stoploss">Stop-Loss</TabsTrigger>
              <TabsTrigger value="dca">DCA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orderbook">
              <OrderBook />
            </TabsContent>
            
            <TabsContent value="history">
              <TradeHistory />
            </TabsContent>
            
            <TabsContent value="limit">
              <LimitOrders />
            </TabsContent>
            
            <TabsContent value="stoploss">
              <StopLossOrders />
            </TabsContent>
            
            <TabsContent value="dca">
              <DCAScheduler />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
