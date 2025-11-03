#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the genesis file
const genesisPath = path.join(__dirname, "../data/genesis-noor-ultimate.json");
const genesis = JSON.parse(fs.readFileSync(genesisPath, "utf8"));

// Correct validator addresses (from validators-info-v2.json)
const validators = [
  "0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C",
  "0x632b5aCF4FfbBE8dAe81df89754Fb1b217924788",
  "0xB3B4f4fb663d9C8c6AD57e30631Ae1BB0E60c62B",
];

// Function to generate extraData for Parlia
function generateExtraData(validators) {
  // Remove 0x prefix and convert to lowercase
  const validatorAddresses = validators.map((v) =>
    v.toLowerCase().replace("0x", "")
  );

  // Parlia extraData format:
  // 32 bytes of vanity (zeros)
  // N * 20 bytes of validator addresses
  // 65 bytes of seal (zeros)

  const vanity = "0".repeat(64); // 32 bytes
  const validatorData = validatorAddresses.join("");
  const seal = "0".repeat(130); // 65 bytes

  return "0x" + vanity + validatorData + seal;
}

// Generate new extraData
const newExtraData = generateExtraData(validators);

console.log("Old extraData:", genesis.extradata);
console.log("New extraData:", newExtraData);

// Update genesis
genesis.extradata = newExtraData;

// Save updated genesis
const outputPath = path.join(__dirname, "../data/genesis-noor-corrected.json");
fs.writeFileSync(outputPath, JSON.stringify(genesis, null, 2));

console.log("\n✓ Genesis file updated successfully!");
console.log("✓ Output:", outputPath);
console.log("\nValidators:");
validators.forEach((addr, i) => {
  console.log(`  Validator ${i + 1}: ${addr}`);
});
