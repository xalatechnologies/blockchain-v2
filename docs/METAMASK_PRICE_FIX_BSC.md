# Fixing MetaMask Price Display on BSC

**Issue**: Token shows $0.00 in MetaMask on BSC  
**Root Cause**: Token not listed on CoinGecko/CoinMarketCap price aggregators  
**Solution**: Get token listed on price aggregators

---

## Why MetaMask Shows $0

MetaMask gets token prices from:
1. **CoinGecko API** (primary source, free)
2. **CoinMarketCap API** (secondary source)
3. **Built-in oracle** (major tokens only)

If your token isn't listed on these platforms, MetaMask cannot fetch the price and shows $0.00.

---

## Current BSC Token Addresses

Based on deployment records, you have these NOR tokens on BSC:

1. **NOR Token**: `0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97`
   - BSCScan: https://bscscan.com/token/0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97
   - Status: Deployed, but not listed on CoinGecko

2. **NOR Token (Alternative)**: `0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E`
   - BSCScan: https://bscscan.com/address/0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E
   - Status: Deployed, but not listed on CoinGecko

---

## Solutions to Get Price Display

### Solution 1: Submit to CoinGecko (Recommended)

**CoinGecko Listing Requirements:**
1. ✅ Token deployed on BSC
2. ✅ Contract verified on BSCScan
3. ✅ Token has trading activity
4. ✅ Liquidity pool exists (PancakeSwap recommended)
5. ✅ Minimum trading volume (varies)
6. ✅ Project has website/social media

**Steps to Submit:**

1. **Verify Contract on BSCScan**
   ```bash
   # If not already verified, verify the contract
   # Go to BSCScan → Contract → Verify and Publish
   ```

2. **Add Liquidity to PancakeSwap**
   - Create a NOR/USDT or NOR/BNB pair on PancakeSwap
   - Add minimum $10k-$50k liquidity
   - This creates trading activity

3. **Submit to CoinGecko**
   - Go to: https://www.coingecko.com/en/coins/new
   - Fill out the form with:
     - Contract address
     - Token name: "Nor"
     - Symbol: "NOR"
     - Decimals: 18
     - Website: Your project website
     - Social media links
   - Wait for approval (1-7 days)

4. **Submit to CoinMarketCap** (Optional but recommended)
   - Go to: https://coinmarketcap.com/community/portal/
   - Submit token listing request
   - Provide same information

---

### Solution 2: Add Liquidity to PancakeSwap (Quick Fix)

Adding liquidity helps with:
- Token discovery
- Trading activity (required for CoinGecko)
- Price discovery

**Steps:**

1. **Create PancakeSwap Pair**
   ```bash
   # Use PancakeSwap Router to add liquidity
   # NOR/USDT or NOR/BNB pair
   ```

2. **Add Initial Liquidity**
   - Minimum: $10,000 worth
   - Recommended: $50,000+ for better visibility

3. **Wait for Indexing**
   - CoinGecko crawls PancakeSwap pairs
   - May take 24-48 hours to appear

---

### Solution 3: Use Custom Price Oracle (Advanced)

If you need immediate price display without waiting for CoinGecko:

1. **Deploy Price Oracle Contract**
   ```solidity
   contract PriceOracle {
       mapping(address => uint256) public prices; // Price in USD * 10^18
       
       function updatePrice(address token, uint256 priceUSD) external onlyOwner {
           prices[token] = priceUSD;
       }
   }
   ```

2. **Update Prices from Nor Chain**
   - Read prices from Nor Chain DEX pairs
   - Update BSC oracle contract
   - Build custom MetaMask integration

**Note**: MetaMask won't automatically read custom oracles. You'd need a custom dApp.

---

### Solution 4: Use Existing Price Feeds (If Available)

If NOR is trading on other DEXs that CoinGecko indexes:

1. **Check if NOR is on other DEXs**
   - Search CoinGecko for "NOR" token
   - See if any existing listings match

2. **Use Same Contract Address**
   - If another project uses same address pattern
   - MetaMask might recognize it

---

## Quick Checklist

- [ ] Contract verified on BSCScan
- [ ] Token has trading activity (transactions)
- [ ] Liquidity pool exists (PancakeSwap or other DEX)
- [ ] Minimum $10k liquidity
- [ ] Project website exists
- [ ] Social media accounts exist
- [ ] Submitted to CoinGecko
- [ ] Submitted to CoinMarketCap (optional)

---

## Expected Timeline

- **CoinGecko Listing**: 1-7 days after submission
- **Price Display in MetaMask**: 24-48 hours after CoinGecko listing
- **Trading Activity Required**: Minimum 7 days of trading

---

## Current Status Check

To check if your token is listed:

1. **CoinGecko**: https://www.coingecko.com/en/coins/nor
2. **CoinMarketCap**: https://coinmarketcap.com/currencies/nor/
3. **BSCScan**: Check token page for price data

---

## Alternative: Manual Price Calculation

Until CoinGecko listing, you can:

1. **Calculate price from Nor Chain**
   - Use the price script: `./scripts/get-addresses-and-prices-simple.sh`
   - Current NOR price: ~$0.01 USD

2. **Display in Custom dApp**
   - Build a simple frontend
   - Fetch price from Nor Chain
   - Display alongside MetaMask balance

---

## Next Steps

1. **Immediate**: Add liquidity to PancakeSwap (NOR/USDT pair)
2. **Short-term**: Submit to CoinGecko listing
3. **Long-term**: Build trading volume to maintain listing

---

**Note**: MetaMask price display is entirely dependent on external price aggregators. There's no way to force MetaMask to show prices without going through CoinGecko/CoinMarketCap.

