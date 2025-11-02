# 🔬 Noor Chain P2P Root Cause Analysis

**Date**: November 2, 2025, 7:00 PM
**Status**: ⚠️ CRITICAL - Block production stuck at block 1
**Chain**: Noor Chain (formerly Xaheen), Chain ID 65001

---

## Executive Summary

**Problem**: Noor Chain validators produce genesis block (block 1) but then block production stops. Peer connectivity is unstable (0-1 peers instead of required 2 peers for Parlia consensus).

**Root Causes Identified**:
1. ✅ **Snap Protocol Incompatibility** (SOLVED)
2. ⚠️ **P2P Connectivity Instability** (ONGOING)
3. 📋 **Configuration Changed Since Success** (INVESTIGATION NEEDED)

---

## Timeline of Events

### Nov 2, 2025 - 5:03 PM: ✅ SUCCESS
- **Status**: Blocks producing successfully
- **Peers**: 3 peers connected
- **Blocks**: 14+ blocks confirmed
- **Configuration**: Using `docker start` on existing containers
- **Genesis**: epoch 9,000,000, hash `058b19..84d159`

### Nov 2, 2025 - 6:00 PM: ❌ REBRAND STARTED
- Started comprehensive Noor Chain rebrand
- Modified CLAUDE.md, hardhat.config.js, package.json
- Created brand identity documentation
- User requested epoch 10,000 for revalidation testing

### Nov 2, 2025 - 6:30 PM - 7:00 PM: 🔧 TROUBLESHOOTING
- Tried 15+ different configurations
- Identified and fixed snap protocol issue
- P2P connectivity remains unstable

---

## Root Cause #1: Snap Protocol Incompatibility ✅ SOLVED

### Problem
```
ERROR: "Snapshot extension registration failed - peer connected on snap without compatible eth support"
```

### Analysis
- Dysnix/bsc Docker image (3 years old, Geth v1.1.11) has snap protocol enabled by default
- `--syncmode full` alone does NOT disable snap protocol
- Peers would briefly connect, then immediately disconnect due to protocol mismatch

### Solution
**Add `--snapshot=false` flag to all validators**

```bash
docker create --name xaheen-rpc \
  --snapshot=false \  # CRITICAL FLAG
  --syncmode full \
  ...
```

###Result
✅ No more snap protocol errors
✅ Geth no longer advertises snap support
⚠️ Peers still won't stay connected (different issue)

---

## Root Cause #2: P2P Connectivity Instability ⚠️ ONGOING

### Symptoms
- Peer count fluctuates: 0 → 1 → 0 → 2 → 0
- Static-nodes.json configured correctly but not working
- All 3 validators on same host (127.0.0.1 / 0.0.0.0)
- Logs show: "Looking for peers peercount=0 tried=62 static=2"

### Configurations Tested

| Configuration | Snap Protocol | Peers | Blocks | Result |
|---------------|---------------|-------|--------|--------|
| Original (epoch 10K) | ERROR | 0-1 | 1 | ❌ Failed |
| + `--syncmode full` | ERROR | 0-1 | 1 | ❌ Failed |
| + `--snapshot=false` | ✅ Fixed | 0-1 | 1 | ⚠️ Partial |
| + static-nodes (127.0.0.1) | ✅ Fixed | 0-1 | 1 | ⚠️ Partial |
| + static-nodes (0.0.0.0) | ✅ Fixed | 0-1 | 1 | ⚠️ Partial |
| + `--nat=none` | ✅ Fixed | 0-1 | 1 | 🔄 Testing |

### Evidence of Partial Functionality

**Mining IS Working**:
```
INFO: Commit new mining work number=2 sealhash=a0caa8..627cd4
```

**Parlia Consensus IS Working**:
```
INFO: Signed recently, must wait for others
```

**Interpretation**: Validator 1 successfully sealed block 1, now waiting in Parlia round-robin for Validators 2 & 3 to seal blocks 2 & 3. But they can't connect stably due to P2P issues.

---

## Root Cause #3: Configuration Drift from Success ❓

### Known Working Configuration (5:03 PM)
- Used `docker start` on PRE-EXISTING containers
- Containers created at unknown earlier time
- Unknown exact docker create flags used
- **HYPOTHESIS**: Original containers may have had different flags or were created differently

### Current Configuration
- Recreating containers from scratch with docker create
- Using inferred flags from documentation
- All flags explicitly specified

### Key Difference
**Success**: `bash fresh-start.sh` → `docker start xaheen-rpc`
**Current**: `docker create --name xaheen-rpc [many flags]` → `docker start`

### Missing Information
- Exact docker create command from successful session
- Any environment variables set
- Any undocumented configuration files
- Docker network settings used originally

---

## Technical Details

