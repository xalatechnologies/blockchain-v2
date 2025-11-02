# 💳 Fiat On-Ramp Integration Guide

**Enable users to buy XHT with credit cards, bank transfers, and fiat payments**

---

## 🏦 Provider Comparison

| Provider | Fees | Countries | Integration | Best For |
|----------|------|-----------|-------------|----------|
| **MoonPay** | 3.5-4.5% | 160+ | ⭐⭐ Easy | Quick launch, global |
| **Transak** | 2.99-5.5% | 160+ | ⭐⭐ Easy | Lower fees |
| **Ramp** | 2.9-3.9% | 170+ | ⭐⭐⭐ Medium | Europe, low fees |
| **Wyre/Bolt** | 3.9% | US/EU/Asia | ⭐⭐⭐ Medium | US-focused |

**Recommendation**: Start with **MoonPay** (easiest) or **Transak** (lower fees)

---

## 🚀 MoonPay Integration (Recommended)

### Step 1: Sign Up for MoonPay

1. Go to https://www.moonpay.com/dashboard/getting-started
2. Create business account
3. Complete KYB (Know Your Business) verification
4. Get API keys (takes 1-3 business days)

### Step 2: Register Your Token

**Requirements:**
- Token contract deployed on supported chain (BSC, Ethereum, etc.)
- Token listed on CoinGecko or CoinMarketCap
- Minimum trading volume: $10K/day
- Security audit (recommended)

**Application Process:**
```
1. Email: currencies@moonpay.com
2. Provide:
   - Token name: Xaheen Token (XHT)
   - Contract address: 0x...
   - Chain: Xaheen Chain (or BSC if deployed there)
   - Logo (PNG, 200x200px)
   - CoinGecko/CMC listing link
   - Daily volume data
   - Security audit report

3. Wait 1-2 weeks for approval
```

### Step 3: Implementation

**Frontend Integration:**

```html
<!-- Simple Widget Integration -->
<!DOCTYPE html>
<html>
<head>
    <title>Buy XHT with MoonPay</title>
</head>
<body>
    <button id="buyXHT">Buy XHT with Card</button>

    <script>
        document.getElementById('buyXHT').addEventListener('click', function() {
            const moonpayUrl = new URL('https://buy.moonpay.com');

            moonpayUrl.searchParams.append('apiKey', 'YOUR_PUBLISHABLE_KEY');
            moonpayUrl.searchParams.append('currencyCode', 'xht'); // Your token code
            moonpayUrl.searchParams.append('walletAddress', 'USER_WALLET_ADDRESS');
            moonpayUrl.searchParams.append('colorCode', '#1a73e8'); // Brand color
            moonpayUrl.searchParams.append('defaultCurrencyCode', 'USD');

            // Open in new window
            window.open(moonpayUrl.toString(), '_blank', 'width=500,height=700');
        });
    </script>
</body>
</html>
```

**React Integration:**

```javascript
// src/components/BuyXHT.jsx
import React from 'react';

const BuyXHT = ({ userWalletAddress }) => {
  const openMoonPay = () => {
    const moonpayUrl = new URL('https://buy.moonpay.com');

    const params = {
      apiKey: process.env.REACT_APP_MOONPAY_KEY,
      currencyCode: 'xht',
      walletAddress: userWalletAddress,
      colorCode: '#1a73e8',
      defaultCurrencyCode: 'USD',
      baseCurrencyAmount: '100', // Default $100
      redirectURL: window.location.origin + '/success',
    };

    Object.entries(params).forEach(([key, value]) => {
      moonpayUrl.searchParams.append(key, value);
    });

    // Open MoonPay widget
    const width = 500;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    window.open(
      moonpayUrl.toString(),
      'MoonPay',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <button
      onClick={openMoonPay}
      className="buy-xht-button"
    >
      💳 Buy XHT with Card
    </button>
  );
};

export default BuyXHT;
```

**Backend Webhook (Node.js/Express):**

```javascript
// server.js
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// MoonPay webhook endpoint
app.post('/webhooks/moonpay', (req, res) => {
  // Verify webhook signature
  const signature = req.headers['moonpay-signature'];
  const secretKey = process.env.MOONPAY_SECRET_KEY;

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const { type, data } = req.body;

  switch(type) {
    case 'transaction_created':
      console.log('Transaction created:', data.id);
      break;

    case 'transaction_updated':
      if (data.status === 'completed') {
        console.log('Purchase completed!');
        console.log('User:', data.walletAddress);
        console.log('Amount:', data.cryptoAmount, 'XHT');

        // Send notification, update database, etc.
      }
      break;

    case 'transaction_failed':
      console.log('Transaction failed:', data.failureReason);
      break;
  }

  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## 🎨 Transak Integration (Alternative)

**Frontend Integration:**

```javascript
// Transak SDK
import transakSDK from '@transak/transak-sdk';

const openTransak = (walletAddress) => {
  const transak = new transakSDK({
    apiKey: 'YOUR_API_KEY',
    environment: 'PRODUCTION', // or 'STAGING'
    defaultCryptoCurrency: 'XHT',
    walletAddress: walletAddress,
    themeColor: '1a73e8',
    fiatCurrency: 'USD',
    email: '', // Optional pre-fill
    redirectURL: window.location.origin,
    hostURL: window.location.origin,
    widgetHeight: '700px',
    widgetWidth: '500px',
  });

  transak.init();

  // Events
  transak.on(transak.ALL_EVENTS, (data) => {
    console.log('Transak event:', data);
  });

  transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
    console.log('Order successful:', orderData);
    transak.close();
  });
};
```

---

## 💰 Cost Structure

### MoonPay Pricing

| Transaction Amount | MoonPay Fee | User Pays |
|-------------------|-------------|-----------|
| $100 | $3.50-$4.50 | $103.50-$104.50 |
| $500 | $17.50-$22.50 | $517.50-$522.50 |
| $1,000 | $35-$45 | $1,035-$1,045 |

**Your Revenue Share**:
- You can earn 0.5-1% commission on volumes
- Requires minimum $50K monthly volume

### Hidden Costs

```
Setup Costs:
├─ Integration: Free (DIY) or $5K-$15K (agency)
├─ Token Listing: Free (if requirements met)
├─ Compliance: $5K-$20K (legal review)
└─ Maintenance: Minimal

