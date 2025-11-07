import { ZakatCalculator } from "@/components/sharia/zakat-calculator";
import { ComplianceBadge } from "@/components/sharia/compliance-badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookOpen, Shield, Scale } from "lucide-react";

export default function ShariaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Sharia-Compliant DeFi
            </h1>
            <ComplianceBadge className="justify-center" />
            <p className="text-lg text-foreground/70 mt-4">
              NEX Exchange operates in full compliance with Islamic finance principles
            </p>
          </div>

          {/* Principles */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-background border border-border rounded-lg">
              <Shield className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Riba (Interest)</h3>
              <p className="text-sm text-foreground/70">
                All transactions are interest-free. We use profit/loss sharing 
                mechanisms (Musharakah/Mudarabah) instead of fixed interest rates.
              </p>
            </div>

            <div className="p-6 bg-background border border-border rounded-lg">
              <Scale className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Gharar (Uncertainty)</h3>
              <p className="text-sm text-foreground/70">
                All transactions are transparent and clearly defined. 
                No hidden fees or ambiguous terms. Full disclosure of risks.
              </p>
            </div>

            <div className="p-6 bg-background border border-border rounded-lg">
              <BookOpen className="h-8 w-8 text-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">Asset-Backed</h3>
              <p className="text-sm text-foreground/70">
                Our stablecoins (Dirhamat) are backed by physical gold reserves. 
                All assets have real-world backing and value.
              </p>
            </div>
          </div>

          {/* Zakat Calculator */}
          <ZakatCalculator />

          {/* Compliance Details */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Compliance Standards</h2>
            <div className="space-y-4 text-sm text-foreground/70">
              <div>
                <h3 className="font-semibold text-foreground mb-2">AAOIFI Compliance</h3>
                <p>
                  NEX Exchange follows the Accounting and Auditing Organization 
                  for Islamic Financial Institutions (AAOIFI) standards for Sharia compliance.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Sharia Board Review</h3>
                <p>
                  All smart contracts and trading mechanisms are reviewed by qualified 
                  Islamic finance scholars to ensure compliance with Sharia principles.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Transparent Operations</h3>
                <p>
                  All transactions are on-chain and publicly verifiable. No hidden fees, 
                  no interest-bearing mechanisms, and full transparency in all operations.
                </p>
              </div>
            </div>
          </div>

          {/* Halal Assets */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Halal Assets</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <div>
                  <div className="font-medium">NOR Token</div>
                  <div className="text-sm text-foreground/70">Native utility token</div>
                </div>
                <ComplianceBadge />
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <div>
                  <div className="font-medium">Dirhamat (DRHT)</div>
                  <div className="text-sm text-foreground/70">Gold-backed stablecoin</div>
                </div>
                <ComplianceBadge />
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <div>
                  <div className="font-medium">BTCBR</div>
                  <div className="text-sm text-foreground/70">Bitcoin bridge token</div>
                </div>
                <ComplianceBadge />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

