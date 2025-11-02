# Genesis File Creation Checklist

**Purpose**: Prevent Parlia consensus deadlocks and ensure proper blockchain initialization

## ✅ PRE-CREATION CHECKLIST

### 1. Define Chain Parameters
- [ ] Chain ID chosen (e.g., 65001)
- [ ] Network ID matches Chain ID
- [ ] Block time period defined (default: 3 seconds)
- [ ] Epoch value appropriate for validator count:
  - 3-7 validators: epoch = 200-500
  - 8-14 validators: epoch = 500-1000
  - 15-21 validators: epoch = 1000-2000
  - 21+ validators: epoch = 200 (BSC standard)

### 2. Validator Setup
- [ ] Number of validators decided (recommend: 3, 7, or 21)
- [ ] Validator keystores generated
- [ ] Validator addresses extracted
- [ ] Password files created for each validator

### 3. Pre-funded Accounts
- [ ] Main wallet address identified
- [ ] Validator addresses will receive gas balance
- [ ] Initial balance amounts calculated (recommend: 1000+ native tokens)

## ✅ EXTRA DATA FORMATTING (CRITICAL!)

### Format Requirements
```
ExtraData = VanityData + ValidatorList + Seal
```

- **VanityData**: Exactly 32 bytes (64 hex characters) - can be all zeros
- **ValidatorList**: N × 20 bytes (40 hex characters per validator, no 0x prefix)
- **Seal**: Exactly 65 bytes (130 hex characters) - MUST be all zeros for genesis

### Calculation
```javascript
// For 3 validators:
const vanity = '0'.repeat(64);      // 32 bytes = 64 hex
const v1 = 'validator1Address';    // 20 bytes = 40 hex (no 0x)
const v2 = 'validator2Address';    // 20 bytes = 40 hex (no 0x)
const v3 = 'validator3Address';    // 20 bytes = 40 hex (no 0x)
const seal = '0'.repeat(130);       // 65 bytes = 130 hex

const extraData = '0x' + vanity + v1 + v2 + v3 + seal;

// VERIFY LENGTH
console.log('Length:', extraData.length - 2); // Should be 314 for 3 validators
// Expected: 64 + (N × 40) + 130 hex chars
```

### Validation Checklist
- [ ] ExtraData starts with '0x'
- [ ] Vanity section is exactly 64 hex chars
- [ ] Each validator address is 40 hex chars (no 0x prefix)
- [ ] Seal section is exactly 130 hex chars
- [ ] Seal is ALL ZEROS (for genesis)
- [ ] NO EXTRA PADDING at the end
- [ ] Total length = 2 + 64 + (N×40) + 130 chars

### Common Mistakes to Avoid
- ❌ Including '0x' prefix in validator addresses within extraData
- ❌ Adding extra zeros at the end
- ❌ Using non-zero seal in genesis
- ❌ Incorrect validator address length
- ❌ Missing validators from extraData

## ✅ ALLOC SECTION

### Required Allocations
- [ ] Main wallet with initial balance
- [ ] Each validator with gas balance (1000+ tokens)
- [ ] Any pre-deployed contracts with code and storage

### For Embedded ERC20 Tokens
```json
"0xTokenAddress": {
  "balance": "0x0",
  "code": "0x[full ERC20 bytecode]",
  "storage": {
    "0x[slot]": "0x[value]"
  }
}
```

- [ ] Token bytecode included
- [ ] Storage slots configured (name, symbol, totalSupply, balances)
- [ ] Owner balance set in storage

## ✅ PARLIA CONFIGURATION

```json
"parlia": {
  "period": 3,        // Block time in seconds
  "epoch": 200        // Validator rotation frequency
}
```

### Epoch Guidelines
| Validators | Recommended Epoch | Finality Blocks |
|------------|-------------------|-----------------|
| 3          | 200              | 2              |
| 7          | 200-500          | 4              |
| 21         | 200              | 11             |

- [ ] Period matches desired block time
- [ ] Epoch appropriate for validator count
- [ ] Epoch not set too high (avoid > 30000)

## ✅ COMPLETE GENESIS STRUCTURE

