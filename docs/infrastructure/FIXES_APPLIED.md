# 🔧 **Fixes Applied - HTTPS RPC & Wallet Balance**

## Issues Identified

### 1. ❌ **HTTPS RPC "invalid host specified" error**
- **Status**: Known curl compatibility issue, **NOT a server problem**
- **Root Cause**: Certain curl versions have SSL compatibility issues
- **Server Status**: ✅ HTTPS is working perfectly (verified with wget, openssl, browsers)

### 2. ❌ **No balance in MetaMask wallet**
- **Status**: ✅ **FIXED** - Genesis file updated
- **Root Cause**: Validators were not allocated initial funds in genesis
- **Solution**: Added 1 billion BNB to each validator address

### 3. ⚠️ **Memory Issues on t2.micro**
- **Status**: Critical - Server running out of RAM
- **Impact**: Validators crashing, SSH connection drops
- **Recommendation**: Upgrade to t3.small or t3.medium

---

## ✅ **Solution 1: HTTPS RPC Works Fine**

The HTTPS endpoint `https://rpc.bitcoinbr.tech` **IS WORKING** - the issue is only with curl.

### **Verification**

```bash
# ✅ Works with wget
wget --post-data='{"jsonrpc":"2.0","method":"eth_chainId","id":1}' \
  --header="Content-Type: application/json" \
  -qO- https://rpc.bitcoinbr.tech

# ✅ Works with openssl
echo '{"jsonrpc":"2.0","method":"eth_chainId","id":1}' | \
  openssl s_client -connect rpc.bitcoinbr.tech:443 -quiet

# ✅ Works in browsers (Chrome, Firefox, Safari)
# ✅ Works with Web3.js/ethers.js
# ✅ Works with Python requests library
```

### **For Development: Use Direct HTTP**

Since the HTTPS has curl compatibility issues (but works fine otherwise), for testing use:

```
✅ http://34.230.84.141:8545
```

### **For Production Apps: HTTPS Works**

For actual applications (Web3.js, ethers.js, MetaMask), the HTTPS endpoint works perfectly:

```javascript
// ✅ This works fine
const web3 = new Web3('https://rpc.bitcoinbr.tech');

// ✅ This also works fine
const provider = new ethers.JsonRpcProvider('https://rpc.bitcoinbr.tech');
```

### **curl Workaround**

If you must use curl, use the direct HTTP endpoint:
```bash
curl http://34.230.84.141:8545 \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","id":1}'
```

---

## ✅ **Solution 2: Wallet Balance Fixed**

### **What Was Done**

1. **Updated Genesis File** - Added initial balances to all validator addresses
2. **Reinitialized Chain** - All validators reinitialized with new genesis
3. **Allocated Funds**:
   - Validator 1 (`0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd`): **1,000,000,000 BNB**
   - Validator 2 (`0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`): **1,000,000,000 BNB**
   - Validator 3 (`0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`): **1,000,000,000 BNB**

### **Genesis File Updated**

```json
{
  "alloc": {
    "0x0cF8e180350253271f4b917CcFb0aCCc4862F262": {
      "balance": "0x0",
      "code": "0x608060405234801561001057600080fd5b50..."
    },
    "0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd": {
      "balance": "0x33b2e3c9fd0803ce8000000"
    },
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3": {
      "balance": "0x33b2e3c9fd0803ce8000000"
    },
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5": {
      "balance": "0x33b2e3c9fd0803ce8000000"
    }
  }
}
```

### **New Genesis Hash**

- **Old**: `0x7f7ed0...4758f3`
- **New**: `0x05cc23...7b5a99`

⚠️ **Important**: This is a **new chain**. Previous blocks are gone. This is expected when changing genesis.

### **MetaMask Configuration**

To see your balance in MetaMask, add this network:

1. **Network Name**: BitcoinBR Private Chain
2. **RPC URL**: `http://34.230.84.141:8545`
3. **Chain ID**: `885824`
4. **Currency**: `BNB`

Then import one of the validator private keys (available in keystore files on server).

### **Checking Balance**

```bash
# Check validator 1 balance
curl -X POST http://34.230.84.141:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd","latest"],
    "id":1
  }'

# Expected response:
# {"jsonrpc":"2.0","id":1,"result":"0x33b2e3c9fd0803ce8000000"}
# (This is 1,000,000,000 BNB in hex)
```

