# Wallet-Based Buying Architecture

## Your Requirement: "I want users to use wallets"

**Perfect! This is the RIGHT approach.**

You want:
- ✅ Users connect their own wallets (MetaMask, Trust Wallet, etc.)
- ✅ Users control their own private keys
- ✅ Non-custodial (we never hold user funds)
- ✅ Decentralized approach

**This is exactly how Uniswap, PancakeSwap, and all major DEXes work.**

---

## How Wallet-Based Buying Works

### Architecture:

```
┌─────────────────────────────────────────┐
│         User's Browser                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   NorSwap Frontend (React)     │  │
│  │   (Hosted on Vercel/Your Server)  │  │
│  └───────────────────────────────────┘  │
│              ↓ Web3 / ethers.js         │
│  ┌───────────────────────────────────┐  │
│  │   User's Wallet (MetaMask)        │  │
│  │   - User controls private keys    │  │
│  │   - Signs transactions            │  │
│  │   - Never leaves device           │  │
│  └───────────────────────────────────┘  │
│              ↓ RPC Connection           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Nor Chain (Blockchain)             │
│   RPC: https://rpc.xaheen.org           │
│                                         │
│   Smart Contracts:                      │
│   ├─ Router: 0x25a4...9890a             │
│   ├─ Factory: 0x3652...A13D             │
│   └─ Pair: 0xa6E8...87EC8               │
└─────────────────────────────────────────┘
```

### Key Points:

**✅ User Controls Everything:**
- Private keys stay in user's wallet (MetaMask)
- We NEVER see or store private keys
- User approves every transaction
- Fully decentralized

**✅ Frontend is Just an Interface:**
- Frontend = nice UI
- No backend server storing keys
- Just connects wallet to blockchain
- Like a "TV remote" for the blockchain

**✅ Non-Custodial:**
- We don't hold user funds
- We don't custody tokens
- All transactions on-chain
- Transparent and trustless

---

## User Experience Flow

### Step 1: User Visits Frontend

```
User opens browser:
└─ Goes to: swap.xaheen.org

Frontend loads:
├─ React app (hosted on Vercel)
├─ Detects if MetaMask installed
└─ Shows "Connect Wallet" button
```

### Step 2: Connect Wallet

```
User clicks "Connect Wallet":

┌─────────────────────────────────────┐
│   Connect Your Wallet               │
├─────────────────────────────────────┤
│                                     │
│   [🦊 MetaMask]                     │
│   [📱 WalletConnect]                │
│   [💼 Trust Wallet]                 │
│   [🌈 Rainbow Wallet]               │
│                                     │
└─────────────────────────────────────┘

User selects MetaMask:
├─ MetaMask popup appears
├─ User approves connection
└─ Frontend can now read wallet address

Frontend shows:
├─ Wallet address: 0xdD77...6B1b
├─ NOR balance: 21B NOR
├─ USDT balance: 1M USDT
└─ Now ready to swap ✅
```

**Important:** Frontend only gets:
- ✅ Wallet address (public)
- ✅ Token balances (public)
- ❌ NOT private keys (stays in MetaMask)

### Step 3: Swap Tokens

```
User enters swap details:
┌─────────────────────────────────────┐
│   You Pay:                          │
│   ┌───────────────────────────────┐ │
│   │ 100          [USDT ▼]         │ │
│   └───────────────────────────────┘ │
│           ↓↓↓                       │
│   You Receive:                      │
│   ┌───────────────────────────────┐ │
│   │ 41,666,666   [NOR ▼]          │ │
│   └───────────────────────────────┘ │
│                                     │
│   Price: 1 NOR = $0.0000024        │
│   Price Impact: <0.01%              │
│   Fee: 0.3% (0.3 USDT)              │
│                                     │
│   [Swap] ✅                         │
└─────────────────────────────────────┘

User clicks "Swap":
├─ Frontend calls: router.swapExactTokensForTokens()
├─ MetaMask popup: "Confirm transaction"
│  ├─ Shows: Contract interaction
│  ├─ Shows: Gas fee estimate
│  ├─ Shows: Total cost
│  └─ User clicks "Confirm" ✅
│
└─ Transaction sent to blockchain
   ├─ Executed on Nor Chain
   ├─ User receives NOR
   └─ Complete in 3 seconds ✅
```

