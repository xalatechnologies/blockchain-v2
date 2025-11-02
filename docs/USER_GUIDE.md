# Xaheen Bridge User Guide

Complete guide to using the Xaheen Bridge for cross-chain BTCBR transfers between BSC Mainnet and Xaheen Chain.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [How to Transfer BTCBR](#how-to-transfer-btcbr)
3. [Understanding Fees](#understanding-fees)
4. [Transfer Limits](#transfer-limits)
5. [Transaction Status](#transaction-status)
6. [Troubleshooting](#troubleshooting)
7. [Security Tips](#security-tips)
8. [FAQ](#faq)

---

## Getting Started

### Prerequisites

1. **MetaMask Wallet**
   - Install MetaMask: https://metamask.io/download/
   - See [MetaMask Setup Guide](METAMASK_SETUP.md)

2. **BTCBR Tokens**
   - You need BTCBR on either BSC Mainnet or Xaheen Chain

3. **Gas Fees**
   - **BSC Mainnet**: ~0.001 BNB (about $0.30)
   - **Xaheen Chain**: ~0.0001 XHT (negligible)

### Quick Start

1. Visit: **https://bridge.xaheen.org** (or your deployed URL)
2. Click "Connect Wallet" (top right)
3. Approve MetaMask connection
4. You're ready to transfer!

---

## How to Transfer BTCBR

### Step 1: Connect Your Wallet

1. Click the **"Connect Wallet"** button in the top right
2. MetaMask will pop up → Click **"Next"** → **"Connect"**
3. Your wallet address will appear in the header

### Step 2: Select Direction

**From BSC Mainnet to Xaheen Chain:**
- **From**: BSC Mainnet
- **To**: Xaheen Chain
- **Fee**: 0.1%

**From Xaheen Chain to BSC Mainnet:**
- **From**: Xaheen Chain
- **To**: BSC Mainnet
- **Fee**: 0.2%

Use the **🔄 swap button** to quickly reverse direction.

### Step 3: Enter Amount

1. Type the amount of BTCBR you want to transfer
2. Or click **"MAX"** to transfer your entire balance
3. The interface will show:
   - **Amount you're sending**
   - **Bridge fee** (0.1% or 0.2%)
   - **Amount you'll receive** (after fees)

**Example:**
```
Sending: 1,000 BTCBR (BSC → Xaheen)
Fee (0.1%): 1 BTCBR
You Receive: 999 BTCBR
```

### Step 4: Review and Confirm

The **Transfer Summary** shows:
- Transfer amount
- Bridge fee percentage and amount
- Net amount you'll receive

Double-check everything before proceeding!

### Step 5: Execute Transfer

1. Click the **"Transfer"** button
2. **First Transaction**: Approve BTCBR spending
   - MetaMask pops up
   - Review and click **"Confirm"**
   - Wait for confirmation (~3 seconds on BSC)

3. **Second Transaction**: Bridge deposit
   - MetaMask pops up again
   - Review and click **"Confirm"**
   - Wait for confirmation (~3 seconds on BSC)

### Step 6: Wait for Settlement

**What happens next:**

1. **Deposit Confirmed** (on source chain)
   - Your BTCBR is locked in the bridge contract
   - Event is emitted for validators

2. **Validation** (~30 seconds)
   - 3 validators monitor the deposit event
   - 2-of-3 signatures required (multi-sig security)

3. **Relayer Forwarding** (~45 seconds)
   - Relayer picks up the event
   - Waits for 15 block confirmations
   - Forwards receipt to destination chain

4. **Settlement Complete** (~2 minutes total)
   - BTCBR is minted/released on destination chain
   - You receive your tokens!

**Total Time: ~2 minutes** from deposit to receiving tokens

---

## Understanding Fees

### Fee Structure

| Direction | Fee | Minimum Fee |
|-----------|-----|-------------|
| BSC → Xaheen | **0.1%** | 0.1 BTCBR |
| Xaheen → BSC | **0.2%** | 0.2 BTCBR |

### Why Different Fees?

- **BSC → Xaheen (0.1%)**: Lower fee for bringing liquidity to Xaheen Chain
- **Xaheen → BSC (0.2%)**: Slightly higher fee for withdrawals to BSC

### Gas Fees (Separate)

Bridge fees are separate from gas fees:

| Network | Gas Fee | USD Value |
|---------|---------|-----------|
| BSC Mainnet | ~0.001 BNB | ~$0.30 |
| Xaheen Chain | ~0.0001 XHT | Negligible |

**Total Cost Example (1,000 BTCBR transfer BSC → Xaheen):**
- Bridge Fee: 1 BTCBR (0.1%)
- Gas Fee: 0.001 BNB (~$0.30)
- **Total: 1 BTCBR + $0.30 in gas**

---

## Transfer Limits

### Per-Transaction Limits

- **Minimum**: 100 BTCBR
- **Maximum**: 100,000 BTCBR per transaction

If you need to transfer more than 100K, split into multiple transactions.

### Daily Limits

- **500,000 BTCBR per address per day**

The daily limit resets every 24 hours (based on block timestamps).

### Why Limits?

Limits protect the bridge from:
- Large unauthorized drains
- Flash loan attacks
- Market manipulation

---

## Transaction Status

### Status Meanings

**🟡 Pending**
- Transaction submitted to blockchain
- Waiting for confirmations (15 blocks on BSC)
- Validators are monitoring

**🟢 Completed**
- Settlement successful
- Tokens received on destination chain
- Transfer complete!

**🔴 Failed**
- Transaction reverted or rejected
- No tokens were locked
- Check error message for details

### Checking Transaction Status

1. **On Bridge Interface**
   - See "Your Recent Transfers" section
   - Shows last 10 transfers

2. **On Block Explorer**
   - **BSC Mainnet**: https://bscscan.com
   - **Xaheen Chain**: https://explorer.xaheen.org
   - Search by transaction hash

### What if Transfer is Stuck?

If a transfer shows "Pending" for more than 5 minutes:

1. **Check source chain**
   - Verify deposit transaction confirmed
   - Look for "Deposit" event in transaction logs

2. **Contact support**
   - Telegram: https://t.me/xaheenchain
   - Provide transaction hash

Validators and relayers monitor 24/7, so stuck transfers are rare.

---

## Troubleshooting

### "Insufficient funds for gas"

**Problem**: Not enough BNB/XHT for gas fees

**Solution**:
- **BSC**: Get more BNB (need ~0.001 BNB)
- **Xaheen**: Get XHT from faucet or exchange

### "Amount below minimum"

**Problem**: Trying to transfer less than 100 BTCBR

**Solution**: Increase amount to at least 100 BTCBR

### "Amount exceeds maximum"

**Problem**: Trying to transfer more than 100,000 BTCBR

**Solution**: Split into multiple transactions (e.g., 2x 50,000)

### "Daily limit exceeded"

**Problem**: Already transferred 500,000 BTCBR today

**Solution**: Wait 24 hours for limit reset

### "Wrong network"

**Problem**: MetaMask is on wrong chain

**Solution**:
- Click "Transfer" button
- MetaMask will prompt to switch chains
- Approve chain switch

### "Transaction failed"

**Problem**: Transaction reverted on blockchain

**Common Causes**:
1. Insufficient BTCBR balance
2. Insufficient gas
3. Not enough BTCBR allowance approved
4. Network congestion

**Solution**: Check error message and try again

---

## Security Tips

### ✅ DO

1. **Double-check addresses**
   - Verify you're on the correct network
   - Check bridge contract address

2. **Start small**
   - First transfer: Use minimum (100 BTCBR)
   - Verify it works before larger amounts

3. **Verify transactions**
   - Check on block explorer
   - Save transaction hashes

4. **Use official links**
   - Only use: https://bridge.xaheen.org
   - Bookmark the site

5. **Keep private keys safe**
   - Never share seed phrase
   - Use hardware wallet for large amounts

### ❌ DON'T

1. **Don't rush**
   - Read transaction details carefully
   - Understand fees before confirming

2. **Don't share credentials**
   - Never give seed phrase to anyone
   - MetaMask will never ask for it

3. **Don't use untrusted sites**
   - Phishing sites are common
   - Always verify URL

4. **Don't ignore warnings**
   - If MetaMask shows a warning, investigate
   - If something feels wrong, stop

---

## FAQ

### How long does a transfer take?

**~2 minutes total** from confirmation to receiving tokens:
- 15 block confirmations (~45 seconds on BSC)
- Validator signatures (~30 seconds)
- Relayer forwarding (~30 seconds)
- Settlement (~15 seconds)

### Can I cancel a transfer?

**No**. Once the deposit transaction is confirmed on-chain, it cannot be canceled. The bridge will automatically complete the settlement.

### What if I enter the wrong amount?

Cancel the MetaMask transaction before confirming. Once confirmed, the transfer will proceed.

### Is my BTCBR safe?

**Yes**. The bridge uses:
- Multi-signature validation (2-of-3 validators)
- Audited smart contracts
- Transfer limits for protection
- 24/7 monitoring

### What happens if a validator is offline?

The bridge requires only 2 of 3 validators, so one can be offline without affecting operations.

### Can I transfer other tokens?

Currently, only BTCBR is supported. Other tokens may be added in the future.

### Are there withdrawal limits?

Daily limit: 500,000 BTCBR per address. No total withdrawal limit.

### How do I add Xaheen Chain to MetaMask?

See [MetaMask Setup Guide](METAMASK_SETUP.md) for step-by-step instructions.

### Where can I get support?

- **Telegram**: https://t.me/xaheenchain
- **Twitter**: https://twitter.com/xaheenchain
- **Email**: support@xaheen.org

---

## Next Steps

1. **Add Xaheen Chain to MetaMask**: [Setup Guide](METAMASK_SETUP.md)
2. **Execute your first transfer**: Start with 100 BTCBR to test
3. **Monitor your transaction**: Check status in "Recent Transfers"
4. **Join the community**: [Telegram](https://t.me/xaheenchain)

---

**Need Help?** Contact us on [Telegram](https://t.me/xaheenchain)

**Ready to start?** Visit [bridge.xaheen.org](https://bridge.xaheen.org)

---

*Last Updated: November 2025*
*Version: 1.0*
