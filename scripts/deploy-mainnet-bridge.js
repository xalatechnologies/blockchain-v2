const { ethers } = require("hardhat");

/**
 * Deploy BTCBR Bridge - Mainnet Side
 *
 * This script deploys the lock contract on BSC mainnet
 */

async function main() {
  console.log("\n🚀 Deploying BTCBR Bridge to BSC MAINNET...\n");

  // Configuration
  const BTCBR_MAINNET = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const REQUIRED_SIGNATURES = 2; // Need 2 out of 3 validators

  const [deployer] = await ethers.getSigners();

  console.log("📍 Deploying with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.utils.formatEther(await deployer.getBalance()),
    "BNB\n"
  );

  // Deploy bridge contract
  console.log("📝 Deploying BTCBRBridgeMainnet contract...");
  const BTCBRBridgeMainnet = await ethers.getContractFactory(
    "BTCBRBridgeMainnet"
  );
  const bridge = await BTCBRBridgeMainnet.deploy(
    BTCBR_MAINNET,
    REQUIRED_SIGNATURES
  );

  await bridge.deployed();

  console.log("✅ Bridge deployed to:", bridge.address);
  console.log("   BTCBR Token:", BTCBR_MAINNET);
  console.log("   Required Signatures:", REQUIRED_SIGNATURES);

  // Add validators
  console.log("\n🔐 Adding validators...");
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD", // Validator 1
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3", // Validator 2
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5", // Validator 3
  ];

  for (let i = 0; i < validators.length; i++) {
    const tx = await bridge.addValidator(validators[i]);
    await tx.wait();
    console.log(`   ✅ Added validator ${i + 1}:`, validators[i]);
  }

  // Configure limits
  console.log("\n⚙️  Configuring transfer limits...");
  const MIN_TRANSFER = ethers.utils.parseEther("100"); // 100 BTCBR
  const MAX_TRANSFER = ethers.utils.parseEther("100000"); // 100,000 BTCBR
  const DAILY_LIMIT = ethers.utils.parseEther("500000"); // 500,000 BTCBR

  const limitsTx = await bridge.setLimits(
    MIN_TRANSFER,
    MAX_TRANSFER,
    DAILY_LIMIT
  );
  await limitsTx.wait();

  console.log(
    "   ✅ Min Transfer:",
    ethers.utils.formatEther(MIN_TRANSFER),
    "BTCBR"
  );
  console.log(
    "   ✅ Max Transfer:",
    ethers.utils.formatEther(MAX_TRANSFER),
    "BTCBR"
  );
  console.log(
    "   ✅ Daily Limit:",
    ethers.utils.formatEther(DAILY_LIMIT),
    "BTCBR"
  );

  // Set bridge fee
  console.log("\n💸 Setting bridge fee...");
  const FEE_PERCENT = 10; // 0.1% (10 basis points)
  const feeTx = await bridge.setBridgeFee(FEE_PERCENT);
  await feeTx.wait();
  console.log("   ✅ Bridge Fee:", FEE_PERCENT / 100, "%");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Contract Address:", bridge.address);
  console.log("Network: BSC Mainnet (Chain ID: 56)");
  console.log("Validators:", validators.length);
  console.log("Required Signatures:", REQUIRED_SIGNATURES);
  console.log("Status: ACTIVE ✅");
  console.log("=".repeat(60));

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "bsc-mainnet",
    chainId: 56,
    bridgeAddress: bridge.address,
    btcbrAddress: BTCBR_MAINNET,
    validators: validators,
    requiredSignatures: REQUIRED_SIGNATURES,
    limits: {
      min: ethers.utils.formatEther(MIN_TRANSFER),
      max: ethers.utils.formatEther(MAX_TRANSFER),
      daily: ethers.utils.formatEther(DAILY_LIMIT),
    },
    fee: FEE_PERCENT / 100,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync(
    "deployments/mainnet-bridge.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/mainnet-bridge.json");

  // Verification instructions
  console.log("\n📝 To verify on BSCScan:");
  console.log(
    `npx hardhat verify --network bsc ${bridge.address} "${BTCBR_MAINNET}" ${REQUIRED_SIGNATURES}`
  );

  console.log("\n✨ Mainnet bridge deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
