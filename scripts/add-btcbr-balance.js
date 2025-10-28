#!/usr/bin/env node

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const YOUR_WALLET = "0x81bDAf1ac2094D5133937B3361A38a4976E55acc";
const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
const TOTAL_SUPPLY = "21000000000000000000000000000"; // 21 septillion with 18 decimals

// Standard ERC20 storage slots
// slot 0: totalSupply
// slot 1: balances mapping
// slot 3: totalSupply (for this contract)

function calculateStorageSlot(mappingSlot, address) {
  // For mapping(address => uint256), the storage slot is:
  // keccak256(abi.encode(address, mappingSlot))
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedData = abiCoder.encode(
    ["address", "uint256"],
    [address, mappingSlot]
  );
  return ethers.keccak256(encodedData);
}

// Calculate storage slots
const balanceMappingSlot = 1; // Standard ERC20 balances mapping slot
const totalSupplySlot = 3; // This contract uses slot 3 for totalSupply

const balanceSlot = calculateStorageSlot(balanceMappingSlot, YOUR_WALLET);
const totalSupplyValue = "0x" + BigInt(TOTAL_SUPPLY).toString(16);

console.log("=== BTCBR Balance Storage Calculation ===");
console.log("Wallet Address:", YOUR_WALLET);
console.log("BTCBR Contract:", BTCBR_ADDRESS);
console.log("Total Supply:", TOTAL_SUPPLY, "(21 septillion)");
console.log("\nStorage Slots:");
console.log("Balance Slot:", balanceSlot);
console.log("Balance Value (hex):", totalSupplyValue);
console.log(
  "Total Supply Slot: 0x" + totalSupplySlot.toString(16).padStart(64, "0")
);
console.log("Total Supply Value (hex):", totalSupplyValue);

// Read genesis file
const genesisPath = path.join(__dirname, "../data/genesis-updated.json");
const genesis = JSON.parse(fs.readFileSync(genesisPath, "utf8"));

// Update BTCBR contract storage
if (!genesis.alloc[BTCBR_ADDRESS].storage) {
  genesis.alloc[BTCBR_ADDRESS].storage = {};
}

// Add balance for your wallet
genesis.alloc[BTCBR_ADDRESS].storage[balanceSlot] = totalSupplyValue;

// Add total supply
genesis.alloc[BTCBR_ADDRESS].storage[
  "0x0000000000000000000000000000000000000000000000000000000000000003"
] = totalSupplyValue;

// Save updated genesis
fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2));

console.log("\n✅ Genesis file updated successfully!");
console.log("📄 File:", genesisPath);
console.log("\nStorage added:");
console.log(`  ${balanceSlot}: ${totalSupplyValue} (your balance)`);
console.log(
  `  ${
    "0x" + totalSupplySlot.toString(16).padStart(64, "0")
  }: ${totalSupplyValue} (total supply)`
);
console.log("\n🚀 Next steps:");
console.log("1. Copy the updated genesis file to your AWS instance");
console.log("2. Stop the BSC node");
console.log("3. Remove old blockchain data: rm -rf /data/bsc/data/geth");
console.log(
  "4. Re-initialize: geth --datadir /data/bsc/data init /path/to/genesis-updated.json"
);
console.log("5. Restart the BSC node");
console.log(
  "\n💡 After restart, you will have 21 septillion BTCBR tokens in your wallet!"
);
