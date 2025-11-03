# Cross-Chain Bridge Deployment Guide

## Overview

The Noor Chain cross-chain bridge enables users on Ethereum, BSC, and Polygon to purchase and trade BTCBR, NOR, and Dirhamat tokens seamlessly.

## Architecture

### Bridge Mechanism: Lock & Mint / Burn & Release

1. **From Noor Chain → External Chain**:
   - User locks tokens on Noor Chain via `CrossChainBridge.lock()`
   - 2/3 validators approve the transfer
   - Wrapped tokens are minted on external chain

2. **From External Chain → Noor Chain**:
   - User burns wrapped tokens via `WrappedToken.redeem()`
   - Validators observe burn event
   - Original tokens are released on Noor Chain

### Security

- **Multi-Sig Validation**: 2-of-3 validator signatures required
- **Validator Nodes**: 
  - 0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C
  - 0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788
  - 0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B
- **Pausable**: Emergency pause functionality
- **Blacklist**: Compliance controls for Dirhamat

## Deployed Contracts (Noor Chain)

### CrossChainBridge
- **Address**: `0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84`
- **Chain ID**: 65001 (Noor Chain)
- **Supported Tokens**:
  - BTCBR: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
  - WNOR: `0x0f8498072DB1611497e2068f9896aeFfcf173583`
  - Dirhamat: `0xd1a00bb0f0af75c20D58ABcF11590780003133D7`

### Bridge Connections
- **Ethereum Mainnet** (Chain ID: 1)
- **BSC Mainnet** (Chain ID: 56)
- **Polygon Mainnet** (Chain ID: 137)

## External Chain Deployment (Required)

### Step 1: Deploy Wrapped Tokens

On Ethereum, BSC, and Polygon, deploy:

1. **WrappedBTCBR** (`contracts/wrapped/WrappedBTCBR.sol`)
   ```solidity
   constructor(address _bridge)
   ```

2. **WrappedNOR** (`contracts/wrapped/WrappedNOR.sol`)
   ```solidity
   constructor(address _bridge)
   ```

3. **WrappedDirhamat** (`contracts/wrapped/WrappedDirhamat.sol`)
   ```solidity
   constructor(address _bridge, address _compliance)
   ```

### Step 2: Deploy CrossChainBridge

On each external chain:

```solidity
CrossChainBridge bridge = new CrossChainBridge(2); // 2 required signatures
```

### Step 3: Configure Bridges

On each external chain bridge:

```javascript
// Add validators
await bridge.addValidator("0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C");
await bridge.addValidator("0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788");
await bridge.addValidator("0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B");

// Add supported wrapped tokens
await bridge.addToken(wrappedBTCBR.address);
await bridge.addToken(wrappedNOR.address);
await bridge.addToken(wrappedDirhamat.address);

// Add Noor Chain connection
await bridge.addBridge(
  65001, // Noor Chain ID
  "Noor Chain",
  "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84" // Noor bridge address
);
```

### Step 4: Update Noor Chain Bridge

After deploying on external chains, update Noor bridge with actual addresses:

```python
# Update Ethereum bridge address
tx = noor_bridge.functions.updateBridge(
    1,  # Ethereum chain ID
    ethereum_bridge_address
).build_transaction({...})

# Repeat for BSC (56) and Polygon (137)
```

## Usage Examples

### Example 1: Buy BTCBR from Ethereum

```javascript
// 1. User on Ethereum approves wrapped BTCBR bridge
const bridge = new ethers.Contract(ETHEREUM_BRIDGE_ADDRESS, abi, signer);

// 2. Lock ETH/USDT and swap for wBTCBR on Uniswap (external DEX)
await uniswapRouter.swapExactETHForTokens(
  0, // min amount
  [WETH, wBTCBR],
  userAddress,
  deadline
);

// 3. Bridge wBTCBR to Noor Chain
await wBTCBR.approve(bridge.address, amount);
await wBTCBR.redeem(amount, noorChainAddress); // Burns and unlocks on Noor
```

### Example 2: Bridge BTCBR from Noor to BSC

```javascript
// 1. User on Noor Chain locks BTCBR
const noorBridge = new ethers.Contract(NOOR_BRIDGE_ADDRESS, abi, signer);

await btcbr.approve(noorBridge.address, amount);
await noorBridge.lock(
  BTCBR_ADDRESS,
  amount,
  bscRecipientAddress,
  56 // BSC chain ID
);

// 2. Validators observe lock event and approve
// (Automated by validator nodes)

// 3. After 2/3 approvals, wBTCBR is minted on BSC
// User receives wBTCBR on BSC and can trade on PancakeSwap
```

