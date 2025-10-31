import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🌉 DEPLOYING BNB BRIDGE FOR REVENUE GENERATION\n");
  console.log("═".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("💼 Deployer:", deployer.address);

  // Check balances
  const bscBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bscBalance), "BNB\n");

  if (bscBalance < ethers.parseEther("0.01")) {
    console.log("⚠️  WARNING: Low BNB balance!");
    console.log("   Need at least 0.01 BNB for deployment");
    console.log("   Current:", ethers.formatEther(bscBalance), "BNB\n");
  }

  // Validator addresses (your existing validators)
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5"
  ];

  console.log("🔐 Validators:", validators.length);
  console.log("📋 Required signatures: 2 of 3\n");

  console.log("═".repeat(60));
  console.log("DEPLOYING TO BSC MAINNET");
  console.log("═".repeat(60) + "\n");

  // Deploy BNB Bridge on BSC
  console.log("📍 Deploying BNBBridgeMainnet...");
  const BNBBridgeMainnet = await ethers.getContractFactory("BNBBridgeMainnet");
  const bridgeBSC = await BNBBridgeMainnet.deploy(2); // 2-of-3 multisig
  await bridgeBSC.waitForDeployment();

  const bscAddress = await bridgeBSC.getAddress();
  console.log("✅ BNBBridgeMainnet deployed:", bscAddress);

  // Add validators
  console.log("\n🔐 Adding validators...");
  for (const validator of validators) {
    const tx = await bridgeBSC.addValidator(validator);
    await tx.wait();
    console.log("   ✅", validator);
  }

  // Get deployment stats
  const minAmount = await bridgeBSC.minTransferAmount();
  const maxAmount = await bridgeBSC.maxTransferAmount();
  const feePercent = await bridgeBSC.bridgeFeePercent();

  console.log("\n📊 Bridge Configuration:");
  console.log("   Min transfer:", ethers.formatEther(minAmount), "BNB");
  console.log("   Max transfer:", ethers.formatEther(maxAmount), "BNB");
  console.log("   Bridge fee:", Number(feePercent) / 100, "%");
  console.log("   Fee in basis points:", feePercent.toString(), "bp (0.2%)");

  console.log("\n💰 REVENUE CALCULATION:");
  console.log("   If users bridge $10,000/month:");
  console.log("   Revenue = $10,000 × 0.2% = $20/month");
  console.log("\n   If users bridge $100,000/month:");
  console.log("   Revenue = $100,000 × 0.2% = $200/month");
  console.log("\n   If users bridge $1,000,000/month:");
  console.log("   Revenue = $1,000,000 × 0.2% = $2,000/month ($24K/year!)");

  console.log("\n═".repeat(60));
  console.log("🎉 BSC DEPLOYMENT COMPLETE!");
  console.log("═".repeat(60));

  console.log("\n📋 SAVE THESE ADDRESSES:\n");
  console.log(`BNB_BRIDGE_BSC=${bscAddress}`);

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Deploy to Xaheen Chain (WBNB token + bridge)");
  console.log("2. Test with small amount (0.01 BNB)");
  console.log("3. Add WBNB/XHT liquidity to DEX");
  console.log("4. Market to users!");

  console.log("\n💡 USER FLOW:");
  console.log("Buy BNB on Binance → Bridge to Xaheen → Swap for XHT → Trade!");

  console.log("\n🚀 Ready to make money!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:\n");
    console.error(error);
    process.exit(1);
  });
