import { SwapInterface } from "@/components/swap/swap-interface";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function SwapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Swap Tokens</h1>
            <p className="text-foreground/70">
              Trade tokens instantly with best prices across all chains
            </p>
          </div>
          <SwapInterface />
        </div>
      </main>
      <Footer />
    </div>
  );
}