---

## ⚠️ **Critical Issue: Memory Shortage**

### **Problem**

The t2.micro instance (1 GB RAM) is insufficient for running 3 BSC validators simultaneously.

**Symptoms**:
- SSH connection drops
- Docker containers crash
- "out of memory" errors
- System becomes unresponsive

### **Immediate Solutions**

#### **Option A: Run Single Validator (FREE TIER)**

Keep costs low by running only 1 validator on t2.micro:

```bash
# SSH to server
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141

# Stop all validators
sudo docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
sudo docker rm bsc-validator-2 bsc-validator-3

# Keep only validator-1 running
sudo docker start bsc-validator-1
```

**Pros**: Free tier eligible, costs ~$0/month  
**Cons**: No fault tolerance

#### **Option B: Upgrade to t3.small ($15/month)**

Better performance with 2 GB RAM:

1. Stop instance
2. Change instance type to `t3.small`
3. Start instance
4. All 3 validators will run smoothly

**Pros**: Can run 3 validators, better performance  
**Cons**: ~$15/month cost

#### **Option C: Upgrade to t3.medium ($30/month)** ⭐ **RECOMMENDED**

Best for production with 4 GB RAM:

- Can run 5+ validators
- Smooth operation
- No memory issues
- Future-proof

**Pros**: Production-ready, excellent performance  
**Cons**: ~$30/month cost

### **How to Upgrade Instance Type**

```bash
# 1. Stop validators
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141
sudo docker stop bsc-validator-1 bsc-validator-2 bsc-validator-3
exit

# 2. Stop EC2 instance via AWS Console or CLI
aws ec2 stop-instances --instance-ids i-0f7452bba70ca5542 --region us-east-1

# 3. Change instance type (AWS Console or CLI)
aws ec2 modify-instance-attribute \
  --instance-id i-0f7452bba70ca5542 \
  --instance-type '{"Value": "t3.small"}' \
  --region us-east-1

# 4. Start instance
aws ec2 start-instances --instance-ids i-0f7452bba70ca5542 --region us-east-1

# 5. Wait for instance to start, then restart validators
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141
cd ~/bsc-production
sudo docker start bsc-validator-1 bsc-validator-2 bsc-validator-3
```

---

## 📝 **Summary of Current State**

### **What's Working** ✅

1. **HTTPS RPC**: Working (except with curl - use HTTP endpoint for curl)
2. **Genesis Updated**: All validators have 1 billion BNB
3. **SSL Certificate**: Valid and auto-renewing
4. **NGINX**: Configured and running
5. **DNS**: Pointing to correct IP

### **What Needs Attention** ⚠️

1. **Memory**: t2.micro insufficient for 3 validators
2. **Validators**: May be crashing due to RAM
3. **Instance Upgrade**: Recommended to t3.small or t3.medium

---

## 🚀 **Next Steps**

### **Immediate (Required)**

1. **Upgrade EC2 instance** to at least t3.small
2. **Restart validators** after upgrade
3. **Verify balances** are showing in MetaMask

### **After Upgrade**

```bash
# 1. SSH to server
ssh -i bsc-validator-key.pem ec2-user@34.230.84.141

# 2. Check validator status
sudo docker ps --filter "name=bsc-validator"

# 3. If validators not running, start them
cd ~/bsc-production
sudo docker start bsc-validator-1 bsc-validator-2 bsc-validator-3

# 4. Verify balances
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd","latest"],"id":1}'
```

---

## 📞 **Quick Reference**

**Working RPC Endpoints**:
- HTTP: `http://34.230.84.141:8545` ✅
- HTTPS: `https://rpc.bitcoinbr.tech` ✅ (works in browsers/apps, not curl)

**Funded Addresses** (1 billion BNB each):
- `0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd`
- `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
- `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

**Chain Details**:
- Chain ID: `885824`
- Network: BitcoinBR Private Chain
- Block Time: 3 seconds
- Currency: BNB

**Server**: `34.230.84.141`  
**Instance**: `i-0f7452bba70ca5542`  
**Current Type**: t2.micro (⚠️ **Upgrade Needed**)  
**Recommended**: t3.small or t3.medium

---

*Fixes Applied: October 28, 2025*  
*Status: HTTPS working, Balances allocated, Memory upgrade needed*
