# Token Addresses & USD Display Guide

## Token Contract Addresses

### BTCBR Token
- **BSC Mainnet**: `0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f`
- **Nor Chain**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
- **Status**: Different addresses ❌

### XHN Token
- **BSC Mainnet**: `0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C`
- **Nor Chain**: `0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C`
- **Status**: SAME address ✅

## Why MetaMask Shows/Doesn't Show USD

### On BSC Mainnet ✅
- **Will show USD**: Yes, after trading activity is indexed
- **Why**: BSC is a public chain indexed by CoinGecko, CoinMarketCap, DexScreener
- **Timeline**: 30 minutes - 2 hours after trading begins
- **Current Status**: Trading bot has run, generating volume

### On Nor Private Chain ⏳
- **XHN will show USD**: Maybe (same address as BSC)
- **BTCBR will NOT show USD**: No (different address)
- **Why**: MetaMask relies on public price aggregators
- **Private chains**: Not automatically indexed

## Solutions for Nor USD Display

### Solution 1: Leverage XHN Same Address ✅

Since XHN has the same contract address on both chains, MetaMask might recognize it and show USD values on Nor. This happens when:
- The token is indexed on BSC mainnet
- MetaMask sees the same address on different chains
- The price feed is available

**Wait 1-2 hours after BSC trading**, then check if XHN shows USD on Nor.

### Solution 2: Deploy Price Oracle Contract 🔧

Deploy a smart contract on Nor that reads BSC prices:

```solidity
// PriceOracle.sol
contract PriceOracle {
    // Manually update prices from BSC
    mapping(address => uint256) public prices; // Price in USD * 10^18

    function updatePrice(address token, uint256 priceUSD) external onlyOwner {
        prices[token] = priceUSD;
    }

    function getPrice(address token) external view returns (uint256) {
        return prices[token];
    }
}
```

**Pros:**
- Works on private chain
- You control the prices
- Can update anytime

**Cons:**
- MetaMask won't read it automatically
- Need custom app to display

### Solution 3: Custom Web App with Price Display ✅

Build a simple web app that:
1. Reads BSC PancakeSwap prices
2. Shows token balances with USD values
3. Works for Nor chain users

**This is the BEST solution for private chains.**

### Solution 4: Submit to CoinGecko/DexScreener ⏳

**For BSC tokens only** (not Nor):

1. **DexScreener** - Automatic indexing
   - URL: https://dexscreener.com/bsc/[PAIR_ADDRESS]
   - Will index automatically after trading volume
   - Usually 24-48 hours

2. **CoinGecko** - Manual submission
   - Submit form: https://www.coingecko.com/en/coins/new
   - Requirements: Volume, liquidity, community
   - Can take weeks

3. **CoinMarketCap** - Manual submission
   - Submit form: https://coinmarketcap.com/request/
   - Requirements: Volume, holders, time active
   - Can take weeks

## Current Status

### BSC Mainnet (Public)
- ✅ BTCBR deployed with liquidity ($106)
- ✅ XHN deployed with liquidity (~$47)
- ✅ Trading activity generated
- ⏳ Waiting for indexing (30min - 2hrs)
- 📊 DexScreener: Will auto-detect trading
- 💰 MetaMask USD: Will appear soon

### Nor Chain (Private)
- ✅ BTCBR deployed (different address)
- ✅ XHN deployed (same address as BSC)
- ❓ XHN might show USD (same address)
- ❌ BTCBR won't show USD (different address)
- 🔧 Need custom solution for USD display

## Recommended Actions

### Short Term (Today)
1. ✅ Wait 1-2 hours for BSC indexing
2. ✅ Check if XHN shows USD on Nor (same address)
3. ✅ Monitor DexScreener for automatic listing

### Medium Term (This Week)
1. 🔧 Build custom price display web app
2. 📝 Submit to CoinGecko (for BSC tokens)
3. 📝 Submit to CoinMarketCap (for BSC tokens)
4. 🎨 Create token logos (200x200 PNG)

### Long Term (This Month)
1. 🌉 Complete bridge UI with price display
2. 📱 Build mobile-friendly wallet interface
3. 📊 Add price charts and trading interface
4. 🚀 Launch marketing campaign

## How to Check USD Display

### On MetaMask
1. Add token to MetaMask
2. Switch to BSC Mainnet
3. Wait 1-2 hours after trading
4. Refresh MetaMask
5. USD value should appear

### On Nor Chain
1. Add XHN token (same address)
2. Check if USD appears (might work!)
3. For BTCBR: Need custom solution

### Check DexScreener
- BTCBR: https://dexscreener.com/bsc/0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f
- XHN: https://dexscreener.com/bsc/0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C

### Check PancakeSwap
- BTCBR: https://pancakeswap.finance/swap?outputCurrency=0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f&chain=bsc
- XHN: https://pancakeswap.finance/swap?outputCurrency=0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C&chain=bsc

## Price Display Custom App

I can build a simple web app that:
- Connects to both BSC and Nor
- Reads PancakeSwap prices from BSC
- Shows your Nor balances with USD values
- Works in browser, no installation needed

Would you like me to build this? It will take about 1 hour.

## Summary

**BSC Mainnet:**
- 🎯 Will show USD automatically (30min - 2hrs)
- 📈 Trading volume generated
- 🔍 Being indexed by DexScreener

**Nor Private Chain:**
- 💡 XHN might show USD (same address)
- 🔧 Need custom app for reliable USD display
- 🚀 Best solution: Bridge UI with built-in prices

**Next Steps:**
1. Wait for BSC indexing
2. Check if XHN shows USD on Nor
3. Build custom price display app (if needed)
