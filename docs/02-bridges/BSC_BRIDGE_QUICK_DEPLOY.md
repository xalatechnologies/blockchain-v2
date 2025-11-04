# 🌉 BSC Bridge Quick Deployment Guide

**Goal**: Enable users to bridge BNB from BSC → Nor Chain → Swap to NOR

**Why This Solves Fiat Problem:**
- Users buy BNB on Binance (fiat on-ramp already exists!)
- Bridge BNB to Nor Chain (using your bridge)
- Swap BNB → NOR on Nor DEX
- Now users have NOR for gas + trading

**Cost**: $100-200 (gas fees for deployment)
**Time**: 2-3 hours
**Difficulty**: Medium (you already have the contracts!)

---

## ARCHITECTURE OVERVIEW

### Simple Lock & Mint Bridge:

```
BSC Mainnet                    Nor Chain
─────────────────────          ─────────────────────

User locks BNB    ────────►    Validator detects
in bridge contract             lock event
(BSC side)
                               Validator signs
                               mint transaction

                               Bridge mints WBNB
                               on Nor Chain

User gets WBNB    ◄────────    WBNB credited
on Nor Chain                to user wallet
```

**Reverse flow (Nor → BSC):**
- User burns WBNB on Nor
- Validator signs release
- User gets BNB on BSC

---

## STEP 1: PREPARE CONTRACTS

### You Need 2 Contracts:

#### 1. BSC Side (Lock Contract)
```solidity
// contracts/bridges/BNBBridgeBSC.sol
contract BNBBridgeBSC {
    event BridgeDeposit(address indexed user, uint256 amount, uint256 nonce);

    function bridgeBNB() external payable {
        require(msg.value >= 0.01 ether, "Minimum 0.01 BNB");
        require(msg.value <= 10 ether, "Maximum 10 BNB");

        emit BridgeDeposit(msg.sender, msg.value, nonce++);
    }

    function releaseBNB(address to, uint256 amount, bytes memory signature) external {
        // Validator signature verification
        require(verifySignature(to, amount, signature), "Invalid signature");
        payable(to).transfer(amount);
    }
}
```

#### 2. Nor Side (Mint Contract)
```solidity
// contracts/bridges/BNBBridgeNor.sol
contract WBNBToken is ERC20 {
    address public bridge;

    function mint(address to, uint256 amount) external {
        require(msg.sender == bridge, "Only bridge");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit BridgeBurn(msg.sender, amount);
    }
}
```

---

## STEP 2: CHECK EXISTING CONTRACTS

**You already have bridge contracts!** Let's check:

```bash
# List existing bridge contracts
ls -la contracts/bridges/

# You should see:
# - BTCBRBridgeMainnet.sol (Lock/Mint for BTCBR)
# - BTCBRBridgePrivate.sol
# - AtomicSwap.sol
# - LiquidityPoolBridge.sol
# etc.
```

**Option A: Reuse Existing Bridge Contract**
Your BTCBR bridge architecture works perfectly for BNB too!

**Option B: Deploy New BNB-Specific Bridge**
Clone BTCBR bridge, adapt for BNB

---

## STEP 3: QUICK DEPLOYMENT SCRIPT

### Create Deployment Script:

