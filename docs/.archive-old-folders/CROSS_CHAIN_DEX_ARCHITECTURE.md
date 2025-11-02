# Cross-Chain DEX Architecture

**Xaheen Chain Global DEX - Technical Architecture**

## Overview

The Xaheen Cross-Chain DEX implements a **Hub-and-Spoke architecture** where Xaheen Chain acts as the central authority for pricing, supply control, and settlement, while spoke chains (BSC, Polygon, Ethereum) serve as execution layers.

**Key Innovation:** Users see XHT as a unified token across all major chains (MetaMask, PancakeSwap, QuickSwap, Uniswap), while Xaheen maintains complete control over monetary policy, pricing, and treasury.

## Architecture Model

```
┌─────────────────────────────────────────────────────────────┐
│                     XAHEEN CHAIN (HUB)                       │
│                    "Price Authority"                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │PriceAuthority│  │SupplyControl │  │SettlementHub │      │
│  │              │  │              │  │              │      │
│  │ TWAP Oracle  │  │ Treasury Mgmt│  │ Receipt      │      │
│  │ Quote Signing│  │ Inventory Cap│  │ Processing   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │   Price Quotes   │  Authorization   │  Fill Receipts
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      SPOKE CHAINS                            │
│              (BSC, Polygon, Ethereum)                        │
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   XaheenRouter       │◄────►│  SettlementInbox     │    │
│  │   (Dual-Mode)        │      │  (Event Logger)      │    │
│  │                      │      │                      │    │
│  │  ┌────────────────┐  │      │  Emits Fill events   │    │
│  │  │ Public LP      │  │      │  for Relayer pickup  │    │
│  │  │ PancakeSwap/   │  │      └──────────────────────┘    │
│  │  │ QuickSwap      │  │                                   │
│  │  └────────────────┘  │                                   │
│  │         OR            │                                   │
│  │  ┌────────────────┐  │                                   │
│  │  │ Hot Inventory  │  │                                   │
│  │  │ Instant Fills  │  │                                   │
│  │  └────────────────┘  │                                   │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

## Hub Contracts (Xaheen Chain)

### 1. PriceAuthority.sol

**Purpose:** Canonical price oracle for all cross-chain trades.

**Key Features:**
- Reads TWAP from Xaheen DEX (30-minute window)
- Applies policy spread (±0.25% for revenue)
- Signs quotes with authorized key
- Publishes every 30 seconds
- Quote freshness: 60 seconds max

**Architecture:**
```solidity
interface IPriceAuthority {
    // Get current TWAP price
    function currentQuote() external view returns (uint256 price, uint256 timestamp);

    // Verify signed quote from spoke
    function verifyQuote(bytes calldata signedQuote) external view returns (bool);

    // Publish new quote (owner only)
    function publishQuote() external returns (uint256 price, uint256 timestamp, uint256 nonce);
}
```

**Trade Flow:**
1. PriceAuthority reads `price0CumulativeLast` from XaheenDEXPair
2. Calculates TWAP: `(current_cumulative - old_cumulative) / time_elapsed`
3. Applies 0.25% spread
4. Signs quote with authorized key
5. Spoke verifies signature before executing trade

### 2. SupplyController.sol

**Purpose:** Treasury management and XHT supply control across all chains.

**Key Features:**
- Per-chain inventory caps (max 3% circulating supply)
- Daily movement limits ($50K/day per chain)
- Multi-sig (3-of-5) authorization
- 24h timelock for cap changes
- 72h timelock for treasury withdrawal
- Tracks all cross-chain revenue

**Security Architecture:**
```
┌─────────────────────────────────────────────────┐
│          SupplyController Security              │
├─────────────────────────────────────────────────┤
│ 1. Per-Chain Inventory Caps                     │
│    - BSC: 300 bps (3% of total supply)          │
│    - Polygon: 200 bps (2% of total supply)      │
│    - Ethereum: 100 bps (1% of total supply)     │
│                                                  │
│ 2. Daily Movement Limits                        │
│    - BSC: $50,000/day                           │
│    - Polygon: $50,000/day                       │
│    - Ethereum: $50,000/day                      │
│                                                  │
│ 3. Multi-Sig Authorization                      │
│    - 3-of-5 Gnosis Safe                         │
│    - Required for: cap changes, withdrawals     │
│                                                  │
│ 4. Timelocks                                    │
│    - 24h for inventory cap changes              │
│    - 72h for treasury withdrawals               │
│                                                  │
│ 5. Emergency Pause                              │
│    - Guardian can pause globally                │
│    - Requires admin to unpause                  │
└─────────────────────────────────────────────────┘
```

**Capital Allocation:**
```
Total Capital: $800,000

