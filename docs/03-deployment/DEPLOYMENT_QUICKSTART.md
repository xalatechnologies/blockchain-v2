# Cross-Chain DEX Deployment - Quick Start Guide

## Prerequisites

1. **Environment Variables (.env)**
```bash
# Xaheen Chain
PRIVATE_CHAIN_RPC=https://rpc.xaheen.org
PRIVATE_CHAIN_KEY=your_xaheen_deployer_private_key

# BSC
BSC_MAINNET_RPC=https://bsc.publicnode.com
BSC_PRIVATE_KEY=your_bsc_deployer_private_key

# Polygon
POLYGON_RPC=https://polygon-rpc.com
POLYGON_PRIVATE_KEY=your_polygon_deployer_private_key

# Ethereum
ETH_RPC=https://eth.llamarpc.com
ETH_PRIVATE_KEY=your_eth_deployer_private_key

# Configuration
XAHEEN_PAIR_ADDRESS=0x[XHT/USDT_PAIR_ADDRESS]
XHT_TOKEN_ADDRESS=0x[XHT_TOKEN_ADDRESS]
TREASURY_ADDRESS=0x[GNOSIS_SAFE_ADDRESS]
RELAYER_ADDRESS=0x[RELAYER_SERVICE_ADDRESS]

# Spoke XHT Addresses (after bridging/wrapping)
XHT_BSC_ADDRESS=0x[WRAPPED_XHT_BSC]
XHT_POLYGON_ADDRESS=0x[WRAPPED_XHT_POLYGON]
XHT_ETH_ADDRESS=0x[WRAPPED_XHT_ETH]

# Quote Signer
PRICE_AUTHORITY_SIGNER=0x[AUTHORIZED_SIGNER]
```

---

## Phase 1: Hub Deployment (Xaheen Chain)

### Step 1: Compile Contracts
```bash
npx hardhat compile
```

### Step 2: Deploy Hub Contracts
```bash
npx hardhat run scripts/deploy-crosschain-hub.js --network btcbr
```

**Expected Output:**
```
✅ PriceAuthority deployed at: 0x...
✅ SupplyController deployed at: 0x...
✅ SettlementHub deployed at: 0x...
```

### Step 3: Initialize TWAP Checkpoint
```bash
# Using Hardhat console
npx hardhat console --network btcbr

const PriceAuthority = await ethers.getContractAt("PriceAuthority", "0x[DEPLOYED_ADDRESS]");
await PriceAuthority.updateCheckpoint();
```

### Step 4: Setup Multi-Sig Treasury

**Using Gnosis Safe UI:**
1. Go to https://app.safe.global
2. Create new Safe (3-of-5 signers)
3. Grant TREASURY_ROLE to Safe:
```javascript
const SupplyController = await ethers.getContractAt("SupplyController", "0x[DEPLOYED_ADDRESS]");
const TREASURY_ROLE = await SupplyController.TREASURY_ROLE();
await SupplyController.grantRole(TREASURY_ROLE, "0x[GNOSIS_SAFE_ADDRESS]");
```

### Step 5: Grant Relayer Permissions
```javascript
const SettlementHub = await ethers.getContractAt("SettlementHub", "0x[DEPLOYED_ADDRESS]");
const RELAYER_ROLE = await SettlementHub.RELAYER_ROLE();
await SettlementHub.grantRole(RELAYER_ROLE, "0x[RELAYER_ADDRESS]");

const SupplyController = await ethers.getContractAt("SupplyController", "0x[DEPLOYED_ADDRESS]");
const OPERATOR_ROLE = await SupplyController.OPERATOR_ROLE();
await SupplyController.grantRole(OPERATOR_ROLE, "0x[RELAYER_ADDRESS]");
```

---

## Phase 2: Spoke Deployment

### BSC Deployment

**Step 1: Deploy Spoke Contracts**
```bash
npx hardhat run scripts/deploy-crosschain-spoke.js --network bsc
```

**Expected Output:**
```
✅ XaheenRouter deployed at: 0x...
✅ SettlementInbox deployed at: 0x...
✅ Payment tokens configured (USDT, BUSD)
```

**Step 2: Replenish Hot Inventory ($10K worth of XHT)**
```javascript
const XaheenRouter = await ethers.getContractAt("XaheenRouter", "0x[BSC_ROUTER_ADDRESS]");
const XHT = await ethers.getContractAt("IERC20", "0x[XHT_BSC_ADDRESS]");

// Approve router to spend XHT
await XHT.approve("0x[BSC_ROUTER_ADDRESS]", ethers.parseEther("100000")); // 100K XHT

// Replenish inventory
await XaheenRouter.replenishInventory(ethers.parseEther("100000"));
```

