# Public Blockchain DEX Access Architecture
## Enabling NorChain DEX Trading from BSC, Ethereum, and Other Public Chains

---

## Overview

To allow users to trade on NorChain DEX from public blockchains (BSC, Ethereum, Polygon, etc.) without needing to connect directly to NorChain, we need a **cross-chain bridge infrastructure** that wraps NorChain assets on public chains.

---

## Architecture: 3-Layer System

### Layer 1: NorChain (Private Chain)
**Current Status**: ✅ DEPLOYED

- NoorSwap DEX with 10 trading pairs
- 36 contracts deployed in genesis
- 3 validators producing blocks
- $5.5M total liquidity

### Layer 2: Bridge Contracts
**Status**: ⏳ PARTIAL (NorChain side deployed, BSC side pending)

#### On NorChain (✅ Deployed):
- `BTCBRBridgePrivate`: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `NORBridgePrivate`: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`

#### On BSC Mainnet (⏳ Pending Deployment):
- `BTCBRBridgeMainnet` - Lock/unlock BTCBR on BSC
- `NORBridgeMainnet` - Lock/unlock NOR on BSC
- **Requirements**: 0.02 BNB for gas

### Layer 3: Wrapped Tokens on Public Chains
**Status**: ⏳ NEEDS DEPLOYMENT

#### Wrapped Tokens to Deploy on BSC:
1. **wNOR** (Wrapped NOR) - ERC20 on BSC
2. **wBTCBR** (Wrapped BTCBR) - ERC20 on BSC (might already exist at `0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f`)
3. **wDirhamat** (Wrapped Dirhamat) - ERC20 on BSC
4. **wDigitalKES** (Wrapped Digital KES) - ERC20 on BSC
5. **wNordCoin** (Wrapped NordCoin) - ERC20 on BSC

---

## User Flow: Trading from BSC

### Scenario: User on BSC wants to trade NOR/USDT

**Option 1: Direct Bridge + Trade**
1. User has BNB on BSC
2. User bridges BNB → NorChain using NORBridge
3. User receives WBNB on NorChain
4. User trades WBNB → NOR on NoorSwap
5. User optionally bridges NOR back to BSC as wNOR

**Option 2: Wrapped Token Trading (Recommended)**
1. User has USDT on BSC
2. User bridges USDT → NorChain
3. User trades USDT → NOR on NoorSwap
4. User bridges NOR → BSC as wNOR
5. User can trade wNOR on PancakeSwap (if liquidity exists)

**Option 3: Cross-Chain Aggregator (Future)**
1. User submits trade on BSC: BNB → NOR
2. Aggregator routes: BSC → NorChain → BSC
3. User receives wNOR on BSC
4. All happens in single transaction (using relayer)

---

## Deployment Requirements

### 1. Deploy Wrapped Token Contracts on BSC
**Contracts to Deploy**:
- `WrappedNOR.sol` (wNOR) - ERC20 with minting/burning by bridge
- `WrappedDirhamat.sol` (wDirhamat)
- `WrappedDigitalKES.sol` (wDigitalKES)
- `WrappedNordCoin.sol` (wNordCoin)

**Features**:
- Only bridge contracts can mint/burn
- Standard ERC20 interface
- PancakeSwap compatible
- MetaMask compatible

### 2. Deploy Bridge Contracts on BSC
**Command**:
```bash
npx hardhat run scripts/deploy-all-bridges-bsc.js --network bsc
```

**Requirements**:
- 0.02 BNB in deployer wallet for gas
- BSC mainnet RPC URL in .env
- Deployer private key

**Contracts**:
- `BTCBRBridgeMainnet` - Lock/unlock BTCBR on BSC
- `NORBridgeMainnet` - Lock/unlock NOR on BSC

### 3. Deploy Liquidity Pools on PancakeSwap
**Pairs to Create**:
1. wNOR/BNB - Primary trading pair
2. wNOR/USDT - Stablecoin pair
3. wBTCBR/USDT - Bridge token pair
4. wDirhamat/USDT - Stablecoin backing
5. wDigitalKES/USDT - African market pair

**Initial Liquidity Required**: ~$500k total
- wNOR/BNB: 5M wNOR / 100 BNB (~$60k)
- wNOR/USDT: 10M wNOR / 100k USDT
- wBTCBR/USDT: 2M wBTCBR / 100k USDT
- wDirhamat/USDT: 200k wDirhamat / 50k USDT
- wDigitalKES/USDT: 500k wDigitalKES / 50k USDT

---

## Bridge Mechanics

### Lock & Mint Mechanism

**BSC → NorChain**:
1. User locks tokens in `BTCBRBridgeMainnet` (BSC)
2. Emits `Deposit` event with amount, recipient, nonce
3. Validators (2-of-3) sign off-chain
4. Relayer submits to `BTCBRBridgePrivate` (NorChain)
5. NorChain bridge mints equivalent tokens
6. User receives tokens on NorChain

**NorChain → BSC**:
1. User burns tokens in `BTCBRBridgePrivate` (NorChain)
2. Emits `Withdraw` event
3. Validators (2-of-3) sign off-chain
4. Relayer submits to `BTCBRBridgeMainnet` (BSC)
5. BSC bridge unlocks tokens
6. User receives tokens on BSC

### Fee Structure
- **BSC → NorChain**: 0.1% (10 basis points)
- **NorChain → BSC**: 0.2% (20 basis points)
- **Minimum**: 10 tokens (BTCBR) or 100 tokens (NOR)

### Limits
- **Min Transfer**: 100 tokens
- **Max Transfer**: 100,000 tokens
- **Daily Limit**: 500,000 tokens per address

---

## Validator Relayer Service

To make bridges functional, we need a **relayer service** that:

1. **Monitors Events** on both chains
2. **Collects Validator Signatures** (2-of-3 multisig)
3. **Submits Transactions** to destination chain
4. **Handles Failures** and retries

### Relayer Components

**Event Monitor**:
```javascript
// Monitor BSC for deposits
bscBridge.on('Deposit', async (from, amount, nonce) => {
  // Collect 2 validator signatures
  const signatures = await collectSignatures(from, amount, nonce);

  // Submit to NorChain
  await norChainBridge.mint(from, amount, signatures);
});
```

**Signature Collector**:
- Connects to 3 validator nodes
- Requests signatures for each bridge event
- Requires 2-of-3 consensus
- Timeouts after 60 seconds

**Transaction Submitter**:
- Gas price optimization
- Retry logic for failed transactions
- Nonce management
- Multi-chain support

---

## Deployment Steps

### Step 1: Prepare Deployer Wallet
```bash
# Check BNB balance on BSC
cast balance $DEPLOYER_ADDRESS --rpc-url $BSC_RPC

