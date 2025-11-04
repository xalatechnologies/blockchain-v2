import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🔧 FIXING ETH BRIDGE CONFIGURATION...\n");

  const [signer] = await ethers.getSigners();
  console.log(`Signer: ${signer.address}\n`);

  // Get ETH Bridge contract on Nor
  const ETHBridgeNor = await ethers.getContractFactory("ETHBridgeNor");
  const bridge = ETHBridgeNor.attach(process.env.ETH_BRIDGE_XAHEEN);

  console.log(`ETH Bridge (Nor): ${process.env.ETH_BRIDGE_XAHEEN}\n`);

  // Check current config
  const reqSigs = await bridge.requiredSignatures();
  const isValidator = await bridge.validators(signer.address);

  console.log("📋 CURRENT CONFIGURATION:");
  console.log(`Required Signatures: ${reqSigs}`);
  console.log(`Is Validator: ${isValidator}\n`);

  // Fix 1: Set required signatures to 1
  if (Number(reqSigs) !== 1) {
    console.log("🔧 Setting required signatures to 1...");
    const tx1 = await bridge.setRequiredSignatures(1);
    await tx1.wait();
    console.log("✅ Required signatures updated to 1\n");
  } else {
    console.log("✅ Required signatures already set to 1\n");
  }

  // Fix 2: Add validator
  if (!isValidator) {
    console.log("🔧 Adding validator...");
    const tx2 = await bridge.addValidator(signer.address);
    await tx2.wait();
    console.log("✅ Validator added\n");
  } else {
    console.log("✅ Validator already registered\n");
  }

  // Verify
  const newReqSigs = await bridge.requiredSignatures();
  const newIsValidator = await bridge.validators(signer.address);
  const validatorCount = await bridge.validatorCount();

  console.log("═".repeat(60));
  console.log("\n✅ ETH BRIDGE FIXED!\n");
  console.log("📋 NEW CONFIGURATION:");
  console.log(`Required Signatures: ${newReqSigs}`);
  console.log(`Is Validator: ${newIsValidator}`);
  console.log(`Validator Count: ${validatorCount}\n`);
  console.log("═".repeat(60));
  console.log("\n🎯 NOW TRY ETH BRIDGE TEST AGAIN:");
  console.log("   npx hardhat run scripts/test-eth-bridge.js --network bsc\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