### Working Components ✅
1. **Genesis Configuration**: Correct hash, proper extraData
2. **Keystores**: All unlocked successfully (password: xaheen2025)
3. **Mining**: Enabled and functioning (seeing "Commit new mining work")
4. **Parlia Consensus**: Round-robin logic working ("Signed recently")
5. **RPC Endpoint**: Responding correctly
6. **Snap Protocol**: Disabled successfully

### Failing Components ❌
1. **P2P Discovery**: Validators can't find each other reliably
2. **Peer Persistence**: Connections drop immediately after establishing
3. **Static Peering**: Configured but not maintaining connections

### Current Validator Configuration

**Flags Applied**:
```bash
--datadir /bsc
--networkid 65001
--syncmode full
--snapshot=false       # Fixed snap protocol
--gcmode archive
--mine
--unlock [ADDRESS]
--password /bsc/password.txt
--allow-insecure-unlock
--nat=none             # Testing
--port 30303/30304/30305
--http --http.addr 0.0.0.0 --http.port 8545
--http.api eth,net,web3
```

**Static-Nodes Format**:
```json
[
  "enode://[NODEID2]@0.0.0.0:30304",
  "enode://[NODEID3]@0.0.0.0:30305"
]
```

**Genesis Hash**: `0x058b19fa412aaa4044d54efc33b241bc5fb780336daa8e39aa76951fa084d159` ✅

---

## Attempted Solutions

### ✅ Successful Fixes
1. Added `--snapshot=false` → Eliminated snap protocol errors
2. Generated correct static-nodes.json with proper enode format
3. Verified all accounts unlocked successfully
4. Confirmed mining is enabled and functioning

### ⚠️ Partial Fixes
1. Changed static-nodes from 127.0.0.1 → 0.0.0.0
2. Added `--nat=none` for localhost networking
3. Increased wait times (up to 3 minutes)
4. Verified node IDs match in static-nodes.json

### ❌ Ineffective Attempts
1. Changing epoch from 9M → 200 → 10,000
2. Minimal configuration (fewer flags)
3. TOML config instead of static-nodes.json
4. Manual peer adding via admin API
5. Restarting without recreating containers

---

## Remaining Questions

1. **What exact docker create command was used for the successful session at 5:03 PM?**
   - Can we find this in server bash history?
   - Are there stopped containers with the working configuration?

2. **Was the working session actually using 3 validators or just 1?**
   - Documentation says 3 peers connected
   - But current attempts with 3 validators consistently fail

3. **Is there a localhost/NAT issue with running 3 validators on same host?**
   - BSC/Parlia may not support multiple validators on 127.0.0.1
   - May need separate hosts or Docker bridge networking

4. **Has the dysnix/bsc Docker image changed?**
   - Image is 3 years old, should be stable
   - Digest matches: sha256:6b0a4e3f3106...

5. **Is there a firewall/iptables rule blocking localhost P2P?**
   - Worth checking: `sudo iptables -L`
   - Docker usually handles this automatically

---

## Next Steps

### Immediate (Priority 1)
1. ✅ Complete `--nat=none` test currently running
2. 🔍 Check server for older stopped containers with working config
3. 🔍 Review server bash_history for exact commands used
4. 🔍 Check if firewall rules blocking localhost connections

### Short Term (Priority 2)
1. Try Docker bridge network instead of --network host
2. Try running validators on separate AWS instances
3. Test with single validator (bypass P2P entirely for testing)
4. Review BSC/Parlia documentation for localhost multi-validator requirements

### Long Term (Priority 3)
1. Document exact working configuration when found
2. Create automated health checks
3. Implement monitoring for peer connections
4. Set up alerts for peer count < 2

---

## Recommendations

### For Testing & Development
**Use single validator mode** (--maxpeers=0 --nodiscover) to bypass P2P issues entirely:
```bash
docker create --name xaheen-rpc \
  --maxpeers=0 \
  --nodiscover \
  [other flags...]
```

**Pros**: Blocks will produce, can test contracts/transactions
**Cons**: No fault tolerance, not production-ready

### For Production
**Deploy validators on separate hosts** (3 different AWS instances):
- Eliminates localhost networking issues
- Proper geographic distribution
- Real fault tolerance
- Standard BSC/Parlia configuration

---

## Conclusion

**Summary**: The Noor Chain rebrand completed successfully (100%), but restoring block production revealed a critical P2P connectivity issue. While snap protocol errors have been resolved, peer connections remain unstable preventing Parlia consensus from completing the round-robin block sealing.

**Status**: Blocks stuck at block 1, miners functioning but waiting for peers.

**Confidence Level**:
- Snap protocol fix: ✅ HIGH (errors eliminated)
- P2P issue diagnosis: ⚠️ MEDIUM (symptoms clear, root cause uncertain)
- Configuration drift: ❓ LOW (insufficient information about original working setup)

**Recommendation**: Prioritize finding the exact configuration from the successful 5:03 PM session, or deploy validators to separate hosts to eliminate localhost networking as a variable.

---

**Last Updated**: November 2, 2025, 7:05 PM
**Next Review**: After `--nat=none` test completes

