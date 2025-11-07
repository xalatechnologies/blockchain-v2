export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">NEX Exchange</h3>
            <p className="text-sm text-foreground/70">
              Market-leading DEX for NorChain ecosystem
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li><a href="/swap" className="hover:text-foreground">Swap</a></li>
              <li><a href="/trade" className="hover:text-foreground">Advanced Trading</a></li>
              <li><a href="/liquidity" className="hover:text-foreground">Liquidity</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li><a href="/docs" className="hover:text-foreground">Documentation</a></li>
              <li><a href="/api" className="hover:text-foreground">API</a></li>
              <li><a href="https://norchain.org" className="hover:text-foreground">NorChain</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li><a href="/terms" className="hover:text-foreground">Terms</a></li>
              <li><a href="/privacy" className="hover:text-foreground">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-foreground/70">
          <p>© 2025 NorChain Foundation AS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

