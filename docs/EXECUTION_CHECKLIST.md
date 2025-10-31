# ✅ Execution Checklist: Treasury Market Maker Strategy

**Goal**: Launch fiat on-ramp with treasury-controlled market in 2 weeks

---

## Week 1: Foundation (Budget: < $5K)

### Day 1-2: Treasury Setup

- [ ] **Check current treasury status**
  ```bash
  node scripts/treasury-market-maker.js status
  ```

- [ ] **Deploy initial treasury liquidity** (Conservative: 100M XHT + $100K USDT)
  ```bash
  node scripts/treasury-market-maker.js setup 100000000 100000
  ```
  - This sets initial price at $0.001 per XHT
  - Treasury now owns 100% of liquidity
  - Treasury earns 100% of trading fees

- [ ] **Verify LP position**
  ```bash
  node scripts/treasury-market-maker.js status
  ```
  - Confirm treasury controls the market
  - Note the pair address
  - Save for MoonPay integration

---

### Day 3-4: Fiat On-Ramp Integration

- [ ] **Sign up for MoonPay Business Account**
  - Go to: https://www.moonpay.com/dashboard/getting-started
  - Complete business verification (KYB)
  - Get API keys (sandbox first)
  - Expected time: 1-3 business days

- [ ] **Alternative: Sign up for Transak**
  - Go to: https://transak.com
  - Complete KYB verification
  - Get API keys
  - Backup option if MoonPay delays

- [ ] **Update widget with your API keys**
  - Edit `frontend/BuyXHT.html`
  - Replace `pk_test_YOUR_KEY_HERE` with real key
  - Test in sandbox mode first

---

### Day 5: Deploy to Production Website

- [ ] **Add widget to your website**
  - Copy `frontend/BuyXHT.html` to your site
  - Or embed iframe:
  ```html
  <iframe src="/BuyXHT.html" width="100%" height="800px"></iframe>
  ```

- [ ] **Configure purchase limits** (Start small)
  - New users: Max $100 per purchase
  - Max $500 per day per user
  - Gradually increase after testing

- [ ] **Test end-to-end flow**
  1. Open widget on your site
  2. Enter test amount ($10 in sandbox)
  3. Complete MoonPay flow
  4. Verify XHT arrives in wallet
  5. Check treasury earned fees

---

### Day 6-7: Marketing Setup

- [ ] **Create social media accounts** (if not exists)
  - Twitter: @XaheenChain
  - Telegram: t.me/xaheenchain
  - Discord: discord.gg/xaheenchain

- [ ] **Prepare launch announcement**
  ```
  🚀 Buy XHT directly with credit card!

  ✅ Instant delivery (30 seconds)
  ✅ No exchange account needed
  ✅ Low fees (0.3%)
  ✅ Secure & simple

  Try it now: [your-website.com/buy]
  ```

- [ ] **Create explainer video** (< $500)
  - Screen recording showing purchase flow
  - Upload to YouTube
  - Share on social media

---

## Week 2: Launch & Growth

### Day 8: Soft Launch (Invite-Only)

- [ ] **Invite 10 trusted beta testers**
  - Friends, family, early community members
  - Ask them to buy $100 each
  - Collect feedback on UX

- [ ] **Monitor first purchases**
  ```bash
  # Check if transactions flowing through treasury DEX
  node scripts/treasury-market-maker.js status
  ```

- [ ] **Troubleshoot any issues**
  - Payment failures?
  - Token delivery delays?
  - Price slippage too high?

---

### Day 9-10: Public Announcement

- [ ] **Launch publicly**
  - Post on Twitter/Telegram/Discord
  - Share explainer video
  - Offer launch bonus: "First 100 buyers get 10% bonus XHT!"

- [ ] **Run targeted ads** ($2K budget)
  - Facebook: Target crypto investors
  - Google: "Buy XHT" keywords
  - Twitter: Crypto community

- [ ] **Engage with community**
  - Answer questions
  - Share success stories
  - Post daily volume updates

---

### Day 11-12: Scaling

- [ ] **Increase purchase limits**
  - Based on demand, raise to $1,000 per purchase
  - Increase daily limit to $5,000 per user

- [ ] **Add more treasury liquidity** (if needed)
  ```bash
  node scripts/treasury-market-maker.js add 50000000 50000
  # Adds 50M XHT + $50K USDT more
  ```

- [ ] **Monitor treasury metrics**
  - Total volume through DEX
  - Fees earned by treasury
  - XHT price stability
  - User acquisition cost

---

### Day 13-14: BSC Bridge (Optional)

- [ ] **Deploy bridge to BSC** (if desired)
  ```bash
  # Deploy bridge contracts
  npx hardhat run scripts/deploy-bridge-complete.sh
  ```

- [ ] **Add liquidity on PancakeSwap** (small amount)
  - 10M XHT + $10K USDT
  - Let market find equilibrium
  - Arbitrageurs will maintain price parity

- [ ] **Monitor arbitrage**
  - Xaheen price: Check your DEX
  - BSC price: Check PancakeSwap
  - Should converge automatically

---

## Success Metrics: Week 2 Targets

### Conservative Targets:
- [ ] 100 total investors
- [ ] $10,000 total fiat inflow
- [ ] $30 treasury fees earned
- [ ] $11,000 treasury LP value (10% gain)
- [ ] Zero fraud/disputes

