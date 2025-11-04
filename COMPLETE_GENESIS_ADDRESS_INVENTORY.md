# Complete Genesis Address Inventory

**Date**: 2025-01-27  
**Genesis**: `data/genesis-nor-complete-v2.json`  
**Chain ID**: 65001  
**Epoch**: 9,000,000 blocks (~1.5 years)

---

## Address Allocation Strategy

All contracts are assigned **sequential addresses** starting from BTCBR at `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`.

### Base Address
- **BTCBR**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` (preserved)

### Sequential Assignment
Each subsequent contract gets address = BASE + offset (in hex)

---

## Complete Address Inventory

### Core Tokens

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **BTCBR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F262` | +0 | Bitcoin Reserve token (21 septillion) |
| **NOR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F263` | +1 | Native gas token (21 billion, 24 decimals) |
| **NRG** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F264` | +2 | Nor Revenue Governance token (1 billion) |

### DEX Infrastructure

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **WNOR** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F265` | +3 | Wrapped NOR token |
| **NorSwapFactory** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F266` | +4 | DEX factory (Uniswap V2 fork) |
| **NorSwapRouter** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F267` | +5 | DEX router for swaps |

### Wrapped Tokens

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **WBNB** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F268` | +6 | Wrapped BNB |
| **WUSDT** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F269` | +7 | Wrapped USDT |
| **WETH** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F26A` | +8 | Wrapped ETH |

### Stablecoins

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **Dirhamat** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F26B` | +9 | AED/gold-backed stablecoin |
| **DigitalKES** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F26C` | +10 | Kenyan Shilling stablecoin |
| **NORDCoin** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F26D` | +11 | Nordic multi-currency stablecoin |

### Bridge Contracts

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **CrossChainBridge** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F26E` | +12 | Main cross-chain bridge |
| **BNBBridgeNor** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F26F` | +13 | BNB bridge (Nor side) |
| **USDTBridgeNor** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F270` | +14 | USDT bridge (Nor side) |
| **ETHBridgeNor** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F271` | +15 | ETH bridge (Nor side) |

### Governance & Staking

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **NorGovernance** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F272` | +16 | Decentralized governance |
| **NorStaking** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F273` | +17 | NOR token staking |
| **NorFarming** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F274` | +18 | Yield farming |

### Tokenomics

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **LiquidityLock** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F275` | +19 | LP token locking |
| **NORBurnMechanism** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F276` | +20 | Triple burn mechanism |
| **NORRevenue** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F277` | +21 | Revenue distribution |
| **WeeklyBuyback** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F278` | +22 | Automated buyback |

### Oracle Contracts

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **PriceOracle** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F279` | +23 | Centralized price oracle |
| **OracleAggregator** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F27A` | +24 | Multi-source oracle |

### Reserve & Funds

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **MultiAssetReserveVault** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F27B` | +25 | Multi-asset reserve vault |
| **NorFundFactory** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F27C` | +26 | Investment fund factory |

### Cross-Chain Infrastructure

| Contract | Address | Offset | Description |
|----------|---------|--------|-------------|
| **NorRouter** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F27D` | +27 | Cross-chain router |
| **SettlementHub** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F27E` | +28 | Settlement hub |
| **PriceAuthority** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F27F` | +29 | Price authority |
| **SupplyController** | `0x0cF8e180350253271f4b917CcFb0aCCc4862F280` | +30 | Supply controller |

---

## Validator Addresses

### Active Validators (3)
1. `0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a`
2. `0x689cf2c189781d9bb6859a830acbf64044e4432f`
3. `0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de`

**Note**: Validators are sorted **lowercase** in genesis extraData for proper epoch revalidation.

### Treasury/Deployer
- `0xdd779a290c937144f80eb75b75d814c834536b1b`

---

## DEX Pairs (Post-Genesis)

DEX pairs are created by the Factory using CREATE2, so addresses are deterministic but calculated after genesis.

### Expected Pair Addresses

Pairs are calculated using:
```
pairAddress = CREATE2(
  salt = keccak256(token0, token1),
  bytecode = NorSwapPair bytecode,
  deployer = NorSwapFactory address
)
```

**Common Pairs**:
- NOR/USDT: Calculated by Factory
- NOR/WBNB: Calculated by Factory
- NOR/WETH: Calculated by Factory
- Dirhamat/USDT: Calculated by Factory

---

## Address Validation

### Uniqueness ✅
- All 31 contract addresses are unique
- No conflicts or overlaps
- Sequential allocation prevents collisions

### BTCBR Preservation ✅
- BTCBR maintained at exact address: `0x0cF8...262`
- Bytecode and storage preserved from existing genesis

### Validator Ordering ✅
- Validators sorted lowercase in extraData
- Prevents epoch boundary deadlock
- Matches Parlia consensus requirements

---

## Epoch Revalidation Strategy

### Epoch Configuration
- **Epoch**: 9,000,000 blocks
- **Time**: ~312 days (~10.4 months)
- **First Boundary**: Block 9,000,000

### Validator Ordering Fix
- **Issue**: Unsorted validators cause deadlock at epoch boundary
- **Solution**: Validators sorted lowercase in genesis extraData
- **Result**: Validators can agree on epoch block header

### Testing Strategy
1. Test with smaller epoch (1000 blocks) on testnet
2. Verify epoch boundary transition
3. Confirm validators continue producing blocks
4. Deploy to production with 9M epoch

---

## Usage

### Generate Genesis
```bash
node scripts/generate-complete-nor-genesis.js
```

### Test Epoch Revalidation
```bash
./scripts/test-epoch-revalidation-complete.sh
```

### Verify Addresses
```bash
# Check BTCBR address
grep -A 5 "0x0cf8e180350253271f4b917ccfb0accc4862f262" data/genesis-nor-complete-v2.json

# Count contracts
python3 -c "import json; g=json.load(open('data/genesis-nor-complete-v2.json')); print(len([a for a in g['alloc'] if 'code' in g['alloc'][a] and len(g['alloc'][a]['code']) > 100]))"
```

---

## Summary

- **Total Contracts**: 31 contracts with bytecode
- **BTCBR**: Preserved at `0x0cF8...262`
- **Address Range**: `0x0cF8...262` to `0x0cF8...280`
- **Uniqueness**: ✅ All addresses unique
- **Epoch**: 9,000,000 blocks (fixed revalidation)
- **Validators**: Sorted lowercase for consensus

---

**Status**: ✅ Complete  
**Ready for**: Testing and deployment  
**Next**: Run epoch revalidation tests

