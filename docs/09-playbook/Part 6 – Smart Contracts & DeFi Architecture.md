# Part 6 – Smart Contracts & DeFi Architecture

**Nor Chain Ecosystem - Technical Implementation Guide**  
**Version**: v3.1-2025-11-02  
**Part of**: Nor Chain Playbook v3 - Public Master Edition

---

## Table of Contents

1. [Token Economics & NOR Contract](#1-token-economics--nor-contract)
2. [NorSwap DEX Architecture](#2-norswap-dex-architecture)
3. [Liquidity Pool Implementation](#3-liquidity-pool-implementation)
4. [Bridge Contracts](#4-bridge-contracts)
5. [Stablecoin Implementations](#5-stablecoin-implementations)
6. [Governance & DAO](#6-governance--dao)
7. [Nor Funds (Halal Investment)](#7-nor-funds-halal-investment)
8. [Security & Auditing](#8-security--auditing)

---

## 1. Token Economics & NOR Contract

### NOR Token Specification

**Contract**: `/contracts/tokens/NOR.sol`

```solidity
// Nor Token (NOR) - Native utility token
- Symbol: NOR (نور - "Light")
- Total Supply: 21,000,000,000 NOR (21 billion)
- Decimals: 24 (ultra-high precision)
- Standard: ERC-20 compatible
- Features: Burnable, Pausable, Access Control, Vesting
```

### Token Distribution

| Category | Allocation | Vesting | Use |
|----------|-----------|---------|-----|
| **Public Sale & Liquidity** | 30% (6.3B NOR) | Unlocked | DEX liquidity, public sale |
| **Treasury & Grants** | 25% (5.25B NOR) | 24 months linear | Development, grants, partnerships |
| **Team & Advisors** | 15% (3.15B NOR) | 18mo cliff + 24mo linear | Core team, advisors |
| **Reserve** | 20% (4.2B NOR) | 12 months locked | Strategic reserve, market making |
| **Charity & Zakat** | 5% (1.05B NOR) | Unlocked | Charity fund, zakat distribution |
| **Validators & Rewards** | 5% (1.05B NOR) | Dynamic | Validator rewards, staking |

### NOR Use Cases

1. **Gas Fees** - All transactions on Nor Chain
2. **Staking** - Validator staking and delegated staking
3. **Governance** - Voting on protocol changes and proposals
4. **Liquidity Provision** - DEX LP token rewards
5. **Fund Subscriptions** - Access to Nor Funds halal investment products
6. **Cross-Chain Fees** - Bridge transaction fees
7. **NFT Marketplace** - Trading fees and royalties

### Vesting Implementation

```solidity
struct VestingSchedule {
    uint256 totalAmount;        // Total tokens to vest
    uint256 releasedAmount;     // Already released tokens
    uint256 startTime;          // Vesting start timestamp
    uint256 cliffDuration;      // Cliff period in seconds
    uint256 vestingDuration;    // Total vesting duration
}

// Create vesting schedule (admin only)
function createVestingSchedule(
    address beneficiary,
    uint256 totalAmount,
    uint256 cliffDuration,
    uint256 vestingDuration
) external onlyRole(DEFAULT_ADMIN_ROLE);

// Release vested tokens (beneficiary calls)
function releaseVestedTokens() external;

// Check releasable amount
function releasableAmount(address beneficiary) external view returns (uint256);
```

**Example Vesting Scenarios**:

```javascript
// Team member: 18-month cliff, 24-month vesting
createVestingSchedule(
  teamMember,
  1_000_000 * 10**24,  // 1M NOR
  18 * 30 * 24 * 3600,  // 18 months cliff
  (18 + 24) * 30 * 24 * 3600  // Total 42 months
);

// Advisor: 12-month cliff, 18-month vesting
createVestingSchedule(
  advisor,
  500_000 * 10**24,  // 500K NOR
  12 * 30 * 24 * 3600,  // 12 months cliff
  (12 + 18) * 30 * 24 * 3600  // Total 30 months
);
```

---

## 2. NorSwap DEX Architecture

### Overview

NorSwap is the native decentralized exchange (DEX) on Nor Chain, implementing Uniswap V2-style Automated Market Maker (AMM) with Shariah-compliant modifications.

### Core Contracts

**1. NorSwapFactory**
```solidity
Contract: /contracts/dex/NorSwapFactory.sol

Purpose: Creates and manages trading pairs
- createPair(tokenA, tokenB): Create new trading pair
- getPair(tokenA, tokenB): Get pair address
- allPairs: Array of all pairs
- feeTo: Fee recipient address
- feeToSetter: Fee configuration authority
```

**2. NorSwapPair**
```solidity
Contract: /contracts/dex/NorSwapPair.sol

Purpose: Individual trading pair (LP token)
- Constant Product Formula: x * y = k
- LP Token: ERC-20 representing liquidity share
- swap(): Execute token swaps
- mint(): Add liquidity
- burn(): Remove liquidity
- price0CumulativeLast: TWAP oracle accumulator
- price1CumulativeLast: TWAP oracle accumulator
```

**3. NorSwapRouter**
```solidity
Contract: /contracts/dex/NorSwapRouter.sol

Purpose: User-facing interface for swaps and liquidity

// Add liquidity
addLiquidity(
  tokenA, tokenB,
  amountADesired, amountBDesired,
  amountAMin, amountBMin,
  to, deadline
)

// Remove liquidity
removeLiquidity(
  tokenA, tokenB,
  liquidity,
  amountAMin, amountBMin,
  to, deadline
)

// Swap exact tokens for tokens
swapExactTokensForTokens(
  amountIn,
  amountOutMin,
  path,
  to,
  deadline
)

// Swap tokens for exact tokens
swapTokensForExactTokens(
  amountOut,
  amountInMax,
  path,
  to,
  deadline
)
```

### Fee Structure

| Transaction Type | Fee | Distribution |
|-----------------|-----|--------------|
| **Swap Fees** | 0.30% | 0.25% to LPs + 0.05% to protocol |
| **Protocol Fee** | 0.05% | NOR buyback & burn |
| **Bridge Fees** | 0.1-0.2% | Validator rewards + protocol |

### Liquidity Mining

```solidity
Contract: /contracts/tokenomics/LiquidityMining.sol

// Stake LP tokens
stake(uint256 amount) external;

// Unstake LP tokens
unstake(uint256 amount) external;

// Claim NOR rewards
claimRewards() external;

// Reward calculation
rewardPerBlock = totalRewards / totalBlocks;
userReward = (userStake / totalStake) * rewardPerBlock * blocksPassed;
```

**Initial Liquidity Pools**:

| Pair | Initial Liquidity | APY Target |
|------|------------------|------------|
| NOR/USDT | $500,000 | 80-120% |
| NOR/BNB | $300,000 | 60-100% |
| Dirhamat/USDT | $200,000 | 20-40% |
| NOR/Dirhamat | $150,000 | 40-60% |

---

## 3. Liquidity Pool Implementation

### Constant Product AMM

**Formula**: `x * y = k`

Where:
- `x` = Reserve of Token A
- `y` = Reserve of Token B
- `k` = Constant product

**Price Calculation**:
```
Price of Token A = y / x (in terms of Token B)
Price of Token B = x / y (in terms of Token A)
```

### Adding Liquidity

```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
    // Calculate optimal amounts
    (amountA, amountB) = _calculateOptimalAmounts(
        tokenA, tokenB,
        amountADesired, amountBDesired,
        amountAMin, amountBMin
    );

    // Transfer tokens to pair
    TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
    TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);

    // Mint LP tokens
    liquidity = IPair(pair).mint(to);
}
```

### Removing Liquidity

```solidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB) {
    // Transfer LP tokens to pair
    IPair(pair).transferFrom(msg.sender, pair, liquidity);

    // Burn LP tokens and get tokens back
    (amountA, amountB) = IPair(pair).burn(to);

    // Ensure minimum amounts met
    require(amountA >= amountAMin, "Insufficient A amount");
    require(amountB >= amountBMin, "Insufficient B amount");
}
```

### Swap Execution

```solidity
function swap(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external {
    // Calculate amounts for each hop in path
    uint256[] memory amounts = getAmountsOut(amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output");

    // Execute swaps
    _swap(amounts, path, to);
}

function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
) public pure returns (uint256 amountOut) {
    uint256 amountInWithFee = amountIn * 997; // 0.3% fee
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = (reserveIn * 1000) + amountInWithFee;
    amountOut = numerator / denominator;
}
```

### Price Oracle (TWAP)

```solidity
// Time-Weighted Average Price implementation
uint256 public price0CumulativeLast;
uint256 public price1CumulativeLast;
uint256 public blockTimestampLast;

function _update(uint112 balance0, uint112 balance1) private {
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast;

    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
        price0CumulativeLast += uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
        price1CumulativeLast += uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
    }

    blockTimestampLast = blockTimestamp;
}
```

---

## 4. Bridge Contracts

### Bridge Architecture Overview

Nor Chain implements a **multi-layer bridge system** for cross-chain asset transfers.

### Bridge Types

| Bridge Type | Chains | Assets | Status |
|------------|--------|--------|--------|
| **Lock & Mint** | BSC ↔ Nor | BTCBR, BNB, USDT, ETH | ✅ Production |
| **Atomic Swap** | BSC ↔ Nor | Any ERC-20 | ✅ Production |
| **Liquidity Pool** | BSC ↔ Nor | Major tokens | ✅ Production |
| **NFT Bridge** | BSC ↔ Nor | ERC-721 | ✅ Production |
| **Optimistic** | Ethereum ↔ Nor | Any ERC-20 | 🔄 Development |
| **ZK Bridge** | Polygon ↔ Nor | Any ERC-20 | 🔄 Development |

### Lock & Mint Bridge Implementation

**Mainnet Side** (`BTCBRBridgeMainnet.sol`):
```solidity
// Lock tokens on BSC mainnet
function depositFor(address recipient, uint256 amount) external {
    require(amount >= MIN_TRANSFER, "Amount too small");
    require(amount <= MAX_TRANSFER, "Amount too large");

    // Transfer tokens to bridge
    IERC20(btcbrToken).transferFrom(msg.sender, address(this), amount);

    // Calculate fee
    uint256 fee = (amount * FEE_PERCENT) / 10000;
    uint256 netAmount = amount - fee;

    // Track daily limit
    _checkDailyLimit(msg.sender, amount);

    // Emit deposit event for validators
    emit Deposit(msg.sender, recipient, netAmount, depositNonce++);
}

// Withdraw tokens (after validators confirm)
function withdraw(
    address recipient,
    uint256 amount,
    bytes[] calldata signatures
) external {
    require(_verifySignatures(signatures, recipient, amount), "Invalid signatures");
    IERC20(btcbrToken).transfer(recipient, amount);

    emit Withdrawal(recipient, amount);
}
```

**Private Chain Side** (`BTCBRBridgePrivate.sol`):
```solidity
// Mint wrapped tokens on Nor Chain
function mint(
    address recipient,
    uint256 amount,
    bytes[] calldata signatures
) external {
    require(_verifySignatures(signatures, recipient, amount), "Invalid signatures");
    IBTCBR(btcbrToken).mint(recipient, amount);

    emit Minted(recipient, amount);
}

// Burn wrapped tokens (for withdrawal to mainnet)
function burn(uint256 amount) external {
    IBTCBR(btcbrToken).burn(msg.sender, amount);

    emit BurnRequested(msg.sender, amount, burnNonce++);
}
```

### Multi-Signature Validation

```solidity
// Validator management
mapping(address => bool) public validators;
uint256 public requiredSignatures = 2; // 2 of 3

function _verifySignatures(
    bytes[] calldata signatures,
    address recipient,
    uint256 amount
) internal view returns (bool) {
    require(signatures.length >= requiredSignatures, "Not enough signatures");

    bytes32 messageHash = keccak256(abi.encodePacked(recipient, amount, nonce));
    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

    address[] memory signers = new address[](signatures.length);

    for (uint i = 0; i < signatures.length; i++) {
        address signer = ethSignedMessageHash.recover(signatures[i]);
        require(validators[signer], "Invalid validator");
        require(!_isDuplicate(signers, signer), "Duplicate signature");

        signers[i] = signer;
    }

    return true;
}
```

### Transfer Limits & Security

```solidity
// Transfer limits
uint256 public constant MIN_TRANSFER = 100 * 10**18;      // 100 BTCBR
uint256 public constant MAX_TRANSFER = 100_000 * 10**18;  // 100,000 BTCBR

// Daily limits per address
mapping(address => DailyLimit) public dailyLimits;

struct DailyLimit {
    uint256 amount;
    uint256 lastReset;
}

uint256 public constant DAILY_LIMIT = 500_000 * 10**18;  // 500K BTCBR

function _checkDailyLimit(address user, uint256 amount) internal {
    DailyLimit storage limit = dailyLimits[user];

    // Reset if new day
    if (block.timestamp >= limit.lastReset + 1 days) {
        limit.amount = 0;
        limit.lastReset = block.timestamp;
    }

    require(limit.amount + amount <= DAILY_LIMIT, "Daily limit exceeded");
    limit.amount += amount;
}
```

---

## 5. Stablecoin Implementations

### Dirhamat (AED/Gold-Backed)

**Contract**: `/contracts/stablecoins/Dirhamat.sol`

```solidity
// Dirhamat - AED and Gold-backed stablecoin
- Peg: 1 Dirhamat = 1 AED + 0.1g gold backing
- Minting: Requires proof of reserve (AED + gold)
- Burning: Redeemable for AED or gold
- Oracle: Chainlink price feeds for AED/USD and Gold/USD
- Auditing: Monthly reserve audits published on-chain
```

**Reserve Management**:
```solidity
struct Reserve {
    uint256 aedBalance;      // AED in reserve
    uint256 goldWeight;      // Gold in grams
    uint256 lastAudit;       // Timestamp of last audit
    bytes32 auditHash;       // IPFS hash of audit report
}

Reserve public reserves;

function mint(address to, uint256 amount) external onlyMinter {
    require(_isFullyBacked(amount), "Insufficient reserves");
    _mint(to, amount);
}

function _isFullyBacked(uint256 mintAmount) internal view returns (bool) {
    uint256 requiredAED = (totalSupply() + mintAmount) * 1e18;
    uint256 requiredGold = (totalSupply() + mintAmount) * 100000000; // 0.1g in grams * 1e8

    return reserves.aedBalance >= requiredAED &&
           reserves.goldWeight >= requiredGold;
}
```

### Digital KES (Kenyan Shilling)

**Contract**: `/contracts/stablecoins/DigitalKES.sol`

```solidity
// Digital KES - Kenyan Shilling stablecoin
- Peg: 1 DKES = 1 KES
- Backing: KES reserves with Kenyan banks
- Regulation: CBK sandbox compliance
- Redemption: Bank transfer to Kenyan accounts
```

---

## 6. Governance & DAO

### Governance Architecture

**Three-Layer DAO System**:

1. **Council DAO** - 5 institutional signers
2. **Validator DAO** - All validators + delegators
3. **Community DAO** - NOR token holders (≥10,000 NOR staked)

**Governance Contract**: `/contracts/governance/NorGovernance.sol`

```solidity
contract NorGovernance {
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }

    // Voting parameters
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 3 days;
    uint256 public proposalThreshold = 100_000 * 10**24; // 100K NOR
    uint256 public quorumVotes = 4_000_000 * 10**24;     // 4M NOR (0.019% of supply)

    // Create proposal
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);

    // Cast vote
    function castVote(uint256 proposalId, bool support) external;

    // Execute proposal (after passing)
    function execute(uint256 proposalId) external;
}
```

---

## 7. Nor Funds (Halal Investment)

### Fund Architecture

**Contract**: `/contracts/funds/NorFund.sol`

```solidity
// Shariah-compliant investment fund
contract NorFund {
    // Fund configuration
    string public name;
    address public manager;
    address public shariahBoard;
    uint256 public managementFee;  // Annual fee in basis points
    uint256 public minimumInvestment;

    // NAV tracking
    uint256 public netAssetValue;
    uint256 public totalShares;

    // Subscribe to fund
    function subscribe(uint256 amount) external {
        require(amount >= minimumInvestment, "Below minimum");
        require(_isShariahCompliant(msg.sender), "Not Shariah compliant");

        uint256 shares = (amount * totalShares) / netAssetValue;
        _mint(msg.sender, shares);

        emit Subscribed(msg.sender, amount, shares);
    }

    // Redeem from fund
    function redeem(uint256 shares) external {
        uint256 redemptionAmount = (shares * netAssetValue) / totalShares;
        _burn(msg.sender, shares);

        emit Redeemed(msg.sender, redemptionAmount, shares);
    }

    // Update NAV (oracle-driven)
    function updateNAV(uint256 newNAV, bytes calldata proof) external onlyOracle {
        require(_verifyNAVProof(proof), "Invalid NAV proof");
        netAssetValue = newNAV;

        emit NAVUpdated(newNAV, block.timestamp);
    }
}
```

### Fund Types

| Fund | Structure | Assets | Returns |
|------|-----------|--------|---------|
| **Gold Savings** | Murabaha/Wakalah | Vaulted gold, Dirhamat | Gold appreciation + trade profit |
| **Sukuk Income** | Mudarabah | Investment-grade sukuk | Rental/lease income |
| **Halal Equity** | Wakalah | AAOIFI-screened stocks | Dividends + capital gains |
| **Real Estate Ijarah** | Musharakah/Ijarah | Income properties | Rent distribution |

---

## 8. Security & Auditing

### Security Best Practices

**1. Access Control**
```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
```

**2. Reentrancy Protection**
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function withdraw() external nonReentrant {
    // Safe withdrawal logic
}
```

**3. Emergency Pause**
```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

function pause() external onlyRole(PAUSER_ROLE) {
    _pause();
}
```

**4. Upgradeability** (Transparent Proxy Pattern)
```solidity
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
```

### Audit Checklist

- [ ] Reentrancy attacks prevention
- [ ] Integer overflow/underflow protection (Solidity 0.8+)
- [ ] Access control properly implemented
- [ ] Emergency pause mechanism functional
- [ ] Oracle price manipulation resistance
- [ ] Front-running mitigation (deadline parameters)
- [ ] Flash loan attack vectors addressed
- [ ] Gas optimization (loops, storage vs memory)
- [ ] Event emission for all state changes
- [ ] Input validation on all public functions

---

## Contract Deployment Addresses (Nor Chain Mainnet - Chain ID 65001)

### Core Infrastructure
```
NOR Token (Native):        Native (gas token)
WNOR (Wrapped NOR):        0x26c0eaF731885b14c031cc50dB79b36458E0b355
NorSwap Factory:          0xBE254176B4f13b02f367a9feCE599ee8887E2D34
NorSwap Router:           0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916
```

### External Tokens (Bridged)
```
USDT:                      0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf
BNB:                       0xa4cBBcbd8146482E5618c833faFf5fA4C29B78a6
ETH:                       0xc6E0cD72723C9409ba221197e06830EB928a7A76
```

### Tokenomics & Governance
```
NOR Staking:               0xbA554577De2d3eE1AdE77737Dc32717527E0cA86
Weekly Buyback:            0xa8ee927a73BED490A5F1CE36A788A7DF1E556542
Burn Mechanism:            0xA609ad73915f72a824b1bFEACd5cA3027490d5b9
```

### Bridge Contracts
```
BTCBR Bridge (BSC):        0x6C46422A0f7dbbAD9BEC3BbBC1189bfAf9794B05
BTCBR Bridge (Nor):       TBD
NFT Bridge:                TBD
Atomic Swap:               TBD
```

### Stablecoins (In Development)
```
Dirhamat:                  TBD
Digital KES:               TBD
```

### Governance & Funds
```
Nor Governance DAO:       TBD
Nor Funds Factory:        TBD
```

### Treasury
```
Treasury Multisig:         0xdD779a290C937144F80Eb75b75d814c834536B1b
 - Native NOR Balance:     ~20.4 billion NOR
 - WNOR Balance:           600 million WNOR
```

### Liquidity Pools (Initial)
```
NOR/USDT Pool:             500M NOR + 1,200 USDT
NOR/BNB Pool:              50M NOR + 100 BNB
NOR/ETH Pool:              50M NOR + 2 ETH
```

**Deployment Status**: Fully Operational (as of Block ~2200+, Oct 31, 2025)  
**Network**: Nor Chain Mainnet  
**Chain ID**: 65001 (0xFDE9)  
**RPC**: https://rpc.nor.org

---

## Development & Testing

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
npx hardhat test --network hardhat
```

### Deploy to Nor Chain
```bash
npx hardhat run scripts/deploy-nor-token.js --network norchain
npx hardhat run scripts/deploy-norswap.js --network norchain
```

### Verify Contracts
```bash
npx hardhat verify --network norchain DEPLOYED_ADDRESS "Constructor Arg1" "Arg2"
```

---

## Summary

Nor Chain's smart contract ecosystem provides:

✅ **Native NOR Token** - 21B supply with vesting and governance
✅ **NorSwap DEX** - Uniswap V2-style AMM with 0.3% fees
✅ **Multi-Chain Bridges** - Lock/Mint, Atomic Swap, Liquidity Pool
✅ **Stablecoins** - Dirhamat (AED+Gold), Digital KES
✅ **Governance** - Three-layer DAO system
✅ **Halal Funds** - Shariah-compliant investment products
✅ **Security** - OpenZeppelin standards, audited contracts

🌙 **Nor Chain - Illuminating DeFi with Light and Trust** 🌙
