# NorChain Compliance Framework

**Last Updated**: November 5, 2025
**Status**: Regulatory roadmap for DEX, Bridge, and Escrow operations
**Jurisdictions**: Norway (primary), EU (MiCA), FATF standards

---

## Executive Summary

NorChain is positioning as a **regulated, compliant blockchain infrastructure** operating under Norwegian financial supervision with EU MiCA alignment. This document outlines the regulatory framework, technical compliance requirements, and operational controls for:

- **DEX (NorSwap)** - Decentralized exchange with AMM liquidity
- **Bridge System** - Cross-chain asset transfers (NorChain ↔ BSC/Ethereum/Polygon)
- **Escrow Services** - Smart contract-based escrow with arbiter governance

---

## 1. Regulatory Framework

### 1.1 Norwegian Financial Supervision (Finanstilsynet)

**Status**: Registration required as Virtual Asset Service Provider (VASP)

**Authority**: Finanstilsynet (Norwegian Financial Supervisory Authority)

**Legal Basis**:
- Money Laundering Act (hvitvaskingsloven)
- Financial Institutions Act (finansforetaksloven)
- FATF Recommendation 15 & 16 implementation

**Registration Requirements**:

| Requirement | Description | Status |
|------------|-------------|--------|
| **VASP Registration** | Register as exchange/custody provider | 🔄 In Progress |
| **MLRO Appointment** | Designate Money Laundering Reporting Officer | ⏳ Pending |
| **AML Risk Assessment** | Comprehensive risk assessment document | ⏳ Pending |
| **KYC/KYB Procedures** | Know Your Customer / Know Your Business | ⏳ Pending |
| **PEP Screening** | Politically Exposed Persons checks | ⏳ Pending |
| **Sanctions Screening** | OFAC, UN, EU sanctions lists | ⏳ Pending |
| **Transaction Monitoring** | Ongoing monitoring system | ⏳ Pending |
| **Record Keeping** | 5-year retention of customer data | ⏳ Pending |

**Reference**: Finanstilsynet AML/CTF Guidelines
**Link**: https://www.finanstilsynet.no/

---

### 1.2 EU Markets in Crypto-Assets Regulation (MiCA)

**Effective**: December 30, 2024
**Status**: Alignment required for EU operations

**MiCA CASP Categories** (Crypto-Asset Service Providers):

| Service | NorChain Activity | Authorization Required |
|---------|-------------------|----------------------|
| **Exchange services** | NorSwap DEX | ✅ Yes |
| **Custody & administration** | Bridge vaults | ✅ Yes |
| **Order execution** | DEX order routing | ✅ Yes |
| **Crypto-asset transfer** | Bridge operations | ✅ Yes |

**MiCA Compliance Requirements**:

1. **Governance & Organization**
   - Fit & proper management (CV, criminal record checks)
   - Conflict of interest policies
   - Outsourcing policy (if using third-party infra)

2. **Disclosures & Transparency**
   - Service description (fees, risks, functionality)
   - Asset custody arrangements
   - Complaints handling procedure
   - Incident reporting to regulators

3. **ICT & Security**
   - ISO 27001 or equivalent certification
   - Business continuity & disaster recovery
   - Data protection (GDPR alignment)
   - Cybersecurity incident response

4. **Asset Safeguarding**
   - Segregation of client assets
   - Insurance or capital buffers
   - Proof-of-reserves attestation

**Reference**: EU Regulation 2023/1114 (MiCA)
**Link**: https://eur-lex.europa.eu/eli/reg/2023/1114

---

### 1.3 FATF Travel Rule (Recommendation 16)

**Updated**: 2025 (strengthened payment transparency)

**Requirements**:
- Transmit originator and beneficiary information for VASP-to-VASP transfers
- Maintain records for at least 5 years
- Screen against sanctions lists
- Implement secure data exchange protocols

**Implementation** (for NorChain Bridge):

