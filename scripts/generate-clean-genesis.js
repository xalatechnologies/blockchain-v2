#!/usr/bin/env node

//═══════════════════════════════════════════════════════════════════════════
// GENERATE CLEAN GENESIS - Fresh Start
//═══════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Create fresh genesis.json with:
// - SAME chainId (65001) - for wallet compatibility
// - PROPER Parlia config (epoch: 9,000,000) - from day 1
// - CORRECTED extraData (sorted validators)
// - CLEAN state (only pre-funded main wallet)
//
// DOES NOT PRESERVE: Old contracts, liquidity, transaction history
// THIS IS A CLEAN START
//═══════════════════════════════════════════════════════════════════════════

import fs from "fs";
import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const CLEAN_GENESIS_FILE = "./data/genesis-clean.json";

console.log(
  "╔═══════════════════════════════════════════════════════════════════════════╗"
);
console.log(
  "║          🌙 NOOR CHAIN - GENERATE CLEAN GENESIS 🌙                       ║"
);
console.log(
  "║              Empowering the Future with Light and Trust                  ║"
);
console.log(
  "╚═══════════════════════════════════════════════════════════════════════════╝"
);
console.log("");

// Validator addresses (SORTED lexicographically, lowercase)
// These match the actual keystore files on the server
// Generated: November 2, 2025 with password "xaheen2025"
const VALIDATORS = [
  "0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE", // validator-1
  "0x689CF2C189781d9bB6859A830acbF64044E4432f", // validator-2
  "0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a", // validator-3
].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

console.log("📋 Validator addresses (sorted):");
VALIDATORS.forEach((v, i) => console.log(`   ${i + 1}. ${v}`));
console.log("");

// Verify sorting
const sortedCheck = [...VALIDATORS].sort((a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase())
);
const isSorted = JSON.stringify(VALIDATORS) === JSON.stringify(sortedCheck);

if (!isSorted) {
  console.log("❌ ERROR: Validators are NOT sorted correctly!");
  console.log("This will cause epoch boundary failures.");
  process.exit(1);
}

console.log("✅ Validator sorting verified");
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

