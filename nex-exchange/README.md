# NEX Exchange - Sharia-Compliant DeFi Exchange

**Market-leading Sharia-compliant decentralized exchange for NorChain ecosystem.**

## Features

- ✅ **Sharia-Compliant**: Full AAOIFI compliance, no riba (interest), no gharar (uncertainty)
- ✅ **Halal Asset Filter**: Filter tokens by Sharia compliance
- ✅ **Zakat Calculator**: Calculate annual zakat obligations
- ✅ **Next.js 14** with App Router and TypeScript
- ✅ **Tailwind CSS** for styling
- ✅ **Wagmi** for Web3 integration
- ✅ **TanStack Query** for data fetching
- ✅ **Zustand** for state management

## Sharia Compliance Principles

### 1. No Riba (Interest)
- All transactions are interest-free
- Uses profit/loss sharing mechanisms (Musharakah/Mudarabah)
- No fixed interest rates

### 2. No Gharar (Uncertainty)
- All transactions are transparent and clearly defined
- No hidden fees or ambiguous terms
- Full disclosure of risks

### 3. Asset-Backed
- Stablecoins backed by physical assets (gold for Dirhamat)
- All assets have real-world backing and value

### 4. No Maysir (Gambling)
- No speculative trading mechanisms
- Clear risk-sharing principles

## Halal Assets

- **NOR Token**: Native utility token (gas, staking, governance)
- **Dirhamat (DRHT)**: Gold-backed stablecoin (100% asset-backed)
- **BTCBR**: Bitcoin bridge token (transparent bridge operations)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_NORCHAIN_RPC=https://rpc.norchain.org
NEXT_PUBLIC_CHAIN_ID=65001
NEXT_PUBLIC_NEX_ROUTER_ADDRESS=0x...
```

## Project Structure

```
nex-exchange/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   ├── sharia/         # Sharia compliance page
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── swap/           # Swap interface components
│   │   ├── sharia/         # Sharia compliance components
│   │   ├── layout/         # Layout components
│   │   ├── wallet/         # Wallet connection components
│   │   └── ui/             # UI primitives
│   ├── config/             # Configuration files
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   │   └── sharia-compliance.ts  # Sharia compliance logic
│   └── types/              # TypeScript types
│       └── sharia.ts       # Sharia compliance types
├── public/                 # Static assets
└── package.json
```

## Sharia Compliance Features

### Halal Filter
Toggle to show only Sharia-compliant tokens in the token selector.

### Zakat Calculator
Calculate annual zakat obligations (2.5% of assets above nisab threshold).

### Compliance Badge
Visual indicator showing Sharia compliance status for tokens and the platform.

### Token Compliance Check
Each token is checked against Sharia principles:
- No interest-bearing mechanisms
- No excessive uncertainty
- Asset-backed where applicable
- Transparent operations

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Compliance Standards

- **AAOIFI**: Accounting and Auditing Organization for Islamic Financial Institutions
- **Sharia Board Review**: All smart contracts reviewed by qualified Islamic finance scholars
- **Transparent Operations**: All transactions on-chain and publicly verifiable

## Documentation

- Architecture: `docs/NEX_COMPREHENSIVE_ARCHITECTURE.md`
- Implementation: `docs/NEX_IMPLEMENTATION_SUMMARY.md`
- Sharia Compliance: See `/sharia` page in the application

## License

© 2025 NorChain Foundation AS. All rights reserved.
