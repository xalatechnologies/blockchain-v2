# Nor Chain Documentation Index

**Complete documentation bundle for blockchain deployment, maintenance, and troubleshooting**

---

## 🚀 QUICK START

**New to Nor Chain deployment?** Start here:

1. **Read**: `MASTER-DEPLOYMENT-CHECKLIST.md` - Complete deployment overview
2. **Follow**: Phase-by-phase instructions
3. **Reference**: Individual checklists as needed
4. **Troubleshoot**: Use troubleshooting guides when issues arise

---

## 📚 CORE DOCUMENTATION

### 1. Master Deployment Guide

**File**: `MASTER-DEPLOYMENT-CHECKLIST.md`

**Purpose**: Complete end-to-end deployment from genesis to go-live

**Use When**:
- Starting a new blockchain deployment
- Planning a complete launch
- Need overview of all deployment phases

**Covers**: 12 phases from genesis creation → validators → contracts → DEX → liquidity → bridges → tokenomics → go-live

**Time**: 4-6 hours for complete deployment

---

### 2. Genesis Creation Checklist

**File**: `CHECKLIST-GENESIS-CREATION.md`

**Purpose**: Create properly formatted genesis file to prevent consensus issues

**Use When**:
- Creating a new genesis file
- Adding validators to genesis
- Embedding contracts in genesis
- Changing chain parameters

**Critical Sections**:
- ✅ ExtraData formatting (MOST CRITICAL)
- ✅ Parlia configuration
- ✅ Validator list format
- ✅ Pre-funded accounts

**Common Issues Prevented**:
- Parlia consensus deadlock
- "Signed recently" infinite loop
- Malformed extraData
- Epoch misconfiguration

---

### 3. Validator Deployment Checklist

**File**: `CHECKLIST-VALIDATOR-DEPLOYMENT.md`

**Purpose**: Deploy and configure BSC/Parlia validators

**Use When**:
- Setting up new validators
- Adding validators to existing network
- Migrating validators to new servers
- Troubleshooting validator startup

**Key Steps**:
- Keystore generation
- Genesis initialization
- Validator startup with critical flags
- Peer connectivity setup
- Health monitoring

**Critical Flags**:
- `--networkid` (REQUIRED)
- `--mine` (REQUIRED)
- `--unlock` (REQUIRED)
- Unique P2P ports per validator

---

### 4. Validator Troubleshooting Guide

**File**: `CHECKLIST-TROUBLESHOOTING-VALIDATORS.md`

**Purpose**: Systematic diagnosis and resolution of validator issues

**Use When**:
- Chain stuck at block 1
- Validators not producing blocks
- Peer connectivity issues
- RPC not responding
- Mining not working

**Diagnostic Tools**:
- Decision trees for common issues
- Quick diagnostic commands
- Step-by-step fix procedures
- Emergency reset procedures

**Most Common Issue**: Parlia consensus deadlock (see fix section)

---

### 5. Parlia Deadlock Fix Summary

**File**: `PARLIA-DEADLOCK-FIX-SUMMARY.md`

**Purpose**: Complete root cause analysis of Parlia consensus deadlock

**Use When**:
- Chain stuck with "Signed recently, must wait for others"
- Validators mining but no blocks produced
- All validators show mining=true but blocks=1

**Root Causes Identified**:
1. Malformed extraData (extra padding)
2. Epoch value too high
3. Missing --networkid flag

**Solution**: Properly formatted genesis with correct extraData, epoch=200, and --networkid flag

**Result**: Blocks producing every 3 seconds ✅

---

## 🎯 WHEN TO USE EACH DOCUMENT

### Starting Fresh Deployment

**Path**: `MASTER-DEPLOYMENT-CHECKLIST.md` → Follow phase by phase

**Timeline**:
- Phase 1-2: Genesis + Validators (2 hours)
- Phase 3-5: Contracts + DEX + Liquidity (1 hour)
- Phase 6-8: LP Locks + Bridges + Tokenomics (1 hour)
- Phase 9-11: Monitoring + Pre-launch + Go Live (1 hour)

### Chain Stuck at Block 1

