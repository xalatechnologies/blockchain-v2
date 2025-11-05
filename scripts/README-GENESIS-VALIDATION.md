# Genesis Validation Script

## Quick Start

```bash
# Validate any genesis file
node scripts/validate-genesis-epoch-safety.js data/genesis.json

# Validate specific file
node scripts/validate-genesis-epoch-safety.js data/genesis-actual-validators-sorted.json
```

## What It Checks

✅ Validators are lowercase
✅ Validators are lexicographically sorted
✅ Epoch configuration exists

## Example Output

### ✅ Valid Genesis

```
🔍 GENESIS EPOCH SAFETY VALIDATOR
======================================================================

📁 Reading: data/genesis-actual-validators-sorted.json
⚙️  Epoch length: 10,000 blocks

👥 Found 3 validators in genesis:
  1. ✅ 0x24f79325b00b4b96150c9da449d3c4b1b1e017a0
  2. ✅ 0x35eb2d4b735f05b5dac9755285f5efd7bd013eef
  3. ✅ 0xeb3fd4bde0e58e4ba960a9282f9d64a9c54a4326

🔤 Checking lowercase format...
✅ PASS: All validators are lowercase

📊 Checking lexicographic sorting...
✅ PASS: Validators are correctly sorted

======================================================================
✅ GENESIS IS EPOCH-SAFE!
======================================================================

✨ This genesis will successfully cross ALL epoch boundaries:
   Block 10,000, 20,000, 30,000, 40,000, etc.
```

### ❌ Invalid Genesis

```
🔍 GENESIS EPOCH SAFETY VALIDATOR
======================================================================

📁 Reading: data/genesis-bad.json
⚙️  Epoch length: 10,000 blocks

👥 Found 3 validators in genesis:
  1. ❌ 0xBB64F4050fC21A2eC3506245A1Ad63cB0256b6dE
  2. ✅ 0x689cf2c189781d9bb6859a830acbf64044e4432f
  3. ✅ 0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a

🔤 Checking lowercase format...
❌ FAIL: Some validators use uppercase/mixed case
   Parlia consensus requires lowercase addresses

EXIT CODE: 1
```

## Integration

### Pre-Deployment Hook

```bash
#!/bin/bash
# scripts/deploy-genesis.sh

# Validate before deployment
node scripts/validate-genesis-epoch-safety.js $GENESIS_FILE || exit 1

# If validation passes, proceed with deployment
echo "✅ Genesis validated, proceeding with deployment..."
```

### CI/CD Integration

```yaml
# .github/workflows/validate.yml
- name: Validate Genesis
  run: node scripts/validate-genesis-epoch-safety.js data/genesis.json
```

## Why This Matters

**Problem**: Blockchain deadlocks at epoch boundaries if validators aren't sorted

**Solution**: This script catches the error BEFORE deployment

**Impact**: Prevents production outages requiring full chain resets

## See Also

- [EPOCH_FIX_PERMANENT.md](../docs/EPOCH_FIX_PERMANENT.md) - Complete documentation
- [Parlia Consensus Spec](https://docs.bnbchain.org/docs/learn/consensus) - BSC consensus details
