# NOR Token Ultra - Bug Bounty Tracker

**Program Start**: November 7, 2025
**Program End**: November 10, 2025 (3 days)
**Total Budget**: $300 USD
**Remaining Budget**: $300 USD

---

## Submission Log

### Template for New Submissions

```markdown
### [TRACKER-XXX] Title
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW/INFO
- **Submitted By**: GitHub username / Email
- **Date**: YYYY-MM-DD HH:MM UTC
- **Platform**: GitHub/Email/Twitter/Discord
- **Status**: NEW / REVIEWING / VALID / INVALID / DUPLICATE / FIXED
- **Bounty**: $XXX (if valid)
- **Payment Status**: PENDING / PAID

**Description**:
[Brief description]

**Location**:
[File:Line]

**Impact**:
[Risk assessment]

**Team Response**:
[Our analysis and decision]
```

---

## Active Submissions

### Status Categories
- 🆕 NEW - Just submitted, awaiting review
- 🔍 REVIEWING - Under evaluation
- ✅ VALID - Confirmed valid finding
- ❌ INVALID - Not a real issue
- 🔄 DUPLICATE - Already reported
- 🔧 FIXED - Implemented fix

---

## Submissions

### CRITICAL Severity ($200 bounty)

*None yet*

---

### HIGH Severity ($100 bounty)

*None yet*

---

### MEDIUM Severity ($50 bounty)

*None yet*

---

### LOW Severity ($25 bounty)

*None yet*

---

### INFO Severity ($10 bounty)

*None yet*

---

## Statistics

| Metric | Count |
|--------|-------|
| **Total Submissions** | 0 |
| **Valid Findings** | 0 |
| **Invalid Findings** | 0 |
| **Duplicate Findings** | 0 |
| **Critical** | 0 |
| **High** | 0 |
| **Medium** | 0 |
| **Low** | 0 |
| **Info** | 0 |
| **Bounties Paid** | $0 |
| **Bounties Pending** | $0 |
| **Budget Remaining** | $300 |

---

## Validation Criteria

### CRITICAL ($200)
- Funds can be stolen or locked
- Contract can be permanently broken
- Unauthorized minting/burning
- Access control completely bypassed

### HIGH ($100)
- Major security feature can be bypassed
- Unauthorized state changes possible
- Significant centralization risk
- Blacklist/pause can be circumvented

### MEDIUM ($50)
- Logic error affecting functionality
- DoS possible but temporary
- Gas griefing attacks
- Edge cases causing incorrect behavior

### LOW ($25)
- Code quality issues
- Gas optimization (significant savings)
- Best practice violations
- Non-critical centralization

### INFO ($10)
- Minor gas optimizations
- Style improvements
- Documentation issues
- Helpful suggestions

---

## Payment Process

1. **Submission**: Reporter submits finding via GitHub/Email/Twitter/Discord
2. **Acknowledgment**: We respond within 24 hours with tracker ID
3. **Validation**: Security team reviews (24-48 hours)
4. **Decision**: VALID/INVALID/DUPLICATE (with explanation)
5. **Payment**: If VALID, bounty paid within 48 hours
6. **Credit**: Reporter credited in final audit report

### Payment Options
- **NOR tokens** (at fair market rate post-launch)
- **USDT** (BEP20 on BSC)
- Reporter chooses preferred payment method

### Payment Information Needed
- BSC/Ethereum wallet address
- Preferred payment method (NOR or USDT)
- Name for credit in audit report (optional)

---

## Excluded Issues (Already Known)

These findings are NOT eligible for bounties:

### C-01: Parameter Name Conflict ✅ FIXED
- **Location**: NorTokenV2_AntBot.sol:185
- **Fix**: Renamed `isExchange` parameter to `status`
- **Date**: November 3, 2025

### C-02: External Function Visibility ✅ FIXED
- **Location**: LiquidityLockUltra.sol:131
- **Fix**: Changed visibility from `external` to `public`
- **Date**: November 3, 2025

### Known Limitations (Design Choices)

**L-01: Owner has significant privileges**
- **Status**: ACCEPTED
- **Reason**: Required for emergency pause, blacklist management
- **Mitigation**: Recommend Gnosis Safe multi-sig for production

**L-02: Ownable instead of Ownable2Step**
- **Status**: ACCEPTED (upgrade recommended)
- **Reason**: Not critical for initial launch
- **Mitigation**: Can upgrade to Ownable2Step in future version

---

## Response Templates

### Valid Finding
```markdown
Thank you for your submission! We've validated this as a {SEVERITY} finding.

**Tracker ID**: TRACKER-XXX
**Severity**: {SEVERITY}
**Bounty**: ${AMOUNT}

We'll implement a fix and pay your bounty within 48 hours.

To receive payment, please provide:
1. BSC/Ethereum wallet address
2. Preferred payment method (NOR or USDT)
3. Name for credit (optional)

You'll be credited in our final audit report. Thank you for making Nor Chain more secure!
```

### Invalid Finding
```markdown
Thank you for your submission. After review, we've determined this is not a valid security vulnerability.

**Tracker ID**: TRACKER-XXX
**Status**: INVALID
**Reason**: {Detailed explanation}

We appreciate your time and effort in reviewing our code. Please feel free to submit additional findings!
```

### Duplicate Finding
```markdown
Thank you for your submission. This issue was already reported by another researcher.

**Tracker ID**: TRACKER-XXX
**Status**: DUPLICATE
**Original**: TRACKER-YYY (submitted {DATE})

We appreciate your review! The original reporter will receive the bounty. Please check our existing issues before submitting to avoid duplicates.
```

---

## Team Review Checklist

For each submission:

- [ ] Assign tracker ID (TRACKER-XXX)
- [ ] Acknowledge receipt within 24 hours
- [ ] Reproduce the issue (if applicable)
- [ ] Assess severity and impact
- [ ] Check for duplicates
- [ ] Determine VALID/INVALID/DUPLICATE
- [ ] Draft response with explanation
- [ ] If VALID: prepare fix, request payment info
- [ ] If VALID: pay bounty within 48 hours of validation
- [ ] Update tracker status
- [ ] Credit reporter in final audit report

---

## Contact Information

**Security Email**: security@norchain.org
**Bounty Email**: bounty@norchain.org
**Response Time**: Within 24 hours

---

## Final Report Integration

After review period ends, all valid findings will be included in:
- **File**: `docs/bootstrap-launch/WEEK2_COMMUNITY_AUDIT_REPORT.md`
- **Sections**:
  - Community Submissions Summary
  - Valid Findings and Fixes
  - Bounties Paid
  - Contributor Credits

---

**Last Updated**: November 7, 2025
**Program Status**: 🚀 ACTIVE
**Next Review**: November 8, 2025 (daily updates)