| Transfer Type | Travel Rule Required? | Solution |
|---------------|----------------------|----------|
| **On-chain DEX swap** | ❌ No (peer-to-peer) | N/A |
| **Bridge to external VASP** | ✅ Yes | TRP provider integration |
| **Fiat on/off-ramp** | ✅ Yes | KYC + TRP |

**Travel Rule Providers** (integrate one):
- Notabene
- Sygna Bridge
- Veriscope
- CipherTrace

---

## 2. Technical Compliance Architecture

### 2.1 DEX (NorSwap) Compliance

**Classification**: Decentralized exchange (AMM model)

**Regulatory Considerations**:
- If NorChain Foundation operates front-end/infrastructure → VASP obligations apply
- If purely on-chain with no custody → May qualify for lighter regime (consult lawyer)

**Technical Controls**:

```solidity
// Compliance features for NorSwap contracts
contract NorSwapRouter {
    // 1. Fee caps to prevent manipulation
    uint256 public constant MAX_FEE_BPS = 100; // 1% max

    // 2. Emergency pause by Safe multisig
    address public immutable governance;
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    // 3. Per-pair rate limits (anti-manipulation)
    mapping(address => uint256) public dailyVolumeLimit;

    // 4. TWAP oracle for price manipulation resistance
    function getTWAP(address pair, uint32 window) external view returns (uint256);

    // 5. Event logging for all swaps (audit trail)
    event Swap(
        address indexed sender,
        address indexed pair,
        uint256 amountIn,
        uint256 amountOut,
        address to,
        uint256 timestamp
    );
}
```

**Operational Controls**:
- ✅ All liquidity pairs require governance approval
- ✅ Token due diligence before listing (audit, supply analysis)
- ✅ TWAP oracles prevent flash loan price manipulation
- ✅ Circuit breaker halts trading if anomaly detected
- ✅ 48-72 hour timelock on parameter changes

---

### 2.2 Bridge System Compliance

**Classification**: Crypto-asset transfer service (MiCA) + VASP (Norway)

**Architecture**: Threshold multisig vault + relayer network

**Compliance Requirements**:

| Control | Implementation | Status |
|---------|----------------|--------|
| **Custody Segregation** | Separate vaults per user/asset | ✅ Implemented |
| **Multi-sig Authorization** | 3-of-5 Safe multisig | ✅ Implemented |
| **Rate Limits** | Daily caps per asset | ✅ Implemented |
| **Proof-of-Reserves** | On-chain Merkle tree attestation | 🔄 In Progress |
| **Travel Rule** | TRP integration for VASP transfers | ⏳ Pending |
| **KYC/AML** | Off-chain screening before bridge | ⏳ Pending |
| **Sanctions Screening** | Real-time OFAC/UN/EU checks | ⏳ Pending |

**Bridge Contract Security**:

```solidity
contract NorBridge {
    // 1. Global daily limit (circuit breaker)
    uint256 public globalDailyLimit;
    uint256 public dailyVolumeUsed;

    // 2. Per-transaction limit
    uint256 public maxTransferAmount;

    // 3. Minimum finality blocks
    uint256 public minFinalityBlocks;

    // 4. Multisig authorization (Gnosis Safe)
    address public safeMultisig;

    // 5. Timelock for withdrawals
    uint256 public withdrawalDelay;

    // 6. Proof-of-reserves
    function getReserves() external view returns (uint256[] memory);
    function getMerkleRoot() external view returns (bytes32);

    // 7. Emergency pause
    function pause() external onlyMultisig;
}
```

**Operational Controls**:
- ✅ HSM (Hardware Security Module) for multisig keys
- ✅ Geo-distributed key holders (Norway, UAE, Kenya)
- ✅ 48-hour timelock on large withdrawals (>$100k)
- ✅ Weekly proof-of-reserves publication
- ✅ Real-time anomaly detection with auto-pause
- ✅ Bug bounty program (HackenProof, Immunefi)

