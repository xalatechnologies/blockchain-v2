# Inventory Discrepancies - Quick Reference

**Date**: 2025-01-27

## Critical Finding: Address Mismatches

The inventory documents show different addresses than what's actually deployed in production.

## Address Comparison Table

| Contract | Logical Inventory | Production (README) | Genesis | Status |
|----------|------------------|-------------------|---------|--------|
| **BTCBR** | `0x0cF8...262` | `0x0cF8...262` | ✅ `0x0cF8...262` | ✅ **MATCH** |
| **WNOR** | `0x0f84...` | `0x26c0...` | ❌ Not in genesis | ⚠️ **DIFFERENT** |
| **NorSwapFactory** | `0x9f37...` | `0x5DAB...` | ❌ Not in genesis | ⚠️ **DIFFERENT** |
| **NorSwapRouter** | `0x5132...` | `0xbe0d...` | ❌ Not in genesis | ⚠️ **DIFFERENT** |
| **CrossChainBridge** | `0xC808...` | Not listed | ❌ Not in genesis | ⚠️ **UNCLEAR** |
| **PriceOracle** | `0x2c09...` | `0x2c09...` | ❌ Not in genesis | ✅ **MATCH** |
| **Dirhamat** | `0xd1a0...` | `0xd1a0...` | ❌ Not in genesis | ✅ **MATCH** |
| **NorGovernance** | `0x5635...` | `0x5635...` | ❌ Not in genesis | ✅ **MATCH** |
| **NorStaking** | `0xed09...` | `0xed09...` | ❌ Not in genesis | ✅ **MATCH** |
| **LiquidityLock** | `0x704c...` | `0x704c...` | ❌ Not in genesis | ✅ **MATCH** |

## Key Insights

1. **BTCBR**: ✅ Only contract in genesis, addresses match everywhere
2. **DEX Contracts**: ⚠️ Inventory shows different addresses than production (likely old deployments)
3. **Other Contracts**: ✅ Most addresses match between inventory and production
4. **Genesis**: Only contains BTCBR, all others are post-genesis

## Recommended Source of Truth

**Use `README.md`** for production addresses - it's the most accurate source.

## Action Required

1. Update `nor-chain-logical-inventory.md` with addresses from README.md
2. Remove or archive `nor-ecosystem-inventory.json` (has placeholder addresses)
3. Document which contracts are genesis vs post-genesis