**Path**:
1. `CHECKLIST-TROUBLESHOOTING-VALIDATORS.md` → Quick diagnostics
2. Identify: "Signed recently" issue?
3. `PARLIA-DEADLOCK-FIX-SUMMARY.md` → Root cause analysis
4. `CHECKLIST-GENESIS-CREATION.md` → Create fixed genesis
5. `CHECKLIST-VALIDATOR-DEPLOYMENT.md` → Redeploy validators

### Adding New Validators

**Path**:
1. `CHECKLIST-GENESIS-CREATION.md` → Update extraData
2. Reinitialize ALL validators with new genesis
3. `CHECKLIST-VALIDATOR-DEPLOYMENT.md` → Deploy new validators
4. Update static-nodes.json for all validators

### Validators Not Starting

**Path**:
1. `CHECKLIST-TROUBLESHOOTING-VALIDATORS.md` → "Validators Not Starting" section
2. Check keystore files
3. Verify password files
4. Check genesis initialization
5. Review startup flags

### Poor Peer Connectivity

**Path**:
1. `CHECKLIST-TROUBLESHOOTING-VALIDATORS.md` → "Peer Connectivity Issues"
2. Get enode addresses
3. Create static-nodes.json
4. Restart validators

### Creating New Genesis

**Path**:
1. `CHECKLIST-GENESIS-CREATION.md` → Pre-creation checklist
2. Calculate extraData exactly (use provided script)
3. Validate genesis (use validation script)
4. Test with one validator first
5. Deploy all validators

---

## 🔍 QUICK REFERENCE COMMANDS

### Check Blockchain Health

```bash
# Block number
curl -s https://rpc.xaheen.org -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n"

# Peer count
curl -s https://rpc.xaheen.org -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n"

# Chain ID
curl -s https://rpc.xaheen.org -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Check Validator Status

```bash
# Mining status
docker logs xaheen-rpc 2>&1 | grep -i mining | tail -5

# Peer count
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "net.peerCount"