**Step 3: (Optional) Create Public LP on PancakeSwap**
```javascript
// Go to https://pancakeswap.finance/add
// Add liquidity: XHT/BUSD ($10K worth)
// Get LP address from transaction

// Register LP in XaheenRouter
await XaheenRouter.registerPublicLP(
    "0x55d398326f99059fF775485246999027B3197955", // BUSD address
    "0x[XHT_BUSD_LP_ADDRESS]"
);
```

---

### Polygon Deployment

**Step 1: Deploy Spoke Contracts**
```bash
npx hardhat run scripts/deploy-crosschain-spoke.js --network polygon
```

**Step 2: Replenish Hot Inventory ($7.5K worth of XHT)**
```javascript
const XaheenRouter = await ethers.getContractAt("XaheenRouter", "0x[POLYGON_ROUTER_ADDRESS]");
const XHT = await ethers.getContractAt("IERC20", "0x[XHT_POLYGON_ADDRESS]");

await XHT.approve("0x[POLYGON_ROUTER_ADDRESS]", ethers.parseEther("75000"));
await XaheenRouter.replenishInventory(ethers.parseEther("75000"));
```

**Step 3: (Optional) Create Public LP on QuickSwap**
```javascript
// Go to https://quickswap.exchange/#/pool
// Add liquidity: XHT/USDC ($7.5K worth)
// Register LP in XaheenRouter
```

---

### Ethereum Deployment

**Step 1: Deploy Spoke Contracts**
```bash
npx hardhat run scripts/deploy-crosschain-spoke.js --network mainnet
```

**Step 2: Replenish Hot Inventory ($5K worth of XHT)**
```javascript
const XaheenRouter = await ethers.getContractAt("XaheenRouter", "0x[ETH_ROUTER_ADDRESS]");
const XHT = await ethers.getContractAt("IERC20", "0x[XHT_ETH_ADDRESS]");

await XHT.approve("0x[ETH_ROUTER_ADDRESS]", ethers.parseEther("50000"));
await XaheenRouter.replenishInventory(ethers.parseEther("50000"));
```

---

## Phase 3: Relayer Service

### Setup Relayer

**Step 1: Install Dependencies**
```bash
cd services/relayer
npm install ethers dotenv
```

**Step 2: Configure Relayer**
```javascript
// services/relayer/config.js
export const config = {
    xaheenRpc: process.env.PRIVATE_CHAIN_RPC,
    bscRpc: process.env.BSC_MAINNET_RPC,
    polygonRpc: process.env.POLYGON_RPC,
    ethRpc: process.env.ETH_RPC,

    settlementHub: process.env.SETTLEMENT_HUB_ADDRESS,
    priceAuthority: process.env.PRICE_AUTHORITY_ADDRESS,

    spokes: {
        56: { // BSC
            inboxAddress: process.env.SETTLEMENT_INBOX_BSC_ADDRESS,
            confirmations: 15
        },
        137: { // Polygon
            inboxAddress: process.env.SETTLEMENT_INBOX_POLYGON_ADDRESS,
            confirmations: 128
        },
        1: { // Ethereum
            inboxAddress: process.env.SETTLEMENT_INBOX_ETH_ADDRESS,
            confirmations: 12
        }
    }
};
```

**Step 3: Start Relayer**
```bash
npm run start
```

---

## Phase 4: Arbitrage Bot

### Setup Arbitrage Bot

**Step 1: Install Dependencies**
```bash
cd services/arbitrage-bot
npm install ethers dotenv flashbots
```

**Step 2: Configure Bot**
```javascript
// services/arbitrage-bot/config.js
export const config = {
    priceAuthority: process.env.PRICE_AUTHORITY_ADDRESS,

    xaheenDex: {
        rpc: process.env.PRIVATE_CHAIN_RPC,
        pairAddress: process.env.XAHEEN_PAIR_ADDRESS
    },

    spokes: [
        {
            chainId: 56,
            name: "BSC",
            rpc: process.env.BSC_MAINNET_RPC,
            dexRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap
            xhtAddress: process.env.XHT_BSC_ADDRESS
        },
        {
            chainId: 137,
            name: "Polygon",
            rpc: process.env.POLYGON_RPC,
            dexRouter: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
            xhtAddress: process.env.XHT_POLYGON_ADDRESS
        }
    ],

    thresholds: {
        deviationTrigger: 0.003, // 0.3% deviation triggers arbitrage
        minProfit: 5, // $5 minimum profit (after gas)
        maxDeviation: 0.03 // 3% max deviation (circuit breaker)
    }
};
```

**Step 3: Start Bot**
```bash
npm run start
```

---

## Phase 5: Verification & Testing

### Test Trade Flow

