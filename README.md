# Nor Chain - Where Intelligence Meets Blockchain 🧠⚡

**A production-grade private BNB Smart Chain (BSC/Parlia PoSA) implementation with comprehensive DEX and bridge infrastructure for cross-chain operations.**

[![Chain ID](https://img.shields.io/badge/Chain%20ID-65001-blue)](https://rpc.xaheen.org)
[![Block Time](https://img.shields.io/badge/Block%20Time-3s-green)](https://rpc.xaheen.org)
[![Status](https://img.shields.io/badge/Status-⚠️%20Critical-red)](#-current-status-critical)

---

## ⚠️ CURRENT STATUS: CRITICAL

**Chain Status**: 🔴 **STUCK at block 29,999** (epoch boundary issue)

**💰 Critical Assets**:
- **$20,000 NOR/USDT liquidity deployed** on Nor Chain
- **$10,000 locked in timelock** until October 30, 2026
- **$10,000 operational liquidity**
- **352.7 billion BTCBR** on BSC Mainnet (SAFE ✅)

👉 **READ IMMEDIATELY**: [docs/00-critical/CRITICAL_BACKUP_ANALYSIS.md](docs/00-critical/CRITICAL_BACKUP_ANALYSIS.md)

---

## 🌟 Network Information

| Parameter | Value |
|-----------|-------|
| **Chain Name** | Nor Chain |
| **Domain** | xaheen.org |
| **Chain ID** | 65001 (0xFDE9) |
| **Network ID** | 65001 |
| **Native Token** | NOR (Nor Token) |
| **Block Time** | 3 seconds |
| **Consensus** | Parlia PoSA (Proof of Staked Authority) |
| **Validators** | 3 validators (2-of-3 multi-sig) |
| **RPC Endpoint** | http://3.91.50.187:8545 |
| **Production RPC** | https://rpc.xaheen.org (pending DNS) |

---

## 🚀 Quick Start

### For New Users
👉 Start here: **[docs/01-getting-started/START_HERE.md](docs/01-getting-started/START_HERE.md)**

### For Emergency Issues
👉 See: **[docs/00-critical/](docs/00-critical/)**

### Add Nor Chain to MetaMask

**Automatic**:
1. Visit: `https://xaheen.org/add-to-metamask.html` (when live)

**Manual Configuration**:
```json
{
  "networkName": "Nor Chain",
  "rpcUrl": "http://3.91.50.187:8545",
  "chainId": "65001",
  "currencySymbol": "NOR",
  "blockExplorerUrl": ""
}
```

---

## 📚 Documentation Structure

All documentation has been **reorganized and categorized** for easy navigation:

| 📁 Category | Description | Link |
|------------|-------------|------|
| 🚨 **00-Critical** | **Current issues, backups, emergency procedures** | [docs/00-critical/](docs/00-critical/) |
| 🎯 **01-Getting Started** | Quick start guides, tutorials, setup | [docs/01-getting-started/](docs/01-getting-started/) |
| 🌉 **02-Bridges** | Bridge infrastructure, deployment, testing | [docs/02-bridges/](docs/02-bridges/) |
| 🚀 **03-Deployment** | Deployment guides, contracts, launch prep | [docs/03-deployment/](docs/03-deployment/) |
| ⚙️ **04-Infrastructure** | Validator setup, servers, monitoring | [docs/04-infrastructure/](docs/04-infrastructure/) |
| 📖 **05-Guides** | User guides, integration, trading | [docs/05-guides/](docs/05-guides/) |
| 📊 **06-Summaries** | Weekly progress, completion reports | [docs/06-summaries/](docs/06-summaries/) |
| 📝 **07-Applications** | Exchange listings, service applications | [docs/07-applications/](docs/07-applications/) |
| 💡 **08-Strategy** | Business strategy, liquidity, monetization | [docs/08-strategy/](docs/08-strategy/) |

Each directory contains a **README.md** with detailed contents and navigation.

---

## 🏗️ Architecture Overview

### Three-Layer System

```
┌──────────────────────────────────────────────────────────┐
│                   XAHEEN CHAIN (Hub)                     │
│   Chain ID: 65001  |  Native Token: NOR  |  3s blocks   │
│   ┌────────────────────────────────────────────────────┐ │
│   │  DEX (NorDEX - Uniswap V2 Fork)                 │ │
│   │  ├─ WNOR Token: 0x26c0...355                       │ │
│   │  ├─ Factory: 0x5DAB...Da3                          │ │
│   │  ├─ Router: 0xbe0d...D80                           │ │
│   │  └─ NOR/USDT Pool: $20K liquidity                  │ │
│   └────────────────────────────────────────────────────┘ │
│   ┌────────────────────────────────────────────────────┐ │
│   │  Genesis Contracts                                  │ │
│   │  └─ BTCBR Token: 0x0cF8...262                      │ │
│   └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                          ↕️ ↕️ ↕️
┌──────────────────────────────────────────────────────────┐
│               BRIDGE INFRASTRUCTURE                       │
│   ┌──────────────────┬──────────────────┬──────────────┐ │
│   │   BNB Bridge     │   USDT Bridge    │  ETH Bridge  │ │
│   │   BSC ↔ Nor   │   BSC ↔ Nor   │ BSC ↔ Nor │ │
│   └──────────────────┴──────────────────┴──────────────┘ │
└──────────────────────────────────────────────────────────┘
                          ↕️ ↕️ ↕️
┌──────────────────────────────────────────────────────────┐
│                  BSC MAINNET (Spoke)                      │
│   Chain ID: 56  |  All bridges operational ✅            │
│   ┌────────────────────────────────────────────────────┐ │
│   │  Your Assets (SAFE):                                │ │
│   │  ├─ 352.7 Billion BTCBR ✅                          │ │
│   │  ├─ 0.082 BNB ✅                                    │ │
│   │  └─ All bridge contracts ✅                         │ │
│   └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 💰 Deployed Assets

### Nor Chain (Chain ID: 65001) - ⚠️ STUCK

#### Core DEX Infrastructure
- **WNOR Token**: `0x26c0eaF731885b14c031cc50dB79b36458E0b355`
- **DEX Factory**: `0x5DAB997112119BeCf715607CaA0A94f020AE2Da3`
- **DEX Router**: `0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80`

#### Liquidity Pools
- **NOR/USDT Pair**: `0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8`
  - Total Value: **$20,000 USD**
  - Locked: $10,000 (timelock until Oct 30, 2026)
  - Operational: $10,000 (unlocked)
  - Current Price: $0.0000024/NOR
  - Timelock Contract: `0x02938F8c35A08126b0be008AaEb0B29B7E48d355`

#### Bridge Contracts (Nor Side)
| Asset | Wrapped Token | Bridge Contract |
|-------|---------------|-----------------|
| BNB | `0x5E2A669Bd80042254C81707Dd53c38D9cFA0fA1B` | `0xB1347E378CE63475b282fCC4E9037D51F189758A` |
| USDT | `0xA0de216D0bF10E9a40C0666FB3De458e3AEB70F5` | `0x1d24C3c51855d5320d7459E03F2d1a13F7cB6334` |
| ETH | `0xF1C1dc0263686093389Fbd66c2951122B2133aEA` | `0x4Ce2954074a2cD465a05dE8518143Cb478A0c913` |

#### Genesis Contracts
- **BTCBR Token**: `0x0cF8e180350253271f4b917CcFb0aCCc4862F262`
  - Type: ERC20 Token
  - Total Supply: 21 septillion BTCBR
  - Deployed: Genesis block

### BSC Mainnet (Chain ID: 56) - ✅ OPERATIONAL

#### Bridge Contracts (BSC Side)
| Asset | Bridge Contract | Status |
|-------|----------------|---------|
| BNB | `0x9bEFFFa3b43D34a2B470DA21aab3CA3263D0e8C0` | ✅ OPERATIONAL |
| USDT | `0x7E1c4448A9d87d5C5478B86085AF4e3715a06f48` | ✅ OPERATIONAL |
| ETH | `0xc5d3eF6f22EBEe07de9320680706a234d4f843f8` | ✅ OPERATIONAL |

---

## ⚙️ Technical Stack

### Blockchain Core
- **Base**: BNB Smart Chain (BSC/Parlia)
- **Consensus**: Parlia PoSA (Proof of Staked Authority)
- **EVM Version**: London (EIP-1559 compatible)
- **Node Software**: geth (BSC fork) via Docker

### Smart Contracts
- **Solidity**: 0.8.20
- **Framework**: Hardhat 3.0.9
- **Security**: OpenZeppelin Contracts 4.9.6
- **Web3**: Ethers.js 6.15.0
- **Testing**: Hardhat, Chai

### Development Tools
- Node.js >= 16
- npm >= 8
- Docker >= 20
- Docker Compose >= 2
- Ansible (infrastructure automation)

---

## 📦 Installation & Setup

### Prerequisites

```bash
# Check versions
node --version    # Should be >= 16
npm --version     # Should be >= 8
docker --version  # Should be >= 20
```

### Quick Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd blockchain-v2

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your private keys and RPC URLs

# 4. Compile contracts
npx hardhat compile

# 5. Initialize validators (if running locally)
./scripts/init-xaheen-validators.sh

# 6. Start validators
./scripts/setup-production-multi-validator.sh

# 7. Verify deployment
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Expected: {"jsonrpc":"2.0","id":1,"result":"0xfde9"}
```

---

## 🛠️ Common Operations

### Deploy Contracts

```bash
# Deploy to Nor Chain (local/production)
npx hardhat run scripts/your-deploy-script.js --network btcbr

# Deploy to BSC Mainnet
npx hardhat run scripts/your-deploy-script.js --network bsc

# Deploy to BSC Testnet
npx hardhat run scripts/your-deploy-script.js --network bscTestnet
```

### Check Chain Status

```bash
# Check current block
curl -s http://3.91.50.187:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check validator peer count
curl -s http://3.91.50.187:8545 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
```

### Validator Management

```bash
# SSH to validator server
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@3.91.50.187

# Check running validators
docker ps | grep validator

# View validator logs
docker logs -f xaheen-rpc

# Restart validators (if needed)
docker restart xaheen-rpc bsc-validator-2 bsc-validator-3
```

---

## 🔐 Security

### Multi-Signature Validation

Bridges use **2-of-3 multi-sig** validation:
- Validator 1: `0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD`
- Validator 2: `0xfd634d55ce9b99058dc06cdda1f866b39579a9f3`
- Validator 3: `0xb753b892551d1c374fda6fd7f6e9b787688c4ea5`

### Transfer Limits
- **Minimum**: 100 BTCBR per transfer
- **Maximum**: 100,000 BTCBR per transfer
- **Daily Limit**: 500,000 BTCBR per address

### Bridge Fees
- **Mainnet → Nor**: 0.1% (minimum 10 BTCBR)
- **Nor → Mainnet**: 0.2% (minimum 20 BTCBR)

---

## 📊 Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Chain ID** | 65001 (0xFDE9) | ✅ |
| **Current Block** | 29,999 | ⚠️ STUCK |
| **Block Time** | 3 seconds | ✅ |
| **Gas Limit** | 30,000,000 | ✅ |
| **Active Validators** | 3 | ✅ |
| **Consensus** | 2-of-3 Parlia PoSA | ✅ |
| **Total Liquidity** | $20,000 | ⚠️ AT RISK |
| **Your BTCBR (BSC)** | 352.7 billion | ✅ SAFE |

---

## 📁 Project Structure

```
blockchain-v2/
├── contracts/                  # Smart contracts
│   ├── bridges/               # 22 bridge implementations
│   ├── crosschain/            # Cross-chain infrastructure
│   ├── dex/                   # DEX contracts (Uniswap V2 fork)
│   └── tokens/                # Token contracts
│
├── scripts/                   # Deployment & utility scripts
│   ├── deploy-*.js           # Deployment scripts
│   ├── *.sh                  # Shell automation
│   └── README_DEPLOYMENT.md  # Script documentation
│
├── docs/                      # 📚 COMPLETE DOCUMENTATION
│   ├── 00-critical/          # 🚨 Emergency & current status
│   ├── 01-getting-started/   # 🎯 Quick start guides
│   ├── 02-bridges/           # 🌉 Bridge docs
│   ├── 03-deployment/        # 🚀 Deployment guides
│   ├── 04-infrastructure/    # ⚙️ Server & validator setup
│   ├── 05-guides/            # 📖 User & dev guides
│   ├── 06-summaries/         # 📊 Progress reports
│   ├── 07-applications/      # 📝 Exchange listings
│   └── 08-strategy/          # 💡 Business strategy
│
├── data/                      # Genesis files & configs
│   ├── genesis-xaheen-final.json
│   └── keystore/             # Validator keys (gitignored)
│
├── infrastructure/            # Infrastructure automation
│   └── ansible/              # Ansible playbooks
│
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Dependencies
├── .env                      # Environment variables (gitignored)
├── CLAUDE.md                 # AI assistant instructions
└── README.md                 # This file
```

---

## 🐛 Troubleshooting

### Chain is Stuck at Block 29,999

**Cause**: Epoch boundary issue at block 30,000

**Solutions**:
1. See: [docs/00-critical/EPOCH_FIX_MANUAL.md](docs/00-critical/EPOCH_FIX_MANUAL.md)
2. See: [docs/00-critical/CRITICAL_BACKUP_ANALYSIS.md](docs/00-critical/CRITICAL_BACKUP_ANALYSIS.md)

### Insufficient Funds for Gas

**Nor Chain**: You need NOR for gas fees
**BSC Mainnet**: You need BNB for gas fees

Get test tokens: [docs/01-getting-started/GET_TEST_TOKENS.md](docs/01-getting-started/GET_TEST_TOKENS.md)

### Bridge Transfer Fails

**Check**:
1. Amount within limits (100 - 100,000 BTCBR)
2. Sufficient balance + fees
3. Bridge has MINTER_ROLE on token
4. Validators operational (2-of-3)

**More troubleshooting**: [docs/05-guides/TROUBLESHOOTING_URLS.md](docs/05-guides/TROUBLESHOOTING_URLS.md)

---

## 🔗 Important Links

- **📚 Complete Documentation**: [docs/](docs/)
- **🎯 Getting Started**: [docs/01-getting-started/START_HERE.md](docs/01-getting-started/START_HERE.md)
- **🚨 Critical Status**: [docs/00-critical/](docs/00-critical/)
- **🌉 Bridge Architecture**: [docs/02-bridges/](docs/02-bridges/)
- **🏗️ Infrastructure**: [docs/04-infrastructure/](docs/04-infrastructure/)
- **🤖 AI Instructions**: [CLAUDE.md](CLAUDE.md)

---

## 📞 Support & Contributing

### Get Help
1. Check [docs/](docs/) for comprehensive documentation
2. Review [docs/00-critical/](docs/00-critical/) for current issues
3. See [docs/05-guides/TROUBLESHOOTING_URLS.md](docs/05-guides/TROUBLESHOOTING_URLS.md)

### For Developers
- **Getting Started**: [docs/01-getting-started/START_HERE.md](docs/01-getting-started/START_HERE.md)
- **Integration Guide**: [docs/05-guides/BACKEND_INTEGRATION_GUIDE.md](docs/05-guides/BACKEND_INTEGRATION_GUIDE.md)
- **AI Assistant Guide**: [CLAUDE.md](CLAUDE.md)

---

## 🎨 Key Features

- ✅ **Full EVM Compatibility** - Run any Ethereum smart contract
- ✅ **3-Second Block Time** - Fast finality with Parlia PoSA
- ✅ **Multi-Validator Security** - 3 validators, 2-of-3 multi-sig
- ✅ **DEX Infrastructure** - Complete Uniswap V2 fork
- ✅ **Cross-Chain Bridges** - BNB, USDT, ETH bridges
- ✅ **Production-Grade** - $20K liquidity deployed
- ✅ **Genesis Contracts** - BTCBR at 0x0cF8...262
- ✅ **JSON-RPC & WebSocket** - Standard Ethereum APIs

---

## 📄 License

[Your License Here]

---

## 🏆 Built With

- [BNB Smart Chain](https://www.bnbchain.org/) - Base blockchain technology
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract library
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [Ethers.js](https://docs.ethers.org/) - Ethereum library
- [Docker](https://www.docker.com/) - Containerization

---

**Last Updated**: 2025-11-02
**Status**: 🔴 Critical - Chain stuck at epoch boundary
**Action Required**: Review [docs/00-critical/CRITICAL_BACKUP_ANALYSIS.md](docs/00-critical/CRITICAL_BACKUP_ANALYSIS.md)

---

**Nor Chain - Where Intelligence Meets Blockchain** 🧠⚡
