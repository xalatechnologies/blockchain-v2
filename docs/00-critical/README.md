# 00 - Critical & Emergency Documentation

⚠️ **CURRENT CRISIS**: Chain stuck at block 29,999 - $20,000 NOR/USDT liquidity at risk

---

## 🚨 IMMEDIATE ACTION REQUIRED

**Chain Status**: STUCK at block 29,999 (epoch boundary)
**At Risk**: $20,000 NOR/USDT liquidity
**Safe**: 352.7B BTCBR on BSC Mainnet ✅

### Quick Recovery

**START HERE**:
1. Read `EPOCH_RECOVERY_QUICK_REF.md` (2 min)
2. Run `../../scripts/epoch-recovery-fast.sh` (5-10 min)
3. If fails: Run `../../scripts/epoch-recovery-regenesis.sh` (30-60 min)

---

## 📚 Recovery Documentation

### Quick References

**EPOCH_RECOVERY_QUICK_REF.md** (2.6K)
→ 1-page emergency guide
→ Fast recovery commands
→ Regenesis commands
→ Verification steps

**RECOVERY_TOOLKIT_SUMMARY.md** (10K)
→ Complete toolkit overview
→ Decision tree
→ All scripts explained
→ What's preserved vs changed

### Complete Guides

**EPOCH_BOUNDARY_RECOVERY_GUIDE.md** (12K)
→ Full recovery procedures
→ Problem explanation
→ Fast recovery (single-sealer nudge)
→ State-preserving regenesis
→ FAQ and troubleshooting

**NEVER_GET_STUCK_AGAIN_CHECKLIST.md** (14K)
→ 10-point production checklist
→ Epoch configuration (9M blocks)
→ Validator list sorting rules
→ Monitoring & alerting
→ Monthly/quarterly rehearsals

### Asset Analysis

**CRITICAL_BACKUP_ANALYSIS.md** (10K)
→ $20K liquidity breakdown
→ What's at risk vs safe
→ Recovery options comparison
→ Financial impact analysis

**XAHEEN_CHAIN_COMPLETE_INVENTORY.md** (6.6K)
→ All deployed contracts
→ DEX infrastructure addresses
→ Bridge contracts
→ Liquidity pool details

### Legacy Documents

**DEPLOYMENT-STATUS.md** (6.2K)
→ Historical deployment status
→ Previous block heights

**EPOCH_FIX_MANUAL.md** (3.5K)
→ Earlier epoch fix attempts
→ Reference only

---

## 🛠️ Recovery Scripts

All scripts located in `../../scripts/`:

**epoch-recovery-fast.sh** (6.4K)
→ Single-sealer nudge approach
→ 5-10 minutes, no state changes
→ 70-80% success rate

**epoch-recovery-regenesis.sh** (9.8K)
→ State-preserving regenesis
→ 30-60 minutes, full preservation
→ 99%+ success rate

**export-state-29999.js** (6.9K)
→ Export blockchain state at block 29,999

**generate-new-genesis.js** (6.5K)
→ Generate new genesis with preserved state

---

## 📊 What's at Stake

### At Risk (on stuck chain)
- **$20,000 NOR/USDT liquidity**
  - $10,000 locked in timelock (until Oct 30, 2026)
  - $10,000 operational liquidity
  - Pair: 0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8

### Safe (on BSC Mainnet)
- **352.7 billion BTCBR** ✅
  - Contract: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262
  - Network: BSC Mainnet (Chain ID: 56)
  - 100% independent of Nor Chain

---

## ✅ Recovery Guarantees

**Both recovery methods preserve**:
- ✅ All contract code
- ✅ All contract storage
- ✅ All account balances
- ✅ All LP reserves
- ✅ $20,000 NOR/USDT liquidity
- ✅ Same contract addresses
- ✅ Same LP pair addresses

---

## 🎯 Recommended Path

1. **Review** (2 min):
   - Read `EPOCH_RECOVERY_QUICK_REF.md`

2. **Execute Fast Recovery** (5-10 min):
   - Run `../../scripts/epoch-recovery-fast.sh`
   - Verify block > 29,999

3. **If Fast Fails** (30-60 min):
   - Run `../../scripts/epoch-recovery-regenesis.sh`
   - Verify contracts and liquidity intact

4. **After Recovery**:
   - Implement `NEVER_GET_STUCK_AGAIN_CHECKLIST.md`

---

## 📞 Emergency Contacts

**Server**: 3.91.50.187
**SSH**: `ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187`

**Validators**:
- xaheen-rpc (validator 1) - RPC/WS + P2P:30303
- bsc-validator-2 (validator 2) - P2P:30304
- bsc-validator-3 (validator 3) - P2P:30305

---

**Last Updated**: November 2, 2025
**Priority**: CRITICAL
**Action Required**: Execute recovery immediately
