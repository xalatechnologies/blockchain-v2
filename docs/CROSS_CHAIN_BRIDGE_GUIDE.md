# Cross-Chain Bridge Guide

## NorChain ↔ BSC Bridge System

This guide explains how to bridge real USDT, BNB, and ETH from BSC Mainnet to NorChain.

## Overview

**Bridge Architecture**: Lock & Mint with 2-of-3 Validator Signatures

- **BSC Side**: Lock real tokens in escrow
- **NorChain Side**: Mint wrapped tokens (WUSDT, WBNB, WETH)
- **Security**: Requires 2 out of 3 validator signatures

## Deployed Contracts

### NorChain Contracts

| Token | Address |
|-------|---------|
| **WUSDT** | `0x7Ad030f7549F02B7258F1c54E6B909b1d5F49d82` |
| **WBNB** | `0x1a49C061d9131c90e9141D8D9754Bf4c8Bd2c82A` |
| **WETH** | `0xEd511294b4Fa418458B2abD577F26104cdB3D4af` |

| Bridge | Address |
|--------|---------|
| **USDT Bridge** | `0xb9B2139a1682c07411E2e13333132C68671664Ff` |
| **BNB Bridge** | `0x70252c548B5D7220e9cdc867b188594208FD0bE7` |
| **ETH Bridge** | `0x64d3fd069d0b151B847284c2bDA4B3f3cDB4664e` |

### BSC Source Tokens

| Token | BSC Mainnet Address |
|-------|---------------------|
| **USDT** (Binance-Peg) | `0x55d398326f99059fF775485246999027B3197955` |
| **WBNB** | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| **ETH** (Binance-Peg) | `0x2170Ed0880ac9A755fd29B2688956BD959F933F8` |

### Validators (2 of 3 required)

1. `0x2844Ae34e062BAA32c46702EaAEe70E3B3E4Ae50`
2. `0x109E44D07f2dA6eDbB989fc735d790F3D5668f33`
3. `0x89DCadbA1C8128b653C63EA3519Cc158ADc67b4f`

## DEX Trading Pairs

All pairs created and ready for liquidity:

| Pair | Address |
|------|---------|
| **NOR/WUSDT** | `0x635f3A136183BfEb3e8e008BBF88Ab4d875DedC5` |
| **NOR/WBNB** | `0xD7A1bc51AffA463c3928e2c922F4D530C0dF76da` |
| **NOR/WETH** | `0x80FDF080e578f6E29706DDb2956b701a886e187A` |
| **BTCBR/WUSDT** | `0xB524729F699e6Af878d3540E93968ea9A01C7aC2` |

## How to Bridge Tokens

### Step 1: Prepare BSC Wallet

1. Get real USDT, BNB, or ETH on BSC Mainnet
2. Ensure you have extra BNB for gas fees (~0.01 BNB)
3. Connect wallet to BSC Mainnet (Chain ID: 56)

### Step 2: Lock Tokens on BSC (TODO: Deploy BSC Bridge Contracts)

**IMPORTANT**: BSC-side bridge contracts need to be deployed first.

You need to deploy:
- `USDTBridgeBSC.sol` - Locks USDT on BSC
- `BNBBridgeBSC.sol` - Locks BNB on BSC
- `ETHBridgeBSC.sol` - Locks ETH on BSC

These contracts will:
- Lock your tokens in escrow
- Emit `TokensLocked` event with nonce
- Require validator signatures to unlock

### Step 3: Get Validator Signatures

After locking tokens on BSC, validators must sign the mint transaction:

```javascript
// Message format for validators to sign
const message = ethers.solidityPackedKeccak256(
  ['address', 'uint256', 'uint256', 'uint256'],
  [recipient, amount, nonce, chainId]
);

// Each validator signs
const signature = await validator.signMessage(ethers.getBytes(message));
```

**Minimum 2 signatures required** from the 3 validators.

### Step 4: Mint Wrapped Tokens on NorChain

Once you have 2+ validator signatures:

