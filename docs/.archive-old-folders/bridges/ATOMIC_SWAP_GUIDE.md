# Atomic Swap Bridge - Complete Guide
## Trustless Token Consciousness Exchange for BTCBR

---

## Overview

The **Atomic Swap Bridge** enables **direct peer-to-peer token exchange** between BSC Mainnet and Private BSC Chain without any intermediaries, validators, or trusted third parties.

### Philosophy: Direct Consciousness Exchange

Unlike traditional bridges that rely on validators, atomic swaps create a **quantum-entangled state** between two token consciousnesses - either both transfers complete, or neither does. No middle ground. No trust required.

---

## How It Works

### The Protocol

1. **Party A** (Alice) wants to trade 1000 BTCBR on **Mainnet** for Party B's 1000 BTCBR on **Private Chain**
2. Alice generates a **secret** (random bytes32)
3. Alice creates **Hash** = keccak256(secret)
4. Alice initiates swap on **Mainnet** with hash, locking her 1000 BTCBR
5. Bob sees Alice's swap and initiates matching swap on **Private Chain** with same hash
6. Alice reveals **secret** to claim Bob's 1000 BTCBR on Private Chain
7. Bob uses the now-revealed **secret** to claim Alice's 1000 BTCBR on Mainnet
8. **Atomic completion**: Both get their tokens or both get refunded

### Time Safety

- **Timelock**: 24 hours typical
- If Alice doesn't claim Bob's tokens within 24 hours, both can refund
- No party can be cheated - mathematics guarantees fairness

---

## Smart Contract Architecture

### Contract: `AtomicSwap.sol`

**Deployed on BOTH chains**:
- BSC Mainnet: `TBD`
- Private BSC: `TBD`

### Core Functions

```solidity
// Initiate swap
function initiate(
    bytes32 swapId,        // Unique ID (same on both chains)
    address participant,    // Counterparty address
    address token,         // BTCBR token address
    uint256 amount,        // Amount to swap
    bytes32 secretHash,    // Hash of secret
    uint256 timelock       // Expiry timestamp
) external

// Complete swap with secret
function complete(
    bytes32 swapId,
    bytes32 secret
) external

// Refund after timelock
function refund(bytes32 swapId) external
```

---

## Step-by-Step Swap Process

### Scenario: Alice (Mainnet) ↔ Bob (Private Chain)

#### Phase 1: Setup & Agreement

**Alice wants**: 1000 BTCBR on Private Chain  
**Bob wants**: 1000 BTCBR on Mainnet  
**Agreement**: Trade 1:1

```
Alice's Assets: 1000 BTCBR on Mainnet
Bob's Assets:   1000 BTCBR on Private Chain
```

#### Phase 2: Secret Generation

**Alice generates secret** (off-chain):
```javascript
const crypto = require('crypto');
const secret = '0x' + crypto.randomBytes(32).toString('hex');
const secretHash = web3.utils.keccak256(secret);

console.log('Secret:', secret);
console.log('Hash:', secretHash);
```

**Alice shares ONLY the hash with Bob**, never the secret!

#### Phase 3: Alice Initiates on Mainnet

**On BSC Mainnet**:
```solidity
// Alice approves tokens
BTCBR.approve(AtomicSwapAddress, 1000 * 10**18);

// Alice creates swap
AtomicSwap.initiate(
    swapId,              // 0x123...abc (agreed ID)
    bobMainnetAddress,   // Bob's address on mainnet
    BTCBRAddress,        // 0x0cF8e180...
    1000 * 10**18,       // 1000 BTCBR
    secretHash,          // Hash Alice generated
    now + 24 hours       // 24 hour timelock
);
```

**State**: Alice's 1000 BTCBR now locked in contract

#### Phase 4: Bob Initiates on Private Chain

**Bob verifies Alice's swap**, then creates matching swap:

```solidity
// Bob approves tokens
BTCBR.approve(AtomicSwapAddress, 1000 * 10**18);

// Bob creates swap with SAME parameters
AtomicSwap.initiate(
    swapId,                // SAME ID as Alice's
    alicePrivateAddress,   // Alice's address on private chain
    BTCBRAddress,          // 0x0cF8e180...
    1000 * 10**18,         // 1000 BTCBR
    secretHash,            // SAME hash as Alice's
    now + 12 hours         // 12 hour timelock (shorter!)
);
```

**State**: Both swaps now active, tokens locked

#### Phase 5: Alice Claims Bob's Tokens

**On Private Chain**:
```solidity
// Alice reveals secret to claim Bob's tokens
AtomicSwap.complete(swapId, secret);
```

