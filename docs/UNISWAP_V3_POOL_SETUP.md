# 🦄 Uniswap V3 Pool Setup Guide

**Network**: Ethereum Mainnet
**Token**: wBTCBR (Wrapped BTCBR)
**DEX**: Uniswap V3

---

## 📋 Prerequisites

1. ✅ wBTCBR deployed on Ethereum: `[YOUR_ADDRESS_HERE]`
2. ✅ ETH for liquidity provision
3. ✅ USDT for USDT pair
4. ✅ MetaMask or hardware wallet with funds

---

## 🎯 Recommended Pools

### **Pool 1: wBTCBR/ETH (0.3% fee tier)** ⭐ Primary

**Why 0.3%?**
- Standard fee for most token pairs
- Balances LP earnings vs. trader costs
- Proven liquidity tier

**Recommended Initial Liquidity**: $25K-50K
- Example: 50 ETH + equivalent wBTCBR

### **Pool 2: wBTCBR/USDT (0.05% fee tier)**

**Why 0.05%?**
- Stablecoin-adjacent pricing
- Encourages high-volume trading
- Lower slippage for traders

**Recommended Initial Liquidity**: $10K-25K
- Example: 25,000 USDT + equivalent wBTCBR

---

## 🔧 Step-by-Step Pool Creation

### **Method 1: Using Uniswap Web Interface (Easiest)**

#### 1. Navigate to Uniswap
```
https://app.uniswap.org/pools
```

#### 2. Click "New Position"

#### 3. Select Tokens
- Token A: wBTCBR (paste contract address)
- Token B: ETH (or WETH)
- Fee Tier: 0.3%

#### 4. Set Price Range (Important!)

**For wBTCBR/ETH:**
- **Full Range** (recommended for initial liquidity)
  - Min Price: 0 (technically very small number)
  - Max Price: ∞ (technically very large number)
  - Provides liquidity at all prices
  - Simplest approach for new pools

- **Concentrated Range** (advanced, higher APY)
  - Example: Current price ±50%
  - If wBTCBR = 0.01 ETH:
    - Min: 0.005 ETH
    - Max: 0.015 ETH
  - More capital efficient
  - Requires active management

#### 5. Set Liquidity Amount
```
Enter amount for one token:
ETH: 50 (or your amount)

Uniswap will automatically calculate wBTCBR amount needed
```

#### 6. Approve Tokens
- Click "Approve wBTCBR"
- Wait for transaction confirmation
- Click "Approve WETH" (if needed)

#### 7. Add Liquidity
- Review details
- Click "Add"
- Confirm transaction in MetaMask
- Wait for confirmation

#### 8. Receive LP NFT
- You'll receive a unique NFT representing your position
- NFT ID is your position tracker
- **Keep this safe!** It's needed to manage/withdraw liquidity

---

### **Method 2: Using Ethers.js (Programmatic)**

```javascript
import { ethers } from "ethers";
import IUniswapV3Factory from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import INonfungiblePositionManager from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";

const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Uniswap V3 Addresses (Ethereum Mainnet)
const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const wbtcbrAddress = "[YOUR_WBTCBR_ADDRESS]";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Step 1: Create pool (if doesn't exist)
const factory = new ethers.Contract(FACTORY, IUniswapV3Factory.abi, signer);

// Fee tier: 3000 = 0.3%, 500 = 0.05%, 10000 = 1%
const feeTier = 3000; // 0.3%

const createPoolTx = await factory.createPool(
    wbtcbrAddress,
    wethAddress,
    feeTier
);
await createPoolTx.wait();
console.log("Pool created!");

// Get pool address
const poolAddress = await factory.getPool(wbtcbrAddress, wethAddress, feeTier);
console.log("Pool address:", poolAddress);

// Step 2: Initialize pool price (first time only)
const pool = new ethers.Contract(poolAddress, [
    "function initialize(uint160 sqrtPriceX96) external"
], signer);

// Calculate initial price
// sqrtPriceX96 = sqrt(price) * 2^96
// Example: 1 wBTCBR = 0.01 ETH
// price = 0.01, sqrt(0.01) = 0.1
// sqrtPriceX96 = 0.1 * 2^96 = 7.92e27
const sqrtPriceX96 = "7922816251426433759354395033"; // Adjust based on desired price

await pool.initialize(sqrtPriceX96);
console.log("Pool initialized!");

// Step 3: Add liquidity
const positionManager = new ethers.Contract(
    POSITION_MANAGER,
    INonfungiblePositionManager.abi,
    signer
);

// Approve tokens
const wbtcbr = new ethers.Contract(wbtcbrAddress, ERC20_ABI, signer);
const weth = new ethers.Contract(wethAddress, ERC20_ABI, signer);

await wbtcbr.approve(POSITION_MANAGER, ethers.MaxUint256);
await weth.approve(POSITION_MANAGER, ethers.MaxUint256);

// Mint position (full range)
const mintParams = {
    token0: wbtcbrAddress < wethAddress ? wbtcbrAddress : wethAddress,
    token1: wbtcbrAddress < wethAddress ? wethAddress : wbtcbrAddress,
    fee: feeTier,
    tickLower: -887220, // Full range min tick
    tickUpper: 887220,  // Full range max tick
    amount0Desired: ethers.parseEther("1000000"), // wBTCBR amount
    amount1Desired: ethers.parseEther("50"),      // WETH amount
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
};

const tx = await positionManager.mint(mintParams);
const receipt = await tx.wait();

// Get NFT ID from event
const transferEvent = receipt.logs.find(
    log => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
);
const nftId = ethers.toNumber(transferEvent.topics[3]);

console.log("Liquidity added! NFT ID:", nftId);
```

