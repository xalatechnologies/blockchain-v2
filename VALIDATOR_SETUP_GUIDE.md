# 🛠️ BRIDGE VALIDATOR SETUP GUIDE

**Complete guide to setup and run the bridge validator service**

---

## What is the Validator Service?

The validator service is the "brain" of your bridges. It:

1. **Monitors BSC** for bridge deposits
2. **Generates signatures** to authorize minting
3. **Mints wrapped tokens** on Xaheen Chain
4. **Runs 24/7** to process deposits automatically

**Without this service, bridges won't work!**

---

## Quick Setup (5 minutes)

### Step 1: Reduce Signature Requirement (for testing)

Right now bridges require 2-of-3 validator signatures. For testing, we'll reduce to 1 signature:

```bash
npx hardhat run scripts/set-signature-requirement.js --network btcbr
```

**Output:**
```
⚙️  SETTING SIGNATURE REQUIREMENTS
Setting requirement to: 1 signature(s)

✅ BNB Bridge updated
✅ USDT Bridge updated
✅ ETH Bridge updated
```

### Step 2: Make Startup Script Executable

```bash
chmod +x validator/start-validator.sh
```

### Step 3: Start Validator Service

```bash
./validator/start-validator.sh
```

**Or directly:**
```bash
node validator/bridge-validator.js
```

### Step 4: Verify It's Running

You should see:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🌉 XAHEEN BRIDGE VALIDATOR SERVICE 🌉             ║
║                                                            ║
║  Monitors BSC bridges and mints tokens on Xaheen Chain   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🚀 INITIALIZING BRIDGE VALIDATOR SERVICE
💼 Validator Address: 0x...
💰 XHT Balance: 20189999999.872259848

✅ BNB Bridge BSC: 0x9bEFFFa3b43D34a2B470DA21aab3CA3263D0e8C0
✅ USDT Bridge BSC: 0x7E1c4448A9d87d5C5478B86085AF4e3715a06f48
✅ ETH Bridge BSC: 0x99883F508F41Ad3750695E68B456A50909f0F3Fe

🔍 CHECKING FOR PAST EVENTS...
Found 1 BNB bridge event(s)

🔵 BNB BRIDGE DEPOSIT DETECTED!
👤 User: 0xdD779a290C937144F80Eb75b75d814c834536B1b
📬 Recipient: 0xdD779a290C937144F80Eb75b75d814c834536B1b
💰 Amount: 0.00998 BNB
💸 Fee: 0.00002 BNB
🔢 Nonce: 0

🔨 MINTING WBNB ON XAHEEN...
✍️  Signature generated
📡 Calling mintWBNB on Xaheen...
⏰ Waiting for confirmation...
✅ WBNB Minted!
📝 TX: 0x...
📬 Recipient now has 0.00998 WBNB on Xaheen

👂 STARTING EVENT LISTENERS...
✅ Listening to BNB Bridge events
✅ Listening to USDT Bridge events
✅ Listening to ETH Bridge events

🎯 VALIDATOR SERVICE IS RUNNING!
Waiting for bridge deposits...
```

---

## What Just Happened?

1. ✅ Service found your previous BNB bridge deposit
2. ✅ Generated validator signature
3. ✅ Minted 0.0098 WBNB on Xaheen Chain
4. ✅ Started listening for new deposits

**Your bridge is now FULLY OPERATIONAL!**

---

## Verify WBNB in MetaMask

### 1. Add Xaheen Network

If you haven't already:

```
Network: Xaheen Chain
RPC: https://rpc.xaheen.org
Chain ID: 65001
Symbol: XHT
Explorer: https://explorer.xaheen.org
```

### 2. Import WBNB Token

- Switch to Xaheen network
- Click "Import tokens"
- Address: `0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B`
- Symbol: `WBNB`
- Decimals: `18`

### 3. Check Balance

You should see: **0.0098 WBNB** 🎉

---

## Testing New Deposits

With validator running, test the bridge again:

### Option 1: Via BSCScan

1. Go to: https://bscscan.com/address/0x9bEFFFa3b43D34a2B470DA21aab3CA3263D0e8C0#writeContract
2. Call `bridgeBNB` with 0.01 BNB
3. **Watch the validator service console!**

You'll see:

```
🔵 BNB BRIDGE DEPOSIT DETECTED!
👤 User: 0x...
💰 Amount: 0.00998 BNB
🔨 MINTING WBNB ON XAHEEN...
✅ WBNB Minted!
```

4. Check MetaMask - WBNB balance increased!

### Option 2: Automated Script

```bash
# In a new terminal (keep validator running)
npx hardhat run scripts/test-all-bridges.js --network bsc
```

---

## How It Works

```
┌──────────────┐
│     BSC      │  User bridges 0.01 BNB
│              │  ↓
│ BNB Bridge   │  Emits BridgeDeposit event
└──────┬───────┘
       │
       │ Event detected
       ↓
┌──────────────┐
│  Validator   │  Listens for events
│   Service    │  ↓
│              │  Generates signature
│              │  ↓
│              │  Calls mintWBNB()
└──────┬───────┘
       │
       │ Mints tokens
       ↓