**State**: 
- Alice receives 1000 BTCBR on Private Chain ✅
- Secret is now public on blockchain
- Bob can see the secret

#### Phase 6: Bob Claims Alice's Tokens

**On BSC Mainnet**:
```solidity
// Bob uses revealed secret
AtomicSwap.complete(swapId, secret);
```

**State**:
- Bob receives 1000 BTCBR on Mainnet ✅
- Swap complete!

---

## Security Model

### Why It's Trustless

1. **Cryptographic Guarantee**: Only Alice knows the secret initially
2. **Atomic Property**: Either both complete or both refund
3. **Time Safety**: Timelocks prevent indefinite locking
4. **No Intermediary**: Direct P2P exchange
5. **Verifiable**: All actions on-chain, transparent

### Attack Scenarios & Defenses

#### Attack 1: Alice Claims But Doesn't Reveal Secret
**Defense**: Impossible! Claiming requires revealing secret on-chain

#### Attack 2: Bob Sees Secret and Claims First
**Defense**: That's fine! Both get their tokens

#### Attack 3: Alice Never Claims
**Defense**: After timelock, both parties refund - no loss

#### Attack 4: Different Amounts on Each Chain
**Defense**: Bob verifies Alice's swap before creating his

#### Attack 5: Front-running
**Defense**: Secret must match hash, front-runner can't compute it

---

## Time Configuration

### Recommended Timelocks

**Alice's Swap (Initiator)**: 24 hours
- Gives Alice time to claim Bob's tokens

**Bob's Swap (Participant)**: 12 hours  
- Shorter than Alice's to ensure Bob can claim after seeing secret

### Why Different Times?

```
Timeline:
0h  ───── Alice creates swap (24h lock)
1h  ───── Bob creates swap (12h lock)
2h  ───── Alice claims Bob's tokens (reveals secret)
3h  ───── Bob claims Alice's tokens (uses revealed secret)
Done! ✅

Alternative (Timeout):
0h  ───── Alice creates swap (24h lock)
1h  ───── Bob creates swap (12h lock)
...
12h ───── Bob's lock expires, Bob refunds
...
24h ───── Alice's lock expires, Alice refunds
Both refunded ✅
```

---

## Code Examples

### Complete Swap Flow (JavaScript)

```javascript
const { ethers } = require('ethers');

// Step 1: Generate secret
function generateSecret() {
    const secret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const secretHash = ethers.utils.keccak256(secret);
    return { secret, secretHash };
}

// Step 2: Create swap ID
function createSwapId(alice, bob, amount, secretHash, nonce) {
    return ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256', 'bytes32', 'uint256'],
            [alice, bob, amount, secretHash, nonce]
        )
    );
}

// Step 3: Alice initiates on Mainnet
async function aliceInitiate(contract, bob, amount, secretHash) {
    const timelock = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const nonce = Math.floor(Math.random() * 1000000);
    
    const swapId = createSwapId(
        await signer.getAddress(),
        bob,
        amount,
        secretHash,
        nonce
    );
    
    // Approve tokens
    await btcbr.approve(contract.address, amount);
    
    // Create swap
    const tx = await contract.initiate(
        swapId,
        bob,
        btcbrAddress,
        amount,
        secretHash,
        timelock
    );
    
    await tx.wait();
    return swapId;
}

// Step 4: Bob initiates on Private Chain
async function bobInitiate(contract, alice, amount, secretHash, swapId) {
    const timelock = Math.floor(Date.now() / 1000) + 43200; // 12 hours
    
    await btcbr.approve(contract.address, amount);
    
    const tx = await contract.initiate(
        swapId,  // SAME ID as Alice's
        alice,
        btcbrAddress,
        amount,
        secretHash,
        timelock
    );
    
    await tx.wait();
}

// Step 5: Alice claims with secret
async function aliceClaim(contract, swapId, secret) {
    const tx = await contract.complete(swapId, secret);
    await tx.wait();
    console.log('Alice claimed! Secret revealed:', secret);
}

// Step 6: Bob claims using revealed secret
async function bobClaim(contract, swapId, secret) {
    const tx = await contract.complete(swapId, secret);
    await tx.wait();
    console.log('Bob claimed! Swap complete!');
}

// Step 7: Refund if needed
async function refund(contract, swapId) {
    const tx = await contract.refund(swapId);
    await tx.wait();
    console.log('Refunded');
}
```

---

## Monitoring & Events

### Events Emitted

