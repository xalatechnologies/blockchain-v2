# Parlia Consensus Deadlock - Root Cause Analysis & Fix

**Date**: October 31, 2025
**Chain**: Nor Chain (Chain ID: 65001)
**Issue**: Blockchain stuck at block 1 with all 3 validators showing "Signed recently, must wait for others"

## Problem Summary

After deploying genesis-xaheen-v2.json with 3 validators and 4 embedded ERC20 tokens, the blockchain was stuck at block 1 despite:
- ✅ All 3 validators running
- ✅ Mining enabled on all validators
- ✅ 2 peers connected on each validator
- ✅ Transactions being sent successfully
- ❌ **Blocks not being produced**

## Root Cause Analysis

### Initial Investigation
Checked all common issues:
1. Mining status: TRUE on all validators ✅
2. Peer connectivity: 2 peers on each ✅
3. Static-nodes.json: Created and applied ✅
4. Network ID flag: Added `--networkid 65001` ✅
5. Genesis initialization: All 3 validators initialized ✅

**Still stuck at block 1!**

### Deep Dive: Parlia Consensus Mechanism

Logs showed:
```
INFO [10-31|12:10:33.008] Commit new mining work  number=2
INFO [10-31|12:10:33.008] Signed recently, must wait for others
```

**Key Discovery**: ALL three validators showed "Signed recently" even though only validator 1 produced block 1. This revealed a **Parlia consensus deadlock**.

### The Actual Root Causes

After comparing with the previous working genesis (`genesis-xaheen-working.json`), we discovered:

#### 1. **MALFORMED EXTRADATA** ❌

**Problem**:
```
genesis-xaheen-v2.json extraData had extra padding at the end:
0x[32 bytes vanity][3 validators][65 bytes seal][EXTRA ZEROS!!!]
                                                   ^^^^^^^^^^^
                                                   CAUSED THE DEADLOCK
```

**Correct Format**:
```
0x[32 bytes vanity][N × 20 bytes validators][65 bytes seal]
  └─ 64 hex chars  └─ 120 hex chars (3×20)   └─ 130 hex chars

Total: 314 hex chars (no extra padding!)
```

**Our Fix**:
```javascript
const vanity = '0'.repeat(64);  // 32 bytes
const v1 = 'a3aac90d6505c2a57141eafda973222df91bbe1c';
const v2 = '632b5acf4ffbbe8dae81df89754fb1b217924788';
const v3 = 'b3b4f4fb663d9c8c6ad57e30631ae1bb0e60c62b';
const seal = '0'.repeat(130);  // 65 bytes of zeros for genesis

extraData = '0x' + vanity + v1 + v2 + v3 + seal;
// Exactly 314 hex chars - NO EXTRA PADDING
```

#### 2. **EPOCH VALUE TOO HIGH** ❌

**Problem**:
- Old epoch: 30000 (designed for mainnet BSC with 21 validators)
- Effect: Validator rotation happens every 30,000 blocks
- With chain stuck at block 1, rotation never happens!

**BSC Mainnet Standard**:
- 21 validators
- Epoch: 200 blocks
- Finality: 11 blocks (n/2 + 1 with n=21)

**Our Fix**:
```json
{
  "parlia": {
    "period": 3,
    "epoch": 200  // Changed from 30000
  }
}
```

#### 3. **NETWORKID FLAG MISSING** ⚠️

While not the primary cause, adding `--networkid 65001` ensures proper network identification and may have contributed to peer coordination issues.

## The Complete Solution

### 1. Fixed Genesis File (`genesis-xaheen-3-validators.json`)

```json
{
  "config": {
    "chainId": 65001,
    "parlia": {
      "period": 3,
      "epoch": 200
    }
  },
  "extraData": "0x[properly formatted 314 hex chars]",
  "alloc": {
    "0xdD779a290C937144F80Eb75b75d814c834536B1b": {...},
    "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C": {...},
    "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788": {...},
    "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B": {...}
  }
}
```

### 2. Validator Startup With Network ID

```bash
docker run -d --name xaheen-rpc --network host \
    -v ~/blockchain-v2/validator-1:/bsc \
    dysnix/bsc \
    --datadir /bsc \
    --networkid 65001 \  # CRITICAL: Added this flag
    --syncmode full \
    --gcmode archive \
    --http --http.addr 0.0.0.0 --http.port 8545 \
    --mine --miner.threads=1 \
    --unlock 0x$V1_ADDR \
    --password /bsc/password.txt
```

### 3. Static Peering Configuration

```bash
# validator-1/static-nodes.json
["enode://[v2]@127.0.0.1:30304", "enode://[v3]@127.0.0.1:30305"]

# validator-2/static-nodes.json
["enode://[v1]@127.0.0.1:30303", "enode://[v3]@127.0.0.1:30305"]

# validator-3/static-nodes.json
["enode://[v1]@127.0.0.1:30303", "enode://[v2]@127.0.0.1:30304"]
```

## Results

### Before Fix
- Block: 1 (stuck for hours)
- Status: "Signed recently, must wait for others" on ALL validators
- Mining: TRUE but no blocks produced
- Peers: 2 connected but deadlocked

### After Fix
```
[12:21:02] Block: 3, Peers: 2
[12:21:05] Block: 4, Peers: 2
[12:21:08] Block: 5, Peers: 2
[12:21:11] Block: 6, Peers: 2

🎉 CHAIN IS PRODUCING BLOCKS WITH 3 VALIDATORS!
```

## Key Learnings

### 1. ExtraData Format is CRITICAL
Parlia consensus relies on exact extraData formatting. Even a single extra byte causes consensus failure.

### 2. Epoch Must Match Validator Count
Small validator sets (3-7) need smaller epochs (200-500) for proper rotation and finality.

### 3. Network ID Flag Matters
While not always required, `--networkid` ensures proper network identification in multi-validator setups.

### 4. Web Research Validated Our Findings
Search for "BSC Parlia consensus validators" confirmed:
- Minimum validator set size considerations
- Epoch configuration importance
- "Signed recently" is part of normal Parlia operation, but shouldn't cause permanent deadlock

## Deployment Script

Complete fix deployed via:
```bash
./scripts/deploy-3-validators-fixed.sh
```

This script:
1. Uploads fixed genesis
2. Clears old blockchain data
3. Reinitializes all 3 validators
4. Starts validators with `--networkid 65001`
5. Creates static-nodes.json
6. Restarts validators to apply peering
7. Monitors block production

## Conclusion

**The Parlia deadlock was caused by:**
1. Malformed extraData with extra padding (PRIMARY CAUSE)
2. Epoch value too high for 3 validators (CONTRIBUTING FACTOR)
3. Missing --networkid flag (MINOR FACTOR)

**Fix applied:**
- Properly formatted 314-hex extraData
- Epoch: 200 (BSC standard)
- --networkid 65001 on all validators
- Static-nodes.json for persistent peering

**Result:** ✅ **Blockchain producing blocks successfully with 3 validators**

---

**Genesis Hash**: b62bac..0098b2
**Block Time**: 3 seconds
**Consensus**: Parlia PoSA
**Validators**: 3
**RPC**: https://rpc.xaheen.org
