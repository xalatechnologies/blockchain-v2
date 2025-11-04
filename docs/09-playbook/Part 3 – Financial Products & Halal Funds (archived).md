# Part 3 – Financial Products & Halal Funds  
---
#ai:module xaheen-chain-funds
#ai:topic halal-finance, mutual-funds, sukuk, retirement
#ai:audience developer, investor, regulator, ai-agent
---

## 15  Nor Funds Platform Overview
Nor Funds enables creation and management of **Shariah-compliant investment vehicles**—mutual funds, sukuk portfolios, waqf impact pools, and retirement schemes—fully on-chain with regulatory auditability.

### Objectives
- Provide **interest-free (riba-free)** returns through asset-backed profit sharing.  
- Support **real-world assets** (gold, sukuk, real estate, halal equities).  
- Automate NAV reporting, subscriptions, redemptions, and zakat purification.  
- Integrate **compliance and Shariah governance** at contract level.  

---

## 16  Fund Types & Structures
| Fund Type | Shariah Structure | Example Assets | Return Mechanism |
|------------|------------------|----------------|------------------|
| **Gold Savings Fund** | *Murābaḥah / Wakālah* | vaulted gold, Dirhamat | gold appreciation, trade profit |
| **Sukuk Income Fund** | *Muḍārabah* | investment-grade sukuk | rental/lease income |
| **Halal Equity Index Fund** | *Wakālah* | AAOIFI-screened equities | dividends + capital gains |
| **Real Estate Ijārah Fund** | *Mushārakah / Ijārah* | income property | rent distribution |
| **SME Partnership Fund** | *Mushārakah* | halal SMEs | profit/loss share |
| **Liquidity Park Fund** | *Commodity Murābaḥah* | short-term trades | markup profit |
| **Waqf Impact Fund** | *Waqf / Tabarru’* | social projects | capped-fee/impact KPIs |
| **Takaful Reserve Pool** | *Tabarru’* | risk mutualisation | surplus redistribution |

---

## 17  FundUnit Token Standard
Every investor position is represented by a **`FundUnit`** ERC-20-compatible token extended with:
- **KYC flag** (`isVerified`)  
- **Transfer restriction hooks** per jurisdiction  
- **NAV oracle binding** for valuation  
- **Redemption lock** (`noticePeriod`, `gateLimit`)  
- **Zakat metadata** (`purificationDue`, `charityTarget`)  

### Example Interface
```solidity
interface IFundUnit {
  function subscribe(uint256 amount) external;
  function redeem(uint256 units) external;
  function navPerUnit() external view returns (uint256);
  function zakatDue(address holder) external view returns (uint256);
}


⸻

18  NAV & Oracle System
	•	Custodian Oracles push daily holdings valuations.
	•	Auditor Nodes sign NAV hashes stored on-chain.
	•	AI NAV Agent cross-checks pricing anomalies vs. market feeds.

NAV Flow

sequenceDiagram
  participant Custodian
  participant Oracle
  participant NAVContract
  participant FundUnit
  Custodian->>Oracle: Submit portfolio valuations
  Oracle->>NAVContract: Post NAV hash + signature
  NAVContract->>FundUnit: Update navPerUnit()
  FundUnit-->>Investor: Display updated NAV


⸻

19  Subscription & Redemption Router
	1.	Investor passes KYC via XCC.
	2.	Transfers Dirhamat / Digital KES to router.
	3.	Router mints FundUnits at latest NAV.
	4.	On redemption, FundUnits burned → payment in stable token.
	5.	Router enforces daily gate limit and cool-down period.

flowchart LR
 Investor-->KYC[XCC Verification]
 KYC-->Router[Fund Router]
 Router-->NAV[Fetch NAV]
 Router-->Mint[Mint FundUnits]
 Mint-->Investor


⸻

20  Shariah Oracle

A dedicated registry contract verifying:
	•	Approved assets & strategies (AAOIFI compliant)
	•	Prohibited sectors list
	•	Certified Scholars who sign off funds

ShariahOracle.approveFund(fundAddress, fatwaHash)
Only approved funds can appear in Nor Funds UI or APIs.

⸻

21  Zakat & Purification Engine
	•	Computes 2.5 % annual zakat on eligible holdings.
	•	Tracks incidental non-compliant income (purification).
	•	Auto-routes charity via CharityContract with public ledger.

graph TD
  FundUnit-->ZakatCalc
  ZakatCalc-->CharityContract
  CharityContract-->Beneficiary[(Approved NGOs)]


⸻

22  Retirement & Pension Model

Architecture
	•	Defined-Contribution halal plan; contributions auto-invested per risk profile.
	•	Glidepath AI gradually shifts allocation from equity → sukuk → ijārah funds.
	•	Retirement payout via Ijārah cash-flow (lease portfolios).
	•	Optional Qard Ḥasan loan from balance during hardship.

Wallet UX
	1.	“My Retirement” tab shows contributions, NAV, projected halal income.
	2.	One-click zakat computation.
	3.	Toggle between “Growth / Balanced / Conservative” strategies.

⸻

23  Regulatory & Custody Framework

Region	Regulator	Structure	Notes
UAE	VARA / ADGM	Fund SPV + licensed manager + custodian	Shariah certification required
Kenya	CBK / CMA	Licensed VASP + Collective Investment Scheme	Digital KES compliance
EU	AIFMD / MiCA	Professional AIF first → retail after	GDPR + MiCA e-money rules

Custodians must provide daily reconciliation; hashes of statements anchored on Nor Chain.

⸻

24  Risks & Safeguards
	•	Liquidity: redemption gates & swing pricing.
	•	Valuation: independent NAV feeds + audit trail.
	•	Custody: segregated, hashed proofs.
	•	Shariah oversight: independent SSB with public fatwa hashes.
	•	GDPR: no PII on-chain; only hash + consent pointer.

⸻

25  Example Flow – Gold Fund Subscription

sequenceDiagram
 Investor->>NorWallet: Choose Gold Fund
 NorWallet->>XCC: KYC verification
 XCC-->>NorWallet: Verified
 NorWallet->>FundRouter: Subscribe 100 Dirhamat
 FundRouter->>Oracle: Get NAV
 Oracle-->>FundRouter: NAV = 1.05
 FundRouter->>FundUnit: Mint 95.23 units
 FundUnit-->>Investor: Units credited


⸻

26  Value Proposition
	•	Transparency: every NAV and fatwa attestation on-chain.
	•	Ethical returns: real assets, no riba or speculation.
	•	Automation: AI fund agents handle NAV, zakat, and risk.
	•	Inclusivity: small ticket sizes; mobile access through Nor Wallet.
	•	Trust: verified scholars + regulated custodians + auditable code.
