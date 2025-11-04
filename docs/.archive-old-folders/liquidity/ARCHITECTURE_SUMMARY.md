# NorSwap Architecture - Wallet-Based (Non-Custodial)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      USER SIDE                          │
│  (Everything User Controls)                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 User's Device (Phone/Computer)                      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🦊 MetaMask Wallet                               │  │
│  │  ├─ Private Keys (NEVER leaves device)           │  │
│  │  ├─ Signs transactions                           │  │
│  │  └─ User controls 100%                           │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↕                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🌐 Web Browser (Chrome/Brave/Firefox)           │  │
│  │  └─ Visits: swap.xaheen.org                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│                   OUR SIDE (UI Only)                    │
│  (We ONLY Provide Interface - No Custody)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ☁️ Vercel CDN (Global Edge Network)                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ⚛️ React Frontend (Static Files)                 │  │
│  │  ├─ Swap UI                                       │  │
│  │  ├─ Add/Remove Liquidity UI                       │  │
│  │  ├─ Pool Stats Dashboard                          │  │
│  │  └─ Just HTML/CSS/JS (no private data)           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  🚫 NO BACKEND SERVER                                   │
│  🚫 NO DATABASE                                         │
│  🚫 NO PRIVATE KEY STORAGE                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         ↕ JSON-RPC
┌─────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                      │
│  (Trustless, Transparent, On-Chain)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔗 Nor Chain (https://rpc.xaheen.org)               │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📜 Smart Contracts (Already Deployed)            │  │
│  │  ├─ Router: 0x25a4...9890a                        │  │
│  │  ├─ Factory: 0x3652...A13D                        │  │
│  │  ├─ Pair (NOR/USDT): 0xa6E8...87EC8               │  │
│  │  └─ All code is public & auditable                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Swaps 100 USDT → NOR

```
Step 1: User Visits Frontend
┌────────────────────┐
│ User types:        │
│ swap.xaheen.org    │
└────────────────────┘
         ↓
┌────────────────────┐
│ Vercel CDN         │
│ Sends React app    │
│ (just HTML/JS)     │
└────────────────────┘
         ↓
┌────────────────────┐
│ User's browser     │
│ Loads app          │
│ Shows UI           │
└────────────────────┘

Step 2: Connect Wallet
┌────────────────────┐
│ User clicks:       │
│ "Connect Wallet"   │
└────────────────────┘
         ↓
┌────────────────────┐
│ Frontend asks      │
│ MetaMask to connect│
└────────────────────┘
         ↓
┌────────────────────┐
│ MetaMask popup     │
│ User approves      │
└────────────────────┘
         ↓
┌────────────────────┐
│ Frontend gets:     │
│ - Wallet address   │
│ - Token balances   │
│ (NO private keys)  │
└────────────────────┘

Step 3: Enter Swap Details
┌────────────────────┐
│ User enters:       │
│ "100 USDT"         │
└────────────────────┘
         ↓
┌────────────────────┐
│ Frontend queries   │
│ blockchain:        │
│ "How much NOR?"    │
└────────────────────┘
         ↓
┌────────────────────┐
│ Router contract    │
│ calculates:        │
│ 41,666,666 NOR     │
└────────────────────┘
         ↓
┌────────────────────┐
│ Frontend shows:    │
│ "You'll receive    │
│  41,666,666 NOR"   │
└────────────────────┘

Step 4: Execute Swap
┌────────────────────┐
│ User clicks:       │
│ "Swap"             │
└────────────────────┘
         ↓
┌────────────────────┐
│ Frontend prepares  │
│ transaction data   │
└────────────────────┘
         ↓
┌────────────────────┐
│ Sends to MetaMask  │
│ (not executed yet) │
└────────────────────┘
         ↓
┌────────────────────┐
│ MetaMask popup     │
│ Shows transaction: │
│ - Contract call    │
│ - Gas fee          │
│ - Total cost       │
└────────────────────┘
         ↓
┌────────────────────┐
│ User reviews       │
│ Clicks "Confirm"   │
└────────────────────┘
         ↓
┌────────────────────┐
│ MetaMask signs     │
│ with private key   │
│ (key never sent)   │
└────────────────────┘
         ↓
┌────────────────────┐
│ Signed tx sent     │
│ to blockchain      │
└────────────────────┘
         ↓
┌────────────────────┐
│ Blockchain         │
│ executes swap      │
│ (3 seconds)        │
└────────────────────┘
         ↓
┌────────────────────┐
│ User receives      │
│ 41,666,666 NOR ✅  │
└────────────────────┘
```

---

## Security Model

### What User Controls:
```
✅ Private keys (in MetaMask)
✅ Seed phrase (written down, never online)
✅ Transaction approval (every single one)
✅ Wallet password
✅ All funds
```

### What We Control:
```
✅ Frontend UI design
✅ Contract addresses shown
✅ Domain name (swap.xaheen.org)
❌ NO user funds
❌ NO private keys
❌ NO ability to move user funds
❌ NO custody whatsoever
```

### What Blockchain Controls:
```
✅ Transaction execution
✅ Fund transfers
✅ Smart contract logic
✅ Transparent & auditable
✅ Immutable once deployed
```

---

## Comparison: Our Model vs. Centralized Exchange

### Centralized Exchange (Binance/Coinbase):
```
User Flow:
1. User creates account → ❌ KYC required
2. User deposits funds → ❌ Exchange controls keys
3. User trades → ❌ Off-chain (exchange database)
4. User withdraws → ❌ Exchange can freeze/deny

Security:
├─ Exchange holds all private keys
├─ Exchange can freeze accounts
├─ Exchange can get hacked
├─ "Not your keys, not your crypto"
└─ Users trust centralized entity
```

### Our Model (NorSwap):
```
User Flow:
1. User connects wallet → ✅ No registration
2. User keeps funds in wallet → ✅ User controls keys
3. User trades → ✅ On-chain (blockchain)
4. User always in control → ✅ Cannot be frozen

Security:
├─ User holds all private keys
├─ We cannot freeze accounts
├─ We cannot get "hacked" (no custody)
├─ "Your keys, your crypto"
└─ Users trust math/code, not us
```

---

## Technology Stack

### Frontend (What I'll Build):
```
Core:
├─ React 18 (UI framework)
├─ TypeScript (type safety)
├─ Tailwind CSS (styling)
└─ Vite (build tool, fast)

Blockchain Integration:
├─ ethers.js v6 (wallet connection, transactions)
├─ Web3Modal v3 (multi-wallet support)
└─ WalletConnect v2 (mobile wallet support)

State Management:
├─ Zustand (global state)
└─ React Query (data fetching)

Features:
├─ Swap interface
├─ Add/remove liquidity
├─ Pool stats
├─ Transaction history
├─ Price charts (optional)
└─ Mobile responsive
```

### Deployment:
```
Hosting: Vercel
├─ Free tier (sufficient)
├─ Automatic SSL
├─ Global CDN
├─ CI/CD (auto-deploy from Git)
└─ 99.99% uptime

Domain: swap.xaheen.org
├─ Point DNS to Vercel
└─ SSL automatic

Build Time: 1-2 hours
Deploy Time: 2 minutes
```

### Smart Contracts (Already Deployed):
```
No changes needed:
├─ Router: 0x25a4240A868f9F5D5e6b55e5dd355bF2e1F9890a ✅
├─ Factory: 0x3652Da488FeF83C3327760f43B01Bad02FFfA13D ✅
└─ Pair: 0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8 ✅

Frontend just calls these contracts
```

---

## Wallet Support

### Desktop (Browser Extension):
```
✅ MetaMask (most popular)
✅ Coinbase Wallet
✅ Brave Wallet (built-in)
✅ Rabby Wallet
✅ Trust Wallet Desktop
```

### Mobile (DApp Browser):
```
✅ MetaMask Mobile
✅ Trust Wallet Mobile
✅ Coinbase Wallet Mobile
✅ Rainbow Wallet
✅ Any WalletConnect-compatible wallet (300+)
```

### Connection Methods:
```
Desktop:
└─ Browser extension injection (window.ethereum)

Mobile:
├─ In-app browser (Trust Wallet, MetaMask)
└─ WalletConnect (scan QR code from desktop)
```

---

## User Journey (Complete)

### First-Time User (Bob):

**1. Setup (One-Time):**
```
Bob installs MetaMask:
├─ Downloads Chrome extension
├─ Creates new wallet
├─ Writes down 12-word seed phrase
├─ Sets password
└─ Wallet ready ✅

Bob adds Nor Chain:
├─ Opens MetaMask settings
├─ Adds custom network:
│  ├─ RPC: https://rpc.xaheen.org
│  ├─ Chain ID: 65001
│  ├─ Symbol: NOR
│  └─ Explorer: https://explorer.xaheen.org
└─ Nor Chain added ✅

Bob gets USDT on Nor:
├─ Bridges from BSC (using bridge UI)
├─ Or buys with card (via Moonpay)
└─ Has 100 USDT on Nor ✅

Total setup time: 10-15 minutes (first time only)
```

**2. Buying NOR (Every Time):**
```
Bob visits swap.xaheen.org:
├─ Clicks "Connect Wallet"
├─ MetaMask popup → Approves
├─ Frontend shows balance: 100 USDT
└─ Connected ✅

Bob swaps:
├─ Enters: 100 USDT
├─ Sees: ~41,666,666 NOR
├─ Clicks "Swap"
├─ MetaMask popup → Confirms
└─ Receives NOR in 3 seconds ✅

Total swap time: 30 seconds
```

### Returning User (Alice):

```
Alice already has:
├─ MetaMask installed ✅
├─ Nor Chain added ✅
├─ USDT on Nor ✅

Alice swaps:
├─ Visits swap.xaheen.org
├─ Connects wallet (auto-remembers)
├─ Swaps USDT → NOR
└─ Done in 20 seconds ✅
```

---

## Cost Analysis

### For Users:

**Gas Fees (Transaction Costs):**
```
Nor Chain (Parlia consensus):
├─ Swap: ~$0.001 (0.1 cents)
├─ Add liquidity: ~$0.002
├─ Remove liquidity: ~$0.002
└─ Much cheaper than Ethereum/BSC
```

**Trading Fees:**
```
NorSwap (Uniswap V2 model):
├─ Swap fee: 0.3%
├─ Goes to liquidity providers
└─ Example: $100 swap = $0.30 fee
```

**Total Cost to Buy $100 NOR:**
```
$100 USDT
+ $0.30 trading fee (0.3%)
+ $0.001 gas fee
= $100.301 total cost

Very affordable ✅
```

### For Us (Deployment):

**Infrastructure Costs:**
```
Frontend Hosting:
├─ Vercel: FREE
├─ Domain: $10/year
└─ SSL: FREE (included)

Smart Contracts:
├─ Already deployed ✅
├─ No additional cost

Backend:
├─ No backend needed ✅
└─ $0/month

Total: ~$10/year
```

---

## What We'll Build

### Phase 1 (Week 1) - MVP:
```
✅ Swap Interface
   ├─ Token input/output
   ├─ Price display
   ├─ Slippage settings
   └─ Wallet connection

✅ Pool Stats
   ├─ Total liquidity
   ├─ 24h volume
   ├─ User's LP position
   └─ Fees earned

✅ Basic UI
   ├─ Responsive design
   ├─ Mobile-friendly
   └─ Professional look
```

### Phase 2 (Week 2) - Enhanced:
```
✅ Add Liquidity UI
✅ Remove Liquidity UI
✅ Transaction History
✅ Price Charts
✅ Multiple Pool Support
```

### Phase 3 (Week 3+) - Advanced:
```
✅ Analytics Dashboard
✅ Farming/Staking UI (if contracts deployed)
✅ Limit Orders
✅ Advanced Charts
```

---

## Summary

### Architecture Type:
**✅ Non-Custodial, Wallet-Based DEX**

### User Experience:
```
1. User connects wallet (MetaMask, etc.)
2. User swaps tokens
3. User signs in their wallet
4. Transaction executes on-chain
5. User receives tokens ✅

Private keys: NEVER leave user's wallet
```

### What We Provide:
```
Frontend UI only:
├─ Beautiful interface
├─ Easy to use
├─ Mobile responsive
└─ Just connects wallet to blockchain

We DON'T provide:
├─ ❌ Custody service
├─ ❌ Private key storage
├─ ❌ Centralized trading
└─ ❌ Account system
```

### Timeline:
```
Build frontend: 1-2 hours
Deploy to Vercel: 2 minutes
Setup domain: 5 minutes
Total: ~2 hours

Users can buy NOR ✅
```

---

## Ready to Build?

**I'll create a wallet-based, non-custodial frontend where:**
- Users connect their own wallets ✅
- Users control private keys ✅
- No backend, no custody ✅
- Just like Uniswap/PancakeSwap ✅

**Deploy to: swap.xaheen.org**
**Time: 1-2 hours**

**Shall I start?**