### Example 3: Buy Dirhamat from Polygon

```javascript
// 1. Swap MATIC for wDIRHAMAT on Polygon DEX
await quickswapRouter.swapExactETHForTokens(
  0,
  [WMATIC, wDIRHAMAT],
  userAddress,
  deadline
);

// 2. Hold wDIRHAMAT (AED-pegged stablecoin) or bridge to Noor
await wDIRHAMAT.redeem(amount, noorAddress);
```

## Validator Operations

### Approving Cross-Chain Transfers

Validators monitor both chains and approve transfers:

```javascript
// When user locks on Noor Chain
const lockEvent = await noorBridge.queryFilter("TransferInitiated");

// Validator approves on external chain
await externalBridge.approveTransfer(
  transferId,
  lockEvent.transactionHash
);

// After 2/3 approvals, wrapped tokens are automatically minted
```

### Emergency Procedures

**Pause Bridge** (if vulnerability detected):
```javascript
await bridge.pause();
```

**Cancel Fraudulent Transfer**:
```javascript
await bridge.cancelTransfer(transferId, "Fraud detected");
// Refunds tokens to original sender
```

## Liquidity Recommendations

To enable seamless cross-chain purchases:

### Ethereum
- Add wBTCBR/WETH pair on Uniswap V2/V3
- Add wNOR/WETH pair
- Add wDIRHAMAT/USDC pair (stablecoin pair)
- Recommended liquidity: $200K total

### BSC
- Add wBTCBR/WBNB pair on PancakeSwap
- Add wNOR/WBNB pair
- Add wDIRHAMAT/BUSD pair
- Recommended liquidity: $300K total

### Polygon
- Add wBTCBR/WMATIC pair on QuickSwap
- Add wNOR/WMATIC pair
- Add wDIRHAMAT/USDC pair
- Recommended liquidity: $150K total

## Monitoring & Analytics

### Key Metrics to Track

1. **Total Value Locked (TVL)**:
   ```javascript
   const btcbrLocked = await noorBridge.totalLocked(BTCBR_ADDRESS);
   ```

2. **Bridge Statistics**:
   ```javascript
   const stats = await wrappedBTCBR.getBridgeStats();
   // Returns: totalBridged, totalRedeemed, netLocked
   ```

3. **Pending Transfers**:
   ```javascript
   const transfer = await bridge.getTransfer(transferId);
   // Check approvals, execution status
   ```

## Security Considerations

1. **Rate Limiting**: Implement transfer limits per user/per day
2. **Oracle Integration**: Consider price feeds for large transfers
3. **Audit**: External audit recommended before mainnet launch
4. **Insurance**: Consider bridge insurance protocols (e.g., Nexus Mutual)
5. **Monitoring**: 24/7 validator monitoring with alerting

## Cost Analysis

### Gas Costs (Estimated)

| Operation | Noor Chain | Ethereum | BSC | Polygon |
|-----------|-----------|----------|-----|---------|
| Lock tokens | ~100K gas | N/A | N/A | N/A |
| Mint wrapped | N/A | ~150K gas | ~100K gas | ~80K gas |
| Burn wrapped | N/A | ~100K gas | ~80K gas | ~60K gas |
| Release tokens | ~120K gas | N/A | N/A | N/A |

### Fee Structure Recommendation

- **Bridge Fee**: 0.1% of transfer amount (to cover validator costs)
- **Minimum Transfer**: $10 equivalent (to prevent spam)
- **Maximum Transfer**: $100K per transaction (security)

## Next Steps

1. ✅ Deploy wrapped tokens on Ethereum mainnet
2. ✅ Deploy wrapped tokens on BSC mainnet
3. ✅ Deploy wrapped tokens on Polygon mainnet
4. ✅ Deploy CrossChainBridge on each external chain
5. ✅ Configure validators and multi-sig
6. ✅ Update Noor Chain bridge with external addresses
7. ✅ Add liquidity on external DEXs
8. ✅ Test cross-chain transfers
9. ✅ Launch bridge interface (UI)
10. ✅ Marketing and user education

## Support

For technical support or questions:
- Documentation: `/docs/BRIDGE_DEPLOYMENT_GUIDE.md`
- Discord: [Your Discord]
- Telegram: [Your Telegram]
- Email: support@noorchain.com