**Critical:**
- User signs transaction IN their wallet
- Private key NEVER leaves MetaMask
- We only provide the UI

### Step 4: Transaction Complete

```
Frontend shows:
┌─────────────────────────────────────┐
│   ✅ Swap Successful!               │
├─────────────────────────────────────┤
│                                     │
│   You swapped:                      │
│   100 USDT → 41,666,666 NOR         │
│                                     │
│   Transaction:                      │
│   0x1d0c9629f070c881bd287...        │
│                                     │
│   [View on Explorer] [Close]        │
│                                     │
└─────────────────────────────────────┘

User's wallet now shows:
├─ USDT: 999,900 (spent 100)
└─ NOR: 21,041,666,666 (received ~41.6M)
```

---

## Technical Implementation

### Frontend Stack (What I'll Build):

```javascript
// React + TypeScript + ethers.js

import { ethers } from 'ethers';

// 1. Connect Wallet
const connectWallet = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // MetaMask popup
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    console.log("Connected:", address); // User's address
    // We NEVER see or store private keys!
  }
};

// 2. Execute Swap (User Signs in Wallet)
const executeSwap = async (amountIn, tokenIn, tokenOut) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const router = new ethers.Contract(
    ROUTER_ADDRESS,
    ROUTER_ABI,
    signer // User's wallet will sign
  );

  // User approves in MetaMask popup
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    minAmountOut,
    [tokenIn, tokenOut],
    userAddress,
    deadline
  );

  // Transaction signed by user's wallet
  await tx.wait();

  console.log("Swap complete!");
};
```

### Key Libraries:

**1. ethers.js** (Wallet Connection)
```javascript
import { ethers } from 'ethers';

// Connects to user's wallet (MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
```

**2. Web3Modal** (Multi-Wallet Support)
```javascript
import Web3Modal from 'web3modal';

// Supports: MetaMask, WalletConnect, Trust Wallet, etc.
const web3Modal = new Web3Modal({
  network: "xaheen",
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          65001: "https://rpc.xaheen.org"
        }
      }
    }
  }
});
```

**3. React** (UI Framework)
```javascript
import React, { useState } from 'react';

function SwapInterface() {
  const [walletAddress, setWalletAddress] = useState(null);

  return (
    <div>
      {!walletAddress ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <SwapForm userAddress={walletAddress} />
      )}
    </div>
  );
}
```

---

## Supported Wallets

### Desktop Wallets:

**1. MetaMask (Browser Extension)**
```
User has MetaMask installed:
├─ Clicks "Connect Wallet"
├─ MetaMask popup appears
├─ Approves connection
└─ Can swap immediately ✅
```

**2. Coinbase Wallet**
```
Similar to MetaMask:
├─ Browser extension
├─ One-click connect
└─ Works same way ✅
```

**3. Brave Wallet (Built-in)**
```
Brave browser users:
├─ Built-in crypto wallet
├─ No extension needed
└─ Native support ✅
```

### Mobile Wallets:

**1. MetaMask Mobile**
```
User on phone:
├─ Opens MetaMask app
├─ Uses built-in browser
├─ Navigates to swap.xaheen.org
├─ Connects automatically
└─ Swaps on mobile ✅
```

**2. Trust Wallet**
```
User on phone:
├─ Opens Trust Wallet
├─ Uses DApp browser
├─ Connects to our frontend
└─ Swaps ✅
```

**3. WalletConnect (Universal)**
```
Any wallet with WalletConnect:
├─ User scans QR code
├─ Connects wallet to desktop frontend
├─ Signs transactions on phone
└─ Works with 300+ wallets ✅
```

---

## Security & Privacy

### What We Can See:

**✅ Public Information (On-Chain):**
- Wallet addresses (public keys)
- Token balances (on blockchain)
- Transaction history (public)
- This is same info on block explorer

### What We CANNOT See:

**❌ Private Information:**
- ❌ Private keys (never leaves wallet)
- ❌ Seed phrases (never transmitted)
- ❌ User identity (wallet is anonymous)
- ❌ Off-chain activity

### Transaction Signing:

