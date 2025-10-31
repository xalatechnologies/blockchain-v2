import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Check if validator is registered in bridge
 */

async function main() {
  console.log("\n🔍 CHECKING VALIDATOR STATUS\n");
  console.log("=" .repeat(60));

  const [signer] = await ethers.getSigners();
  console.log("💼 Checking address:", signer.address);

  const BNBBridgeXaheen = await ethers.getContractFactory("BNBBridgeXaheen");
  const bridge = BNBBridgeXaheen.attach(process.env.BNB_BRIDGE_XAHEEN);

  // Check if validator
  const isValidator = await bridge.validators(signer.address);
  console.log("Is validator:", isValidator);

  if (!isValidator) {
    console.log("\n❌ NOT A VALIDATOR!");
    console.log("Need to add:", signer.address);
    console.log("\nAdding validator now...");

    const tx = await bridge.addValidator(signer.address);
    await tx.wait();

    console.log("✅ Validator added!");
  } else {
    console.log("✅ Already a validator");
  }

  // Check validator count and requirement
  const validatorCount = await bridge.validatorCount();
  const requiredSigs = await bridge.requiredSignatures();

  console.log("\n📊 BRIDGE STATUS:");
  console.log("Validator count:", validatorCount.toString());
  console.log("Required signatures:", requiredSigs.toString());

  console.log("\n📋 ALL VALIDATORS:");
  const validators = await bridge.getValidators();
  validators.forEach((v, i) => {
    console.log(`${i + 1}. ${v}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
