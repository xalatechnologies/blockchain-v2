import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Deploy ETH Bridge to BSC Mainnet
 *
 * This deploys the BSC side of the ETH bridge where users lock ETH
 */

async function main() {
  console.log("\n🚀 DEPLOYING ETH BRIDGE TO BSC MAINNET\n");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("💼 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.01")) {
    console.error("\n❌ Insufficient BNB! Need at least 0.01 BNB for gas");
    process.exit(1);
  }

  console.log("\n📋 CONFIGURATION:");

  // Validators (same as BNB/USDT bridge)
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5"
  ];
  console.log("Validators:", validators.length);
  console.log("Required signatures: 2 (2-of-3 multisig)");

  console.log("\n=" .repeat(60));
  console.log("🔨 DEPLOYING CONTRACTS...\n");

  // Deploy bridge
  console.log("1️⃣ Deploying ETHBridgeMainnet...");
  const ETHBridgeMainnet = await ethers.getContractFactory("ETHBridgeMainnet");
  const bridgeBSC = await ETHBridgeMainnet.deploy(2); // 2-of-3 multisig
  await bridgeBSC.waitForDeployment();

  const bscAddress = await bridgeBSC.getAddress();
  console.log("   ✅ Deployed at:", bscAddress);

  // Add validators
  console.log("\n2️⃣ Adding validators...");
  for (let i = 0; i < validators.length; i++) {
    console.log(`   Adding validator ${i + 1}:`, validators[i].slice(0, 10) + "...");
    const tx = await bridgeBSC.addValidator(validators[i]);
    await tx.wait();
  }
  console.log("   ✅ All validators added");

  console.log("\n=" .repeat(60));
  console.log("✅ DEPLOYMENT SUCCESSFUL!\n");

  console.log("📝 CONTRACT ADDRESSES:");
  console.log("ETH_BRIDGE_BSC=" + bscAddress);

  console.log("\n🔍 VERIFYING ON BSCSCAN...");

  try {
    // Wait a bit for BSCScan to index
    console.log("⏰ Waiting 30 seconds for BSCScan to index...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("Verifying ETHBridgeMainnet...");
    await hre.run("verify:verify", {
      address: bscAddress,
      constructorArguments: [2],
    });
    console.log("✅ Contract verified on BSCScan!");
  } catch (error) {
    if (error.message.includes("already verified")) {
      console.log("✅ Contract already verified on BSCScan");
    } else {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually later with:");
      console.log(`npx hardhat verify --network bsc ${bscAddress} 2`);
    }
  }

  console.log("\n=" .repeat(60));
  console.log("📊 BRIDGE CONFIGURATION:");
  console.log("Min transfer: 0.005 ETH (~$10)");
  console.log("Max transfer: 5 ETH (~$10,000)");
  console.log("Daily limit: 50 ETH per address");
  console.log("Bridge fee: 0.2% (REVENUE!)");
  console.log("=" .repeat(60));

  console.log("\n💰 REVENUE POTENTIAL:");
  console.log("If $100K bridged/month: $200/month revenue");
  console.log("If $1M bridged/month: $2,000/month revenue ($24K/year!)");

  console.log("\n🔗 VIEW ON BSCSCAN:");
  console.log("https://bscscan.com/address/" + bscAddress);

  console.log("\n📋 NEXT STEPS:");
  console.log("1. Run: npx hardhat run scripts/deploy-eth-bridge-xaheen.js --network btcbr");
  console.log("2. Add this address to .env: ETH_BRIDGE_BSC=" + bscAddress);
  console.log("3. Test with small ETH amount (0.01 ETH)");

  console.log("\n✅ BSC DEPLOYMENT COMPLETE!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });
