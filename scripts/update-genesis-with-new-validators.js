#!/usr/bin/env node

/**
 * Update Genesis File with New Validator Addresses
 * Based on the successful fix pattern from previous deployment
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// New validator addresses (from created accounts)
const NEW_VALIDATORS = [
  "0x3aC7B335b2d25a4B7eDF73Ec274b363F69bCdD19",
  "0xd4ec6f6C1A49b53F42c00b66a788e73F794F792f",
  "0xf34498402d9Ec6A50B39C0Afc0bF71848a008865",
];

// Treasury address (keep existing)
const TREASURY = "0xdd779a290C937144F80Eb75b75d814c834536B1b";

// Load existing genesis
const genesisPath = path.join(__dirname, "../data/genesis-nor-complete-v2.json");
const genesis = JSON.parse(fs.readFileSync(genesisPath, "utf8"));

console.log("🔄 Updating Genesis with New Validator Addresses");
console.log("");

// Sort validators lexicographically (lowercase)
const sortedValidators = NEW_VALIDATORS
  .map((v) => v.toLowerCase())
  .sort();

console.log("👥 Validators (sorted):");
sortedValidators.forEach((v, i) => {
  console.log(`   ${i + 1}. ${v}`);
});
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
console.log("");

// Update genesis
genesis.extradata = extraData;

// Remove old validator balances
const oldValidators = [
  "0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a",
  "0x689cf2c189781d9bb6859a830acbf64044e4432f",
  "0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de",
];

oldValidators.forEach((v) => {
  delete genesis.alloc[v.toLowerCase()];
});

// Add new validator balances
const INITIAL_BALANCE = "0x04ee2d6d415b85acef8100000000"; // Same as before

[...NEW_VALIDATORS, TREASURY].forEach((address) => {
  genesis.alloc[address.toLowerCase()] = {
    balance: INITIAL_BALANCE,
  };
});

console.log("💰 Updated validator balances:");
[...NEW_VALIDATORS, TREASURY].forEach((addr) => {
  console.log(`   ${addr}: ${INITIAL_BALANCE}`);
});
console.log("");

// Save updated genesis
const outputPath = path.join(__dirname, "../data/genesis-nor-complete-v2-new-validators.json");
fs.writeFileSync(outputPath, JSON.stringify(genesis, null, 2));
console.log(`✅ Updated genesis saved to: ${path.basename(outputPath)}`);
console.log("");

console.log("✅ Genesis update complete!");

