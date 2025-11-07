"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Wallet, Shield } from "lucide-react";
import { ComplianceBadge } from "@/components/sharia/compliance-badge";

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold text-foreground">NEX</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/swap" className="text-sm font-medium text-foreground/70 hover:text-foreground">
              Swap
            </Link>
            <Link href="/trade" className="text-sm font-medium text-foreground/70 hover:text-foreground">
              Trade
            </Link>
            <Link href="/portfolio" className="text-sm font-medium text-foreground/70 hover:text-foreground">
              Portfolio
            </Link>
            <Link href="/liquidity" className="text-sm font-medium text-foreground/70 hover:text-foreground">
              Liquidity
            </Link>
            <Link href="/sharia" className="text-sm font-medium text-foreground/70 hover:text-foreground">
              Sharia
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="hidden lg:block">
              <ComplianceBadge />
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