**Step 1: Buy XHT on BSC**
```javascript
const XaheenRouter = await ethers.getContractAt("XaheenRouter", "0x[BSC_ROUTER_ADDRESS]");
const BUSD = await ethers.getContractAt("IERC20", "0x55d398326f99059fF775485246999027B3197955");

// Get signed quote from PriceAuthority
const signedQuote = await getSignedQuote(); // From relayer service

// Approve BUSD
await BUSD.approve("0x[BSC_ROUTER_ADDRESS]", ethers.parseEther("100"));

// Buy 1000 XHT with 100 BUSD
await XaheenRouter.buyXHT(
    "0x55d398326f99059fF775485246999027B3197955", // BUSD
    ethers.parseEther("100"), // 100 BUSD
    ethers.parseEther("990"), // Min 990 XHT (1% slippage)
    signedQuote,
    Math.floor(Date.now() / 1000) + 300 // 5 minute deadline
);
```

**Step 2: Verify Settlement**
```javascript
// Check SettlementHub logs on Xaheen
const SettlementHub = await ethers.getContractAt("SettlementHub", "0x[HUB_ADDRESS]");
const events = await SettlementHub.queryFilter("FillProcessed");
console.log(events);
```

**Step 3: Check Inventory**
```javascript
const SupplyController = await ethers.getContractAt("SupplyController", "0x[CONTROLLER_ADDRESS]");
const inventory = await SupplyController.getChainInventory(56); // BSC
console.log("BSC Inventory:", inventory);
```

---

## Phase 6: Monitoring

### Dashboard Metrics

**Key Metrics to Track:**
1. **Volume:**
   - Daily volume per chain
   - Total cross-chain volume
   - Top trading pairs

2. **Inventory:**
   - Hot inventory balance per chain
   - Inventory utilization (%)
   - Rebalancing needs

3. **Pricing:**
   - TWAP accuracy
   - Price deviation per chain
   - Arbitrage opportunities

4. **Revenue:**
   - Daily fee revenue (0.35%)
   - Cumulative revenue
   - ROI progress

5. **Security:**
   - Circuit breaker triggers
   - Failed settlements
   - Unauthorized access attempts

---

## Emergency Procedures

### Circuit Breaker Activation

**If Price Deviation >3%:**
```javascript
const SettlementHub = await ethers.getContractAt("SettlementHub", "0x[HUB_ADDRESS]");

// Pause specific chain
await SettlementHub.pauseChain(56); // Pause BSC

// Or global pause
await SettlementHub.globalPause();
```

### Inventory Emergency Withdrawal

**Using Multi-Sig (3-of-5):**
```javascript
// Queue withdrawal (72h timelock)
const SupplyController = await ethers.getContractAt("SupplyController", "0x[CONTROLLER_ADDRESS]");
// Withdrawal logic TBD based on emergency type
```

---

## Contract Addresses Checklist

After deployment, save these addresses:

### Hub (Xaheen Chain)
- [ ] PriceAuthority: `0x________________________`
- [ ] SupplyController: `0x________________________`
- [ ] SettlementHub: `0x________________________`

### BSC Spoke
- [ ] XaheenRouter: `0x________________________`
- [ ] SettlementInbox: `0x________________________`
- [ ] XHT Token (wrapped): `0x________________________`

### Polygon Spoke
- [ ] XaheenRouter: `0x________________________`
- [ ] SettlementInbox: `0x________________________`
- [ ] XHT Token (wrapped): `0x________________________`

### Ethereum Spoke
- [ ] XaheenRouter: `0x________________________`
- [ ] SettlementInbox: `0x________________________`
- [ ] XHT Token (wrapped): `0x________________________`

### Infrastructure
- [ ] Multi-Sig Treasury: `0x________________________`
- [ ] Relayer Service: `0x________________________`
- [ ] Arbitrage Bot: `0x________________________`

---

## Troubleshooting

### Common Issues

**Issue: "Invalid quote signature"**
- Check PRICE_AUTHORITY_SIGNER matches PriceAuthority.quoteSigner
- Verify quote freshness (<60s)
- Check nonce is increasing

**Issue: "Insufficient inventory"**
- Replenish hot inventory on spoke
- Check inventory caps haven't been exceeded
- Verify daily limits haven't been hit

**Issue: "Daily limit exceeded"**
- Wait 24 hours for reset
- Increase daily limit via multi-sig + timelock
- Use alternative spoke chain

**Issue: Arbitrage bot not executing**
- Check deviation is >0.3%
- Verify profit calculation >$5
- Check gas prices
- Ensure Flashbots connection

---

## Next Steps After Deployment

1. **Monitor for 1 Week**
   - Watch all metrics
   - Test small trades daily
   - Verify settlement accuracy

2. **Security Audit**
   - Engage Hacken or BlockApex
   - Fix critical/high issues
   - Re-audit if needed

3. **Marketing Launch**
   - Announce on socials
   - Add to CoinGecko/CMC
   - Publish tutorial videos
   - Onboard early users

4. **Optimize Operations**
   - Fine-tune arbitrage thresholds
   - Adjust inventory levels
   - Add more trading pairs
   - Expand to more chains

---

**Status:** Ready for Testnet Deployment ✅

**Estimated Time:** 2-3 hours for full deployment + 1 week monitoring