Xaheen Chain (Hub): $760,000 (95%)
├─ XHT/USDT LP: $600,000
├─ XHT/BNB LP: $100,000
└─ Treasury Reserve: $60,000 (emergency + buyback)

BSC (Spoke): $20,000 (2.5%)
├─ XHT/BUSD Public LP: $10,000 (if created)
└─ Hot Inventory: $10,000 (guaranteed fills)

Polygon (Spoke): $15,000 (1.875%)
├─ XHT/USDC Public LP: $7,500 (if created)
└─ Hot Inventory: $7,500 (guaranteed fills)

Ethereum (Spoke): $5,000 (0.625%)
└─ Hot Inventory only: $5,000 (no public LP)
```

### 3. SettlementHub.sol

**Purpose:** Cross-chain receipt processing and net settlement.

**Key Features:**
- Validates fill receipts from spokes
- Verifies signatures and finality (N confirmations)
- Triggers mint/burn for net settlement via SupplyController
- Logs all cross-chain revenue
- Circuit breaker (pause per chain or globally)
- Price deviation alerts (>3% auto-pause)

**Settlement Flow:**
```
1. User trades on Spoke (BSC/Polygon/ETH)
   └─> XaheenRouter executes trade
       └─> SettlementInbox emits Fill event

2. Relayer picks up Fill event
   └─> Waits for N confirmations (BSC: 15, Polygon: 128, ETH: 12)
       └─> Forwards receipt to SettlementHub

3. SettlementHub validates receipt
   ├─> Verifies quote signature
   ├─> Verifies receipt signature
   ├─> Checks nonce (prevent replay)
   ├─> Checks price deviation (<3%)
   └─> If valid, calls SupplyController.settleFill()

4. SupplyController processes settlement
   ├─> Updates spoke inventory balance
   ├─> Burns excess if above cap
   ├─> Logs revenue (0.35% fee)
   └─> Emits FillSettled event
```

## Spoke Contracts (BSC, Polygon, Ethereum)

### 1. XaheenRouter.sol

**Purpose:** Execute trades on spoke chains using hub quotes.

**Key Innovation: Dual-Mode Routing**
```
User wants to buy XHT on BSC
        │
        ▼
┌───────────────────┐
│ XaheenRouter      │
│ Check LP exists?  │
└───────┬───────────┘
        │
    ┌───┴───┐
    │       │
   YES     NO
    │       │
    ▼       ▼
┌────────┐ ┌─────────────┐
│Public  │ │Hot Inventory│
│LP Route│ │Direct Fill  │
│        │ │             │
│Pancake │ │ Instant     │
│Swap    │ │ No Slippage │
└────────┘ └─────────────┘
```

**Trade Functions:**
```solidity
// Buy XHT with USDT/USDC
function buyXHT(
    address paymentToken,
    uint256 amountIn,
    uint256 minXHTOut,
    bytes calldata signedQuote, // From PriceAuthority
    uint256 deadline
) external returns (uint256 xhtOut);