```javascript
// scripts/deploy-bnb-bridge.js
import { ethers } from "hardhat";

async function main() {
  console.log("🌉 Deploying BNB Bridge...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Check balances
  const bscBalance = await ethers.provider.getBalance(deployer.address);
  console.log("BSC Balance:", ethers.formatEther(bscBalance), "BNB\n");

  // Deploy to BSC Mainnet
  console.log("📍 Deploying to BSC Mainnet...");
  const BNBBridgeBSC = await ethers.getContractFactory("BNBBridgeBSC");
  const bridgeBSC = await BNBBridgeBSC.deploy();
  await bridgeBSC.waitForDeployment();

  const bscAddress = await bridgeBSC.getAddress();
  console.log("✅ BSC Bridge:", bscAddress);

  // Switch to Nor Chain
  console.log("\n📍 Switching to Nor Chain...");

  // Deploy WBNB Token
  const WBNBToken = await ethers.getContractFactory("WBNBToken");
  const wbnb = await WBNBToken.deploy("Wrapped BNB", "WBNB");
  await wbnb.waitForDeployment();

  const wbnbAddress = await wbnb.getAddress();
  console.log("✅ WBNB Token:", wbnbAddress);

  // Deploy Nor Bridge
  const BNBBridgeNor = await ethers.getContractFactory("BNBBridgeNor");
  const bridgeNor = await BNBBridgeNor.deploy(wbnbAddress);
  await bridgeNor.waitForDeployment();

  const xaheenAddress = await bridgeNor.getAddress();
  console.log("✅ Nor Bridge:", xaheenAddress);

  // Grant minting rights
  console.log("\n🔐 Setting up permissions...");
  await wbnb.grantRole(await wbnb.MINTER_ROLE(), xaheenAddress);
  console.log("✅ Bridge can mint WBNB");

  // Add validators
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5"
  ];

  for (const validator of validators) {
    await bridgeBSC.addValidator(validator);
    await bridgeNor.addValidator(validator);
    console.log("✅ Added validator:", validator);
  }

  console.log("\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("═══════════════════════════════════════");
  console.log("BSC BRIDGE:     ", bscAddress);
  console.log("WBNB TOKEN:     ", wbnbAddress);
  console.log("XAHEEN BRIDGE:  ", xaheenAddress);
  console.log("═══════════════════════════════════════");

  console.log("\n📋 SAVE THESE TO .env:");
  console.log(`BNB_BRIDGE_BSC=${bscAddress}`);
  console.log(`WBNB_TOKEN_XAHEEN=${wbnbAddress}`);
  console.log(`BNB_BRIDGE_XAHEEN=${xaheenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## STEP 4: DEPLOY TO BSC & XAHEEN

### Deploy Commands:

```bash
# 1. Make sure you have BNB for gas on BSC
# Need: ~0.05 BNB (~$20) for deployment

# 2. Check .env has required keys
cat .env | grep -E "MAINNET_PRIVATE_KEY|PRIVATE_CHAIN_KEY|BSC_MAINNET_RPC"

# 3. Deploy to BSC Mainnet
npx hardhat run scripts/deploy-bnb-bridge.js --network bsc

# 4. Deploy to Nor Chain
npx hardhat run scripts/deploy-bnb-bridge.js --network btcbr

# 5. Verify on BSCScan (optional)
npx hardhat verify --network bsc <BSC_BRIDGE_ADDRESS>
```

**Expected output:**
```
🌉 Deploying BNB Bridge...
Deployer: 0x...
BSC Balance: 0.5 BNB

📍 Deploying to BSC Mainnet...
✅ BSC Bridge: 0xABC...123

📍 Switching to Nor Chain...
✅ WBNB Token: 0xDEF...456
✅ Nor Bridge: 0xGHI...789

🔐 Setting up permissions...
✅ Bridge can mint WBNB
✅ Added validator: 0xFAA...
✅ Added validator: 0xfd6...
✅ Added validator: 0xb75...

🎉 DEPLOYMENT COMPLETE!
```

---

## STEP 5: ADD WBNB TO YOUR DEX

### Create WBNB Trading Pair:

```javascript
// scripts/add-wbnb-liquidity.js
import { ethers } from "hardhat";

async function main() {
  const ROUTER_ADDRESS = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
  const WBNB_ADDRESS = "0xDEF...456"; // From deployment
  const WNOR_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";

  const router = await ethers.getContractAt("IUniswapV2Router02", ROUTER_ADDRESS);
  const wbnb = await ethers.getContractAt("IERC20", WBNB_ADDRESS);
  const wxht = await ethers.getContractAt("IERC20", WNOR_ADDRESS);

  // Add liquidity: 10 WBNB + 10,000 NOR
  const bnbAmount = ethers.parseEther("10");
  const xhtAmount = ethers.parseEther("10000");

  console.log("Adding WBNB/NOR liquidity...");

  await wbnb.approve(ROUTER_ADDRESS, bnbAmount);
  await wxht.approve(ROUTER_ADDRESS, xhtAmount);

  await router.addLiquidity(
    WBNB_ADDRESS,
    WNOR_ADDRESS,
    bnbAmount,
    xhtAmount,
    0, // Min amounts (for testing)
    0,
    deployer.address,
    Math.floor(Date.now() / 1000) + 3600 // 1 hour deadline
  );

  console.log("✅ WBNB/NOR pair created!");
  console.log("Users can now swap WBNB → NOR");
}

main();
```

Run:
```bash
npx hardhat run scripts/add-wbnb-liquidity.js --network btcbr
```

---

## STEP 6: VALIDATOR SERVICE (Bridge Relayer)

### Simple Validator Script:

```javascript
// scripts/bridge-validator.js
import { ethers } from "hardhat";

const BSC_BRIDGE = "0xABC...123";
const XAHEEN_BRIDGE = "0xGHI...789";
const WBNB_TOKEN = "0xDEF...456";

async function monitorBridge() {
  console.log("🔍 Bridge Validator Running...\n");

  const providerBSC = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const providerNor = new ethers.JsonRpcProvider(process.env.PRIVATE_CHAIN_RPC);

  const signerBSC = new ethers.Wallet(process.env.VALIDATOR_PRIVATE_KEY, providerBSC);
  const signerNor = new ethers.Wallet(process.env.VALIDATOR_PRIVATE_KEY, providerNor);

  const bridgeBSC = await ethers.getContractAt("BNBBridgeBSC", BSC_BRIDGE, signerBSC);
  const bridgeNor = await ethers.getContractAt("BNBBridgeNor", XAHEEN_BRIDGE, signerNor);

  // Listen for deposits on BSC
  bridgeBSC.on("BridgeDeposit", async (user, amount, nonce) => {
    console.log(`\n💰 New deposit detected!`);
    console.log(`User: ${user}`);
    console.log(`Amount: ${ethers.formatEther(amount)} BNB`);
    console.log(`Nonce: ${nonce}`);

    try {
      // Sign the mint transaction
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256"],
        [user, amount, nonce]
      );

      const signature = await signerNor.signMessage(ethers.getBytes(messageHash));

      // Mint WBNB on Nor
      console.log("🔨 Minting WBNB on Nor Chain...");
      const tx = await bridgeNor.mint(user, amount, nonce, signature);
      await tx.wait();

      console.log("✅ Bridge complete!");
      console.log(`User ${user} received ${ethers.formatEther(amount)} WBNB on Nor`);
    } catch (error) {
      console.error("❌ Bridge failed:", error.message);
    }
  });

  // Listen for burns on Nor (reverse bridge)
  bridgeNor.on("BridgeBurn", async (user, amount, nonce) => {
    console.log(`\n🔥 Burn detected on Nor!`);
    console.log(`User: ${user}`);
    console.log(`Amount: ${ethers.formatEther(amount)} WBNB`);

    try {
      // Sign release on BSC
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256"],
        [user, amount, nonce]
      );

      const signature = await signerBSC.signMessage(ethers.getBytes(messageHash));

      // Release BNB on BSC
      console.log("💸 Releasing BNB on BSC...");
      const tx = await bridgeBSC.releaseBNB(user, amount, signature);
      await tx.wait();

      console.log("✅ Bridge complete!");
      console.log(`User ${user} received ${ethers.formatEther(amount)} BNB on BSC`);
    } catch (error) {
      console.error("❌ Bridge failed:", error.message);
    }
  });

  console.log("✅ Validator is monitoring both chains...\n");
}

monitorBridge().catch(console.error);
```

Run validator:
```bash
node scripts/bridge-validator.js
```

**Keep this running 24/7** (use PM2 or Docker)

---

## STEP 7: USER INTERFACE (Simple Web UI)

### Create Bridge UI:

```html
<!-- frontend/bridge.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Nor Bridge - BNB ↔ Nor</title>
    <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>
</head>
<body>
    <h1>🌉 Nor Bridge</h1>

    <div id="bridge-container">
        <h2>Bridge BNB to Nor Chain</h2>

        <label>Amount (BNB):</label>
        <input type="number" id="amount" placeholder="0.1" min="0.01" max="10" step="0.01">

        <button onclick="bridgeToNor()">Bridge to Nor →</button>

        <div id="status"></div>
    </div>

    <script>
        const BSC_BRIDGE = "0xABC...123";
        const BSC_CHAIN_ID = 56;
        const XAHEEN_CHAIN_ID = 65001;

        async function bridgeToNor() {
            const amount = document.getElementById('amount').value;

            if (!amount || amount < 0.01) {
                alert("Minimum: 0.01 BNB");
                return;
            }

            try {
                // Connect wallet
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);

                // Switch to BSC
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x38' }], // BSC = 56 = 0x38
                });

                const signer = provider.getSigner();

                // Bridge contract
                const bridge = new ethers.Contract(
                    BSC_BRIDGE,
                    ['function bridgeBNB() external payable'],
                    signer
                );

                document.getElementById('status').innerText = "⏳ Sending transaction...";

                // Send BNB to bridge
                const tx = await bridge.bridgeBNB({
                    value: ethers.utils.parseEther(amount)
                });

                document.getElementById('status').innerText = "⏳ Waiting for confirmation...";

                await tx.wait();

                document.getElementById('status').innerHTML =
                    `✅ Success! <br>
                     Your BNB is being bridged to Nor Chain.<br>
                     You'll receive WBNB in ~30 seconds.<br>
                     <a href="https://explorer.xaheen.org/address/${await signer.getAddress()}">View on Explorer</a>`;

            } catch (error) {
                document.getElementById('status').innerText = "❌ Error: " + error.message;
            }
        }
    </script>
</body>
</html>
```

Upload to: `https://xaheen.org/bridge`

---

## STEP 8: USER FLOW (END TO END)

### How Users Will Use It:

**1. User buys BNB on Binance (FIAT → BNB)**
- User creates Binance account
- User deposits USD/EUR via credit card/bank
- User buys BNB

**2. User sends BNB to MetaMask**
- User withdraws BNB from Binance to MetaMask
- User pays small network fee (~$0.50)

**3. User bridges BNB to Nor**
- User goes to https://xaheen.org/bridge
- User connects MetaMask (BSC network)
- User enters amount (e.g., 0.5 BNB)
- User clicks "Bridge to Nor"
- Wait 30-60 seconds for validator

**4. User receives WBNB on Nor**
- Automatically credited to same wallet address
- User switches MetaMask to Nor Chain
- User sees WBNB balance

**5. User swaps WBNB → NOR on DEX**
- User goes to Nor DEX
- User swaps WBNB for NOR
- Now user has NOR for gas + trading!

**Total time: 5-10 minutes**
**Total cost: ~$1-2 in fees**

---

## TESTING CHECKLIST

### Before Going Live:

- [ ] Deploy to BSC Testnet first (test with fake BNB)
- [ ] Deploy to Nor Chain
- [ ] Test bridge BSC → Nor with 0.01 BNB
- [ ] Verify WBNB minted correctly on Nor
- [ ] Test reverse bridge Nor → BSC
- [ ] Test swap WBNB → NOR on DEX
- [ ] Test with multiple users
- [ ] Verify validator is signing correctly
- [ ] Check all events are logged
- [ ] Test error cases (insufficient balance, invalid amounts)

---

## SECURITY CONSIDERATIONS

### Multi-Signature Validation:

**Currently**: Your validator setup is single-sig
**Recommended**: Multi-sig (2-of-3 validators)

```solidity
// Require 2-of-3 validator signatures
function mint(address to, uint256 amount, bytes[] memory signatures) external {
    require(signatures.length >= 2, "Need 2 signatures");
    require(verifySignatures(to, amount, signatures), "Invalid signatures");
    _mint(to, amount);
}
```

### Transfer Limits:

```solidity
// Protect against large unauthorized transfers
uint256 public constant MIN_AMOUNT = 0.01 ether; // 0.01 BNB
uint256 public constant MAX_AMOUNT = 10 ether;   // 10 BNB
uint256 public constant DAILY_LIMIT = 100 ether; // 100 BNB per address
```

### Emergency Pause:

```solidity
// Allow owner to pause bridge in emergency
bool public paused = false;

function pause() external onlyOwner {
    paused = true;
}

function unpause() external onlyOwner {
    paused = false;
}
```

---

## ESTIMATED COSTS

### Deployment:
- BSC gas: ~0.02 BNB (~$8)
- Nor gas: ~0.001 NOR (~$0.001)
- **Total deployment: ~$10**

### Operational:
- Validator signing: ~$0.10 per bridge transaction
- User pays bridge fee: 0.1% (covers validator costs)

### Liquidity:
- Initial WBNB/NOR pool: 10 BNB + 10,000 NOR (~$400 + $10)
- **Total liquidity: ~$410**

**Grand total to launch bridge: ~$420**

---

## MONITORING & MAINTENANCE

### What to Monitor:

```bash
# Check validator is running
pm2 status bridge-validator

# View logs
pm2 logs bridge-validator

# Monitor transactions
curl https://explorer.xaheen.org/api/v2/transactions?module=account&action=txlist&address=<BRIDGE_ADDRESS>

# Check bridge balance
curl -X POST https://rpc.xaheen.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["<BRIDGE_ADDRESS>","latest"],"id":1}'
```

---

## QUICK START COMMANDS

```bash
# 1. Create bridge deployment script
cat > scripts/deploy-bnb-bridge-quick.js << 'EOF'
[paste deployment script from above]
EOF

# 2. Deploy to BSC Mainnet
npx hardhat run scripts/deploy-bnb-bridge-quick.js --network bsc

# 3. Deploy to Nor Chain
npx hardhat run scripts/deploy-bnb-bridge-quick.js --network btcbr

# 4. Add WBNB liquidity to DEX
npx hardhat run scripts/add-wbnb-liquidity.js --network btcbr

# 5. Start validator
node scripts/bridge-validator.js

# 6. Upload bridge UI
scp frontend/bridge.html user@yourserver:/var/www/html/bridge.html

# 7. Test with small amount
# Send 0.01 BNB through bridge interface
```

---

## SUCCESS METRICS

**Week 1:**
- [ ] Bridge deployed and tested
- [ ] 5-10 test transactions successful
- [ ] Validator running 24/7

**Month 1:**
- [ ] 100+ bridge transactions
- [ ] $10K+ volume bridged
- [ ] Zero security incidents
- [ ] <1 minute bridge time

---

## TROUBLESHOOTING

**Problem**: Bridge transaction stuck
**Solution**: Check validator logs, manually process if needed

**Problem**: WBNB not minting on Nor
**Solution**: Verify bridge has MINTER_ROLE on WBNB contract

**Problem**: Validator not signing
**Solution**: Check validator has BNB/NOR for gas on both chains

**Problem**: User can't see WBNB
**Solution**: User needs to add WBNB token to MetaMask (provide contract address)

---

## NEXT STEPS AFTER BRIDGE

**Once bridge is live:**

1. **Add more pairs**: USDT bridge, ETH bridge
2. **List on bridge aggregators**: Multichain, Celer, Connext
3. **Create tutorial videos**: "How to bridge to Nor"
4. **Offer bridge fee discounts**: First 100 users get free bridging
5. **Monitor and optimize**: Reduce bridge time, add features

---

## READY TO DEPLOY?

**Pre-deployment checklist:**
- [ ] Have 0.05 BNB on BSC for gas
- [ ] Have NOR on Nor for gas
- [ ] `.env` configured with private keys
- [ ] Hardhat networks configured
- [ ] Validator key ready
- [ ] Bridge contracts reviewed
- [ ] Test plan ready

**Deploy command:**
```bash
npm run deploy:bridge
```

**This is your fastest path to solving the fiat problem!** 🚀

Users buy BNB (easy) → Bridge to Nor (your bridge) → Swap to NOR (your DEX) → Trade! ✅