### Stretch Targets:
- [ ] 500 total investors
- [ ] $100,000 total fiat inflow
- [ ] $300 treasury fees earned
- [ ] $110,000 treasury LP value (10% gain)
- [ ] Listed on CoinGecko

---

## Month 2: Growth Phase

### Week 3-4: Remove Limits

- [ ] **Increase to $10K per purchase**
- [ ] **Add more treasury liquidity**
  ```bash
  node scripts/treasury-market-maker.js add 100000000 100000
  # Now 250M XHT + $250K total
  ```

- [ ] **Launch staking program**
  - Already deployed: `0xbA554577De2d3eE1AdE77737Dc32717527E0cA86`
  - Offer 50% APY for 6-month lock
  - Reduces circulating supply

### Week 5-6: Marketing Expansion

- [ ] **Increase ad budget to $5K/month**
- [ ] **Partner with crypto influencers**
- [ ] **Launch referral program**
  - Give 5% bonus to referrer
  - Give 5% bonus to referee
  - Viral growth mechanism

### Week 7-8: Listings & Credibility

- [ ] **Apply for CoinGecko listing** (free)
  - Submit form: coingecko.com/request
  - Provide contract address, logo, social links
  - Takes 1-2 weeks

- [ ] **Apply for CoinMarketCap** (free)
  - Submit form: coinmarketcap.com/request
  - Provide same information
  - Takes 2-4 weeks

- [ ] **Get security audit** (optional, $10K-$50K)
  - CertiK, Quantstamp, or Trail of Bits
  - Builds investor confidence
  - Can list on more platforms

---

## Month 3: Scale

### Revenue Targets:

**Conservative:**
- 1,000 investors
- $500K fiat inflow
- $1,500 treasury fees
- $550K treasury LP value

**Aggressive:**
- 5,000 investors
- $2M fiat inflow
- $6,000 treasury fees
- $2.2M treasury LP value

---

## Emergency Procedures

### If Price Dumps:

```bash
# Treasury buyback to support price
node scripts/treasury-market-maker.js add 0 50000
# Adds $50K USDT buy pressure (no XHT)
```

### If Liquidity Too Low:

```bash
# Add more liquidity
node scripts/treasury-market-maker.js add 50000000 50000
```

### If Too Much Demand:

- Increase purchase limits
- Add more treasury liquidity
- Raise price target gradually

---

## Daily Monitoring Checklist

Every day, check:

- [ ] **Treasury status**
  ```bash
  node scripts/treasury-market-maker.js status
  ```

- [ ] **Number of new purchases** (MoonPay dashboard)
- [ ] **Total fiat inflow** (today, this week, this month)
- [ ] **XHT price stability** (should stay near target)
- [ ] **Treasury fees earned** (cumulative)
- [ ] **Social media engagement** (followers, mentions)
- [ ] **Support tickets** (resolve within 24h)

---

## Key Performance Indicators (KPIs)

### Financial KPIs:
- Daily fiat inflow
- Treasury fees earned
- Treasury LP value
- XHT price (target: gradual increase)

### User KPIs:
- New users per day
- Repeat purchase rate
- Average purchase size
- Referral conversion rate

### Marketing KPIs:
- Social media followers
- Website traffic
- Ad conversion rate
- Cost per acquisition

---

## Budget Breakdown: First 2 Months

### Setup (Week 1): $5K
- Treasury liquidity: $100K USDT (from reserves)
- MoonPay KYB: $0 (free)
- Website integration: $0 (already built)
- Marketing prep: $500
- Misc: $500

### Launch (Week 2): $2K
- Facebook ads: $1K
- Google ads: $500
- Influencer: $500

### Growth (Month 2): $10K
- Increased ad spend: $5K
- Influencer partnerships: $3K
- Referral bonuses: $2K

### Total Budget (2 months): $17K

### Expected Revenue (2 months): $50K+
### ROI: 3x

---

## Support & Resources

### Documentation:
- **Strategy**: `docs/GENIUS_STRATEGY_UNIFIED_MARKET.md`
- **Fiat Integration**: `docs/FIAT_ONRAMP_INTEGRATION.md`
- **Treasury Script**: `scripts/treasury-market-maker.js`
- **Widget**: `frontend/BuyXHT.html`

### Smart Contracts:
- **WXHT**: `0x26c0eaF731885b14c031cc50dB79b36458E0b355`
- **Router**: `0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916`
- **Factory**: `0xBE254176B4f13b02f367a9feCE599ee8887E2D34`
- **Staking**: `0xbA554577De2d3eE1AdE77737Dc32717527E0cA86`

### External Links:
- **MoonPay**: https://www.moonpay.com/dashboard
- **Transak**: https://transak.com
- **CoinGecko**: https://coingecko.com/request
- **CoinMarketCap**: https://coinmarketcap.com/request

---

## Final Notes

**The Strategy in One Sentence:**
> You control the market, earn from every sale, and your treasury appreciates—this is how you build $100M+ wealth from $5K investment.

**Remember:**
- Start small, scale carefully
- Monitor daily, adjust quickly
- Community first, profits follow
- Control the narrative

**You're not just launching a token—you're creating an economy you own!** 🚀