// Sell XHT for USDT/USDC
function sellXHT(
    address paymentToken,
    uint256 xhtIn,
    uint256 minPaymentOut,
    bytes calldata signedQuote, // From PriceAuthority
    uint256 deadline
) external returns (uint256 paymentOut);
```

**Security Features:**
- Quote verification (PriceAuthority signature)
- Quote freshness (<60s)
- Slippage protection (minOut parameter)
- Emergency pause
- Inventory limits

### 2. SettlementInbox.sol

**Purpose:** Log fills and emit events for relayer pickup.

**Simple Event Logger:**
```solidity
event Fill(
    bytes32 indexed fillId,
    address indexed trader,
    int256 xhtDelta,      // Positive = bought, negative = sold
    uint256 cashDelta,    // Payment in USD
    uint256 nonce,
    uint256 timestamp
);
```

## Capital Efficiency Model

### Problem: Liquidity Fragmentation
Traditional cross-chain models split liquidity across all chains, weakening price discovery and increasing slippage.

### Solution: Hub-and-Spoke with Minimal Spoke Capital

**Capital Distribution:**
- **95% on Xaheen Hub** → Deep liquidity, strong price discovery
- **5% on Spokes** → Just enough for visibility and instant fills

**How It Works:**
1. **Xaheen = Price Authority**
   - $600K XHT/USDT LP → Determines canonical price
   - All spoke trades follow Xaheen price (±0.25% spread)

2. **Spokes = Execution Layers**
   - BSC: $20K → Small showcase LP + hot inventory
   - Polygon: $15K → Small showcase LP + hot inventory
   - ETH: $5K → Hot inventory only (no LP)

3. **Arbitrage Bot Maintains ±0.5% Price Band**
   - Monitors price deviation across all chains
   - Executes arbitrage when deviation >0.3%
   - Self-funding (profit >$5 per trade)

## Arbitrage & Price Control

### Why Arbitrage Bot is Essential

With small spoke LPs, external traders could create price deviations. The arbitrage bot ensures:
- ✅ Price stays within ±0.5% tolerance
- ✅ Xaheen price remains canonical
- ✅ Self-funding (no operational cost)
- ✅ MEV protection via Flashbots

### Arbitrage Strategy

```
┌─────────────────────────────────────────────────────────┐
│                  Arbitrage Bot Logic                     │
├─────────────────────────────────────────────────────────┤
│ 1. Monitor Prices (every 30 seconds)                    │
│    - Xaheen TWAP: $0.10                                 │
│    - BSC PancakeSwap: $0.1035                           │
│    - Deviation: 3.5% (above 0.5% threshold)             │
│                                                          │
│ 2. Calculate Arbitrage Profit                           │
│    - Buy 10,000 XHT on Xaheen @ $0.10 = $1,000          │
│    - Sell 10,000 XHT on BSC @ $0.1035 = $1,035          │
│    - Gross Profit: $35                                  │
│    - Gas Cost: $5                                       │
│    - Net Profit: $30 ✅                                 │
│                                                          │
│ 3. Execute if Profit > $5 (covers gas)                  │
│    - Flashbots bundle (MEV protection)                  │
│    - Slippage: 0.5% max                                 │
│    - Result: Prices converge to ±0.5%                   │
└─────────────────────────────────────────────────────────┘
```

## User Experience

### For End Users (MetaMask, Trust Wallet)

**On BSC:**
```
MetaMask → Add Token
Contract: 0x[XHT_BSC_ADDRESS]
Symbol: XHT
Name: Xaheen Token
Decimals: 18

Balance: 250 XHT ✅
```

**On PancakeSwap:**
```
Swap BUSD → XHT
Price: $0.10
Volume: $240K
APR: 45%

Trade like any other token ✅
```

**Behind the Scenes:**
- Price comes from Xaheen PriceAuthority
- Trade routes through XaheenRouter
- Settlement happens on Xaheen hub
- User never sees cross-chain mechanics

### For Xaheen Team (Control)

**Complete Sovereignty:**
- ✅ Set all prices (via PriceAuthority TWAP)
- ✅ Control total supply (SupplyController)
- ✅ Enforce inventory caps (max 3% per spoke)
- ✅ Daily movement limits ($50K/day)
- ✅ Emergency pause (per chain or global)
- ✅ Multi-sig treasury (3-of-5)

**Visibility:**
- ✅ Real-time dashboards (all chain activity)
- ✅ Revenue tracking (0.35% fees)
- ✅ Arbitrage monitoring
- ✅ Circuit breaker alerts

## Security Architecture

### Multi-Layer Defense

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                        │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Quote Verification                             │
│   - PriceAuthority signature required                   │
│   - 60-second freshness limit                           │
│   - Nonce tracking (prevent replay)                     │
│                                                          │
│ Layer 2: Inventory Caps                                 │
│   - BSC: Max 3% circulating supply                      │
│   - Polygon: Max 2% circulating supply                  │
│   - Ethereum: Max 1% circulating supply                 │
│   - Auto-burn excess on settlement                      │
│                                                          │
│ Layer 3: Daily Limits                                   │
│   - $50K/day per chain                                  │
│   - Resets every 24 hours                               │
│   - Prevents rapid draining                             │
│                                                          │
│ Layer 4: Circuit Breakers                               │
│   - Price deviation >3% → Auto-pause chain              │
│   - Guardian can pause globally                         │
│   - Admin required to unpause                           │
│                                                          │
│ Layer 5: Multi-Sig Treasury                             │
│   - 3-of-5 Gnosis Safe                                  │
│   - 24h timelock for cap changes                        │
│   - 72h timelock for withdrawals                        │
│                                                          │
│ Layer 6: Finality Windows                               │
│   - BSC: 15 blocks (~45s)                               │
│   - Polygon: 128 blocks (~4 minutes)                    │
│   - Ethereum: 12 blocks (~2.5 minutes)                  │
│   - Prevents reorg attacks                              │
└─────────────────────────────────────────────────────────┘
```

## Deployment Sequence