```
Every transaction:
├─ User clicks "Swap" on our frontend
├─ Frontend prepares transaction
├─ Sends to user's wallet (MetaMask)
├─ User reviews in MetaMask:
│  ├─ Contract address
│  ├─ Function being called
│  ├─ Amount being spent
│  ├─ Gas fee
│  └─ Total cost
├─ User clicks "Confirm" or "Reject"
└─ Only if confirmed, transaction executes

We NEVER execute without user approval ✅
```

---

## Frontend Features We'll Build

### Basic Features (Priority 1):

**1. Swap Interface**
```
┌─────────────────────────────────────┐
│   Swap                              │
├─────────────────────────────────────┤
│   From: [100] [USDT ▼]              │
│   To: [41,666,666] [NOR ▼]          │
│                                     │
│   Price: 1 NOR = $0.0000024         │
│   Fee: 0.3%                         │
│                                     │
│   [Connect Wallet] or [Swap]        │
└─────────────────────────────────────┘
```

**2. Add Liquidity**
```
┌─────────────────────────────────────┐
│   Add Liquidity                     │
├─────────────────────────────────────┤
│   Token A: [1000] [NOR ▼]           │
│   Token B: [0.0024] [USDT ▼]        │
│                                     │
│   You'll receive: 100 LP tokens     │
│                                     │
│   [Add Liquidity]                   │
└─────────────────────────────────────┘
```

**3. Remove Liquidity**
```
┌─────────────────────────────────────┐
│   Remove Liquidity                  │
├─────────────────────────────────────┤
│   LP Tokens: [100] XLP              │
│                                     │
│   You'll receive:                   │
│   ├─ 1000 NOR                       │
│   └─ 0.0024 USDT                    │
│                                     │
│   [Remove Liquidity]                │
└─────────────────────────────────────┘
```

**4. Pool Stats**
```
┌─────────────────────────────────────┐
│   Pool Statistics                   │
├─────────────────────────────────────┤
│   NOR/USDT Pool                     │
│                                     │
│   Total Liquidity: $20,000          │
│   24h Volume: $150                  │
│   Your Share: 50%                   │
│   Your LP Value: $10,000            │
│   Fees Earned: $0.0031              │
│                                     │
└─────────────────────────────────────┘
```

### Advanced Features (Priority 2):

**5. Transaction History**
```
┌─────────────────────────────────────┐
│   Your Transactions                 │
├─────────────────────────────────────┤
│   Swap: 100 USDT → 41.6M NOR        │
│   2 minutes ago                     │
│   [View on Explorer]                │
│                                     │
│   Add Liquidity: 1000 NOR + 0.024 U │
│   1 hour ago                        │
│   [View on Explorer]                │
└─────────────────────────────────────┘
```

**6. Price Charts**
```
┌─────────────────────────────────────┐
│   NOR/USDT Price Chart              │
├─────────────────────────────────────┤
│        Price: $0.0000024            │
│        Change: +0.5%                │
│                                     │
│   [Interactive Chart]               │
│                                     │
│   [1H] [24H] [7D] [30D] [ALL]       │
└─────────────────────────────────────┘
```

**7. Analytics Dashboard**
```
┌─────────────────────────────────────┐
│   Analytics                         │
├─────────────────────────────────────┤
│   Total Value Locked: $20,000       │
│   24h Volume: $150                  │
│   Total Fees (24h): $0.45           │
│   Unique Users (24h): 1             │
│                                     │
│   Top Pairs:                        │
│   1. NOR/USDT - $20k                │
│   2. NOR/BTCBR - $0 (coming soon)   │
└─────────────────────────────────────┘
```

---

## Mobile Responsiveness

### Desktop View:
```
┌────────────────────────────────────────────────┐
│  NorSwap                  [Connect Wallet]  │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Swap Interface  │  │  Pool Stats      │   │
│  │                  │  │                  │   │
│  │  [Swap Form]     │  │  [Analytics]     │   │
│  │                  │  │                  │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

### Mobile View:
```
┌─────────────────┐
│  NorSwap    │
│  [≡ Menu]      │
├─────────────────┤
│                │
│  Swap Interface│
│                │
│  [From]        │
│  100 USDT      │
│      ↓         │
│  [To]          │
│  41.6M NOR     │
│                │
│  [Swap Now]    │
│                │
└─────────────────┘
```

---

## Deployment Architecture

### What I'll Deploy:

```
Frontend (React App):
├─ Hosted on: Vercel (free, fast CDN)
├─ Domain: swap.xaheen.org
├─ SSL: Automatic (Vercel provides)
└─ Build time: 1-2 hours