# Current block
docker exec xaheen-rpc geth attach /bsc/geth.ipc --exec "eth.blockNumber"
```

### Check Genesis

```bash
# Validate extraData
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis.json'));
const extraLen = genesis.extraData.length - 2;
console.log('ExtraData length:', extraLen, '(expected: 314 for 3 validators)');
console.log('Validators:', (extraLen - 64 - 130) / 40);
console.log('Epoch:', genesis.config.parlia.epoch);
const seal = genesis.extraData.slice(-130);
console.log('Seal all zeros:', seal.split('').every(c => c === '0'));
"
```

---

## 📊 DOCUMENTATION COVERAGE MAP

### Genesis & Validators
- ✅ Genesis creation (complete)
- ✅ Validator deployment (complete)
- ✅ Validator troubleshooting (complete)
- ✅ Parlia deadlock fix (complete)

### Smart Contracts & DEX
- ✅ Contract deployment (in MASTER guide)
- ✅ DEX deployment (in MASTER guide)
- ✅ Liquidity deployment (in MASTER guide)
- ✅ LP locks (in MASTER guide)

### Bridges & Tokenomics
- ✅ Bridge deployment (in MASTER guide)
- ✅ Staking & burn (in MASTER guide)
- ✅ Weekly buyback (in MASTER guide)

### Operations & Maintenance
- ✅ Monitoring setup (in MASTER guide)
- ✅ Post-launch operations (in MASTER guide)
- ✅ Health checks (in MASTER guide)
- ✅ Rollback procedures (in MASTER guide)

---

## 🚨 EMERGENCY PROCEDURES

### Chain Completely Stuck

1. **Check logs**: `CHECKLIST-TROUBLESHOOTING-VALIDATORS.md` → Quick Diagnostics
2. **Identify issue**: Use decision tree
3. **Apply fix**: Follow specific fix section
4. **Last resort**: Emergency complete reset procedure

### Validators Crashed

1. Check logs: `docker logs xaheen-rpc --tail 100`
2. Check disk space: `df -h`
3. Check memory: `free -h`
4. Restart validators: `docker restart xaheen-rpc bsc-validator-2 bsc-validator-3`

### Genesis Needs Change

**WARNING**: Changing genesis requires full reinitialization!

1. Stop all validators
2. Delete blockchain data: `rm -rf validator-*/geth`
3. Create new genesis: Use `CHECKLIST-GENESIS-CREATION.md`
4. Reinitialize all validators
5. Start validators with correct flags

### RPC Down

1. Check nginx: `sudo systemctl status nginx`
2. Check validator: `docker ps | grep xaheen-rpc`
3. Check logs: `docker logs xaheen-rpc --tail 50`
4. Restart if needed: `docker restart xaheen-rpc`

---

## 📖 ADDITIONAL RESOURCES

### Investor Documentation
- `docs/investor/TOKEN_PRICING_AND_STRATEGY.md` - Token pricing and launch strategy

### Deployment Logs
- `docs/deployment-logs/` - Historical deployment records
- Contract addresses
- LP lock proofs
- Trading simulations

### Current Session Documentation
- `docs/SESSION-SUMMARY-2025-10-31.md` - Most recent session summary
- `docs/RPC_FIXED_SUMMARY.md` - RPC issue resolution
- `docs/CRITICAL_RPC_DOWN_DIAGNOSIS.md` - Critical issue diagnosis

### Infrastructure
- `infrastructure/ansible/` - Ansible automation playbooks
- Server provisioning
- SSL/HTTPS setup
- Multi-validator orchestration

---

## 💡 BEST PRACTICES

### Genesis Creation
1. Always validate extraData length (314 hex chars for 3 validators)
2. Ensure seal is all zeros (130 hex chars)
3. Set epoch appropriate to validator count (200 for 3-21 validators)
4. Test with one validator before deploying all

### Validator Deployment
1. Always use `--networkid` flag matching chain ID
2. Create static-nodes.json for persistent peering
3. Ensure each validator has unique P2P port
4. Monitor logs during first 30 seconds after start

### Troubleshooting
1. Start with quick diagnostics (block number, peers, mining status)
2. Use decision trees to narrow down issue
3. Check logs for specific error messages
4. Apply specific fixes, avoid shotgun approach

### Maintenance
1. Backup keystores and passwords regularly
2. Monitor block production continuously
3. Set up automated health checks
4. Document all changes and deployments

---

## 🔗 EXTERNAL REFERENCES

### BSC/Parlia Documentation
- [BNB Chain GitHub](https://github.com/bnb-chain/bsc)
- [Parlia Consensus Specification](https://github.com/bnb-chain/BEPs/blob/master/BEP159.md)

### Ethereum/Geth
- [Go-Ethereum Documentation](https://geth.ethereum.org/docs)
- [JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/)

### Docker
- [Docker Documentation](https://docs.docker.com/)
- [dysnix/bsc Docker Image](https://hub.docker.com/r/dysnix/bsc)

---

## ✅ DOCUMENTATION CHECKLIST

- ✅ Master deployment guide (complete)
- ✅ Genesis creation checklist (complete)
- ✅ Validator deployment guide (complete)
- ✅ Troubleshooting guide (complete)
- ✅ Parlia deadlock analysis (complete)
- ✅ Documentation index (this file)
- ✅ Quick reference commands
- ✅ Emergency procedures
- ✅ Best practices

---

## 📝 DOCUMENT VERSION HISTORY

**Version 1.0** (October 31, 2025)
- Initial complete documentation bundle
- All checklists created
- Parlia deadlock root cause documented
- Emergency procedures added
- Best practices documented

---

## 🎯 DOCUMENTATION GOALS ACHIEVED

✅ **"Create a proper checklist, documentation and bundle for all these processes so we do not have to remind each other of such issues in future!!"**

**What's Included**:
1. Master deployment checklist (12 phases, complete guide)
2. Genesis creation checklist (prevent Parlia deadlock)
3. Validator deployment guide (step-by-step)
4. Troubleshooting guide (decision trees, quick fixes)
5. Parlia deadlock analysis (root cause + solution)
6. Documentation index (this file, navigation guide)

**Coverage**: Genesis → Validators → Contracts → DEX → Liquidity → Bridges → Tokenomics → Go-Live → Post-Launch

**Result**: Complete documentation bundle that covers "all corners" of deployment ✅

---

**Maintained By**: Nor Chain Team
**Last Updated**: October 31, 2025
**Status**: Production-Ready ✅

---

## 📞 NEED HELP?

1. **Check this index** to find the right document
2. **Use decision trees** in troubleshooting guide
3. **Follow phase-by-phase** in master checklist
4. **Validate genesis** before any deployment
5. **Check logs first** when issues occur

**Remember**: Most issues have been documented and solved. Check documentation before debugging!