### Phase 1: Hub Deployment (Xaheen Chain)

```bash
# 1. Deploy hub contracts
npx hardhat run scripts/deploy-crosschain-hub.js --network btcbr

# 2. Initialize TWAP checkpoint
priceAuthority.updateCheckpoint()

# 3. Setup multi-sig treasury
# Deploy Gnosis Safe (3-of-5)
# Grant TREASURY_ROLE to Safe

# 4. Grant OPERATOR_ROLE to relayer
supplyController.grantRole(OPERATOR_ROLE, relayerAddress)
```

### Phase 2: Spoke Deployment (BSC, Polygon, Ethereum)

```bash
# Deploy on BSC
npx hardhat run scripts/deploy-crosschain-spoke.js --network bsc

# Deploy on Polygon
npx hardhat run scripts/deploy-crosschain-spoke.js --network polygon

# Deploy on Ethereum
npx hardhat run scripts/deploy-crosschain-spoke.js --network mainnet
```

### Phase 3: Capital Seeding

```bash
# Xaheen Hub: $760K
# Add liquidity to XHT/USDT and XHT/BNB pools

# BSC: $20K
# Option A: Create XHT/BUSD LP on PancakeSwap ($10K)
# Option B: Replenish hot inventory ($20K)

# Polygon: $15K
# Option A: Create XHT/USDC LP on QuickSwap ($7.5K)
# Option B: Replenish hot inventory ($15K)

# Ethereum: $5K
# Replenish hot inventory only
```

### Phase 4: Arbitrage Bot Deployment

```bash
# Start arbitrage monitoring service
cd services/arbitrage-bot
npm install
npm run start

# Monitor logs for price deviations
# Execute arbitrage when deviation >0.3%
```

### Phase 5: Relayer Service

```bash
# Start relayer service
cd services/relayer
npm install
npm run start

# Monitor Fill events from all spokes
# Forward receipts to SettlementHub
```

## Economics & Revenue Model

### Revenue Sources

**0.35% Maker Fee on All Trades**
```
Daily Volume Scenarios:

Conservative ($50K/day):
├─> Fee Revenue: $175/day
├─> Annual: $63,875
└─> Breaks even in: 16-22 months

Moderate ($200K/day):
├─> Fee Revenue: $700/day
├─> Annual: $255,500
└─> Breaks even in: 4-5 months

Optimistic ($500K/day):
├─> Fee Revenue: $1,750/day
├─> Annual: $638,750
└─> Breaks even in: 1.5-2 months
```

### Capital Allocation ROI

**Xaheen Hub ($760K):**
- Deep liquidity → Low slippage
- Strong price discovery
- Attracts large trades
- LP fees (0.3%) → Additional revenue

**Spokes ($40K total):**
- Visibility on major chains
- Instant fills (no wait for settlement)
- Showcase presence
- Marketing benefit

**Arbitrage Bot:**
- Self-funding (profit >$5/trade)
- Maintains price stability
- No operational cost

## Next Steps

### Immediate (Week 1-2)
- [x] Deploy hub contracts on Xaheen
- [ ] Deploy spoke contracts on BSC testnet
- [ ] Test TWAP calculations
- [ ] Test quote signing/verification

### Short-Term (Week 3-4)
- [ ] Deploy to mainnet (all chains)
- [ ] Seed initial capital ($40-80K)
- [ ] Start arbitrage bot
- [ ] Monitor for 1 week

### Medium-Term (Week 5-8)
- [ ] Security audit (Hacken or BlockApex)
- [ ] Fix critical/high issues
- [ ] Public launch announcement
- [ ] Marketing campaign

### Long-Term (Month 3+)
- [ ] Expand to more chains (Arbitrum, Avalanche)
- [ ] Increase capital allocation based on volume
- [ ] DAO governance transition
- [ ] Additional revenue streams

## Contract Addresses

**Hub Contracts (Xaheen Chain):**
- PriceAuthority: `[TBD after deployment]`
- SupplyController: `[TBD after deployment]`
- SettlementHub: `[TBD after deployment]`

**Spoke Contracts (BSC):**
- XaheenRouter: `[TBD after deployment]`
- SettlementInbox: `[TBD after deployment]`

**Spoke Contracts (Polygon):**
- XaheenRouter: `[TBD after deployment]`
- SettlementInbox: `[TBD after deployment]`

**Spoke Contracts (Ethereum):**
- XaheenRouter: `[TBD after deployment]`
- SettlementInbox: `[TBD after deployment]`

---

**Status:** Week 1 Implementation Complete ✅
**Next:** Deploy to testnets for validation
