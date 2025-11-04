import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Set Signature Requirements for Bridges
 *
 * For testing: Set to 1 signature
 * For production: Set to 2 or 3 signatures
 */

async function main() {
  console.log("\n⚙️  SETTING SIGNATURE REQUIREMENTS\n");
  console.log("=".repeat(60));

  const [signer] = await ethers.getSigners();
  console.log("💼 Signer:", signer.address);

  const requirement = 1; // Change to 1 for testing (was 2)
  console.log("🔢 Setting requirement to:", requirement, "signature(s)");

  console.log("\n📋 UPDATING BRIDGES...\n");

  // Update BNB Bridge on Nor
  console.log("1️⃣ BNB Bridge...");
  const BNBBridgeNor = await ethers.getContractFactory("BNBBridgeNor");
  const bnbBridge = BNBBridgeNor.attach(process.env.BNB_BRIDGE_XAHEEN);

  try {
    const tx1 = await bnbBridge.setRequiredSignatures(requirement);
    await tx1.wait();
    console.log("   ✅ BNB Bridge updated");
  } catch (error) {
    console.log("   ⚠️  Error:", error.message);
  }

  // Update USDT Bridge on Nor
  console.log("\n2️⃣ USDT Bridge...");
  const USDTBridgeNor = await ethers.getContractFactory("USDTBridgeNor");
  const usdtBridge = USDTBridgeNor.attach(process.env.USDT_BRIDGE_XAHEEN);

  try {
    const tx2 = await usdtBridge.setRequiredSignatures(requirement);
    await tx2.wait();
    console.log("   ✅ USDT Bridge updated");
  } catch (error) {
    console.log("   ⚠️  Error:", error.message);
  }

  // Update ETH Bridge on Nor
  console.log("\n3️⃣ ETH Bridge...");
  const ETHBridgeNor = await ethers.getContractFactory("ETHBridgeNor");
  const ethBridge = ETHBridgeNor.attach(process.env.ETH_BRIDGE_XAHEEN);

  try {
    const tx3 = await ethBridge.setRequiredSignatures(requirement);
    await tx3.wait();
    console.log("   ✅ ETH Bridge updated");
  } catch (error) {
    console.log("   ⚠️  Error:", error.message);
  }

  console.log("\n=".repeat(60));
  console.log("✅ SIGNATURE REQUIREMENTS UPDATED!\n");

  console.log("💡 Current setting:", requirement, "signature(s) required");
  console.log("\n📋 For production, increase to 2 or 3 signatures:");
  console.log(
    "Run: npx hardhat run scripts/set-signature-requirement.js --network btcbr"
  );
  console.log("(Edit requirement = 2 or 3 in the script first)\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:");
    console.error(error);
    process.exit(1);
  });
