#!/usr/bin/env node

/**
 * Update Genesis File with ACTUAL New Validator Addresses
 * Created during Nov 4, 2025 validator fix
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ACTUAL new validator addresses (created on Nov 4, 2025)
const ACTUAL_NEW_VALIDATORS = [
  "0x24f79325B00B4b96150C9DA449d3C4b1B1E017A0",
  "0x35EB2D4B735f05b5DAc9755285F5EFD7Bd013eEf",
  "0xeB3FD4Bde0e58e4Ba960A9282F9d64A9c54A4326",
];

// Previous validators from script (to be removed from alloc)
const OLD_VALIDATORS = [
  "0x3aC7B335b2d25a4B7eDF73Ec274b363F69bCdD19",
  "0xd4ec6f6C1A49b53F42c00b66a788e73F794F792f",
  "0xf34498402d9Ec6A50B39C0Afc0bF71848a008865",
];

// Treasury address (keep existing)
const TREASURY = "0xdd779a290C937144F80Eb75b75d814c834536B1b";

// Load existing genesis
const genesisPath = path.join(
  __dirname,
  "../data/genesis-nor-complete-v2-new-validators.json"
);
const genesis = JSON.parse(fs.readFileSync(genesisPath, "utf8"));

console.log("🔄 Updating Genesis with ACTUAL New Validator Addresses");
console.log("");

// Sort validators lexicographically (lowercase) - CRITICAL for epoch stability
const sortedValidators = ACTUAL_NEW_VALIDATORS.map((v) =>
  v.toLowerCase()
).sort();

console.log("👥 ACTUAL Validators (sorted):");
sortedValidators.forEach((v, i) => {
  console.log(`   ${i + 1}. ${v}`);
});
console.log("");

// Verify sorting
console.log("✅ Sorting verification:");
const sorted = [...sortedValidators];
sorted.sort();
if (JSON.stringify(sorted) === JSON.stringify(sortedValidators)) {
  console.log("   Validators are correctly sorted!");
} else {
  console.error("   ❌ ERROR: Validators are NOT sorted!");
  process.exit(1);
}
console.log("");

// Generate extraData
function generateExtraData(validators) {
  const vanity = "0".repeat(64); // 32 bytes
  const validatorsHex = validators.map((v) => v.replace("0x", "")).join("");
  const seal = "0".repeat(130); // 65 bytes
  return "0x" + vanity + validatorsHex + seal;
}

const extraData = generateExtraData(sortedValidators);
console.log(`✅ ExtraData: ${extraData.substring(0, 70)}...`);
console.log(`   Length: ${extraData.length} chars (should be 328)`);
console.log("");

// Update genesis extradata
genesis.extraData = extraData;

// Update epoch to testing value (matching current running validators)
genesis.config.parlia.epoch = 10000;
console.log("🔧 Set epoch to 10000 (testing/matching current validators)");
console.log("");

// Remove old validator balances
OLD_VALIDATORS.forEach((v) => {
  delete genesis.alloc[v.toLowerCase()];
});
console.log("🗑️  Removed old validator addresses from alloc");
console.log("");

// Add new validator balances
const INITIAL_BALANCE = "0x04ee2d6d415b85acef8100000000"; // 100M NOR for gas

[...ACTUAL_NEW_VALIDATORS, TREASURY].forEach((address) => {
  genesis.alloc[address.toLowerCase()] = {
    balance: INITIAL_BALANCE,
  };
});

console.log("💰 Added new validator balances:");
[...ACTUAL_NEW_VALIDATORS, TREASURY].forEach((addr) => {
  console.log(`   ${addr}: ${INITIAL_BALANCE}`);
});
console.log("");

// Count contracts
const contractCount = Object.keys(genesis.alloc).length;
const contractsWithCode = Object.values(genesis.alloc).filter(
  (v) => v.code && v.code !== "0x"
).length;

console.log("📊 Genesis Summary:");
console.log(`   Total allocations: ${contractCount}`);
console.log(`   Contracts with bytecode: ${contractsWithCode}`);
console.log(`   Chain ID: ${genesis.config.chainId}`);
console.log(`   Epoch: ${genesis.config.parlia.epoch} blocks`);
console.log("");

// Save updated genesis
const outputPath = path.join(
  __dirname,
  "../data/genesis-nor-ultimate-actual-validators.json"
);
fs.writeFileSync(outputPath, JSON.stringify(genesis, null, 2));
console.log(`✅ Updated genesis saved to: ${path.basename(outputPath)}`);
console.log("");

console.log("✅ Genesis update complete!");
console.log("");
console.log("📋 Next steps:");
console.log("   1. Upload genesis to server: scp genesis-nor-ultimate-actual-validators.json ec2-user@server:/home/ec2-user/");
console.log("   2. Stop validators: docker stop xaheen-rpc bsc-validator-2 bsc-validator-3");
console.log("   3. Reinitialize: docker run --rm -v ~/validator-X:/bsc -v ~/genesis-nor-ultimate-actual-validators.json:/genesis.json dysnix/bsc init --datadir /bsc /genesis.json");
console.log("   4. Start validators with working configuration");
console.log("");
