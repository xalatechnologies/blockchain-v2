/**
 * Deploy BTCBRBridgePrivate to BTCBR Private Chain
 *
 * Usage:
 *   export PRIVATE_CHAIN_KEY="0x..."
 *   export MAINNET_BRIDGE_ADDRESS="0x..."  (from previous deployment)
 *   npx hardhat run scripts/hardhat-deploy-private.js --network btcbr
 */

import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    "║     🌉 DEPLOYING PRIVATE BRIDGE TO BTCBR CHAIN 🌉           ║"
  );
  console.log(
    "║                                                              ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝\n"
  );

  // Get mainnet bridge address from previous deployment
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const mainnetDeploymentPath = path.join(
    deploymentsDir,
    "mainnet-bridge.json"
  );

  let mainnetBridgeAddress;
  if (fs.existsSync(mainnetDeploymentPath)) {
    const mainnetDeployment = JSON.parse(
      fs.readFileSync(mainnetDeploymentPath, "utf8")
    );
    mainnetBridgeAddress = mainnetDeployment.bridgeAddress;
    console.log("📄 Loaded mainnet bridge from deployment file");
  } else if (process.env.MAINNET_BRIDGE_ADDRESS) {
    mainnetBridgeAddress = process.env.MAINNET_BRIDGE_ADDRESS;
    console.log("📄 Using mainnet bridge from environment variable");
  } else {
    throw new Error(
      "❌ Mainnet bridge address not found! Set MAINNET_BRIDGE_ADDRESS or deploy mainnet bridge first."
    );
  }

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("📍 Network:", hre.network.name);
  console.log("📍 Chain ID:", hre.network.config.chainId);
  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "BNB\n");

  // Deploy bridge
  console.log("🚀 Deploying BTCBRBridgePrivate...");
  console.log("   Token:", BTCBR_TOKEN);
  console.log("   Mainnet Bridge:", mainnetBridgeAddress);
  console.log("   Required Signatures:", REQUIRED_SIGNATURES);
  console.log("");

  const BTCBRBridgePrivate = await hre.ethers.getContractFactory(
    "BTCBRBridgePrivate"
  );
  const bridge = await BTCBRBridgePrivate.deploy(
    BTCBR_TOKEN,
    mainnetBridgeAddress,
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

  // Set transfer limits (same as mainnet)
  console.log("⚙️  Configuring transfer limits...");
  const MIN_TRANSFER = hre.ethers.parseEther("100");
  const MAX_TRANSFER = hre.ethers.parseEther("100000");
  const DAILY_LIMIT = hre.ethers.parseEther("500000");

  const limitsTx = await bridge.setLimits(
    MIN_TRANSFER,
    MAX_TRANSFER,
    DAILY_LIMIT
  );
  await limitsTx.wait();

  console.log(
    "   Min Transfer:",
    hre.ethers.formatEther(MIN_TRANSFER),
    "BTCBR"
  );
  console.log(
    "   Max Transfer:",
    hre.ethers.formatEther(MAX_TRANSFER),
    "BTCBR"
  );
  console.log("   Daily Limit:", hre.ethers.formatEther(DAILY_LIMIT), "BTCBR");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    bridgeAddress: bridgeAddress,
    mainnetBridgeAddress: mainnetBridgeAddress,
    btcbrToken: BTCBR_TOKEN,
    validators: VALIDATORS,
    requiredSignatures: REQUIRED_SIGNATURES,
    limits: {
      min: hre.ethers.formatEther(MIN_TRANSFER),
      max: hre.ethers.formatEther(MAX_TRANSFER),
      daily: hre.ethers.formatEther(DAILY_LIMIT),
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    txHash: bridge.deploymentTransaction().hash,
  };

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "private-bridge.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Summary
  console.log("═".repeat(70));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("═".repeat(70));
  console.log("Contract:", bridgeAddress);
  console.log("Mainnet Bridge:", mainnetBridgeAddress);
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

  // Next steps
  console.log("✨ Next Steps:");
  console.log("1. Link bridges bidirectionally");
  console.log("2. Setup Gnosis Safe on mainnet");
  console.log("3. Transfer mainnet bridge ownership");
  console.log("4. Fund mainnet vault with 2M BTCBR");
  console.log("5. Test bridge transfer");
  console.log("");

  console.log("💾 Deployment saved: deployments/private-bridge.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Error:", error);
    process.exit(1);
  });
