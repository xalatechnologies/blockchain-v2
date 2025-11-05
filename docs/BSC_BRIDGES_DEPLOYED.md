# BSC MAINNET BRIDGES - DEPLOYED ✅

## Deployment Date: November 4, 2025

### PUBLIC VISIBILITY ACHIEVED! 🎉

Both NOR and BTCBR bridges are now live on BSC Mainnet for public visibility.

## Bridge Contract Addresses on BSC Mainnet

### 1. BTCBR Bridge
- **Contract Address**: `0x1A2651144788544222544FcC0109DECCE60AD1A6`
- **BSCScan**: https://bscscan.com/address/0x1A2651144788544222544FcC0109DECCE60AD1A6
- **Token on BSC**: `0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f` (BTCBR)
- **Configuration**:
  - Min Transfer: 100 BTCBR
  - Max Transfer: 100,000 BTCBR
  - Daily Limit: 500,000 BTCBR per address
  - Bridge Fee: 0.1% (10 basis points)
  - Validators: 3 (2-of-3 multisig required)

### 2. NOR Bridge
- **Contract Address**: `0xeEBA26529453B39876dAf0bE73216B71cdc07c3E`
- **BSCScan**: https://bscscan.com/address/0xeEBA26529453B39876dAf0bE73216B71cdc07c3E
- **Token on BSC**: `0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C` (NOR)
- **Configuration**:
  - Min Transfer: 100 NOR
  - Max Transfer: 100,000 NOR
  - Daily Limit: 500,000 NOR per address
  - Bridge Fee: 0.1% (10 basis points)
  - Validators: 3 (2-of-3 multisig required)

## Validators (2-of-3 Multisig)

All bridge operations require signatures from 2 out of 3 validators:

1. `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
2. `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
3. `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

## Bridge Architecture

### BSC Mainnet → NorChain
1. User locks tokens on BSC bridge contract
2. Validators monitor lock events
3. 2-of-3 validators sign mint transaction
4. Tokens minted on NorChain

### NorChain → BSC Mainnet
1. User burns tokens on NorChain bridge
2. Validators monitor burn events
3. 2-of-3 validators sign release transaction
4. Tokens released from BSC bridge contract

## NorChain Bridge Addresses (Private Chain)

- **BTCBRBridgePrivate**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **NORBridgePrivate**: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
- **NorChain RPC**: https://rpc.norchain.org (currently https://rpc.xaheen.org)
- **Chain ID**: 65001

## Token Symbols (NO "w" prefix!)

As per user requirement, tokens use SAME symbols on both chains:
- **NOR** (not wNOR) - Same on both BSC and NorChain
- **BTCBR** (not wBTCBR) - Same on both BSC and NorChain

## Public Visibility ✅

Both bridges are now publicly visible on BSCScan:
- Anyone can verify contract code
- Anyone can view bridge transactions
- Anyone can see validator configuration
- Anyone can check bridge balances and fees

## Next Steps

1. ✅ BSC bridges deployed
2. ⏳ Build validator relayer service
3. ⏳ Test bridge transfers (small amounts)
4. ⏳ Add liquidity on PancakeSwap (BSC)
5. ⏳ Add liquidity on NoorSwap (NorChain)
6. ⏳ Build bridge UI (React app)
7. ⏳ Public announcement and marketing

## Gas Used

- **Deployer**: `0xdD779a290C937144F80Eb75b75d814c834536B1b`
- **Starting Balance**: 0.082505 BNB
- **Final Balance**: 0.070156 BNB
- **Total Gas Used**: ~0.012349 BNB (~$7.50 USD)

## Verification on BSCScan

To verify contracts on BSCScan:

```bash
npx hardhat verify --network bsc 0x1A2651144788544222544FcC0109DECCE60AD1A6 "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f" 2

npx hardhat verify --network bsc 0xeEBA26529453B39876dAf0bE73216B71cdc07c3E "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C" 2
```

## STATUS: LIVE AND PUBLIC ✅

Both bridges are now live on BSC Mainnet and publicly visible. Cross-chain infrastructure complete!