Monthly Costs:
├─ No monthly fee for MoonPay
├─ Only pay per-transaction
└─ Revenue share optional (requires volume)

One-time Requirements:
├─ CoinGecko listing: Free
├─ CoinMarketCap listing: Free
├─ Security audit: $10K-$50K (recommended)
└─ KYB verification: Free
```

---

## 📋 Requirements Checklist

### Before Integration

- [ ] Token deployed on supported chain (BSC, Ethereum, Polygon, etc.)
- [ ] Token contract verified on block explorer
- [ ] Listed on CoinGecko or CoinMarketCap
- [ ] Minimum $10K daily trading volume
- [ ] Active liquidity pool on DEX
- [ ] Clear tokenomics documentation
- [ ] Website with proper branding
- [ ] Social media presence
- [ ] Legal entity registered
- [ ] Terms of Service & Privacy Policy

### For MoonPay Approval

- [ ] Business account created
- [ ] KYB verification completed
- [ ] Token submission email sent
- [ ] Logo provided (200x200px PNG)
- [ ] Contract address verified
- [ ] Trading volume proof
- [ ] Security audit (recommended)
- [ ] API keys obtained

---

## 🔐 Compliance & Legal

### KYC/AML

**Good News**: The on-ramp provider handles ALL KYC/AML
- Users verify identity with MoonPay/Transak
- You don't need to collect personal data
- Provider handles regulatory compliance
- You remain non-custodial

### Legal Requirements (Your Side)

```
Required Documents:
├─ Terms of Service
├─ Privacy Policy
├─ Risk Disclosures
├─ Refund Policy
└─ AML/CFT Policy (basic)

Jurisdiction Considerations:
├─ US: Register as MSB if needed
├─ EU: GDPR compliance
├─ Asia: Varies by country
└─ Consult crypto-friendly lawyer ($5K-$10K)
```

---

## 🚀 Quick Launch Plan (No XHT Listing Required Initially)

### Phase 1: Soft Launch (Weeks 1-2)

**Option A: Manual OTC via On-Ramp**
```
Process:
1. User buys USDT/BNB via MoonPay/Transak
2. User receives USDT/BNB on BSC
3. User manually swaps for XHT on your DEX
4. You guide users through process

Setup Time: 1 day
Cost: $0
Limitation: Extra step for users
```

**Option B: Aggregator Integration**
```
Use existing on-ramp aggregators:
- Kado Ramp (supports custom tokens faster)
- Onramper (multi-provider support)
- Mercuryo (fast approval)

These can list XHT faster than MoonPay
```

### Phase 2: Full Integration (Months 1-3)

```
1. Get XHT listed on CoinGecko/CMC
2. Build trading volume ($10K+/day)
3. Apply to MoonPay/Transak
4. Wait for approval (1-2 weeks)
5. Deploy full integration
6. Users buy XHT directly with fiat ✅
```

---

## 💡 Alternative: Kado Ramp (Faster Approval)

**Why Kado?**
- Approves new tokens faster (1-3 days)
- Lower listing requirements
- Good for new projects
- Similar fees to MoonPay

**Integration:**
```javascript
// Kado integration
const openKado = () => {
  const kadoUrl = `https://app.kado.money/?` +
    `apiKey=${KADO_API_KEY}&` +
    `onPayCurrency=USD&` +
    `onRevCurrency=XHT&` +
    `onToAddress=${userAddress}&` +
    `network=XAHEEN`;

  window.open(kadoUrl, '_blank', 'width=500,height=700');
};
```

---

## 📊 Expected User Experience

### With Fiat On-Ramp

```
User Journey (2-5 minutes):
1. Click "Buy XHT" on your website
2. MoonPay widget opens
3. Enter amount ($100)
4. Enter card details
5. Complete KYC (first time only)
6. Confirm purchase
7. Receive XHT in wallet (instant)
✅ Done! Ready to trade on Xaheen DEX
```

### Without Fiat On-Ramp

```
User Journey (10-30 minutes):
1. Go to Binance/Coinbase
2. Create account + KYC (days)
3. Deposit fiat money
4. Buy USDT/BNB
5. Withdraw to MetaMask
6. Connect to Xaheen Chain
7. Swap for XHT on your DEX
❌ Too complicated for normies
```

---

## 🎯 Recommendation

### Immediate Action (This Week)

**Deploy XHT on BSC Mainnet:**
```bash
# Enables future on-ramp integration
node scripts/deploy-xht-bsc-mainnet.js

# Create liquidity pool on PancakeSwap
# List on CoinGecko/CoinMarketCap
# Start building volume
```

### Short-term (Month 1)

**Soft Launch:**
- Integrate MoonPay for USDT purchases
- Users buy USDT → swap for XHT
- Begin on-ramp application process

### Mid-term (Months 2-3)

**Full Integration:**
- Get XHT approved by MoonPay
- Deploy direct XHT purchase widget
- Launch marketing campaign

---

## 📞 Next Steps

Want me to:
1. ✅ Create the MoonPay integration code?
2. ✅ Set up the BSC mainnet deployment?
3. ✅ Draft token listing applications?
4. ✅ Build the fiat on-ramp widget?

Let me know and I'll build it right now! 🚀
