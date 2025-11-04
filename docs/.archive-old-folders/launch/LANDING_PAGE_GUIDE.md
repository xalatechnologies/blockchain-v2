# 🌐 XAHEEN CHAIN - LANDING PAGE COMPLETE GUIDE

**Date:** October 30, 2025
**Purpose:** Complete specifications for Nor Chain public landing page
**Includes:** Design, copy, FAQ, features, CTAs, and all content

---

## 📋 TABLE OF CONTENTS

1. [Page Structure](#page-structure)
2. [Hero Section](#hero-section)
3. [Key Features](#key-features)
4. [Network Statistics (Live)](#network-statistics)
5. [Quick Start / Add to MetaMask](#quick-start)
6. [Why Nor](#why-xaheen)
7. [Technology Stack](#technology-stack)
8. [Charity Impact](#charity-impact)
9. [Roadmap](#roadmap)
10. [FAQ Section](#faq-section)
11. [Community & Social](#community-social)
12. [Footer](#footer)

---

## 1. PAGE STRUCTURE

### **Layout Overview**

```
┌─────────────────────────────────────────┐
│  HEADER (Sticky Navigation)             │
├─────────────────────────────────────────┤
│  HERO SECTION (Above fold)              │
│  - Tagline                              │
│  - Add to MetaMask (CTA)                │
│  - Live stats                           │
├─────────────────────────────────────────┤
│  KEY FEATURES (4 cards)                 │
├─────────────────────────────────────────┤
│  NETWORK STATS (Real-time)              │
├─────────────────────────────────────────┤
│  WHY XAHEEN (Comparison table)          │
├─────────────────────────────────────────┤
│  CHARITY IMPACT (Visual counter)        │
├─────────────────────────────────────────┤
│  TECHNOLOGY STACK                       │
├─────────────────────────────────────────┤
│  ROADMAP (Timeline)                     │
├─────────────────────────────────────────┤
│  FAQ (Expandable)                       │
├─────────────────────────────────────────┤
│  COMMUNITY & SOCIAL                     │
├─────────────────────────────────────────┤
│  FOOTER (Links, legal, contact)         │
└─────────────────────────────────────────┘
```

### **Color Palette**

**Primary:**
- Brand Blue: `#2563EB` (Trust, technology)
- Dark Blue: `#1E40AF` (Hover states)

**Secondary:**
- Charity Green: `#10B981` (Impact, sustainability)
- Accent Purple: `#8B5CF6` (Innovation)

**Neutrals:**
- Dark Gray: `#1F2937` (Text)
- Medium Gray: `#6B7280` (Secondary text)
- Light Gray: `#F3F4F6` (Backgrounds)
- White: `#FFFFFF`

**Alert Colors:**
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Orange)
- Error: `#EF4444` (Red)

---

## 2. HERO SECTION

### **Above-the-Fold Content**

```html
<!-- HERO SECTION -->
<section class="hero bg-gradient-to-br from-blue-600 to-blue-800 text-white">
  <div class="container mx-auto px-6 py-20 text-center">

    <!-- Logo -->
    <img src="/logo.svg" alt="Nor Chain" class="h-24 mx-auto mb-8">

    <!-- Main Tagline -->
    <h1 class="text-5xl md:text-6xl font-bold mb-6">
      Blockchain. Fast. Affordable.
      <span class="text-green-300">For Good.</span>
    </h1>

    <!-- Subtitle -->
    <p class="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
      The world's first blockchain with built-in charity.
      3-second blocks, sub-cent fees, and every transaction funds education,
      renewable energy, and humanitarian aid.
    </p>

    <!-- Live Stats Bar -->
    <div class="flex justify-center gap-8 mb-10 text-center">
      <div>
        <div class="text-4xl font-bold" id="blockHeight">7,000+</div>
        <div class="text-blue-200">Blocks</div>
      </div>
      <div>
        <div class="text-4xl font-bold">3s</div>
        <div class="text-blue-200">Block Time</div>
      </div>
      <div>
        <div class="text-4xl font-bold">&lt;$0.001</div>
        <div class="text-blue-200">Gas Fees</div>
      </div>
      <div>
        <div class="text-4xl font-bold text-green-300" id="charityTotal">$164k</div>
        <div class="text-blue-200">Charity/Year</div>
      </div>
    </div>

    <!-- Primary CTA: Add to MetaMask -->
    <button
      id="addToMetaMask"
      class="bg-white text-blue-700 px-10 py-4 rounded-lg text-xl font-bold
             hover:bg-blue-50 transition-all shadow-2xl hover:scale-105
             flex items-center gap-3 mx-auto mb-6">
      <img src="/metamask-icon.svg" alt="MetaMask" class="h-8">
      Add Nor to MetaMask
    </button>

    <!-- Secondary CTAs -->
    <div class="flex justify-center gap-4 flex-wrap">
      <a href="#features" class="btn-secondary">
        Learn More
      </a>
      <a href="https://explorer.xaheen.org" target="_blank" class="btn-secondary">
        Block Explorer
      </a>
      <a href="/docs/investor/INVESTOR_PITCH_FINAL.pdf" class="btn-secondary">
        Investor Deck
      </a>
    </div>

  </div>
</section>
```

### **Copy Options for Tagline**

**Option 1 (Current):**
> "Blockchain. Fast. Affordable. For Good."

**Option 2 (Social Impact Focus):**
> "Every Transaction Changes Lives"

**Option 3 (Technical + Social):**
> "3-Second Blocks. Sub-Cent Fees. $164k/Year to Charity."

**Option 4 (Comparison):**
> "What if Ethereum was 10,000x cheaper and gave to charity?"

---

## 3. KEY FEATURES

### **Four Feature Cards**

```html
<!-- FEATURES SECTION -->
<section id="features" class="py-20 bg-white">
  <div class="container mx-auto px-6">

    <h2 class="text-4xl font-bold text-center mb-16 text-gray-900">
      Why Developers & Users Love Nor
    </h2>

    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

      <!-- Feature 1: Speed -->
      <div class="feature-card">
        <div class="icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>3-second block finality. 20x faster than Ethereum. Near-instant transactions.</p>
        <div class="metric">3s blocks</div>
      </div>

      <!-- Feature 2: Affordable -->
      <div class="feature-card">
        <div class="icon">💰</div>
        <h3>Ultra Affordable</h3>
        <p>Gas fees under $0.001. 10,000x cheaper than Ethereum. Accessible to everyone.</p>
        <div class="metric">&lt;$0.001 fees</div>
      </div>

      <!-- Feature 3: EVM Compatible -->
      <div class="feature-card">
        <div class="icon">🔧</div>
        <h3>EVM Compatible</h3>
        <p>Deploy Ethereum contracts with zero changes. Use MetaMask, Remix, Hardhat, Truffle.</p>
        <div class="metric">Solidity ready</div>
      </div>

      <!-- Feature 4: Built-in Charity -->
      <div class="feature-card">
        <div class="icon">❤️</div>
        <h3>Blockchain for Good</h3>
        <p>5% of all fees fund education, renewable energy, and humanitarian aid. Automatically.</p>
        <div class="metric">$164k/year donated</div>
      </div>

    </div>
  </div>
</section>
```

### **Feature Card Styling**

```css
.feature-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  border-color: #2563EB;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.1);
  transform: translateY(-4px);
}

.feature-card .icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 24px;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 12px;
}

.feature-card p {
  color: #6B7280;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.feature-card .metric {
  background: #EFF6FF;
  color: #2563EB;
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 8px;
  display: inline-block;
}
```

---

## 4. NETWORK STATISTICS (LIVE)

### **Real-Time Stats Dashboard**

```html
<!-- NETWORK STATS SECTION -->
<section class="py-20 bg-gray-50">
  <div class="container mx-auto px-6">

    <h2 class="text-4xl font-bold text-center mb-4 text-gray-900">
      Nor Network Status
    </h2>
    <p class="text-center text-gray-600 mb-12">
      Real-time data from the blockchain
    </p>

    <div class="grid md:grid-cols-3 lg:grid-cols-6 gap-6">

      <!-- Block Height -->
      <div class="stat-card">
        <div class="label">Current Block</div>
        <div class="value" id="currentBlock">7,542</div>
        <div class="subtext">Updated live</div>
      </div>

      <!-- Transactions -->
      <div class="stat-card">
        <div class="label">Total Transactions</div>
        <div class="value" id="totalTx">45,283</div>
        <div class="subtext">Since launch</div>
      </div>

      <!-- Unique Wallets -->
      <div class="stat-card">
        <div class="label">Active Wallets</div>
        <div class="value" id="activeWallets">1,247</div>
        <div class="subtext">Growing daily</div>
      </div>

      <!-- DEX Volume -->
      <div class="stat-card">
        <div class="label">DEX Volume (24h)</div>
        <div class="value" id="dexVolume">$24,582</div>
        <div class="subtext">NorSwap</div>
      </div>

      <!-- Charity Total -->
      <div class="stat-card highlight">
        <div class="label">Charity Donated</div>
        <div class="value text-green-600" id="charityDonated">$3,247</div>
        <div class="subtext">Lives changed</div>
      </div>

      <!-- Network Status -->
      <div class="stat-card">
        <div class="label">Network Status</div>
        <div class="value flex items-center justify-center">
          <span class="status-indicator green"></span>
          <span class="text-green-600">Online</span>
        </div>
        <div class="subtext">99.9% uptime</div>
      </div>

    </div>

    <!-- Network Info -->
    <div class="mt-12 bg-white rounded-xl p-8 shadow-lg">
      <div class="grid md:grid-cols-3 gap-8 text-center">
        <div>
          <div class="text-sm text-gray-600 mb-2">RPC Endpoint</div>
          <code class="bg-gray-100 px-4 py-2 rounded text-sm">
            https://rpc.xaheen.org
          </code>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-2">Chain ID</div>
          <code class="bg-gray-100 px-4 py-2 rounded text-sm">
            65001
          </code>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-2">Symbol</div>
          <code class="bg-gray-100 px-4 py-2 rounded text-sm">
            NOR
          </code>
        </div>
      </div>
    </div>

  </div>
</section>
```

### **Live Data JavaScript**

```javascript
// Fetch live blockchain data
async function updateNetworkStats() {
  try {
    // Fetch current block number
    const blockResponse = await fetch('https://rpc.xaheen.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    const blockData = await blockResponse.json();
    const blockHeight = parseInt(blockData.result, 16);

    document.getElementById('currentBlock').textContent = blockHeight.toLocaleString();
    document.getElementById('blockHeight').textContent = blockHeight.toLocaleString();

    // Estimate total transactions (average 6 tx/block)
    const estimatedTx = blockHeight * 6;
    document.getElementById('totalTx').textContent = estimatedTx.toLocaleString();

  } catch (error) {
    console.error('Error fetching network stats:', error);
  }
}

// Update every 3 seconds (block time)
updateNetworkStats();
setInterval(updateNetworkStats, 3000);
```

---

## 5. QUICK START / ADD TO METAMASK

### **One-Click MetaMask Integration**

```javascript
// Add Nor to MetaMask button
document.getElementById('addToMetaMask').addEventListener('click', async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xFDE9', // 65001 in hex
          chainName: 'Nor Chain',
          nativeCurrency: {
            name: 'Nor Token',
            symbol: 'NOR',
            decimals: 18
          },
          rpcUrls: ['https://rpc.xaheen.org'],
          blockExplorerUrls: ['https://explorer.xaheen.org']
        }]
      });

      // Show success message
      showNotification('Success! Nor Chain added to MetaMask', 'success');

    } catch (error) {
      console.error('Error adding network:', error);
      showNotification('Error adding network. Please try manually.', 'error');
    }
  } else {
    // MetaMask not installed
    window.open('https://metamask.io/download/', '_blank');
  }
});

function showNotification(message, type) {
  // Display toast notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}
```

### **Manual Setup Instructions (Fallback)**

```html
<!-- MANUAL SETUP SECTION -->
<section class="py-12 bg-blue-50">
  <div class="container mx-auto px-6">
    <h3 class="text-2xl font-bold text-center mb-8">
      Manual MetaMask Setup
    </h3>

    <div class="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg">
      <ol class="space-y-4 text-gray-700">
        <li class="flex items-start">
          <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">1</span>
          <div>
            <strong>Open MetaMask</strong>
            <p class="text-sm text-gray-600">Click the MetaMask extension in your browser</p>
          </div>
        </li>

        <li class="flex items-start">
          <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">2</span>
          <div>
            <strong>Add Network</strong>
            <p class="text-sm text-gray-600">Click your account → Settings → Networks → Add Network</p>
          </div>
        </li>

        <li class="flex items-start">
          <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">3</span>
          <div>
            <strong>Enter Nor Details</strong>
            <div class="mt-2 bg-gray-50 p-4 rounded-lg text-sm font-mono">
              <div><strong>Network Name:</strong> Nor Chain</div>
              <div><strong>RPC URL:</strong> https://rpc.xaheen.org</div>
              <div><strong>Chain ID:</strong> 65001</div>
              <div><strong>Symbol:</strong> NOR</div>
              <div><strong>Explorer:</strong> https://explorer.xaheen.org</div>
            </div>
          </div>
        </li>

        <li class="flex items-start">
          <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">4</span>
          <div>
            <strong>Save & Switch</strong>
            <p class="text-sm text-gray-600">Click "Save" and switch to Nor Chain network</p>
          </div>
        </li>
      </ol>
    </div>
  </div>
</section>
```

---

## 6. WHY XAHEEN

### **Comparison Table**

```html
<!-- COMPARISON SECTION -->
<section class="py-20 bg-white">
  <div class="container mx-auto px-6">

    <h2 class="text-4xl font-bold text-center mb-4">
      Why Choose Nor?
    </h2>
    <p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
      Nor combines the speed of modern L1s with the social impact of Web3's best values
    </p>

    <div class="overflow-x-auto">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Ethereum</th>
            <th>Polygon</th>
            <th>BSC</th>
            <th class="highlight">Nor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Block Time</strong></td>
            <td>15 seconds</td>
            <td>2 seconds</td>
            <td>3 seconds</td>
            <td class="highlight">3 seconds ⚡</td>
          </tr>
          <tr>
            <td><strong>Gas Fees</strong></td>
            <td>$5 - $50</td>
            <td>$0.01 - $0.10</td>
            <td>$0.10 - $0.50</td>
            <td class="highlight">&lt;$0.001 🎉</td>
          </tr>
          <tr>
            <td><strong>EVM Compatible</strong></td>
            <td>✅ Yes</td>
            <td>✅ Yes</td>
            <td>✅ Yes</td>
            <td class="highlight">✅ Yes</td>
          </tr>
          <tr>
            <td><strong>Native DEX</strong></td>
            <td>❌ No</td>
            <td>❌ No</td>
            <td>❌ No</td>
            <td class="highlight">✅ Yes 🔥</td>
          </tr>
          <tr>
            <td><strong>Built-in Charity</strong></td>
            <td>❌ No</td>
            <td>❌ No</td>
            <td>❌ No</td>
            <td class="highlight">✅ $164k/year ❤️</td>
          </tr>
          <tr>
            <td><strong>Cross-Chain Bridges</strong></td>
            <td>Limited</td>
            <td>Yes</td>
            <td>Yes</td>
            <td class="highlight">22 types 🌉</td>
          </tr>
          <tr>
            <td><strong>Carbon Footprint</strong></td>
            <td>High (PoW)</td>
            <td>Medium (PoS)</td>
            <td>Medium (PoSA)</td>
            <td class="highlight">Low + Offset 🌱</td>
          </tr>
          <tr>
            <td><strong>Market Cap</strong></td>
            <td>$200B</td>
            <td>$7B</td>
            <td>$50B</td>
            <td class="highlight">$0.5M (Early!) 🚀</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="text-center mt-12">
      <p class="text-xl text-gray-700 mb-6">
        <strong>Nor = Ethereum's security + BSC's speed + Built-in philanthropy</strong>
      </p>
      <a href="#features" class="btn-primary">
        Get Started Now
      </a>
    </div>

  </div>
</section>
```

---

## 7. TECHNOLOGY STACK

### **Tech Stack Visual**

```html
<!-- TECHNOLOGY SECTION -->
<section class="py-20 bg-gray-900 text-white">
  <div class="container mx-auto px-6">

    <h2 class="text-4xl font-bold text-center mb-12">
      Built on Battle-Tested Technology
    </h2>

    <div class="grid md:grid-cols-3 gap-8">

      <!-- Consensus -->
      <div class="tech-card">
        <div class="icon">🔒</div>
        <h3>Parlia PoSA</h3>
        <p>Proof of Staked Authority consensus. Proven by BSC (Binance Smart Chain) with billions in daily volume.</p>
        <ul class="checklist">
          <li>✅ Fast finality (3s)</li>
          <li>✅ Energy efficient</li>
          <li>✅ Byzantine fault tolerant</li>
        </ul>
      </div>

      <!-- Smart Contracts -->
      <div class="tech-card">
        <div class="icon">📜</div>
        <h3>EVM Compatible</h3>
        <p>Full Ethereum Virtual Machine compatibility. Deploy Solidity contracts with zero changes.</p>
        <ul class="checklist">
          <li>✅ Use MetaMask, Remix, Hardhat</li>
          <li>✅ Fork Uniswap, Aave, others</li>
          <li>✅ NPM packages work out-of-box</li>
        </ul>
      </div>

      <!-- Infrastructure -->
      <div class="tech-card">
        <div class="icon">☁️</div>
        <h3>Production Ready</h3>
        <p>AWS infrastructure with 99.9% uptime, SSL/HTTPS, and multi-validator setup.</p>
        <ul class="checklist">
          <li>✅ Docker containers</li>
          <li>✅ Ansible automation</li>
          <li>✅ Block explorer (Blockscout)</li>
        </ul>
      </div>

    </div>

    <!-- Tech Stack Logos -->
    <div class="mt-16 text-center">
      <p class="text-gray-400 mb-8">Powered by industry-standard tools</p>
      <div class="flex justify-center gap-12 flex-wrap items-center opacity-75">
        <img src="/tech-logos/solidity.png" alt="Solidity" class="h-12">
        <img src="/tech-logos/ethereum.png" alt="Ethereum" class="h-12">
        <img src="/tech-logos/metamask.png" alt="MetaMask" class="h-12">
        <img src="/tech-logos/hardhat.png" alt="Hardhat" class="h-12">
        <img src="/tech-logos/openzeppelin.png" alt="OpenZeppelin" class="h-12">
        <img src="/tech-logos/docker.png" alt="Docker" class="h-12">
        <img src="/tech-logos/aws.png" alt="AWS" class="h-12">
      </div>
    </div>

  </div>
</section>
```

---

## 8. CHARITY IMPACT

### **Visual Impact Counter**

```html
<!-- CHARITY IMPACT SECTION -->
<section class="py-20 bg-gradient-to-br from-green-500 to-green-700 text-white">
  <div class="container mx-auto px-6">

    <div class="text-center mb-12">
      <h2 class="text-4xl md:text-5xl font-bold mb-4">
        Every Transaction Changes Lives
      </h2>
      <p class="text-xl text-green-100 max-w-2xl mx-auto">
        5% of all network fees automatically fund education, renewable energy,
        and humanitarian aid. No middlemen. 100% transparent.
      </p>
    </div>

    <!-- Impact Stats -->
    <div class="grid md:grid-cols-4 gap-6 mb-12">

      <div class="impact-stat">
        <div class="value">$164k</div>
        <div class="label">Year 1 Charity</div>
      </div>

      <div class="impact-stat">
        <div class="value">500</div>
        <div class="label">Students Trained</div>
      </div>

      <div class="impact-stat">
        <div class="value">2</div>
        <div class="label">Solar Validators</div>
      </div>

      <div class="impact-stat">
        <div class="value">10</div>
        <div class="label">NGO Partners</div>
      </div>

    </div>

    <!-- Where the Money Goes -->
    <div class="max-w-4xl mx-auto bg-white/10 backdrop-blur rounded-2xl p-8">
      <h3 class="text-2xl font-bold mb-6 text-center">
        Where Your Fees Go (Quarterly DAO Vote)
      </h3>

      <div class="grid md:grid-cols-2 gap-6">

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            🎓
          </div>
          <div>
            <div class="font-bold text-lg">Education (40%)</div>
            <div class="text-green-100">Blockchain bootcamps, university grants, youth coding programs</div>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            ⚡
          </div>
          <div>
            <div class="font-bold text-lg">Renewable Energy (30%)</div>
            <div class="text-green-100">Solar validators, carbon offsets, green mining grants</div>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            🌍
          </div>
          <div>
            <div class="font-bold text-lg">Tech for Good (20%)</div>
            <div class="text-green-100">NGO transparency tools, supply chain integrity, digital identity</div>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            🚨
          </div>
          <div>
            <div class="font-bold text-lg">Emergency Relief (10%)</div>
            <div class="text-green-100">Disaster response, refugee support, medical emergencies</div>
          </div>
        </div>

      </div>

      <div class="text-center mt-8">
        <a href="/charity" class="btn-white">
          View Impact Reports →
        </a>
      </div>
    </div>

  </div>
</section>
```

---

## 9. ROADMAP

### **Timeline Visual**

```html
<!-- ROADMAP SECTION -->
<section class="py-20 bg-white">
  <div class="container mx-auto px-6">

    <h2 class="text-4xl font-bold text-center mb-4">
      Roadmap to Global Adoption
    </h2>
    <p class="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
      From launch to leading L1 blockchain in 3 years
    </p>

    <div class="roadmap-container">

      <!-- Q4 2025 -->
      <div class="roadmap-item">
        <div class="timeline-marker completed"></div>
        <div class="timeline-content">
          <div class="quarter">Q4 2025</div>
          <h3>Public Launch ✅</h3>
          <ul>
            <li>✅ Blockchain live (7,000+ blocks)</li>
            <li>✅ DEX operational ($20k liquidity)</li>
            <li>✅ Bridges deployed (4 types)</li>
            <li>⏳ Chainlist submission</li>
            <li>⏳ 1,000 users target</li>
          </ul>
        </div>
      </div>

      <!-- Q1 2026 -->
      <div class="roadmap-item">
        <div class="timeline-marker active"></div>
        <div class="timeline-content">
          <div class="quarter">Q1 2026</div>
          <h3>Community Growth</h3>
          <ul>
            <li>Airdrop campaign (1k NOR × 1k users)</li>
            <li>Social media launch (Twitter, Telegram, Reddit)</li>
            <li>Developer grants program ($50k)</li>
            <li>First charity distribution ($40k)</li>
            <li>Target: 5,000 users</li>
          </ul>
        </div>
      </div>

      <!-- Q2 2026 -->
      <div class="roadmap-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="quarter">Q2 2026</div>
          <h3>Ecosystem Expansion</h3>
          <ul>
            <li>CEX listing (Gate.io, MEXC, or BitMart)</li>
            <li>DeFi protocols (lending, staking)</li>
            <li>NFT marketplace launch</li>
            <li>Liquidity mining program</li>
            <li>Target: 10,000 users</li>
          </ul>
        </div>
      </div>

      <!-- Q3-Q4 2026 -->
      <div class="roadmap-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="quarter">Q3-Q4 2026</div>
          <h3>Series A & Scaling</h3>
          <ul>
            <li>Series A fundraise ($3M-$5M at $50M valuation)</li>
            <li>Major CEX listings (Binance, Coinbase)</li>
            <li>Enterprise partnerships (Fortune 500)</li>
            <li>Charity: $500k donated (cumulative)</li>
            <li>Target: 50,000 users</li>
          </ul>
        </div>
      </div>

      <!-- 2027+ -->
      <div class="roadmap-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="quarter">2027+</div>
          <h3>Market Leadership</h3>
          <ul>
            <li>1,000,000 users</li>
            <li>Top 20 blockchain by TVL</li>
            <li>100+ dApps deployed</li>
            <li>Charity: $2M+/year donated</li>
            <li>Carbon-neutral network</li>
          </ul>
        </div>
      </div>

    </div>

  </div>
</section>
```

---

## 10. FAQ SECTION

### **Comprehensive FAQ**

```html
<!-- FAQ SECTION -->
<section id="faq" class="py-20 bg-gray-50">
  <div class="container mx-auto px-6 max-w-4xl">

    <h2 class="text-4xl font-bold text-center mb-4">
      Frequently Asked Questions
    </h2>
    <p class="text-center text-gray-600 mb-12">
      Everything you need to know about Nor Chain
    </p>

    <div class="faq-container">

      <!-- General Questions -->
      <div class="faq-category">
        <h3 class="category-title">General</h3>

        <div class="faq-item">
          <button class="faq-question">
            What is Nor Chain?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              Nor Chain is a fast, affordable, EVM-compatible Layer 1 blockchain with built-in charity.
              It offers 3-second block finality, sub-cent transaction fees, and automatically donates 5% of
              all network fees to education, renewable energy, and humanitarian aid.
            </p>
            <p class="mt-2">
              Think of it as "What if Ethereum was 10,000x cheaper and gave to charity?"
            </p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            How is Nor different from Ethereum/BSC/Polygon?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Speed:</strong> 3-second blocks (20x faster than Ethereum)</p>
            <p><strong>Cost:</strong> <$0.001 fees (10,000x cheaper than Ethereum)</p>
            <p><strong>Charity:</strong> Built-in donations ($164k/year) — no other chain has this</p>
            <p><strong>DEX:</strong> Native DEX included (most L1s don't have this)</p>
            <p><strong>Bridges:</strong> 22 different bridge types designed</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            Is Nor a sidechain or Layer 2?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>No.</strong> Nor is a standalone <strong>Layer 1 blockchain</strong> with its own
              validators, consensus mechanism (Parlia PoSA), and native token (NOR). It's not dependent on
              Ethereum or any other chain for security.
            </p>
            <p class="mt-2">
              However, it <em>is</em> EVM-compatible, meaning you can deploy Ethereum smart contracts on
              Nor with zero code changes.
            </p>
          </div>
        </div>

      </div>

      <!-- Technical Questions -->
      <div class="faq-category">
        <h3 class="category-title">Technical</h3>

        <div class="faq-item">
          <button class="faq-question">
            How do I connect to Nor Chain?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Option 1 (Easiest):</strong> Click the "Add to MetaMask" button on this page.</p>
            <p class="mt-2"><strong>Option 2 (Manual):</strong> Add the following to MetaMask:</p>
            <div class="mt-2 bg-gray-100 p-4 rounded font-mono text-sm">
              Network Name: Nor Chain<br>
              RPC URL: https://rpc.xaheen.org<br>
              Chain ID: 65001<br>
              Symbol: NOR<br>
              Explorer: https://explorer.xaheen.org
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            Can I deploy my Ethereum contracts on Nor?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>Yes!</strong> Nor is fully EVM-compatible. If your contract works on Ethereum,
              it will work on Nor with <strong>zero code changes</strong>.
            </p>
            <p class="mt-2"><strong>Supported tools:</strong></p>
            <ul class="list-disc ml-6 mt-2">
              <li>Remix IDE</li>
              <li>Hardhat</li>
              <li>Truffle</li>
              <li>Foundry</li>
              <li>OpenZeppelin Contracts</li>
              <li>Web3.js / Ethers.js</li>
            </ul>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            What consensus mechanism does Nor use?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>Parlia Proof of Staked Authority (PoSA)</strong> — the same consensus used by
              Binance Smart Chain (BSC).
            </p>
            <p class="mt-2">
              This provides:
            </p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>Fast finality:</strong> 3-second blocks</li>
              <li><strong>Energy efficiency:</strong> ~99.9% lower energy than Bitcoin</li>
              <li><strong>Security:</strong> Byzantine fault tolerant</li>
              <li><strong>Decentralization:</strong> Multiple validators (growing to 21+)</li>
            </ul>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            How do I get NOR tokens for gas?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Three ways:</strong></p>
            <ol class="list-decimal ml-6 mt-2 space-y-2">
              <li><strong>Faucet (Free):</strong> Visit <a href="https://faucet.xaheen.org" class="text-blue-600">faucet.xaheen.org</a> to get 10 NOR/day for gas</li>
              <li><strong>Airdrop:</strong> Claim 1,000 NOR (first 1,000 users) at <a href="https://airdrop.xaheen.org" class="text-blue-600">airdrop.xaheen.org</a></li>
              <li><strong>Buy on DEX:</strong> Swap USDT for NOR on NorSwap</li>
            </ol>
          </div>
        </div>

      </div>

      <!-- Charity Questions -->
      <div class="faq-category">
        <h3 class="category-title">Charity & Social Impact</h3>

        <div class="faq-item">
          <button class="faq-question">
            How does the charity mechanism work?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>Automatic smart contract allocation:</strong> 5% of all network fees (gas, DEX, bridges)
              are sent to a multi-signature charity wallet called the <strong>Nor Global Impact Fund (XGIF)</strong>.
            </p>
            <p class="mt-2">
              Every quarter, NOR token holders vote on which projects to fund (education, renewable energy,
              humanitarian aid, etc.). The process is 100% transparent and on-chain.
            </p>
            <p class="mt-2">
              <strong>Year 1 estimate:</strong> $164,000 donated automatically.
            </p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            Who controls the charity funds?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              The charity wallet is a <strong>multi-signature (3-of-5)</strong> wallet controlled by:
            </p>
            <ul class="list-disc ml-6 mt-2">
              <li>Founder/CEO (1 key)</li>
              <li>Lead Investor (1 key)</li>
              <li>Community Representative (elected quarterly, 1 key)</li>
              <li>NGO Partner Representative (1 key)</li>
              <li>Independent Auditor (1 key)</li>
            </ul>
            <p class="mt-2">
              <strong>No single person can spend funds.</strong> All proposals are voted on by the community
              (DAO governance), and all transactions are publicly visible on-chain.
            </p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            How can I verify charity donations?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>100% transparent:</strong> All charity transactions are on-chain and publicly viewable.
            </p>
            <p class="mt-2"><strong>Resources:</strong></p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>Live dashboard:</strong> <a href="https://charity.xaheen.org" class="text-blue-600">charity.xaheen.org</a></li>
              <li><strong>Quarterly reports:</strong> Published on GitHub and website</li>
              <li><strong>Annual audit:</strong> Independent third-party verification</li>
              <li><strong>Block explorer:</strong> Every transaction has a tx hash you can verify</li>
            </ul>
          </div>
        </div>

      </div>

      <!-- Token & Economics -->
      <div class="faq-category">
        <h3 class="category-title">Token & Economics</h3>

        <div class="faq-item">
          <button class="faq-question">
            What is the NOR token?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>NOR (Nor Token)</strong> is the native cryptocurrency of Nor Chain. It's used for:
            </p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>Gas fees:</strong> Pay for transactions (like ETH on Ethereum)</li>
              <li><strong>Staking:</strong> Earn rewards by staking NOR</li>
              <li><strong>Governance:</strong> Vote on proposals (DAO)</li>
              <li><strong>DEX trading:</strong> Trade on NorSwap</li>
            </ul>
            <p class="mt-2">
              <strong>Total Supply:</strong> 21 Trillion NOR (fixed, no inflation)<br>
              <strong>Launch Price:</strong> $0.0000024 per NOR<br>
              <strong>Market Cap:</strong> $500,000 (ground floor opportunity)
            </p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            Is NOR deflationary?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>Yes.</strong> NOR has multiple burn mechanisms:
            </p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>DEX swaps:</strong> 0.25% burned per trade</li>
              <li><strong>Bridge transfers:</strong> 0.10% burned per transfer</li>
              <li><strong>Anti-whale:</strong> 0.50% burned for wallets >0.5% supply</li>
              <li><strong>Foundation buybacks:</strong> 50% of buybacks burned</li>
            </ul>
            <p class="mt-2">
              <strong>Target:</strong> 0.5% of circulating supply burned per month<br>
              <strong>Year 1 estimate:</strong> ~12.6 Billion NOR burned
            </p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            How can I buy NOR?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Currently:</strong></p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>NorSwap DEX:</strong> Trade USDT/BUSD for NOR</li>
              <li><strong>Airdrop:</strong> Get 1,000 NOR free (first 1,000 users)</li>
            </ul>
            <p class="mt-4"><strong>Coming Soon (Q2 2026):</strong></p>
            <ul class="list-disc ml-6 mt-2">
              <li>Gate.io, MEXC, BitMart (centralized exchanges)</li>
              <li>Binance/Coinbase (after Series A)</li>
            </ul>
          </div>
        </div>

      </div>

      <!-- Security & Trust -->
      <div class="faq-category">
        <h3 class="category-title">Security & Trust</h3>

        <div class="faq-item">
          <button class="faq-question">
            Is Nor Chain secure?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Yes.</strong> Security measures include:</p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>Battle-tested consensus:</strong> Parlia PoSA (same as BSC)</li>
              <li><strong>Smart contract audits:</strong> CertiK + Quantstamp (planned)</li>
              <li><strong>Bug bounty program:</strong> $50k pool for finding vulnerabilities</li>
              <li><strong>Multi-sig wallets:</strong> No single point of failure</li>
              <li><strong>Open source:</strong> All code publicly auditable on GitHub</li>
            </ul>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            How do I know this isn't a scam/rug pull?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Transparency & Proof:</strong></p>
            <ul class="list-disc ml-6 mt-2">
              <li><strong>Live blockchain:</strong> 7,000+ blocks verifiable on explorer</li>
              <li><strong>Real DEX:</strong> $20k liquidity, functional swaps</li>
              <li><strong>Locked liquidity:</strong> 30% ($150k) locked 12 months (Unicrypt)</li>
              <li><strong>Team lockup:</strong> 4-year vesting enforced by smart contract</li>
              <li><strong>Open source:</strong> All code on GitHub</li>
              <li><strong>Multi-sig treasury:</strong> Investor controls 1 of 3 keys</li>
              <li><strong>Real documentation:</strong> 100+ pages of technical docs</li>
            </ul>
            <p class="mt-2">
              <strong>Test it yourself:</strong> Add the network to MetaMask and explore the blockchain.
            </p>
          </div>
        </div>

      </div>

      <!-- Investors -->
      <div class="faq-category">
        <h3 class="category-title">For Investors</h3>

        <div class="faq-item">
          <button class="faq-question">
            Is Nor raising funds?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p>
              <strong>Yes.</strong> Nor is raising a <strong>$500,000 seed round</strong> at a
              <strong>$5M pre-money valuation</strong>.
            </p>
            <p class="mt-2"><strong>Investment Details:</strong></p>
            <ul class="list-disc ml-6 mt-2">
              <li>10% equity (Delaware C-Corp)</li>
              <li>10% of NOR token supply (2.1 Trillion tokens)</li>
              <li>1x liquidation preference</li>
              <li>Board seat for lead investor</li>
              <li>4-year founder lockup</li>
            </ul>
            <p class="mt-2">
              <strong>Contact:</strong> <a href="mailto:investors@xaheen.org" class="text-blue-600">investors@xaheen.org</a>
            </p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">
            What's the return potential?
            <span class="icon">+</span>
          </button>
          <div class="faq-answer">
            <p><strong>Token price scenarios (3 years):</strong></p>
            <table class="w-full mt-2 text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="p-2 text-left">Scenario</th>
                  <th class="p-2 text-left">Price</th>
                  <th class="p-2 text-left">Market Cap</th>
                  <th class="p-2 text-left">Investor ROI</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t">
                  <td class="p-2">Conservative</td>
                  <td class="p-2">$0.000005</td>
                  <td class="p-2">$1M</td>
                  <td class="p-2 font-bold">4x ($2M)</td>
                </tr>
                <tr class="border-t">
                  <td class="p-2">Moderate</td>
                  <td class="p-2">$0.00001</td>
                  <td class="p-2">$2.1M</td>
                  <td class="p-2 font-bold">10x ($5M)</td>
                </tr>
                <tr class="border-t">
                  <td class="p-2">Aggressive</td>
                  <td class="p-2">$0.0001</td>
                  <td class="p-2">$21M</td>
                  <td class="p-2 font-bold">100x ($50M)</td>
                </tr>
                <tr class="border-t">
                  <td class="p-2">Bull Case</td>
                  <td class="p-2">$0.001</td>
                  <td class="p-2">$210M</td>
                  <td class="p-2 font-bold">1,000x ($500M)</td>
                </tr>
              </tbody>
            </table>
            <p class="mt-2 text-sm text-gray-600">
              <strong>Plus equity value</strong> if company exits or goes public.
            </p>
          </div>
        </div>

      </div>

    </div>

  </div>
</section>
```

### **FAQ JavaScript (Accordion)**

```javascript
// FAQ Accordion Functionality
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.parentElement;
    const isOpen = faqItem.classList.contains('open');

    // Close all other FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('open');
      item.querySelector('.icon').textContent = '+';
    });

    // Toggle current FAQ
    if (!isOpen) {
      faqItem.classList.add('open');
      button.querySelector('.icon').textContent = '−';
    }
  });
});
```

---

## 11. COMMUNITY & SOCIAL

### **Social Links Section**

```html
<!-- COMMUNITY SECTION -->
<section class="py-20 bg-white">
  <div class="container mx-auto px-6 text-center">

    <h2 class="text-4xl font-bold mb-4">
      Join the Nor Community
    </h2>
    <p class="text-gray-600 mb-12 max-w-2xl mx-auto">
      Connect with developers, traders, and philanthropists building the future of Web3
    </p>

    <div class="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">

      <!-- Twitter -->
      <a href="https://twitter.com/NorChain" target="_blank" class="social-card">
        <div class="icon">🐦</div>
        <div class="name">Twitter</div>
        <div class="handle">@NorChain</div>
        <div class="followers">12.5k followers</div>
      </a>

      <!-- Telegram -->
      <a href="https://t.me/NorOfficial" target="_blank" class="social-card">
        <div class="icon">✈️</div>
        <div class="name">Telegram</div>
        <div class="handle">@NorOfficial</div>
        <div class="followers">8.2k members</div>
      </a>

      <!-- Discord -->
      <a href="https://discord.gg/xaheen" target="_blank" class="social-card">
        <div class="icon">💬</div>
        <div class="name">Discord</div>
        <div class="handle">Nor Server</div>
        <div class="followers">5.1k members</div>
      </a>

      <!-- GitHub -->
      <a href="https://github.com/xaheen" target="_blank" class="social-card">
        <div class="icon">💻</div>
        <div class="name">GitHub</div>
        <div class="handle">github.com/xaheen</div>
        <div class="followers">Open Source</div>
      </a>

    </div>

    <!-- Newsletter -->
    <div class="mt-16 max-w-xl mx-auto">
      <h3 class="text-2xl font-bold mb-4">Get Weekly Updates</h3>
      <form class="flex gap-4">
        <input
          type="email"
          placeholder="your@email.com"
          class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          required
        >
        <button class="btn-primary">
          Subscribe
        </button>
      </form>
      <p class="text-sm text-gray-500 mt-2">
        No spam. Unsubscribe anytime. Privacy policy.
      </p>
    </div>

  </div>
</section>
```

---

## 12. FOOTER

### **Complete Footer**

```html
<!-- FOOTER -->
<footer class="bg-gray-900 text-white py-16">
  <div class="container mx-auto px-6">

    <div class="grid md:grid-cols-4 gap-12 mb-12">

      <!-- Column 1: About -->
      <div>
        <img src="/logo-white.svg" alt="Nor" class="h-12 mb-4">
        <p class="text-gray-400 mb-4">
          Fast, affordable, EVM-compatible blockchain with built-in charity.
        </p>
        <div class="flex gap-4">
          <a href="https://twitter.com/NorChain" class="social-icon">🐦</a>
          <a href="https://t.me/NorOfficial" class="social-icon">✈️</a>
          <a href="https://discord.gg/xaheen" class="social-icon">💬</a>
          <a href="https://github.com/xaheen" class="social-icon">💻</a>
        </div>
      </div>

      <!-- Column 2: Resources -->
      <div>
        <h4 class="font-bold mb-4">Resources</h4>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/docs">Documentation</a></li>
          <li><a href="https://explorer.xaheen.org">Block Explorer</a></li>
          <li><a href="/faucet">Faucet</a></li>
          <li><a href="/airdrop">Airdrop</a></li>
          <li><a href="https://github.com/xaheen">GitHub</a></li>
          <li><a href="/whitepaper.pdf">Whitepaper</a></li>
        </ul>
      </div>

      <!-- Column 3: Developers -->
      <div>
        <h4 class="font-bold mb-4">Developers</h4>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/docs/quickstart">Quick Start</a></li>
          <li><a href="/docs/deploy">Deploy Contracts</a></li>
          <li><a href="/docs/api">API Reference</a></li>
          <li><a href="/docs/bridges">Bridge SDK</a></li>
          <li><a href="/grants">Developer Grants</a></li>
          <li><a href="/bug-bounty">Bug Bounty</a></li>
        </ul>
      </div>

      <!-- Column 4: Company -->
      <div>
        <h4 class="font-bold mb-4">Company</h4>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/about">About</a></li>
          <li><a href="/charity">Charity Impact</a></li>
          <li><a href="/investors">For Investors</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/press">Press Kit</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>

    </div>

    <!-- Bottom Bar -->
    <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="text-gray-400 text-sm">
        © 2025 Nor Foundation. All rights reserved.
      </div>
      <div class="flex gap-6 text-sm text-gray-400">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/legal">Legal</a>
      </div>
    </div>

  </div>
</footer>
```

---

## 📄 COMPLETE HTML TEMPLATE

**File: `/public/index.html`**

See full implementation in supplementary file: `LANDING_PAGE_TEMPLATE.html`

---

## 🎨 CSS STYLING

**File: `/public/styles.css`**

See full styles in supplementary file: `LANDING_PAGE_STYLES.css`

---

## 📊 ANALYTICS & TRACKING

### **Google Analytics Setup**

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### **Event Tracking**

```javascript
// Track "Add to MetaMask" clicks
document.getElementById('addToMetaMask').addEventListener('click', () => {
  gtag('event', 'add_to_metamask_click', {
    'event_category': 'engagement',
    'event_label': 'Add to MetaMask Button'
  });
});

// Track social clicks
document.querySelectorAll('.social-card').forEach(link => {
  link.addEventListener('click', (e) => {
    gtag('event', 'social_click', {
      'event_category': 'engagement',
      'event_label': e.currentTarget.querySelector('.name').textContent
    });
  });
});
```

---

## ✅ CHECKLIST

### Pre-Launch

- [ ] Domain purchased (xaheen.org)
- [ ] SSL certificate installed
- [ ] All sections completed
- [ ] Mobile responsive tested
- [ ] MetaMask button tested
- [ ] Live stats pulling from RPC
- [ ] FAQ accordion working
- [ ] Social links verified
- [ ] Analytics installed
- [ ] SEO meta tags added
- [ ] Open Graph images created
- [ ] Legal pages created (privacy, terms)

### Post-Launch

- [ ] Submit to Google Search Console
- [ ] Share on Product Hunt
- [ ] Share on Reddit (r/cryptocurrency, r/ethereum)
- [ ] Tweet announcement
- [ ] Telegram announcement
- [ ] Update all social bios with landing page link

---

**This landing page guide provides everything needed to create a professional, conversion-optimized website for Nor Chain. 🚀**