No Backend Needed:
├─ Frontend talks directly to blockchain
├─ No server storing user data
├─ No database
└─ Fully decentralized ✅

Smart Contracts (Already Deployed):
├─ Router: 0x25a4240A868f9F5D5e6b55e5dd355bF2e1F9890a ✅
├─ Factory: 0x3652Da488FeF83C3327760f43B01Bad02FFfA13D ✅
├─ Pair: 0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8 ✅
└─ No changes needed ✅
```

### Infrastructure:

```
User's Browser
     ↓ HTTPS
Vercel CDN (Frontend)
     ↓ RPC
Nor Chain (https://rpc.xaheen.org)
     ↓ Smart Contracts
Router/Factory/Pair Contracts
```

**Zero backend servers = Zero custody = Fully decentralized**

---

## User Journey Example

### Alice Wants to Buy $100 of NOR:

**Step 1: Setup (One-time)**
```
1. Alice installs MetaMask
2. Creates wallet (writes down seed phrase)
3. Adds Nor Chain network:
   - RPC: https://rpc.xaheen.org
   - Chain ID: 65001
4. Bridges 100 USDT from BSC to Nor
```

**Step 2: Buy NOR**
```
1. Alice visits: swap.xaheen.org
2. Clicks "Connect Wallet"
3. MetaMask popup → Approves
4. Frontend shows:
   - Your address: 0x...
   - Your USDT: 100
5. Alice enters: "100 USDT"
6. Sees output: "41,666,666 NOR"
7. Clicks "Swap"
8. MetaMask popup → Reviews → Confirms
9. Transaction executes (3 seconds)
10. Alice now has 41.6M NOR ✅
```

**Total time: 1 minute (after initial setup)**

**Alice's private keys:** Never left her MetaMask
**We saw:** Only her public address (0x...)
**We stored:** Nothing

---

## Comparison: Custodial vs. Non-Custodial

### ❌ Custodial (What We're NOT Building):

```
Centralized Exchange Model:
├─ User creates account
├─ User deposits funds to exchange
├─ Exchange holds private keys
├─ User trades on exchange
└─ User withdraws to own wallet

Problems:
├─ Exchange can freeze funds
├─ Exchange can get hacked
├─ Exchange controls your keys
└─ "Not your keys, not your crypto"
```

### ✅ Non-Custodial (What We're Building):

```
Decentralized Exchange Model:
├─ User keeps funds in own wallet
├─ User connects wallet to frontend
├─ Trades execute on blockchain
├─ User signs every transaction
└─ User always in control

Benefits:
├─ User controls private keys ✅
├─ We can't freeze funds ✅
├─ No account registration ✅
├─ Fully transparent ✅
└─ True decentralization ✅
```

---

## Summary

### Your Requirement: "I want users to use wallets"

**This is EXACTLY what we're building:**

✅ Users connect their own wallets (MetaMask, Trust Wallet, etc.)
✅ Users control private keys (never shared with us)
✅ Non-custodial (we never hold funds)
✅ Decentralized (frontend just interfaces blockchain)
✅ Transparent (all transactions on-chain)

### What I'll Deploy:

**1. Swap Frontend (React + ethers.js)**
- User connects MetaMask
- User swaps tokens
- User signs in their wallet
- Private keys never leave wallet

**2. Add/Remove Liquidity UI**
- Same wallet-based approach
- User controls everything

**3. Pool Stats Dashboard**
- Shows user's positions
- Read-only (no custody)

### Architecture:

```
User Wallet (MetaMask) ← User controls
     ↓
Frontend (UI only) ← We provide
     ↓
Blockchain (Smart Contracts) ← Trustless
```

**No backend, no custody, no private keys stored anywhere.**

---

## Ready to Deploy?

I'll build a **wallet-based, non-custodial frontend** where:

- ✅ Users connect their own wallets
- ✅ Users sign all transactions
- ✅ We never see or store private keys
- ✅ Fully decentralized
- ✅ Like Uniswap, PancakeSwap, etc.

**Time to build: 1-2 hours**
**Hosting: Vercel (free)**
**Domain: swap.xaheen.org**

**Should I start building this now?**
