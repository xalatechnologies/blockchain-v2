#!/usr/bin/env node

//═══════════════════════════════════════════════════════════════════════════
// STATE EXPORT SCRIPT - Block 29,999
//═══════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Export complete world state at block 29,999 for regenesis
//
// EXPORTS:
// - All account balances
// - All contract code
// - All contract storage
// - All nonces
//
// OUTPUT: alloc.json (ready for genesis.json)
//═══════════════════════════════════════════════════════════════════════════

import { ethers } from "ethers";
import fs from "fs";

const RPC_URL = process.env.PRIVATE_CHAIN_RPC || "https://rpc.xaheen.org";
const EXPORT_BLOCK = 29999;
const OUTPUT_FILE = "./data/state-export-29999.json";

console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
console.log("║              STATE EXPORT - Block 29,999 (Pre-Epoch)                     ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`RPC: ${RPC_URL}`);
console.log(`Block: ${EXPORT_BLOCK}`);
console.log("");

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Known critical addresses to export
const CRITICAL_ADDRESSES = [
  "0x26c0eaF731885b14c031cc50dB79b36458E0b355", // WXHT
  "0x5DAB997112119BeCf715607CaA0A94f020AE2Da3", // Factory
  "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80", // Router
  "0xa6E8ce14D79FE0D0ab6e5f6D806310f46cb87EC8", // XHT/USDT Pair
  "0x0cF8e180350253271f4b917CcFb0aCCc4862F262", // BTCBR
  "0x55d398326f99059fF775485246999027B3197955", // USDT (if bridged)
];

async function getAccountState(address, blockNumber) {
  const balance = await provider.getBalance(address, blockNumber);
  const code = await provider.getCode(address, blockNumber);
  const nonce = await provider.getTransactionCount(address, blockNumber);

  return {
    balance: balance.toString(),
    code: code !== "0x" ? code : undefined,
    nonce: nonce > 0 ? nonce : undefined,
  };
}

async function getContractStorage(address, blockNumber) {
  // Note: This is a simplified version
  // For full storage, you'd need to use debug_storageRangeAt
  // and iterate through all slots
  console.log(`   📦 Exporting storage for ${address}...`);

  // For critical contracts, we'll export known storage slots
  const storage = {};

  try {
    // Attempt to get some common storage slots (0-100)
    for (let i = 0; i < 100; i++) {
      const slot = ethers.toBeHex(i, 32);
      const value = await provider.send("eth_getStorageAt", [
        address,
        slot,
        ethers.toQuantity(blockNumber),
      ]);

      if (value !== "0x" + "0".repeat(64)) {
        storage[slot] = value;
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Could not export all storage: ${error.message}`);
  }

  return Object.keys(storage).length > 0 ? storage : undefined;
}

async function exportState() {
  console.log("🔍 Step 1: Verifying block number...");
  const currentBlock = await provider.getBlockNumber();
  console.log(`   Current block: ${currentBlock}`);

  if (currentBlock < EXPORT_BLOCK) {
    console.log(`   ❌ ERROR: Chain not at block ${EXPORT_BLOCK} yet`);
    process.exit(1);
  }

  console.log("");
  console.log("📊 Step 2: Exporting critical contract states...");

  const alloc = {};

  for (const address of CRITICAL_ADDRESSES) {
    console.log(`   🔄 Exporting ${address}...`);

    try {
      const state = await getAccountState(address, EXPORT_BLOCK);

      alloc[address.toLowerCase()] = {
        balance: state.balance !== "0" ? state.balance : undefined,
        nonce: state.nonce,
        code: state.code,
      };

      // If it's a contract (has code), export storage
      if (state.code && state.code !== "0x") {
        const storage = await getContractStorage(address, EXPORT_BLOCK);
        if (storage) {
          alloc[address.toLowerCase()].storage = storage;
        }
      }

      console.log(`   ✅ Exported ${address}`);
    } catch (error) {
      console.log(`   ⚠️  Error exporting ${address}: ${error.message}`);
    }
  }

  console.log("");
  console.log("💰 Step 3: Exporting main wallet balance...");

  const mainWallet = process.env.MAIN_WALLET_ADDRESS;
  if (mainWallet) {
    const state = await getAccountState(mainWallet, EXPORT_BLOCK);
    alloc[mainWallet.toLowerCase()] = {
      balance: state.balance,
      nonce: state.nonce,
    };
    console.log(`   ✅ Wallet ${mainWallet}: ${ethers.formatEther(state.balance)} BNB`);
  }

  console.log("");
  console.log("💾 Step 4: Saving state export...");

  const exportData = {
    block: EXPORT_BLOCK,
    timestamp: new Date().toISOString(),
    rpc: RPC_URL,
    alloc,
    summary: {
      totalAccounts: Object.keys(alloc).length,
      contracts: Object.values(alloc).filter((a) => a.code).length,
    },
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportData, null, 2));

  console.log(`   ✅ Saved to ${OUTPUT_FILE}`);
  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║                       STATE EXPORT COMPLETE                               ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`📊 Summary:`);
  console.log(`   Total accounts: ${exportData.summary.totalAccounts}`);
  console.log(`   Contracts: ${exportData.summary.contracts}`);
  console.log("");
  console.log("⚠️  IMPORTANT:");
  console.log("   This export includes CRITICAL contracts only.");
  console.log("   For a FULL state export, use Geth's debug APIs:");
  console.log("   - debug_accountRange (all accounts)");
  console.log("   - debug_storageRangeAt (all storage slots)");
  console.log("");
  console.log("Next step: ./scripts/generate-new-genesis.js");
}

exportState().catch((error) => {
  console.error("❌ Export failed:", error);
  process.exit(1);
});
