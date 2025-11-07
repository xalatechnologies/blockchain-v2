import Link from "next/link";
import { SwapInterface } from "@/components/swap/swap-interface";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ComplianceBadge } from "@/components/sharia/compliance-badge";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">
                NEX Exchange
              </h1>
            </div>
            <p className="text-lg text-foreground/70 mb-4">
              Sharia-Compliant DeFi Exchange for NorChain Ecosystem
            </p>
            <div className="flex items-center justify-center space-x-4">
              <ComplianceBadge />
              <span className="text-sm text-foreground/50">70% lower fees than Firi</span>
            </div>
          </div>
          <SwapInterface />
          <div className="mt-8 text-center">
            <Link 
              href="/sharia" 
              className="text-sm text-primary hover:underline"
            >
              Learn more about Sharia compliance →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
