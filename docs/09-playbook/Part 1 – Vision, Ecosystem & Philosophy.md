# Nor Chain Playbook v3 – Public Master Edition  
*The compliant blockchain for real-world finance*  
© 2025 Nor Technologies (formerly Nor Technologies AS) | All Rights Reserved  
Version v3.1-2025-11-02  

---
#ai:module nor-chain
#ai:topic vision, ecosystem, compliance, halal-economy
#ai:audience developer, investor, regulator, public
---

## 1  Introduction
**Nor Chain** (نور - "Light") is a next-generation Layer-1 blockchain engineered to connect compliant finance with decentralized innovation.  
It merges a **regulated foundation**—aligned with NSM, ISO 27001, GDPR and AAOIFI—with the openness and liquidity of public markets.

### Mission
To enable ethical, transparent, and intelligent financial systems across emerging economies—bridging fiat, gold, digital assets, and AI-driven governance.

### Vision
A world where anyone can transact, invest, and build in a transparent halal-compliant environment governed by verified institutions yet open to the public.

---

## 2  Ecosystem Overview
Nor Chain is the anchor of a complete financial and technological ecosystem:

| Component | Purpose |
|------------|----------|
| **Nor Chain (L1)** | Core blockchain running PoSA (Parlia) consensus with 3 s blocks and 10 000-block epochs |
| **Dirhamat (AED/Gold-backed)** | Shariah-compliant stable-asset representing UAE Dirham and vaulted gold |
| **Digital KES** | Stable digital Kenyan Shilling aligned with CBK sandbox regulations |
| **NordCoin** | Nordic-compliant currency focused on ESG reporting and EU MiCA alignment |
| **Nor Wallet** | Chrome Extension + Mobile wallet for cross-chain assets and halal fund participation |
| **NorSwap (DEX)** | Native decentralized exchange with hybrid liquidity routing |
| **Nor Bridge** | Cross-chain vault and router system linking Nor with BSC, Polygon, Ethereum |
| **Nor Funds** | On-chain halal mutual and retirement funds |
| **Compliance Core (XCC)** | Smart-contract framework for AML/KYC/GDPR/AAOIFI rules |
| **Nor AI Agents** | Autonomous agents handling liquidity, compliance, and governance automation |

Each component interoperates through unified standards and the **Nor AI protocol layer** for predictive management.

---

## 3  Core Philosophy
1. **Ethical by Design** — No interest (riba), no gharar (excessive uncertainty), transparent risk-sharing.  
2. **Compliant by Default** — GDPR, AAOIFI, NSM and ISO 27001 mapped into smart-contract templates.  
3. **Intelligent by Architecture** — AI-driven validators, liquidity, and compliance agents.  
4. **Inclusive by Access** — Publicly readable, permissionless use with verified-governance validators.  
5. **Sustainable by Operation** — Low-energy PoSA consensus + carbon-offset program.

---

## 4  Governance and Participation Model
Nor Chain operates under a **Public-Permissioned Governance** structure:

| Role | Description |
|------|--------------|
| **Validators (3 active + 2 standby)** | Sign blocks; must maintain > 99 % uptime; rotated every 10 000 blocks |
| **Governance Council** | Multisig (3 of 5) representatives from UAE, Kenya, Nordic institutions |
| **Community Delegators** | Stake NOR tokens to vote and earn rewards |
| **Compliance Observers** | Regulator-linked nodes auditing AML/KYC events |
| **AI Advisors** | Autonomous agents proposing parameter tuning (liquidity, epoch length, gas policy) |

All decisions → on-chain DAO proposals with weighted votes from council + delegators.  
AI Advisors provide predictive insights but cannot execute changes without human sign-off.

---

## 5  Token Economy (NOR & Assets)
### Native Token: NOR
- **Supply:** 21 billion (Nor-standard 24 decimals)  
- **Contract:** TBD (NOR Token)  
- **Use Cases:** Gas, staking, liquidity pair, governance, fund subscriptions  
- **Burn Mechanism:** 1 % of network fees → burn address  
- **Charity Allocation:** 0.5 % of fees → Charity Contract for zakat-funded projects  

### Other Key Assets
| Asset | Contract | Purpose |
|--------|-----------|---------|
| **BTCBR (Nor Mirror)** | TBD | Bridge representation of Bitcoin BR token |
| **Dirhamat** | TBD | Gold + AED-backed stablecoin |
| **Digital KES** | TBD | CBK-regulated Kenyan Shilling token |
| **FundUnits** | dynamic | Shares of halal mutual funds and retirement plans |

---

## 6  Hybrid Network Vision
**"Nor is the engine; all other chains are branches."**

### Design Principle
- Nor holds the real liquidity and price control.  
- External chains (BSC, Polygon, Ethereum) host **routers + mirror tokens** for visibility.  
- Routers sync prices and volume with NorSwap DEX in real time.

### User Experience Example
**Case 1 – With Mirror Tokens:**  
User opens MetaMask → selects BSC → adds `Nor Token (NOR)` → trades on PancakeSwap as normal.  
Behind the scenes, the router calls Nor's DEX for actual execution and settles via bridge.

**Case 2 – Router-Only (High Control):**  
User trades USDT→NOR on BSC router; no mirror minted; Nor records ownership internally.  
Best for regulatory jurisdictions requiring on-chain proof without token circulation.

---

## 7  Public Benefit and Market Impact
Nor Chain serves as:
- **Economic Infrastructure** for Islamic finance and emerging markets.  
- **Compliance Sandbox** for governments testing CBDCs and tokenized securities.  
- **Sustainability Hub** linking real-world carbon credits and ESG assets.  
- **AI Finance Platform** for real-time policy feedback and market stability.

---

## 8  Ecosystem Diagram
```mermaid
graph TD
  A[Nor Chain Core] --> B[Dirhamat AED/Gold]
  A --> C[Digital KES]
  A --> D[NordCoin]
  A --> E[NorSwap DEX]
  A --> F[Nor Bridge]
  A --> G[Nor Funds]
  A --> H[Compliance Core XCC]
  A --> I[AI Agents]
  subgraph Public Chains
    J[BSC Router]
    K[Polygon Router]
    L[Ethereum Router]
  end
  F --> J
  F --> K
  F --> L