---

## 💰 Liquidity Provision Strategy

### **Initial Launch (Week 1-2)**

**wBTCBR/ETH Pool:**
- Amount: 50 ETH + equivalent wBTCBR
- Range: Full range (safest)
- Expected APY: 10-30% (depends on volume)

**wBTCBR/USDT Pool:**
- Amount: 25,000 USDT + equivalent wBTCBR
- Range: Full range
- Expected APY: 5-20%

### **Growth Phase (Month 1-3)**

**Concentrated Liquidity:**
- Move to ±25% range around current price
- Monitor and rebalance weekly
- Higher capital efficiency
- Expected APY: 30-100%+

### **Mature Phase (Month 4+)**

**Multiple Positions:**
- 60% in tight range (±10%)
- 30% in medium range (±25%)
- 10% in wide range (±50%)
- Active rebalancing strategy
- Expected APY: 50-150%+

---

## 📊 Pool Management

### **Monitor Your Position**

Check regularly:
- Current price vs. your range
- Fees earned
- Impermanent loss
- Volume trends

**Tools:**
- Uniswap Analytics: https://info.uniswap.org
- Revert Finance: https://revert.finance
- APY.vision: https://apy.vision

### **When to Rebalance**

Rebalance if:
- Price moves outside your range
- Fees earned < impermanent loss
- Volume shifts to different range
- Market conditions change

**Rebalancing Steps:**
1. Remove liquidity (burn NFT)
2. Collect fees
3. Create new position with adjusted range
4. Add liquidity

### **Fee Collection**

```javascript
// Collect fees without removing liquidity
const collectParams = {
    tokenId: nftId,
    recipient: signer.address,
    amount0Max: ethers.MaxUint128,
    amount1Max: ethers.MaxUint128
};

const collectTx = await positionManager.collect(collectParams);
await collectTx.wait();
console.log("Fees collected!");
```

---

## ⚠️ Important Considerations

### **Impermanent Loss**

Uniswap V3 has **higher impermanent loss** than V2 due to concentrated liquidity:

**Example:**
- Initial: 1 wBTCBR = 0.01 ETH
- Price doubles: 1 wBTCBR = 0.02 ETH
- Loss: ~5-10% (depends on range)

**Mitigation:**
- Wider ranges = less IL
- Collect fees regularly
- Rebalance when needed

### **Gas Costs**

Ethereum gas is expensive:
- Pool creation: $50-200
- Add liquidity: $50-150
- Remove liquidity: $50-150
- Rebalance: $100-300

**Tips:**
- Deploy during low gas periods (weekends, nights EST)
- Use gas trackers: https://etherscan.io/gastracker
- Consider batching operations

### **Price Discovery**

For new tokens:
- Start with conservative pricing
- Monitor first trades closely
- Adjust range based on market
- Don't fight the market

---

## 🎯 Success Metrics

**Week 1:**
- ✅ Pool created and liquid
- ✅ First trades executed
- ✅ 10+ unique traders
- ✅ $50K+ volume

**Month 1:**
- ✅ $500K+ TVL
- ✅ $1M+ monthly volume
- ✅ Listed on CoinGecko/CMC
- ✅ 50+ daily active traders

**Month 3:**
- ✅ $2M+ TVL
- ✅ $10M+ monthly volume
- ✅ Top 100 on Uniswap
- ✅ 200+ daily active traders

---

## 📞 Support Resources

**Uniswap:**
- Docs: https://docs.uniswap.org/
- Discord: https://discord.gg/uniswap
- Forum: https://gov.uniswap.org/

**Analytics:**
- Uniswap Info: https://info.uniswap.org
- Dune Analytics: https://dune.com/uniswap

**Tools:**
- Liquidity Manager: https://revert.finance
- APY Calculator: https://apy.vision
- IL Calculator: https://dailydefi.org/tools/impermanent-loss-calculator/

---

## ✅ Pre-Launch Checklist

- [ ] wBTCBR deployed on Ethereum
- [ ] Bridge operational between Xaheen and Ethereum
- [ ] Marketing materials ready
- [ ] Initial liquidity secured ($25K+ recommended)
- [ ] Pool parameters decided (fee tier, range)
- [ ] Gas funds available (0.5+ ETH)
- [ ] Position management strategy defined
- [ ] Analytics tracking setup
- [ ] Community announcement prepared
- [ ] CoinGecko/CMC listing applications submitted

---

**Last Updated**: October 30, 2025
**wBTCBR Contract**: [DEPLOY TO ETHEREUM FIRST]
**Uniswap V3 Factory**: `0x1F98431c8aD98523631AE4a59f267346ea31F984`
**Position Manager**: `0xC36442b4a4522E871399CD717aBDD847Ab11FE88`