---

### 2.3 Escrow System Compliance

**Classification**: Neutral intermediary service (may require trust company license)

**Deployed Contract**: `contracts/escrow/Escrow.sol`

**Compliance Features**:

```solidity
contract Escrow {
    // 1. Full audit trail
    event DealCreated(...);
    event Funded(...);
    event Released(...);
    event Refunded(...);

    // 2. Arbiter-based governance (DAO multisig)
    address public arbiter;

    // 3. Daily volume limits (AML control)
    uint256 public globalDailyLimit;
    uint256 public dailyVolumeUsed;

    // 4. Per-deal caps
    uint256 public perDealLimit;

    // 5. Fee collection for sustainability
    uint256 public feeBps;
    address public feeCollector;

    // 6. Emergency pause
    function pause() external onlyOwner;
}
```

**KYC/AML Integration** (off-chain):
- Require KYC for deals > $10,000
- Sanctions screening before accepting high-value escrows
- Transaction monitoring for suspicious patterns
- SAR (Suspicious Activity Report) filing capability

---

## 3. Operational Compliance Program

### 3.1 AML/CTF Program Structure

**Required Components**:

1. **Written AML Policy**
   - Risk assessment methodology
   - Customer due diligence (CDD) procedures
   - Enhanced due diligence (EDD) thresholds
   - Transaction monitoring rules
   - SAR filing procedures

2. **MLRO Responsibilities**
   - Independent reporting line to board
   - Authority to freeze suspicious transactions
   - Liaison with Finanstilsynet
   - Annual AML training for all staff

3. **Risk-Based Approach**

| Customer Type | Risk Level | CDD Required |
|--------------|------------|--------------|
| **Individual (< $1k)** | Low | Basic ID verification |
| **Individual ($1k-$10k)** | Medium | ID + proof of address |
| **Individual (> $10k)** | High | EDD + source of funds |
| **Corporate** | High | KYB + UBO identification |
| **PEP** | Very High | EDD + ongoing monitoring |

4. **Transaction Monitoring**
   - Threshold alerts (e.g., > $5k single tx, > $10k daily)
   - Velocity monitoring (rapid in/out = structuring?)
   - Geographic risk (high-risk jurisdictions)
   - Behavioral patterns (sudden large transfers)

5. **Sanctions Screening**
   - Real-time checks against:
     - OFAC (US Treasury)
     - UN Security Council
     - EU sanctions list
     - Norwegian national lists
   - Screen on: account creation, transaction, withdrawal

---

### 3.2 GDPR Compliance (Data Protection)

**Legal Basis**: EU GDPR + Norwegian Personal Data Act

**NorChain Data Handling**:

| Data Type | Storage | Retention | Basis |
|-----------|---------|-----------|-------|
| **Wallet addresses** | On-chain (public) | Permanent | Public blockchain |
| **KYC data (name, DOB, address)** | Off-chain encrypted DB | 5 years post-closure | Legal obligation (AML) |
| **Transaction history** | On-chain (public) | Permanent | Public blockchain |
| **IP logs** | Server logs | 90 days | Legitimate interest (security) |

**User Rights**:
- ✅ Right to access (provide data export)
- ✅ Right to rectification (update KYC data)
- ❌ Right to erasure (NOT applicable to blockchain data)
- ✅ Right to data portability (JSON export)

**Technical Measures**:
- End-to-end encryption for KYC data
- Access controls (role-based)
- Audit logs for all data access
- GDPR-compliant privacy policy
- Cookie consent banner

---

### 3.3 ISO 27001 Security Management

**Status**: Alignment in progress

**Required Controls** (ISO 27001:2022):

