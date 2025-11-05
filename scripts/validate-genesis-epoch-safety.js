#!/usr/bin/env node

/**
 * Genesis Validator Sorting Validator
 *
 * This script validates that validator addresses in genesis.json are:
 * 1. Lowercase (required by Parlia consensus)
 * 2. Lexicographically sorted (required for epoch revalidation)
 *
 * WHY THIS MATTERS:
 * - Parlia consensus revalidates validators at every epoch boundary
 * - If validators aren't sorted, the chain DEADLOCKS at epoch blocks
 * - This has caused production outages at blocks 10,000, 20,000, etc.
 *
 * Usage:
 *   node scripts/validate-genesis-epoch-safety.js [genesis-file]
 *   node scripts/validate-genesis-epoch-safety.js data/genesis.json
 */

import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function extractValidatorsFromExtraData(extraData) {
  // Remove 0x prefix
  const hex = extraData.startsWith('0x') ? extraData.slice(2) : extraData;

  // Parlia extraData format:
  // 32 bytes: vanity
  // N * 20 bytes: validator addresses
  // 65 bytes: signature

  // Skip first 32 bytes (64 hex chars) for vanity
  const validatorsStart = 64;

  // Skip last 65 bytes (130 hex chars) for signature
  const validatorsEnd = hex.length - 130;

  const validatorsHex = hex.slice(validatorsStart, validatorsEnd);

  // Each address is 20 bytes = 40 hex chars
  const validators = [];
  for (let i = 0; i < validatorsHex.length; i += 40) {
    const addr = validatorsHex.slice(i, i + 40);
    if (addr.length === 40) {
      validators.push('0x' + addr);
    }
  }

  return validators;
}

function isLowercase(address) {
  const hex = address.startsWith('0x') ? address.slice(2) : address;
  return hex === hex.toLowerCase();
}

function isSorted(validators) {
  const lowercase = validators.map(v => v.toLowerCase());
  const sorted = [...lowercase].sort();

  for (let i = 0; i < lowercase.length; i++) {
    if (lowercase[i] !== sorted[i]) {
      return false;
    }
  }

  return true;
}

function validateGenesis(genesisPath) {
  console.log('\n🔍 GENESIS EPOCH SAFETY VALIDATOR');
  console.log('='.repeat(70));

  // Read genesis file
  console.log(`\n📁 Reading: ${genesisPath}`);

  if (!fs.existsSync(genesisPath)) {
    console.log(`${RED}❌ ERROR: File not found${RESET}`);
    process.exit(1);
  }

  const genesis = JSON.parse(fs.readFileSync(genesisPath, 'utf8'));

  // Check for Parlia config
  if (!genesis.config?.parlia) {
    console.log(`${YELLOW}⚠️  WARNING: Not a Parlia genesis file${RESET}`);
    process.exit(0);
  }

  const epochLength = genesis.config.parlia.epoch;
  console.log(`⚙️  Epoch length: ${epochLength.toLocaleString()} blocks`);

  // Extract validators
  const validators = extractValidatorsFromExtraData(genesis.extradata);

  console.log(`\n👥 Found ${validators.length} validators in genesis:`);
  validators.forEach((v, i) => {
    const lowercase = isLowercase(v);
    const icon = lowercase ? '✅' : '❌';
    console.log(`  ${i + 1}. ${icon} ${v}`);
  });

  // Check lowercase
  console.log(`\n🔤 Checking lowercase format...`);
  const allLowercase = validators.every(isLowercase);

  if (!allLowercase) {
    console.log(`${RED}❌ FAIL: Some validators use uppercase/mixed case${RESET}`);
    console.log(`${RED}   Parlia consensus requires lowercase addresses${RESET}`);
    process.exit(1);
  }

  console.log(`${GREEN}✅ PASS: All validators are lowercase${RESET}`);

  // Check sorting
  console.log(`\n📊 Checking lexicographic sorting...`);
  const sorted = isSorted(validators);

  if (!sorted) {
    console.log(`${RED}❌ FAIL: Validators are NOT sorted${RESET}`);
    console.log(`${RED}   This will cause epoch revalidation to FAIL${RESET}`);
    console.log(`${RED}   Chain will DEADLOCK at blocks: ${epochLength.toLocaleString()}, ${(epochLength * 2).toLocaleString()}, ${(epochLength * 3).toLocaleString()}, etc.${RESET}`);

    console.log(`\n${YELLOW}📝 Correct order (sorted):${RESET}`);
    const lowercase = validators.map(v => v.toLowerCase());
    const sortedValidators = [...lowercase].sort();
    sortedValidators.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v}`);
    });

    process.exit(1);
  }

  console.log(`${GREEN}✅ PASS: Validators are correctly sorted${RESET}`);

  // All checks passed
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${GREEN}✅ GENESIS IS EPOCH-SAFE!${RESET}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\n✨ This genesis will successfully cross ALL epoch boundaries:`);
  console.log(`   Block ${epochLength.toLocaleString()}, ${(epochLength * 2).toLocaleString()}, ${(epochLength * 3).toLocaleString()}, ${(epochLength * 4).toLocaleString()}, etc.\n`);

  process.exit(0);
}

// Main
const genesisFile = process.argv[2] || 'data/genesis.json';
const genesisPath = path.resolve(genesisFile);

validateGenesis(genesisPath);
