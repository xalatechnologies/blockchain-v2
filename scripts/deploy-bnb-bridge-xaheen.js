import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🌉 DEPLOYING TO XAHEEN CHAIN\n");
  console.log("═".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("💼 Deployer:", deployer.address);

  const xaheenBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(xaheenBalance), "NOR\n");

  // Validator addresses (your existing validators)
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  ];

  console.log("═".repeat(60));
  console.log("STEP 1: DEPLOY WBNB TOKEN");
  console.log("═".repeat(60) + "\n");

  const WBNBToken = await ethers.getContractFactory("WBNBToken");
  const wbnb = await WBNBToken.deploy();
  await wbnb.waitForDeployment();

  const wbnbAddress = await wbnb.getAddress();
  console.log("✅ WBNB Token deployed:", wbnbAddress);

  console.log("\n═".repeat(60));
  console.log("STEP 2: DEPLOY BRIDGE CONTRACT");
  console.log("═".repeat(60) + "\n");

  const BNBBridgeNor = await ethers.getContractFactory("BNBBridgeNor");
  const bridge = await BNBBridgeNor.deploy(wbnbAddress, 2); // 2-of-3 multisig
  await bridge.waitForDeployment();

  const bridgeAddress = await bridge.getAddress();
  console.log("✅ BNBBridgeNor deployed:", bridgeAddress);

  console.log("\n═".repeat(60));
  console.log("STEP 3: GRANT MINTER ROLE TO BRIDGE");
  console.log("═".repeat(60) + "\n");

  const MINTER_ROLE = await wbnb.MINTER_ROLE();
  const tx1 = await wbnb.grantRole(MINTER_ROLE, bridgeAddress);
  await tx1.wait();
  console.log("✅ Bridge can now mint WBNB");

  console.log("\n═".repeat(60));
  console.log("STEP 4: ADD VALIDATORS");
  console.log("═".repeat(60) + "\n");

  for (const validator of validators) {
    const tx = await bridge.addValidator(validator);
    await tx.wait();
    console.log("✅ Validator added:", validator);
  }

  console.log("\n═".repeat(60));
  console.log("🎉 XAHEEN DEPLOYMENT COMPLETE!");
  console.log("═".repeat(60));

  console.log("\n📋 SAVE THESE TO .env:\n");
  console.log(`WBNB_TOKEN_XAHEEN=${wbnbAddress}`);
  console.log(`BNB_BRIDGE_XAHEEN=${bridgeAddress}`);

  console.log("\n📊 NEXT STEPS:");
  console.log("1. Save contract addresses to .env");
  console.log("2. Test bridge with 0.01 BNB");
  console.log("3. (Optional) Add WBNB/NOR liquidity to DEX");
  console.log("4. Market to users!");

  console.log("\n💰 REVENUE STARTS NOW!");
  console.log("Every bridge transaction earns you 0.2% fee!");
  console.log("\n🚀 Ready to make money!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:\n");
    console.error(error);
    process.exit(1);
  });