| Domain | Control | NorChain Implementation |
|--------|---------|------------------------|
| **A.5.1** | Policies | Information security policy published |
| **A.5.7** | Threat intel | Subscribe to CertiK, PeckShield alerts |
| **A.8.2** | Access rights | Role-based access (RBAC) |
| **A.8.3** | Privileged access | HSM for signing keys, MFA for all admins |
| **A.8.8** | Event logging | All contract events logged |
| **A.8.23** | Web filtering | Firewall + DDoS protection (Cloudflare) |
| **A.8.24** | Cryptography | TLS 1.3, AES-256, Ed25519 signatures |

**Incident Response**:
1. Detection → Monitoring alerts trigger
2. Containment → Pause affected contracts
3. Eradication → Deploy fix via timelock
4. Recovery → Resume operations
5. Lessons learned → Post-mortem report

---

## 4. Marketing & Consumer Protection

### 4.1 ESMA Warning (MiCA Article 90)

**Issue**: CASPs are warned not to imply protections they don't offer

**NorChain Compliance**:
- ❌ Do NOT claim "bank-level security" without deposit insurance
- ❌ Do NOT imply regulatory approval before receiving it
- ✅ DO disclose: "Crypto-assets are unregulated and high-risk"
- ✅ DO disclose: "No deposit guarantee or investor compensation scheme"

**Disclosure Example** (website footer):
```
⚠️ Risk Warning: Crypto-assets are volatile and can lose value.
NorChain is registered as a VASP in Norway but crypto-assets are
not protected by deposit insurance. Only invest what you can afford
to lose. Read our full Risk Disclosure before using NorSwap or Bridge.
```

---

### 4.2 Complaints Handling (MiCA Requirement)

**Process**:
1. User submits complaint via web form
2. Acknowledge within 24 hours
3. Investigate within 7 days
4. Resolve within 30 days
5. If unresolved → escalate to external dispute resolution (ODR platform)

**External Dispute Resolution** (Norway):
- Finansklagenemnda (Financial Services Complaints Board)
- Link: https://www.finansklagenemnda.no/

---

## 5. Incident Reporting

### 5.1 MiCA Incident Reporting (Article 94)

**Required Reporting**:
- Cyber attacks affecting service availability
- Operational disruptions > 4 hours
- Loss of client assets
- Data breaches

**Timeline**:
- **4 hours**: Initial notification to regulator
- **24 hours**: Detailed incident report
- **Public disclosure**: If materially affecting clients

---

### 5.2 GDPR Breach Notification (Article 33-34)

**Trigger**: Personal data breach (KYC data leak, unauthorized access)

**Timeline**:
- **72 hours**: Notify Norwegian Data Protection Authority (Datatilsynet)
- **Without undue delay**: Notify affected users if high risk

---

## 6. Audit & Assurance

### 6.1 Smart Contract Audits

**Required Audits**:

| Contract | Auditor | Status | Report |
|----------|---------|--------|--------|
| **Escrow.sol** | TBD | ⏳ Pending | - |
| **NorSwap Router** | TBD | ⏳ Pending | - |
| **Bridge (NorChain)** | TBD | ⏳ Pending | - |
| **Bridge (BSC)** | TBD | ⏳ Pending | - |

**Recommended Auditors**:
- CertiK (comprehensive security audit)
- Trail of Bits (formal verification)
- OpenZeppelin (best practices review)
- Hacken (ongoing monitoring)

**Post-Audit**:
- ✅ Publish audit reports publicly
- ✅ Address all critical findings before mainnet
- ✅ Re-audit after material changes

---

### 6.2 Financial Audit

**Required**: Annual financial statements audited by Norwegian CPA

**Scope**:
- Proof-of-reserves verification
- Fee revenue accounting
- Client asset segregation
- Capital adequacy (if required under MiCA)

---

## 7. Travel Rule Implementation

### 7.1 Technical Architecture

**Option 1: TRP Provider Integration (Recommended)**

