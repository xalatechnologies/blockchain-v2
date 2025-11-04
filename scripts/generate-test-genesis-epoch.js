import fs from "fs";
import { ethers } from "ethers";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Test Genesis with Small Epoch for Epoch Revalidation Testing
 * 
 * This creates a test genesis file with:
 * - Small epoch (1000 blocks) for fast testing
 * - Same validator configuration as production
 * - BTCBR preserved
 * - Validators properly sorted for epoch revalidation
 * - Chain ID: 65002 (testnet)
 */

console.log("🧪 Generating Test Genesis for Epoch Revalidation Testing...\n");

const CONFIG = {
  chainId: 65002, // Testnet Chain ID
  epoch: 1000, // Small epoch for fast testing (~50 minutes)
  blockTime: 3,
  gasLimit: "0x2FAF080",

  BTCBR_ADDRESS: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",

  VALIDATORS: [
    "0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a",
    "0x689cf2c189781d9bb6859a830acbf64044e4432f",
    "0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de",
  ],

  TREASURY: "0xdd779a290c937144f80eb75b75d814c834536b1b",
  INITIAL_BALANCE: "0x04ee2d6d415b85acef8100000000",
};

// Sort validators (CRITICAL for epoch revalidation)
const sortedValidators = [...CONFIG.VALIDATORS]
  .map((v) => v.toLowerCase())
  .sort();

console.log("📋 Configuration:");
console.log(`   Chain ID: ${CONFIG.chainId} (testnet)`);
console.log(`   Epoch: ${CONFIG.epoch} blocks (~${Math.round(CONFIG.epoch * 3 / 60)} minutes)`);
console.log(`   Validators: ${CONFIG.VALIDATORS.length} (sorted)`);
console.log("");

console.log("👥 Validators (sorted for epoch revalidation):");
sortedValidators.forEach((v, i) => {
  console.log(`   ${i + 1}. ${v}`);
});
console.log("");

// Build extraData
const vanity = "0x" + "0".repeat(64);
const validatorsHex = sortedValidators.map((v) => v.slice(2)).join("");
const seal = "0".repeat(130);
const extraData = vanity + validatorsHex + seal;

// Create genesis
const genesis = {
  config: {
    chainId: CONFIG.chainId,
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
    parlia: {
      period: CONFIG.blockTime,
      epoch: CONFIG.epoch,
    },
  },
  difficulty: "0x1",
  gasLimit: CONFIG.gasLimit,
  extradata: extraData,
  alloc: {},
};

// Add validator balances
[...CONFIG.VALIDATORS, CONFIG.TREASURY].forEach((address) => {
  genesis.alloc[address.toLowerCase()] = {
    balance: CONFIG.INITIAL_BALANCE,
  };
});

// Load BTCBR bytecode
const existingGenesisPath = path.join(
  __dirname,
  "..",
  "data",
  "genesis-nor-complete.json"
);

let btcbrBytecode = "";
let btcbrStorage = {};

if (fs.existsSync(existingGenesisPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(existingGenesisPath, "utf8"));
    const btcbrAddr = CONFIG.BTCBR_ADDRESS.toLowerCase();
    if (existing.alloc[btcbrAddr]?.code) {
      btcbrBytecode = existing.alloc[btcbrAddr].code;
      btcbrStorage = existing.alloc[btcbrAddr].storage || {};
    }
  } catch (e) {
    console.warn(`   ⚠️  Could not load BTCBR: ${e.message}`);
  }
}

// Add BTCBR
if (btcbrBytecode) {
  genesis.alloc[CONFIG.BTCBR_ADDRESS.toLowerCase()] = {
    balance: "0x0",
    code: btcbrBytecode,
    storage: btcbrStorage,
  };
  console.log(`   ✅ BTCBR added (${btcbrBytecode.length} bytes)`);
}

// Save test genesis
const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "genesis-test-epoch-1000.json"
);

fs.writeFileSync(outputPath, JSON.stringify(genesis, null, 2));

console.log("");
console.log("✅ Test genesis generated:");
console.log(`   File: ${outputPath}`);
console.log(`   Chain ID: ${CONFIG.chainId}`);
console.log(`   Epoch: ${CONFIG.epoch} blocks`);
console.log(`   Time to first epoch: ~${Math.round(CONFIG.epoch * 3 / 60)} minutes`);
console.log("");

