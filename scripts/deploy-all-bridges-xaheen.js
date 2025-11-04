import hre from "hardhat";
const { ethers } = hre;

/**
 * DEPLOY ALL BRIDGES TO XAHEEN CHAIN
 *
 * Deploys:
 * 1. BTCBRBridgePrivate (for BTCBR bridging)
 * 2. XHNBridgePrivate (for XHN bridging)
 *
 * Configures validators, limits, and permissions
 * Works with existing Nor chain gas!
 */

async function main() {
  console.log("\n🌉 DEPLOYING ALL BRIDGES TO XAHEEN CHAIN");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  // Token addresses on Nor
  const BTCBR_XAHEEN = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const XHN_XAHEEN = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C"; // Same as BSC

  // Validators
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  ];

  console.log("\n🔧 CONFIGURATION:");
  console.log("  BTCBR on Nor:", BTCBR_XAHEEN);
  console.log("  XHN on Nor:", XHN_XAHEEN);
  console.log("  Validators:", validators.length);
  console.log("  Required signatures: 2 of 3");

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("\n💰 Balance:", ethers.formatEther(balance), "BNB");

  console.log("\n" + "=".repeat(70));
  console.log("PART 1: BTCBR BRIDGE");
  console.log("=".repeat(70));

  // Deploy BTCBR Bridge
  console.log("\n[1/5] Deploying BTCBRBridgePrivate...");
  const BTCBRBridgePrivate = await ethers.getContractFactory(
    "BTCBRBridgePrivate"
  );
  const btcbrBridge = await BTCBRBridgePrivate.deploy(BTCBR_XAHEEN, 2);
  await btcbrBridge.waitForDeployment();
  const btcbrBridgeAddr = await btcbrBridge.getAddress();
  console.log("  ✅ Deployed at:", btcbrBridgeAddr);

  // Add validators
  console.log("\n[2/5] Adding validators to BTCBR bridge...");
  for (const validator of validators) {
    const tx = await btcbrBridge.addValidator(validator);
    await tx.wait();
    console.log("  ✅ Added:", validator);
  }

  // Set limits
  console.log("\n[3/5] Setting BTCBR bridge limits...");
  await (
    await btcbrBridge.setLimits(
      ethers.parseEther("100"),
      ethers.parseEther("100000"),
      ethers.parseEther("500000")
    )
  ).wait();
  console.log("  ✅ Limits configured");

  console.log("\n" + "=".repeat(70));
  console.log("PART 2: XHN BRIDGE");
  console.log("=".repeat(70));

  // Deploy XHN Bridge
  console.log("\n[4/5] Deploying XHNBridgePrivate...");
  const XHNBridgePrivate = await ethers.getContractFactory("XHNBridgePrivate");
  const xhnBridge = await XHNBridgePrivate.deploy(XHN_XAHEEN, 2);
  await xhnBridge.waitForDeployment();
  const xhnBridgeAddr = await xhnBridge.getAddress();
  console.log("  ✅ Deployed at:", xhnBridgeAddr);

  // Add validators
  console.log("\n[5/5] Adding validators to XHN bridge...");
  for (const validator of validators) {
    const tx = await xhnBridge.addValidator(validator);
    await tx.wait();
    console.log("  ✅ Added:", validator);
  }

  // Set limits
  console.log("\nSetting XHN bridge limits...");
  await (
    await xhnBridge.setLimits(
      ethers.parseEther("100"),
      ethers.parseEther("100000"),
      ethers.parseEther("500000")
    )
  ).wait();
  console.log("  ✅ Limits configured");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 ALL BRIDGES DEPLOYED TO XAHEEN!");
  console.log("=".repeat(70));

  console.log("\n📝 SAVE THESE ADDRESSES:");
  console.log("\n  BTCBRBridgePrivate:", btcbrBridgeAddr);
  console.log("  XHNBridgePrivate:", xhnBridgeAddr);

  console.log("\n🔧 CONFIGURATION SUMMARY:");
  console.log("  Both bridges configured with:");
  console.log("  - 3 validators (2-of-3 multisig)");
  console.log("  - Min: 100 tokens");
  console.log("  - Max: 100,000 tokens");
  console.log("  - Daily limit: 500,000 tokens per address");

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Add 0.02 BNB to BSC wallet");
  console.log("  2. Deploy bridges to BSC mainnet");
  console.log("  3. Build validator relayer service");
  console.log("  4. Test bridge transfers");
  console.log("  5. Build bridge UI");
  console.log("  6. Go live!");

  console.log("\n💡 TO DEPLOY TO BSC (when you have BNB):");
  console.log(
    "  npx hardhat run scripts/deploy-all-bridges-bsc.js --network bsc"
  );

  console.log("\n✅ XAHEEN SIDE COMPLETE!");
  console.log("  Both BTCBR and XHN bridges ready on Nor");
  console.log("  Waiting for BSC side deployment");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
