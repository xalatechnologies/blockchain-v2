/**
 * Deploy BTCBRBridgeMainnet to BSC Mainnet
 *
 * Usage:
 *   export MAINNET_PRIVATE_KEY="0x..."
 *   npx hardhat run scripts/hardhat-deploy-mainnet.js --network bsc
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hre from "hardhat";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BTCBR_TOKEN = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
const REQUIRED_SIGNATURES = 2;

const VALIDATORS = [
  "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
  "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
  "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
];

async function main() {
  console.log(
    "\n╔══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                              ║"
  );
  console.log(
    "║     🌉 DEPLOYING MAINNET BRIDGE TO BSC MAINNET 🌉           ║"
  );
  console.log(
    "║                                                              ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝\n"
  );

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 Network:", hre.network.name);
  console.log("📍 Chain ID:", hre.network.config.chainId);
  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "BNB\n");

  // Check balance
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("❌ Insufficient balance! Need at least 0.01 BNB");
  }

  // Deploy bridge
  console.log("🚀 Deploying BTCBRBridgeMainnet...");
  console.log("   Token:", BTCBR_TOKEN);
  console.log("   Required Signatures:", REQUIRED_SIGNATURES);
  console.log("");

  const BTCBRBridgeMainnet = await ethers.getContractFactory(
    "BTCBRBridgeMainnet"
  );
  const bridge = await BTCBRBridgeMainnet.deploy(
    BTCBR_TOKEN,
    REQUIRED_SIGNATURES
  );

  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();

  console.log("✅ Bridge deployed to:", bridgeAddress);
  console.log("");

  // Add validators
  console.log("🔐 Adding validators...");
  for (let i = 0; i < VALIDATORS.length; i++) {
    const tx = await bridge.addValidator(VALIDATORS[i]);
    await tx.wait();
    console.log(`   ✅ Validator ${i + 1}:`, VALIDATORS[i]);
  }
  console.log("");

  // Set transfer limits
  console.log("⚙️  Configuring transfer limits...");
  const MIN_TRANSFER = ethers.parseEther("100"); // 100 BTCBR
  const MAX_TRANSFER = ethers.parseEther("100000"); // 100,000 BTCBR
  const DAILY_LIMIT = ethers.parseEther("500000"); // 500,000 BTCBR

  const limitsTx = await bridge.setLimits(
    MIN_TRANSFER,
    MAX_TRANSFER,
    DAILY_LIMIT
  );
  await limitsTx.wait();

  console.log(
    "   Min Transfer:",
    ethers.formatEther(MIN_TRANSFER),
    "BTCBR"
  );
  console.log(
    "   Max Transfer:",
    ethers.formatEther(MAX_TRANSFER),
    "BTCBR"
  );
  console.log("   Daily Limit:", ethers.formatEther(DAILY_LIMIT), "BTCBR");
  console.log("");

  // Set bridge fee
  console.log("💸 Setting bridge fee...");
  const FEE_PERCENT = 10; // 0.1% (10 basis points)
  const feeTx = await bridge.setBridgeFee(FEE_PERCENT);
  await feeTx.wait();
  console.log("   Bridge Fee:", FEE_PERCENT / 100, "%");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    bridgeAddress: bridgeAddress,
    btcbrToken: BTCBR_TOKEN,
    validators: VALIDATORS,
    requiredSignatures: REQUIRED_SIGNATURES,
    limits: {
      min: ethers.formatEther(MIN_TRANSFER),
      max: ethers.formatEther(MAX_TRANSFER),
      daily: ethers.formatEther(DAILY_LIMIT),
    },
    fee: FEE_PERCENT / 100,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    txHash: bridge.deploymentTransaction().hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "mainnet-bridge.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Summary
  console.log("═".repeat(70));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("═".repeat(70));
  console.log("Contract:", bridgeAddress);
  console.log(
    "Network:",
    hre.network.name,
    `(Chain ID: ${hre.network.config.chainId})`
  );
  console.log("Validators:", VALIDATORS.length);
  console.log("Required Signatures:", REQUIRED_SIGNATURES);
  console.log("Status: ✅ ACTIVE");
  console.log("═".repeat(70));
  console.log("");

  // Verification instructions
  console.log("📝 To verify on BSCScan:");
  console.log(
    `npx hardhat verify --network bsc ${bridgeAddress} "${BTCBR_TOKEN}" ${REQUIRED_SIGNATURES}`
  );
  console.log("");

  // Next steps
  console.log("✨ Next Steps:");
  console.log("1. Save bridge address:", bridgeAddress);
  console.log("2. Setup Gnosis Safe multisig");
  console.log("3. Transfer ownership to multisig");
  console.log("4. Deploy private chain bridge");
  console.log("5. Fund vault with 2M BTCBR");
  console.log("");

  console.log("💾 Deployment saved: deployments/mainnet-bridge.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Error:", error);
    process.exit(1);
  });