```javascript
// Pseudo-code for Travel Rule Provider (TRP) integration
async function bridgeTransfer(from, to, amount, asset) {
  // 1. Check if destination is a VASP
  const destVASP = await trpProvider.lookupVASP(to);

  if (destVASP) {
    // 2. Collect originator info (if not KYC'd, require now)
    const originatorInfo = await getOriginatorInfo(from);

    // 3. Send Travel Rule message
    await trpProvider.sendTravelRuleMessage({
      originator: originatorInfo,
      beneficiary: to,
      amount: amount,
      asset: asset
    });

    // 4. Wait for beneficiary VASP acknowledgment
    await trpProvider.waitForAcknowledgment();
  }

  // 5. Execute transfer
  await bridge.transfer(from, to, amount, asset);
}
```

**Option 2: Self-hosted Travel Rule Server**
- IVMS 101 protocol implementation
- Encrypted peer-to-peer messaging
- Higher development cost but more control

---

### 7.2 TRP Provider Comparison

| Provider | Coverage | Cost | Integration |
|----------|----------|------|-------------|
| **Notabene** | Global, 150+ VASPs | $$$ | API + SDK |
| **Sygna Bridge** | Asia-focused | $$ | API |
| **Veriscope** | North America | $$ | API |
| **CipherTrace** | Global | $$$ | Full AML suite |

**Recommendation**: Start with Notabene for EU/Norway compliance.

---

## 8. Compliance Roadmap

### Phase 1: Foundation (Months 1-3)

**Objective**: Register as VASP, establish baseline controls

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| Complete VASP registration form | Legal | Week 4 | ⏳ |
| Appoint MLRO | Compliance | Week 2 | ⏳ |
| Draft AML policy | Compliance | Week 6 | ⏳ |
| Procure KYC provider (Onfido, Jumio) | Tech | Week 8 | ⏳ |
| Procure TRP provider (Notabene) | Tech | Week 10 | ⏳ |
| Audit Escrow contract | Security | Week 12 | ⏳ |

---

### Phase 2: MiCA Alignment (Months 4-6)

**Objective**: Prepare MiCA CASP authorization pack

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| MiCA gap analysis | Legal | Month 4 | ⏳ |
| Draft governance policies | Compliance | Month 4 | ⏳ |
| ISO 27001 readiness assessment | Security | Month 5 | ⏳ |
| Complaints handling procedure | Compliance | Month 5 | ⏳ |
| Incident reporting SOP | Compliance | Month 6 | ⏳ |
| Submit MiCA CASP application | Legal | Month 6 | ⏳ |

---

### Phase 3: Operational Readiness (Months 7-9)

**Objective**: Deploy production-ready compliance infrastructure

| Task | Owner | Deadline | Status |
|------|-------|----------|--------|
| Go-live KYC/AML system | Tech | Month 7 | ⏳ |
| Integrate Travel Rule provider | Tech | Month 7 | ⏳ |
| Complete DEX & Bridge audits | Security | Month 8 | ⏳ |
| Publish proof-of-reserves dashboard | Tech | Month 8 | ⏳ |
| Staff AML training | Compliance | Month 9 | ⏳ |
| Launch public beta with limits | Product | Month 9 | ⏳ |

---

## 9. Resources & Contacts

### Regulatory Authorities

**Norway**:
- **Finanstilsynet** (FSA): https://www.finanstilsynet.no/
- **Datatilsynet** (DPA): https://www.datatilsynet.no/

**EU**:
- **ESMA** (Securities regulator): https://www.esma.europa.eu/
- **EBA** (Banking regulator): https://www.eba.europa.eu/

**FATF**:
- **Guidance on Virtual Assets**: https://www.fatf-gafi.org/

---

### Legal & Compliance Advisors

**Recommended Firms** (Norway/EU crypto-asset expertise):
- Wikborg Rein (Oslo) - Fintech & blockchain
- Advokatfirmaet Selmer (Oslo) - Financial regulation
- DLA Piper (Pan-European) - MiCA compliance
- Bird & Bird (Pan-European) - Crypto-asset regulation

