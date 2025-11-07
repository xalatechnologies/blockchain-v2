# Community Review Posting Templates

**Get Free Security Reviews from the Developer Community**

---

## Table of Contents

1. [Reddit (r/ethdev) Template](#reddit-template)
2. [Twitter/X Template](#twitter-template)
3. [OpenZeppelin Forum Template](#openzeppelin-template)
4. [Discord Template](#discord-template)
5. [Bug Bounty Template](#bug-bounty-template)
6. [GitHub Issues Template](#github-template)

---

## Reddit Template

### For r/ethdev

```markdown
Title: [Review Request] NOR Token Ultra - Seeking Security Feedback ($200 Bounty)

---

Hey r/ethdev,

I'm launching a Shariah-compliant L1 blockchain token with advanced bot protection and would appreciate security feedback from the community.

**Contract:** NorTokenUltra.sol (700 lines, 7 security layers)
**GitHub:** [Your GitHub link]
**Network:** BSC/NorChain
**Bounty:** $200 for critical findings, $50 for medium severity issues

## What I've Done So Far

✅ Slither analysis (0 critical issues)
✅ Mythril scan (0 vulnerabilities)
✅ 100% test coverage (50+ test cases)
✅ Manual code review against OWASP

## Key Features

- Phased launch system (DISABLED → PHASE1 → PHASE2 → PHASE3 → OPEN)
- Anti-bot protections (cooldowns, buy/sell limits)
- Emergency pause functionality
- Blacklist capability (multi-sig controlled)
- ReentrancyGuard implementation

## What I'm Looking For

1. **Security vulnerabilities** I might have missed
2. **Edge cases** in transfer logic
3. **Gas optimization** opportunities
4. **Best practice** violations

## Specific Areas of Concern

- Are my phase transition checks safe?
- Is the cooldown system exploit-proof?
- Any reentrancy vectors I missed?
- Timestamp manipulation risks?

## Code Highlights

```solidity
// Phase-based buy limit enforcement
function _checkBuyLimits(address to, uint256 amount) internal view {
    if (isWhitelisted[to]) return;

    if (currentPhase == LaunchPhase.PHASE1) {
        require(amount <= maxBuyAmountPhase1, "Exceeds max buy");
    } else if (currentPhase == LaunchPhase.PHASE2) {
        require(amount <= maxBuyAmountPhase2, "Exceeds max buy");
    }
    // PHASE3 and OPEN have no buy limits
}
```

## Reward Structure

- 🔴 Critical vulnerability: $200
- 🟠 High severity: $100
- 🟡 Medium severity: $50
- 🔵 Low severity: $25
- ⚪ Informational: Public thanks + credit

## How to Review

1. Clone repo: `git clone [your-repo]`
2. Install deps: `npm install`
3. Run tests: `npx hardhat test`
4. Review contracts in `contracts/`
5. Comment here or DM findings

## Deployment Timeline

Planning to deploy in 2 weeks after incorporating feedback.

Thanks in advance for any insights! 🙏

---

**Links:**
- GitHub: [link]
- Documentation: [link]
- Test coverage report: [link]
```

---

## Twitter/X Template

### Short Version (Thread)

```
🔒 SECURITY REVIEW REQUEST 🔒

Launching NOR Token Ultra - a Shariah-compliant token with 7 security layers.

Looking for devs to review before mainnet!

$200 bounty for critical findings 💰

🧵 Details 👇

1/6 Contract: NorTokenUltra.sol
- 700 lines of code
- Phased launch system
- Bot protection built-in
- Emergency pause
- Multi-sig controlled blacklist

GitHub: [link]

2/6 What I've done:
✅ Slither (0 issues)
✅ Mythril (0 vulnerabilities)
✅ 100% test coverage
✅ Manual OWASP review

But I want fresh eyes on it!

3/6 Key features to review:
- Phase transitions (4 phases over 7 days)
- Cooldown system (anti-sandwich)
- Buy/sell limits (whale protection)
- Blacklist function (bot banning)

4/6 Bounty structure:
🔴 Critical: $200
🟠 High: $100
🟡 Medium: $50
🔵 Low: $25

All findings get public credit!

5/6 How to participate:
1. Review code: [GitHub link]
2. Run tests: npx hardhat test
3. DM findings or comment below
4. Get paid in USDT/BNB

Deadline: [Date]

6/6 Why this matters:
Building a halal-compliant L1 for 1.8B Muslims.
Security is non-negotiable.

Help make DeFi accessible to everyone! 🌍

RT for visibility? 🙏

#Solidity #Web3Security #SmartContracts #DeFi
```

---

## OpenZeppelin Forum Template

### For OpenZeppelin Community Forum

```markdown
Title: Security Review Request - NOR Token Ultra (ERC20 with Advanced Bot Protection)

Category: Security

---

## Project Overview

I'm building NOR Token Ultra, a Shariah-compliant ERC20 token with advanced bot protection mechanisms for launch on BSC and a custom L1 (NorChain).

**Repository:** [GitHub link]
**Contracts:** `NorTokenUltra.sol`, `LiquidityLockUltra.sol`, `NorTokenBridgeHub.sol`
**Based on:** OpenZeppelin Contracts v4.9.6

## Contract Features

### Core ERC20
- Standard ERC20 implementation
- 24 decimals (following BSC standard)
- 21 billion total supply
- Burnable (planned)

### Security Layers

1. **Phased Launch System**
   - DISABLED (before launch)
   - PHASE1 (first hour): Strictest limits
   - PHASE2 (hours 1-6): Moderate limits
   - PHASE3 (days 1-7): Reduced limits
   - OPEN (day 7+): Normal operation

2. **Anti-Bot Protection**
   - Buy cooldown (prevents same-block purchases)
   - Transaction limits (phase-dependent)
   - Wallet limits (max holdings)

3. **Emergency Controls**
   - Pausable (OpenZeppelin Pausable)
   - Blacklist (multi-sig controlled)
   - ReentrancyGuard

## Code Structure

```solidity
contract NorTokenUltra is ERC20, Ownable, Pausable, ReentrancyGuard {
    enum LaunchPhase { DISABLED, PHASE1, PHASE2, PHASE3, OPEN }

    LaunchPhase public currentPhase = LaunchPhase.DISABLED;
    uint256 public tradingStartTime;

    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isExchange;
    mapping(address => uint256) private _lastBuyTime;

    function enableTrading() external onlyOwner { ... }
    function _updatePhase() internal { ... }
    function _beforeTokenTransfer(...) internal override { ... }
}
```

## Specific Questions for Community

### 1. Phase Transition Logic
```solidity
function _updatePhase() internal {
    if (!tradingEnabled) return;

    uint256 elapsed = block.timestamp - tradingStartTime;

    if (elapsed >= PHASE3_DURATION) {
        currentPhase = LaunchPhase.OPEN;
    } else if (elapsed >= PHASE2_DURATION) {
        currentPhase = LaunchPhase.PHASE3;
    } else if (elapsed >= PHASE1_DURATION) {
        currentPhase = LaunchPhase.PHASE2;
    }
}
```

**Question:** Is this phase transition safe from timestamp manipulation? Should I add additional safeguards?

### 2. Cooldown System
```solidity
if (cooldownEnabled && isExchange[from]) {
    require(
        block.timestamp >= _lastBuyTime[to] + buyCooldown,
        "Buy cooldown active"
    );
    _lastBuyTime[to] = block.timestamp;
}
```

**Question:** Can this be gamed? Any edge cases I'm missing?

### 3. Blacklist vs Decentralization
```solidity
function blacklist(address account) external onlyOwner {
    require(account != owner(), "Cannot blacklist owner");
    isBlacklisted[account] = true;
    emit Blacklisted(account);
}
```

**Question:** Planning to renounce ownership after 90 days. Is there a better way to handle bot banning without permanent owner control?

## Testing

- ✅ 50+ test cases
- ✅ 100% line coverage
- ✅ 98% branch coverage
- ✅ All edge cases covered

**Test execution:**
```bash
$ npx hardhat test

  NorTokenUltra - Complete Security Test Suite
    ✓ Should set the correct name and symbol
    ✓ Should only allow owner to enable trading
    ✓ Should prevent blacklisted address from transferring
    ... (47 more tests)

  50 passing (8s)
```

## Security Analysis Done

1. **Slither:** 0 critical issues
2. **Mythril:** 0 vulnerabilities
3. **Solhint:** All warnings addressed
4. **Manual OWASP review:** Complete

## What I'm Looking For

1. Security vulnerabilities
2. Gas optimization opportunities
3. Best practice violations
4. Edge cases in transfer logic
5. Compliance with OpenZeppelin standards

## Deployment Plan

- **Timeline:** 2-3 weeks
- **Networks:** BSC Mainnet, NorChain (custom L1)
- **Liquidity:** $100k minimum, locked 2 years
- **Ownership:** Multi-sig (3-of-5), renouncement after 90 days

## Bounty

Offering $200 for critical findings, lesser amounts for lower severity issues.

## Questions

Would greatly appreciate feedback from the OpenZeppelin community on:
- Security architecture
- OpenZeppelin contract usage
- Best practices compliance
- Any red flags you see

Thank you! 🙏
```

---

## Discord Template

### For Security/Audit Discord Channels

```
**🔒 SECURITY REVIEW REQUEST 🔒**

**Project:** NOR Token Ultra
**Type:** ERC20 with Advanced Bot Protection
**Bounty:** $200 for critical findings

---

**📋 QUICK OVERVIEW**

Token for Shariah-compliant L1 blockchain
- 7 security layers
- Phased launch (4 phases over 7 days)
- Anti-bot protection
- Emergency controls

**🔍 WHAT I'VE DONE**
✅ Slither (clean)
✅ Mythril (clean)
✅ 100% test coverage
✅ Manual OWASP review

**💰 BOUNTY STRUCTURE**
🔴 Critical: $200
🟠 High: $100
🟡 Medium: $50
🔵 Low: $25

**📂 LINKS**
GitHub: [link]
Tests: [link]
Docs: [link]

**🎯 LOOKING FOR**
- Security holes
- Edge cases
- Gas optimizations
- Best practice violations

**⏰ DEADLINE**
[Date - 2 weeks from now]

**💬 RESPOND HERE OR DM**

Thanks! 🙏
```

---

## Bug Bounty Template

### For Bug Bounty Platforms (Immunefi Style)

```markdown
# NOR Token Ultra Bug Bounty Program

## Overview

**Project:** NOR Token Ultra
**Website:** [link]
**GitHub:** [link]
**Status:** Pre-Launch Audit
**Maximum Bounty:** $200

## Program Rules

### Eligibility

- First to report gets the bounty
- Duplicate reports receive no reward
- Public disclosure before fix = disqualified
- Must provide proof of concept
- Must suggest a fix

### Scope

**In Scope:**
- `contracts/NorTokenUltra.sol`
- `contracts/LiquidityLockUltra.sol`
- `contracts/bridges/NorTokenBridgeHub.sol`

**Out of Scope:**
- Known issues (see documentation)
- Issues in third-party contracts
- Issues in test files
- Gas optimizations (unless critical)

## Severity Classification

### 🔴 Critical ($200)

Immediate threat to user funds or contract integrity:
- Ability to drain contract
- Ability to mint unlimited tokens
- Ability to steal funds
- Reentrancy attacks leading to fund loss
- Complete bypass of security mechanisms

**Examples:**
- "Attacker can drain all liquidity"
- "Minting function has no access control"
- "Reentrancy in transfer allows double-spending"

### 🟠 High ($100)

Significant vulnerability affecting contract security:
- Unauthorized access to admin functions
- Bypass of critical protections
- DOS attacks affecting all users
- Logic errors leading to fund loss

**Examples:**
- "Anyone can pause the contract"
- "Blacklist can be bypassed"
- "Phase system can be manipulated"

### 🟡 Medium ($50)

Potential security issue with limited impact:
- Access control issues on non-critical functions
- Logic errors with minor impact
- DOS attacks affecting single user
- Timestamp manipulation in non-critical areas

**Examples:**
- "Cooldown can be bypassed under specific conditions"
- "Phase limits don't apply to certain edge cases"

### 🔵 Low ($25)

Minor security issue or best practice violation:
- Missing event emissions
- Missing input validation
- Non-critical function visibility
- Code quality issues with security implications

## How to Submit

1. **Email:** security@norchain.org
2. **Include:**
   - Vulnerability description
   - Proof of concept (code)
   - Suggested fix
   - Severity assessment
   - Your payment address (USDT/BNB)

3. **We will:**
   - Acknowledge within 24 hours
   - Assess severity within 48 hours
   - Fix within 7 days
   - Pay bounty after fix verification

## Payment

- Paid in USDT or BNB (your choice)
- Within 48 hours of fix deployment
- Includes public credit (unless you prefer anonymous)

## Timeline

**Program Start:** [Date]
**Program End:** [Date] or mainnet launch
**Response Time:** 24-48 hours
**Fix Time:** 7 days maximum

## Contact

**Email:** security@norchain.org
**Discord:** [link]
**Telegram:** [link]

## Acknowledgments

All valid submissions will be credited publicly unless you prefer to remain anonymous.
```

---

## GitHub Issues Template

### For GitHub Repository

```markdown
**Issue Template: Security Review**

---

## 🔒 Security Review Submission

**Severity:** [ ] Critical | [ ] High | [ ] Medium | [ ] Low | [ ] Informational

**Affected Contract:** [Contract name]

**Line Number(s):** [Line numbers]

---

### Description

[Describe the vulnerability or issue]

---

### Impact

[What could an attacker do? What's the worst case scenario?]

---

### Proof of Concept

```solidity
// Code demonstrating the vulnerability

// Example attack transaction:
// 1. Attacker calls functionX with parameter Y
// 2. This allows them to...
// 3. Resulting in...
```

---

### Suggested Fix

```solidity
// Recommended code changes

// BEFORE:
[original code]

// AFTER:
[fixed code]
```

---

### Additional Context

[Any other relevant information]

---

### Bounty Claim

**Payment Address (USDT/BNB):** [Your address]
**Preferred Credit:** [ ] Public | [ ] Anonymous
**Contact:** [Email or Discord]

---

**Checklist:**
- [ ] I've tested this locally
- [ ] I've provided a proof of concept
- [ ] I've suggested a fix
- [ ] I understand this will be reviewed within 48 hours
- [ ] I agree to the bug bounty terms
```

---

## Follow-Up Template

### After Posting

```markdown
**Update [Date]:** Security Review Findings

Thank you to everyone who reviewed NOR Token Ultra!

## Summary

- **Total Submissions:** [X]
- **Critical:** [X]
- **High:** [X]
- **Medium:** [X]
- **Low:** [X]
- **Informational:** [X]

## Actions Taken

### Fixed Issues

1. ✅ **[Issue Title]** - [Submitter username]
   - Severity: [Level]
   - Fix: [Description]
   - Bounty: $[Amount] paid

2. ✅ **[Issue Title]** - [Submitter username]
   - Severity: [Level]
   - Fix: [Description]
   - Bounty: $[Amount] paid

### Acknowledged (Not Fixed)

1. ⚠️ **[Issue Title]** - [Submitter username]
   - Severity: [Level]
   - Reason: [Why not fixed]
   - Alternative: [Mitigation]

## Total Bounties Paid

**$[Total Amount]** distributed to [X] contributors

## Special Thanks

- [@username1] - Critical finding
- [@username2] - Multiple helpful suggestions
- [@username3] - Thorough review

## Next Steps

1. Re-running all security scans
2. Updating documentation
3. Final review before mainnet
4. Launch date: [Date]

Thank you all for making this contract more secure! 🙏
```

---

## Tips for Maximum Engagement

### DO's ✅

1. **Be specific** about what you want reviewed
2. **Show your work** (what you've already done)
3. **Offer fair bounties** ($50+ attracts serious reviewers)
4. **Respond quickly** to all feedback
5. **Give credit** publicly (unless requested otherwise)
6. **Be humble** - you're asking for help
7. **Follow up** with results and fixes

### DON'Ts ❌

1. **Don't be vague** - "Please review my contract"
2. **Don't lowball** - $10 bounties waste everyone's time
3. **Don't argue** with valid findings
4. **Don't disappear** after posting
5. **Don't deploy** before addressing critical issues
6. **Don't spam** - post once per platform
7. **Don't ignore** informational findings

---

## Expected Results

### Reddit (r/ethdev)

- **Engagement:** 10-50 comments
- **Reviews:** 3-10 serious reviewers
- **Findings:** 2-5 valid issues
- **Cost:** $100-300 in bounties

### Twitter/X

- **Engagement:** 50-200 interactions
- **Reviews:** 5-15 serious reviewers
- **Findings:** 1-3 valid issues
- **Cost:** $50-200 in bounties

### OpenZeppelin Forum

- **Engagement:** 5-20 comments
- **Reviews:** 2-5 expert reviewers
- **Findings:** 1-3 high-quality issues
- **Cost:** $100-300 in bounties

### Discord

- **Engagement:** 10-30 messages
- **Reviews:** 3-8 reviewers
- **Findings:** 1-4 valid issues
- **Cost:** $50-200 in bounties

---

## Success Story Example

```
"Posted NOR Token for review on r/ethdev with $200 bounty.

Results:
- 32 comments
- 7 serious reviews
- 2 critical issues found (both fixed!)
- 3 medium issues (all fixed)
- 5 low/info (mostly implemented)

Total bounties paid: $450
Total value received: PRICELESS

The contract is now 10x more secure. 100% worth it!"
```

---

**Ready to post? Use these templates and get free security reviews!** 🚀

**Remember:** The crypto community LOVES helping secure projects. Just be genuine, offer fair compensation, and you'll get amazing feedback.
