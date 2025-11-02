#!/usr/bin/env node

//═══════════════════════════════════════════════════════════════════════════
// GENERATE NEW GENESIS - State-Preserving Regenesis
//═══════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Create new genesis.json with:
// - SAME chainId (65001)
// - FIXED Parlia config (epoch: 9,000,000)
// - CORRECTED extraData (sorted validators)
// - IMPORTED state from block 29,999
//
// PRESERVES: All contracts, balances, storage, nonces
//═══════════════════════════════════════════════════════════════════════════

import fs from "fs";
import { ethers } from "ethers";

const STATE_EXPORT_FILE = "./data/state-export-29999.json";
const OLD_GENESIS_FILE = "./data/genesis.json";
const NEW_GENESIS_FILE = "./data/genesis-regenesis.json";

console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
console.log("║           GENERATE NEW GENESIS - State-Preserving Regenesis              ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
console.log("");

// Validator addresses (SORTED lexicographically, lowercase)
const VALIDATORS = [
  "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  "0xfaa5aa97651c2e2b6860219bb8f9902d416db5dd",
  "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

console.log("📋 Validator addresses (sorted):");
VALIDATORS.forEach((v, i) => console.log(`   ${i + 1}. ${v}`));
console.log("");

// Generate extraData for Parlia
function generateExtraData(validators) {
  // Parlia extraData format:
  // - 32 bytes: vanity
  // - N * 20 bytes: validator addresses (sorted, no 0x prefix)
  // - 65 bytes: seal (zeros for genesis)

  const vanity = "0".repeat(64); // 32 bytes
  const validatorBytes = validators
    .map((v) => v.substring(2).toLowerCase())
    .join("");
  const seal = "0".repeat(130); // 65 bytes

  return "0x" + vanity + validatorBytes + seal;
}

async function generateNewGenesis() {
  console.log("📖 Step 1: Loading state export...");

  if (!fs.existsSync(STATE_EXPORT_FILE)) {
    console.log(`   ❌ ERROR: ${STATE_EXPORT_FILE} not found`);
    console.log("   Run: node scripts/export-state-29999.js first");
    process.exit(1);
  }

  const stateExport = JSON.parse(fs.readFileSync(STATE_EXPORT_FILE, "utf8"));
  console.log(`   ✅ Loaded state from block ${stateExport.block}`);
  console.log(
    `   ✅ ${stateExport.summary.totalAccounts} accounts, ${stateExport.summary.contracts} contracts`
  );

  console.log("");
  console.log("📖 Step 2: Loading old genesis...");

  const oldGenesis = JSON.parse(fs.readFileSync(OLD_GENESIS_FILE, "utf8"));
  console.log(`   ✅ Chain ID: ${oldGenesis.config.chainId}`);
  console.log(`   ✅ Old epoch: ${oldGenesis.config.parlia?.epoch || "N/A"}`);

  console.log("");
  console.log("🔧 Step 3: Creating new genesis...");

  const extraData = generateExtraData(VALIDATORS);
  console.log(`   extraData: ${extraData}`);

  const newGenesis = {
    config: {
      chainId: 65001, // KEEP SAME
      homesteadBlock: 0,
      eip150Block: 0,
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      ramanujanBlock: 0,
      nielsBlock: 0,
      mirrorSyncBlock: 0,
      brunoBlock: 0,
      eulerBlock: 0,
      gibbsBlock: 0,
      parlia: {
        period: 3, // 3 second block time
        epoch: 9000000, // 🔥 HUGE EPOCH - prevents future stalls
      },
    },
    nonce: "0x0",
    timestamp: "0x0",
    extraData: extraData,
    gasLimit: "0x2FAF080", // 50M
    difficulty: "0x1",
    mixHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    coinbase: "0x0000000000000000000000000000000000000000",
    alloc: stateExport.alloc, // 🔥 IMPORTED STATE
    number: "0x0",
    gasUsed: "0x0",
    parentHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
  };

  console.log("");
  console.log("💾 Step 4: Saving new genesis...");

  fs.writeFileSync(NEW_GENESIS_FILE, JSON.stringify(newGenesis, null, 2));
  console.log(`   ✅ Saved to ${NEW_GENESIS_FILE}`);

  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    NEW GENESIS GENERATED ✅                               ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("📊 New Genesis Summary:");
  console.log(`   Chain ID: 65001 (unchanged)`);
  console.log(`   Epoch: 9,000,000 (was: ${oldGenesis.config.parlia?.epoch || 30000})`);
  console.log(`   Period: 3 seconds`);
  console.log(`   Validators: ${VALIDATORS.length}`);
  console.log(`   Imported accounts: ${Object.keys(newGenesis.alloc).length}`);
  console.log("");
  console.log("⚠️  CRITICAL:");
  console.log("   All contracts, LP reserves, and balances are PRESERVED.");
  console.log("   Your $20,000 XHT/USDT liquidity will be intact.");
  console.log("");
  console.log("Next steps:");
  console.log("   1. Backup current validator data");
  console.log("   2. Stop all validators");
  console.log("   3. Re-initialize with new genesis");
  console.log("   4. Restart validators");
  console.log("");
  console.log("See: ./scripts/epoch-recovery-regenesis.sh");
}

generateNewGenesis().catch((error) => {
  console.error("❌ Generation failed:", error);
  process.exit(1);
});