# Need at least 0.02 BNB for bridge deployment
# Need at least 1 BNB for liquidity deployment
```

### Step 2: Deploy Wrapped Token Contracts on BSC
```bash
# Deploy wNOR on BSC
npx hardhat run scripts/deploy-wrapped-nor-bsc.js --network bsc

# Deploy other wrapped tokens
npx hardhat run scripts/deploy-wrapped-tokens-bsc.js --network bsc
```

### Step 3: Deploy Bridge Contracts on BSC
```bash
# Deploy BTCBR and NOR bridges to BSC mainnet
npx hardhat run scripts/deploy-all-bridges-bsc.js --network bsc
```

### Step 4: Add Liquidity on PancakeSwap
```bash
# Add wNOR/BNB liquidity
npx hardhat run scripts/add-pancakeswap-liquidity.js --network bsc
```

### Step 5: Deploy Relayer Service
```bash
cd relayer/
npm install
npm run build

# Start relayer
npm start
```

### Step 6: Test Bridge
```bash
# Test BTCBR transfer BSC → NorChain
npx hardhat run scripts/test-bridge-btcbr.js --network bsc
```

---

## Security Considerations

### Multi-Signature Validation
- 3 validators total
- 2-of-3 signatures required
- Prevents single point of failure

### Transfer Limits
- Min: 100 tokens (prevents spam)
- Max: 100,000 tokens (prevents large unauthorized drains)
- Daily: 500,000 tokens per address (rate limiting)

### Emergency Pause
- Owner can pause bridges
- Prevents exploitation during attacks
- Requires 24-hour timelock

### Audit Requirements
- Full smart contract audit
- Bridge security review
- Relayer penetration testing

---

## Timeline & Costs

### Development Timeline
1. **Week 1**: Deploy wrapped tokens + bridges on BSC
2. **Week 2**: Build and test relayer service
3. **Week 3**: Add PancakeSwap liquidity
4. **Week 4**: Security audit + testing
5. **Week 5**: Public launch

### Estimated Costs
- **BSC Deployment**: 0.05 BNB (~$30)
- **Initial Liquidity**: $500k worth of tokens
- **Relayer Hosting**: $50/month (AWS)
- **Security Audit**: $10k-$20k
- **Total**: ~$520k + audit costs

---

## Next Steps

**Immediate (Today)**:
1. ✅ Create wrapped token contracts
2. ✅ Update BSC bridge deployment scripts
3. ⏳ Add BNB to deployer wallet for gas
4. ⏳ Deploy bridges to BSC mainnet

**Short-term (This Week)**:
1. Build relayer service
2. Test bridge transfers
3. Add PancakeSwap liquidity
4. Launch cross-chain trading

**Long-term (Next Month)**:
1. Deploy to Ethereum mainnet
2. Deploy to Polygon
3. Integrate with cross-chain aggregators (Li.Fi, Socket)
4. Launch public DEX access

---

## Commands Summary

```bash
# 1. Deploy bridges to NorChain (✅ DONE)
node scripts/deploy-all-bridges-xaheen.js

# 2. Deploy bridges to BSC (⏳ PENDING - needs 0.02 BNB)
npx hardhat run scripts/deploy-all-bridges-bsc.js --network bsc

# 3. Deploy wrapped tokens to BSC (⏳ PENDING)
npx hardhat run scripts/deploy-wrapped-tokens-bsc.js --network bsc

# 4. Add PancakeSwap liquidity (⏳ PENDING)
npx hardhat run scripts/add-pancakeswap-liquidity.js --network bsc

# 5. Start relayer service (⏳ PENDING)
cd relayer && npm start
```

---

**Status**: Architecture documented, NorChain bridges deployed, BSC deployment pending BNB for gas

**Contact**: For deployment assistance or questions about public blockchain DEX access
