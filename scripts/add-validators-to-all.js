import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Add validator to all bridge contracts on Nor
 */

async function main() {
  console.log("\n🔧 ADDING VALIDATOR TO ALL BRIDGES\n");
  console.log("=".repeat(60));

  const [signer] = await ethers.getSigners();
  console.log("💼 Validator to add:", signer.address);

  // BNB Bridge
  console.log("\n1️⃣ BNB Bridge...");
  const BNBBridgeNor = await ethers.getContractFactory("BNBBridgeNor");
  const bnbBridge = BNBBridgeNor.attach(process.env.BNB_BRIDGE_XAHEEN);

  try {
    const isValidator = await bnbBridge.validators(signer.address);
    if (!isValidator) {
      const tx = await bnbBridge.addValidator(signer.address);
      await tx.wait();
      console.log("   ✅ Validator added to BNB bridge");
    } else {
      console.log("   ✅ Already a validator");
    }
  } catch (error) {
    console.log("   ⚠️  Error:", error.message);
  }

  // USDT Bridge
  console.log("\n2️⃣ USDT Bridge...");
  const USDTBridgeNor = await ethers.getContractFactory("USDTBridgeNor");
  const usdtBridge = USDTBridgeNor.attach(process.env.USDT_BRIDGE_XAHEEN);

  try {
    const isValidator = await usdtBridge.validators(signer.address);
    if (!isValidator) {
      const tx = await usdtBridge.addValidator(signer.address);
      await tx.wait();
      console.log("   ✅ Validator added to USDT bridge");
    } else {
      console.log("   ✅ Already a validator");
    }
  } catch (error) {
    console.log("   ⚠️  Error:", error.message);
  }

  // ETH Bridge
  console.log("\n3️⃣ ETH Bridge...");
  const ETHBridgeNor = await ethers.getContractFactory("ETHBridgeNor");
  const ethBridge = ETHBridgeNor.attach(process.env.ETH_BRIDGE_XAHEEN);

  try {
    const isValidator = await ethBridge.validators(signer.address);
    if (!isValidator) {
      const tx = await ethBridge.addValidator(signer.address);
      await tx.wait();
      console.log("   ✅ Validator added to ETH bridge");
    } else {
      console.log("   ✅ Already a validator");
    }
  } catch (error) {
    console.log("   ⚠️  Error:", error.message);
  }

  console.log("\n=".repeat(60));
  console.log("✅ ALL BRIDGES UPDATED!\n");

  // Check status
  console.log("📊 VALIDATOR STATUS:");
  const bnbCount = await bnbBridge.validatorCount();
  const usdtCount = await usdtBridge.validatorCount();
  const ethCount = await ethBridge.validatorCount();

  console.log("BNB Bridge validators:", bnbCount.toString());
  console.log("USDT Bridge validators:", usdtCount.toString());
  console.log("ETH Bridge validators:", ethCount.toString());

  console.log("\n🎯 All bridges ready for testing!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