```javascript
// Example: Mint WUSDT
const usdtBridge = await ethers.getContractAt(
  "USDTBridgeNor",
  "0xb9B2139a1682c07411E2e13333132C68671664Ff"
);

const tx = await usdtBridge.mintWUSDT(
  recipientAddress,
  amount,
  nonce,
  [signature1, signature2]
);
await tx.wait();
```

### Step 5: Verify Wrapped Tokens

Check your balance on NorChain:

```javascript
const wusdt = await ethers.getContractAt(
  "WrappedUSDT",
  "0x7Ad030f7549F02B7258F1c54E6B909b1d5F49d82"
);

const balance = await wusdt.balanceOf(yourAddress);
console.log("WUSDT Balance:", ethers.formatUnits(balance, 18));
```

## Bridge Security Features

### Nonce Protection
- Each bridge transfer has unique nonce
- Prevents replay attacks
- Nonces tracked on-chain

### Multi-Signature Validation
- Requires 2 of 3 validator signatures
- Prevents single point of failure
- Validators are independent entities

### Access Control
- Only bridges can mint wrapped tokens
- Minter role managed by AccessControl
- Owner can pause in emergency

## Adding Liquidity to DEX

Once you have wrapped tokens bridged:

```bash
# Run liquidity addition script
node scripts/add-cross-chain-liquidity.js
```

Suggested initial liquidity:
- **NOR/WUSDT**: 10,000 NOR + 100 USDT
- **NOR/WBNB**: 10,000 NOR + 1 BNB
- **NOR/WETH**: 10,000 NOR + 0.05 ETH

## Reverse Bridge (NorChain → BSC)

To bridge back from NorChain to BSC:

1. **Burn wrapped tokens** on NorChain
2. **Get validator signatures** for unlock
3. **Unlock real tokens** on BSC

```javascript
// Burn WUSDT on NorChain
await wusdt.burn(amount);

// Emit event for validators to sign
// Validators sign unlock message
// Use signatures to unlock on BSC
```

## TODO: Automated Bridge Service

For production, you should deploy:

1. **BSC Bridge Contracts** - Lock tokens on BSC
2. **Bridge Relayer Service** - Automate validator signatures
3. **Bridge UI** - User-friendly interface for bridging
4. **Bridge API** - REST API for bridge status and history

## Testing the Bridge

### Test Bridging USDT

```bash
# 1. Deploy test script
node scripts/test-bridge-usdt.js

# 2. Lock 100 USDT on BSC
# 3. Get signatures from validators
# 4. Mint 100 WUSDT on NorChain
# 5. Verify balance
```

### Monitor Bridge Events

```javascript
// Listen for TokensLocked on BSC
bscBridge.on("TokensLocked", (user, amount, nonce) => {
  console.log(`Locked: ${amount} from ${user}, nonce: ${nonce}`);
});

// Listen for Minted on NorChain
norBridge.on("Minted", (user, amount, nonce) => {
  console.log(`Minted: ${amount} to ${user}, nonce: ${nonce}`);
});
```

## Emergency Procedures

### Pause Bridge

If suspicious activity detected:

```javascript
// Only owner can pause
await bridge.pause();
```

### Resume Bridge

After investigation:

```javascript
await bridge.unpause();
```

### Revoke Validator

Remove compromised validator:

```javascript
await bridge.removeValidator(validatorAddress);
```

## Gas Costs

### BSC Side
- Lock tokens: ~50,000 gas (~0.0002 BNB or $0.12)
- Unlock tokens: ~80,000 gas (~0.0003 BNB or $0.18)

### NorChain Side
- Mint wrapped: ~150,000 gas (~0.00015 NOR)
- Burn wrapped: ~50,000 gas (~0.00005 NOR)

## Support

For bridge issues:
- **Email**: support@norchain.org
- **Discord**: discord.gg/norchain
- **Documentation**: norchain.org/docs/bridge

## Next Steps

1. ✅ **Wrapped token contracts deployed**
2. ✅ **Bridge contracts deployed on NorChain**
3. ✅ **DEX pairs created**
4. ⏳ **Deploy BSC-side bridge contracts**
5. ⏳ **Setup validator signature service**
6. ⏳ **Bridge initial liquidity**
7. ⏳ **Add liquidity to DEX pairs**
8. ⏳ **Lock LP tokens for security**