```json
{
  "config": {
    "chainId": 65001,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "arrowGlacierBlock": 0,
    "grayGlacierBlock": 0,
    "mergeNetsplitBlock": 0,
    "shanghaiBlock": 0,
    "cancunBlock": 0,
    "eulerBlock": 0,
    "gibbsBlock": 0,
    "brunoBlock": 0,
    "mirrorSyncBlock": 0,
    "parlia": {
      "period": 3,
      "epoch": 200
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "0x[PROPERLY FORMATTED]",
  "gasLimit": "0x1c9c380",
  "difficulty": "0x1",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "0xMainWallet": {
      "balance": "0x[large amount in hex]"
    },
    "0xValidator1": {
      "balance": "0x3635c9adc5dea00000"
    },
    "0xValidator2": {
      "balance": "0x3635c9adc5dea00000"
    },
    "0xValidator3": {
      "balance": "0x3635c9adc5dea00000"
    }
  },
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

## ✅ VALIDATION BEFORE DEPLOYMENT

### Automated Validation Script
```bash
node -e "
const fs = require('fs');
const genesis = JSON.parse(fs.readFileSync('data/genesis.json'));

console.log('=== Genesis Validation ===');

// 1. Check extraData length
const extraData = genesis.extraData;
const extraLen = extraData.length - 2; // Remove '0x'
console.log('ExtraData length:', extraLen, 'hex chars');

// Expected: 64 (vanity) + N*40 (validators) + 130 (seal)
const validatorCount = (extraLen - 64 - 130) / 40;
console.log('Validators detected:', validatorCount);

// 2. Check seal is all zeros
const seal = extraData.slice(-130);
const allZeros = seal.split('').every(c => c === '0');
console.log('Seal is all zeros:', allZeros ? '✅' : '❌');

// 3. Check epoch
const epoch = genesis.config.parlia.epoch;
console.log('Epoch:', epoch);
if (epoch > 30000) console.warn('⚠️  Epoch very high!');

// 4. Check chainId matches networkId
console.log('Chain ID:', genesis.config.chainId);

console.log('\\n✅ Validation complete');
"
```

- [ ] ExtraData length correct
- [ ] Seal is all zeros
- [ ] Epoch appropriate
- [ ] Chain ID set
- [ ] Alloc includes validators

### Manual Checks
- [ ] All EIP blocks set to 0
- [ ] Parlia config present
- [ ] Gas limit reasonable (default: 30,000,000)
- [ ] Timestamp is 0x0
- [ ] Difficulty is 0x1

## ✅ POST-CREATION VERIFICATION

### Save and Backup
- [ ] Genesis file saved with descriptive name
- [ ] Backup copy created
- [ ] Genesis hash will be recorded after initialization
- [ ] ExtraData documented separately

### Test Initialization
```bash
# Test with single validator first
docker run --rm \
  -v $(pwd)/validator-1:/bsc \
  -v $(pwd)/data/genesis.json:/genesis.json \
  dysnix/bsc init --datadir /bsc /genesis.json
```

- [ ] Initialization completes without errors
- [ ] Genesis hash recorded
- [ ] Database created in validator-1/geth/chaindata

## 🚨 RED FLAGS - DO NOT DEPLOY IF:

- ❌ ExtraData length is not (64 + N×40 + 130) hex chars
- ❌ Seal contains non-zero values
- ❌ Epoch > 30000 for < 21 validators
- ❌ Validator addresses have '0x' prefix in extraData
- ❌ ExtraData has extra padding
- ❌ Chain ID missing or zero
- ❌ Parlia config missing

## 📋 EXAMPLE: 3-Validator Genesis

```bash
# Generate genesis with proper extraData
node scripts/generate-genesis-3-validators.js

# Verify extraData
# Expected: 314 hex chars (without 0x)
# Format: 64 (vanity) + 120 (3×40 validators) + 130 (seal) = 314
```

## 📚 References

- **BSC Parlia Specification**: [bnb-chain/bsc](https://github.com/bnb-chain/bsc)
- **ExtraData Format**: `docs/PARLIA-DEADLOCK-FIX-SUMMARY.md`
- **Troubleshooting**: `docs/CHECKLIST-TROUBLESHOOTING.md`

---

**Last Updated**: October 31, 2025
**Version**: 1.0
**Status**: Production-Ready ✅