async function generateCleanGenesis() {
  console.log("🧹 This is a CLEAN START - no old state will be preserved");
  console.log("");

  console.log("📊 Configuration:");
  console.log("   Chain ID: 65001 (unchanged for wallet compatibility)");
  console.log("   Epoch: 9,000,000 blocks (~1.5 years)");
  console.log("   Period: 3 seconds");
  console.log("   Validators: 3");
  console.log("");

  console.log("🔧 Step 1: Generating extraData...");
  const extraData = generateExtraData(VALIDATORS);
  console.log(
    `   extraData: ${extraData.substring(0, 50)}...${extraData.substring(
      extraData.length - 10
    )}`
  );
  console.log("");

  console.log("💰 Step 2: Creating alloc (pre-funded accounts)...");

  // Get main wallet address from private key
  const mainWallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY);
  console.log(`   Main wallet: ${mainWallet.address}`);
  console.log("   Balance: 1,000,000 BNB (for gas)");
  console.log("");

  // CLEAN alloc - only main wallet with BNB for gas
  const alloc = {
    [mainWallet.address.toLowerCase()]: {
      balance: ethers.toQuantity(ethers.parseEther("1000000")), // 1M BNB for gas
    },
    // Pre-fund validators with gas
    [VALIDATORS[0].toLowerCase()]: {
      balance: ethers.toQuantity(ethers.parseEther("100000")), // 100K BNB
    },
    [VALIDATORS[1].toLowerCase()]: {
      balance: ethers.toQuantity(ethers.parseEther("100000")), // 100K BNB
    },
    [VALIDATORS[2].toLowerCase()]: {
      balance: ethers.toQuantity(ethers.parseEther("100000")), // 100K BNB
    },
  };

  console.log("📝 Step 3: Creating genesis structure...");

  const cleanGenesis = {
    config: {
      chainId: 65001, // KEEP SAME for wallet compatibility
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
        epoch: 9000000, // 🔥 HUGE EPOCH - 1.5 years before next boundary
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
    alloc: alloc, // 🧹 CLEAN START - only gas accounts
    number: "0x0",
    gasUsed: "0x0",
    parentHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
  };

  console.log("");
  console.log("💾 Step 4: Saving clean genesis...");

  fs.writeFileSync(CLEAN_GENESIS_FILE, JSON.stringify(cleanGenesis, null, 2));
  console.log(`   ✅ Saved to ${CLEAN_GENESIS_FILE}`);

  console.log("");
  console.log(
    "╔═══════════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║          🌙 NOOR CHAIN GENESIS GENERATED SUCCESSFULLY ✅                 ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════════════════╝"
  );
  console.log("");
  console.log("📊 Nor Chain Genesis Summary:");
  console.log(`   Chain Name: Nor Chain`);
  console.log(`   Native Token: NOR (Nor Token)`);
  console.log(`   Chain ID: 65001`);
  console.log(`   Epoch: 9,000,000 blocks (~1.5 years until boundary)`);
  console.log(`   Block Time: 3 seconds`);
  console.log(`   Validators: ${VALIDATORS.length}`);
  console.log(`   Pre-funded accounts: ${Object.keys(alloc).length}`);
  console.log("");
  console.log("🌙 NOOR CHAIN FEATURES:");
  console.log("   ✅ Ethical blockchain with light and transparency");
  console.log("   ✅ Compliance-first architecture");
  console.log("   ✅ Shariah-compliant DeFi infrastructure");
  console.log("   ✅ Fresh start for innovative playbook implementation");
  console.log("");
  console.log("⚠️  IMPORTANT:");
  console.log("   This is a CLEAN GENESIS. All old state removed.");
  console.log("   Deploy Nor Chain ecosystem from scratch:");
  console.log("   - NOR token (native)");
  console.log("   - WNOR wrapper");
  console.log("   - NorSwap DEX (Factory, Router, Pairs)");
  console.log(
    "   - Halal finance contracts (FundUnit, Shariah Oracle, NAV, Zakat)"
  );
  console.log("");
  console.log("📋 Next steps:");
  console.log(
    "   1. Review epoch strategy: docs/00-critical/EPOCH_STRATEGY.md"
  );
  console.log(
    "   2. Review brand guide: docs/branding/NOOR_CHAIN_BRAND_GUIDE.md"
  );
  console.log("   3. Stop all validators");
  console.log("   4. Clean validator data directories");
  console.log("   5. Re-initialize with Nor Chain genesis");
  console.log("   6. Start validators and verify block production");
  console.log("   7. Deploy core contracts (Phase 1 of master plan)");
  console.log("");
  console.log("🌙 Nor Chain - Empowering the Future with Light and Trust");

  // Verify genesis can be parsed back
  console.log("");
  console.log("🔍 Verifying genesis format...");
  try {
    const parsed = JSON.parse(fs.readFileSync(CLEAN_GENESIS_FILE, "utf8"));
    console.log("   ✅ Genesis file is valid JSON");
    console.log(`   ✅ Chain ID: ${parsed.config.chainId}`);
    console.log(`   ✅ Epoch: ${parsed.config.parlia.epoch.toLocaleString()}`);
    console.log(`   ✅ Alloc accounts: ${Object.keys(parsed.alloc).length}`);

    // Verify all balances are hex
    for (const [addr, account] of Object.entries(parsed.alloc)) {
      if (!account.balance.startsWith("0x")) {
        console.log(`   ❌ ERROR: Balance for ${addr} is not hex`);
        process.exit(1);
      }
    }
    console.log("   ✅ All balances are hex format");
  } catch (error) {
    console.log("   ❌ ERROR: Genesis file validation failed");
    console.error(error);
    process.exit(1);
  }

  console.log("");
  console.log("✅ Clean genesis ready for deployment!");
}

generateCleanGenesis().catch((error) => {
  console.error("❌ Generation failed:", error);
  process.exit(1);
});