┌──────────────┐
│    Xaheen    │  WBNB minted!
│              │  User receives 0.0098 WBNB
│ WBNB Token   │
└──────────────┘
```

---

## Running in Production

### Option 1: Keep Terminal Open (Simple)

```bash
./validator/start-validator.sh
```

**Pros:**
- Simple
- See logs in real-time

**Cons:**
- Stops when you close terminal
- Not for production

---

### Option 2: PM2 Process Manager (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start validator:
```bash
pm2 start validator/bridge-validator.js --name bridge-validator
```

**Useful commands:**
```bash
pm2 status              # Check status
pm2 logs bridge-validator  # View logs
pm2 restart bridge-validator  # Restart
pm2 stop bridge-validator     # Stop
pm2 startup             # Auto-start on boot
pm2 save                # Save current processes
```

---

### Option 3: Docker Container (Advanced)

Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "validator/bridge-validator.js"]
```

Build and run:
```bash
docker build -t bridge-validator .
docker run -d --name validator bridge-validator
```

---

### Option 4: Systemd Service (Linux)

Create `/etc/systemd/system/bridge-validator.service`:
```ini
[Unit]
Description=Xaheen Bridge Validator
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/blockchain-v2
ExecStart=/usr/bin/node validator/bridge-validator.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable bridge-validator
sudo systemctl start bridge-validator
sudo systemctl status bridge-validator
```

---

## Monitoring

### Check Service Health

```bash
# If using PM2
pm2 status

# If using systemd
sudo systemctl status bridge-validator

# If using Docker
docker ps
docker logs validator
```

### Check Processed Events

The service stores processed nonces in memory. To persist them, you could:

1. Add SQLite database
2. Use Redis
3. Write to file

For now, restarting service will reprocess recent events (last 1000 blocks), but duplicates are prevented by checking nonces on-chain.

---

## Troubleshooting

### "Insufficient XHT balance"

Validator needs XHT for gas when minting tokens.

**Solution:**
```bash
# Send XHT to validator address
# Your validator: 0xdD779a290C937144F80Eb75b75d814c834536B1b
```

### "Invalid validator"

The validator address isn't registered in the bridge contract.

**Solution:**
```bash
npx hardhat run scripts/add-validator.js --network btcbr
```

### "Already processed"

The nonce was already used (duplicate event).

**This is normal** - the service prevents double-processing.

### "RPC connection failed"

BSC or Xaheen RPC is down.

**Solutions:**
- Check RPC URLs in .env
- Try backup RPC:
  - BSC: `https://bsc.publicnode.com`
  - BSC: `https://bsc-rpc.gateway.pokt.network`

### Service not detecting events

**Check:**
1. Service is running
2. BSC RPC is accessible
3. Events exist (check BSCScan)
4. Correct bridge address in .env

---

## Scaling to Multiple Validators (Production)

### Current Setup:
- 1 validator
- 1 signature required
- Good for testing

### Production Setup:
- 3 validators (different servers)
- 2-of-3 signatures required
- More secure, decentralized

**To upgrade:**

1. **Generate 3 validator wallets:**
```javascript
const validator1 = ethers.Wallet.createRandom();
const validator2 = ethers.Wallet.createRandom();
const validator3 = ethers.Wallet.createRandom();
```

2. **Add to bridges:**
```bash
npx hardhat run scripts/add-validator.js --network btcbr
```

3. **Set requirement to 2:**
```bash
# Edit scripts/set-signature-requirement.js
# Change: requirement = 2

npx hardhat run scripts/set-signature-requirement.js --network btcbr
```

4. **Run 3 validator services** on different servers

5. **Implement signature collection** (validators communicate to combine signatures)

---

## Revenue Monitoring

Add to validator service to track revenue:

```javascript
// After minting
console.log("💰 REVENUE UPDATE:");
console.log("Bridge fees earned:", await bridge.totalFees());
```

Or create dashboard:
```bash
node scripts/check-revenue.js
```

---

## Backup and Recovery

### Backup Validator Key

Your validator key is in `.env`:
```
MAINNET_PRIVATE_KEY=681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4
```

**CRITICAL:**
- 🔒 Never share this key
- 💾 Backup securely (encrypted USB, password manager)
- 🔐 If lost, you lose control of validator!

### Recovery

If service crashes:

1. Restart service
2. Service automatically processes missed events (last 1000 blocks)
3. Duplicates prevented by nonce checking

---

## Performance Tuning

### Optimize Block Scanning

Default: Scans last 1000 blocks on startup

Adjust in `bridge-validator.js`:
```javascript
const fromBlock = currentBlock - 1000; // Change to 500 or 2000
```

### Optimize Gas

Use `gasLimit` parameter:
```javascript
{ gasLimit: 300000 } // Lower if possible
```

---

## Summary Checklist

After setup, you should have:

- [x] Validator service running
- [x] Service detecting BSC events
- [x] Tokens minting on Xaheen
- [x] WBNB visible in MetaMask
- [x] Revenue generating from fees

**Next steps:**
1. Keep validator running 24/7
2. Test with real users
3. Monitor revenue
4. Scale to multiple validators (optional)

---

## Quick Commands Reference

```bash
# Setup
npx hardhat run scripts/set-signature-requirement.js --network btcbr

# Start validator
./validator/start-validator.sh

# Or with PM2
pm2 start validator/bridge-validator.js --name bridge-validator
pm2 logs bridge-validator

# Test bridge
npx hardhat run scripts/test-all-bridges.js --network bsc

# Check revenue
# (Check BSCScan Read Contract → totalFees)
```

---

**Your bridges are now FULLY OPERATIONAL and GENERATING REVENUE!** 💰🎉