---

### Technical Compliance Vendors

**KYC/AML**:
- Onfido (ID verification)
- Jumio (biometric KYC)
- Chainalysis (transaction monitoring + sanctions)
- Elliptic (AML + Travel Rule)

**Travel Rule**:
- Notabene
- Sygna Bridge
- Veriscope

**Security**:
- CertiK (smart contract audit)
- Trail of Bits (formal verification)
- Hacken (ongoing monitoring)
- Immunefi (bug bounty)

---

## 10. Summary & Next Actions

### Critical Path Items

**Immediate (Weeks 1-4)**:
1. ✅ Appoint MLRO and establish compliance function
2. ✅ Begin Finanstilsynet VASP registration process
3. ✅ Procure KYC provider and integrate
4. ✅ Audit Escrow contract before deployment

**Short-term (Months 1-3)**:
5. ✅ Draft and publish AML policy
6. ✅ Integrate Travel Rule provider (Notabene)
7. ✅ Complete DEX and Bridge smart contract audits
8. ✅ Publish proof-of-reserves dashboard

**Medium-term (Months 4-6)**:
9. ✅ Complete MiCA CASP gap analysis
10. ✅ Submit MiCA authorization application
11. ✅ Achieve ISO 27001 readiness
12. ✅ Launch public beta with transaction limits

---

## Appendix A: Compliance Checklist

**Use this checklist to track compliance progress:**

### VASP Registration (Norway)
- [ ] Company registered in Norway (AS or ASA)
- [ ] MLRO appointed with board approval
- [ ] AML policy drafted and approved
- [ ] KYC/KYB procedures documented
- [ ] Transaction monitoring system operational
- [ ] Staff trained on AML/CTF
- [ ] Finanstilsynet registration submitted

### MiCA CASP Authorization
- [ ] Fit & proper documentation for management
- [ ] Conflicts of interest policy
- [ ] Service disclosure documents
- [ ] Complaints handling procedure
- [ ] Incident reporting SOP
- [ ] ICT security policy (ISO 27001-aligned)
- [ ] Asset safeguarding policy
- [ ] CASP application submitted

### Technical Compliance
- [ ] Escrow contract audited
- [ ] DEX contracts audited
- [ ] Bridge contracts audited
- [ ] Proof-of-reserves implemented
- [ ] Travel Rule integration live
- [ ] Circuit breakers tested
- [ ] Emergency pause procedures documented

### Operational Compliance
- [ ] Privacy policy published (GDPR)
- [ ] Risk disclosure published
- [ ] Bug bounty program launched
- [ ] 24/7 monitoring operational
- [ ] Incident response plan tested
- [ ] Annual financial audit scheduled

---

## Appendix B: Key Definitions

**VASP**: Virtual Asset Service Provider (FATF term for crypto businesses)

**CASP**: Crypto-Asset Service Provider (MiCA term, equivalent to VASP)

**MiCA**: Markets in Crypto-Assets Regulation (EU Regulation 2023/1114)

**MLRO**: Money Laundering Reporting Officer (AML compliance lead)

**KYC**: Know Your Customer (identity verification)

**KYB**: Know Your Business (corporate due diligence)

**EDD**: Enhanced Due Diligence (for high-risk customers)

**PEP**: Politically Exposed Person (higher AML risk)

**SAR**: Suspicious Activity Report (filed with authorities)

**FATF**: Financial Action Task Force (global AML standard-setter)

**IVMS**: InterVASP Messaging Standard (Travel Rule protocol)

**TWAP**: Time-Weighted Average Price (oracle for DEX)

**HSM**: Hardware Security Module (secure key storage)

---

**Document Status**: Living document, updated as regulations evolve
**Next Review**: March 2026 or upon regulatory changes
**Owner**: NorChain Compliance Team
**Contact**: compliance@norchain.org

---

