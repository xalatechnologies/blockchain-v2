# Epoch Recovery Quick Reference

**Chain stuck at block 29,999** → Choose recovery method below

---

## Option 1: Fast Recovery (Try This First) ⚡

**Time**: 5-10 minutes
**Risk**: None (no state changes)
**Preserves**: Everything

```bash
./scripts/epoch-recovery-fast.sh
```

**What it does**:
1. Stops validators 2 & 3
2. Lets validator 1 seal block 30,000
3. Restarts all validators

**Success**: Block > 29,999, all validators running

---

## Option 2: State-Preserving Regenesis 🔧

**Time**: 30-60 minutes
**Risk**: Low (tested procedure)
**Preserves**: All contracts, balances, LP reserves

```bash
./scripts/epoch-recovery-regenesis.sh
```

**What it does**:
1. Exports state at block 29,999
2. Generates new genesis (epoch: 9M, sorted validators)
3. Re-initializes validators with preserved state
4. Restarts blockchain from block 0

**Success**: Block > 0 and increasing, all assets intact

---

## Critical Info

**At Risk**: $20,000 NOR/USDT liquidity
**Safe**: 352.7B BTCBR on BSC Mainnet ✅

**Server**: `ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187`

**Validators**:
- xaheen-rpc (validator 1)
- bsc-validator-2
- bsc-validator-3

---

## Manual Fast Recovery

```bash
# 1. SSH to server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

# 2. Stop validators 2 & 3
docker stop bsc-validator-2 bsc-validator-3

# 3. Wait 60 seconds
sleep 60

# 4. Check block
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 5. Restart other validators
docker start bsc-validator-2 bsc-validator-3
```

---

## Verification

```bash
# Block number (should be > 29999 or increasing)
curl https://rpc.xaheen.org -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Peer count (should be ≥ 2)
curl https://rpc.xaheen.org -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# LP reserves (NOR/USDT pair: 0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8)
curl https://rpc.xaheen.org -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8","data":"0x0902f1ac"},"latest"],"id":1}'
```

---

## Full Documentation

- **Complete Guide**: `EPOCH_BOUNDARY_RECOVERY_GUIDE.md`
- **Prevention**: `NEVER_GET_STUCK_AGAIN_CHECKLIST.md`
- **Asset Inventory**: `XAHEEN_CHAIN_COMPLETE_INVENTORY.md`
- **Liquidity Analysis**: `CRITICAL_BACKUP_ANALYSIS.md`

---

**Ready?** Run: `./scripts/epoch-recovery-fast.sh`