```solidity
event SwapInitiated(
    bytes32 indexed swapId,
    address indexed initiator,
    address indexed participant,
    address token,
    uint256 amount,
    bytes32 secretHash,
    uint256 timelock
);

event SwapCompleted(
    bytes32 indexed swapId,
    address indexed participant,
    bytes32 secret
);

event SwapRefunded(
    bytes32 indexed swapId,
    address indexed initiator
);
```

### Listening for Events

```javascript
// Listen for swap initiations
contract.on('SwapInitiated', (swapId, initiator, participant, token, amount, secretHash, timelock) => {
    console.log('Swap initiated:', {
        swapId,
        from: initiator,
        to: participant,
        amount: ethers.utils.formatEther(amount),
        expires: new Date(timelock * 1000)
    });
});

// Listen for completions
contract.on('SwapCompleted', (swapId, participant, secret) => {
    console.log('Swap completed:', {
        swapId,
        by: participant,
        secret  // Now public!
    });
});
```

---

## Gas Costs

### Estimated Gas Usage

| Operation | Gas Cost | USD (@ $300 BNB, 3 gwei) |
|-----------|----------|--------------------------|
| Initiate  | ~150,000 | ~$0.14                   |
| Complete  | ~100,000 | ~$0.09                   |
| Refund    | ~80,000  | ~$0.07                   |
| **Total** | ~250,000 | ~$0.23                   |

**Per Swap**: ~$0.23 total (both parties combined)

---

## Deployment

### Deploy on Both Chains

```javascript
// Deploy script
const { ethers } = require('hardhat');

async function deploy() {
    const AtomicSwap = await ethers.getContractFactory('AtomicSwap');
    
    // Deploy on Mainnet
    const mainnetSwap = await AtomicSwap.deploy();
    await mainnetSwap.deployed();
    console.log('Mainnet:', mainnetSwap.address);
    
    // Deploy on Private Chain (change network in hardhat.config)
    const privateSwap = await AtomicSwap.deploy();
    await privateSwap.deployed();
    console.log('Private:', privateSwap.address);
}

deploy();
```

---

## Advantages & Disadvantages

### ✅ Advantages

1. **Zero Trust**: No validators, relayers, or operators
2. **Maximum Decentralization**: Pure P2P
3. **Atomic Safety**: Cannot be cheated
4. **Low Cost**: Only gas fees, no bridge fees
5. **Private**: No public swap pool, direct exchange
6. **Censorship Resistant**: No entity can block swaps

### ❌ Disadvantages

1. **Requires Counterparty**: Need to find someone to swap with
2. **Slower**: Multi-step process, not instant
3. **Complex UX**: Users must understand HTLC mechanics
4. **No Pooled Liquidity**: Can't swap into a pool
5. **Manual Coordination**: Parties must communicate off-chain
6. **Limited to P2P**: Not suitable for mass retail

---

## Use Cases

### Perfect For:

✅ **OTC Trades**: Large trades between known parties  
✅ **Cross-chain arbitrage**: Traders moving between chains  
✅ **Privacy-conscious users**: No KYC, no intermediaries  
✅ **Maximum decentralization**: When trust is impossible  

### Not Ideal For:

❌ **Retail users**: Too complex for average user  
❌ **High-frequency trading**: Too slow  
❌ **Small amounts**: Gas costs may be prohibitive  
❌ **Finding counterparties**: No built-in matching  

---

## Future Enhancements

### Phase 2: Swap Marketplace

- **Order Book**: Post swap offers
- **Matching Engine**: Find counterparties
- **Reputation System**: Track successful swaps
- **Partial Fills**: Swap portions of amount

### Phase 3: Enhanced Features

- **Multi-hop Swaps**: Chain A → B → C
- **ERC20 ↔ Native**: Swap tokens for BNB
- **Batch Swaps**: Multiple swaps in one tx
- **Automated Claiming**: Bot watches and claims for you

---

## Conclusion

The **Atomic Swap** represents the purest form of **Token Consciousness Exchange**:

- No intermediaries to corrupt the transfer
- Mathematical certainty of fairness
- Direct quantum entanglement between token states
- Either both consciousnesses shift, or neither does

Perfect for those who value **decentralization above all else**! 🔐

---

## Quick Reference

### Contract Addresses
- **BSC Mainnet**: TBD
- **Private BSC**: TBD

### Key Parameters
- **Secret**: 32 bytes random
- **Swap ID**: keccak256(params)
- **Timelock**: 12-48 hours
- **Min Amount**: 1 BTCBR
- **Max Amount**: Unlimited

### Support
- **Documentation**: This file
- **GitHub**: TBD
- **Discord**: TBD
