import hre from "hardhat";
const { ethers } = hre;

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * DEPLOY COMPLETE NORCHAIN BRIDGE SYSTEM
 *
 * Deploys bridges for real tokens from BSC:
 * - USDT (0x55d398326f99059fF775485246999027B3197955 on BSC)
 * - BNB (native token)
 * - ETH (wrapped)
 */

const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955";
const BSC_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BSC_ETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";

async function main() {
  console.log("\n🌉 COMPLETE NORCHAIN BRIDGE SYSTEM DEPLOYMENT");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "NOR");

  const deployedContracts = {};

  // Step 1: Deploy Wrapped Token Contracts
  console.log("\n" + "=".repeat(70));
  console.log("1️⃣  DEPLOYING WRAPPED TOKEN CONTRACTS");
  console.log("=".repeat(70));

  // WUSDT
  console.log("\n📦 Deploying WUSDT...");
  const WUSDT = await ethers.getContractFactory("WrappedUSDT");
  const wusdt = await WUSDT.deploy();
  await wusdt.waitForDeployment();
  deployedContracts.WUSDT = await wusdt.getAddress();
  console.log("✅ WUSDT:", deployedContracts.WUSDT);

  // WBNB
  console.log("\n📦 Deploying WBNB...");
  const WBNB = await ethers.getContractFactory("WrappedBNB");
  const wbnb = await WBNB.deploy();
  await wbnb.waitForDeployment();
  deployedContracts.WBNB = await wbnb.getAddress();
  console.log("✅ WBNB:", deployedContracts.WBNB);

  // WETH
  console.log("\n📦 Deploying WETH...");
  const WETH = await ethers.getContractFactory("WrappedETH");
  const weth = await WETH.deploy();
  await weth.waitForDeployment();
  deployedContracts.WETH = await weth.getAddress();
  console.log("✅ WETH:", deployedContracts.WETH);

  // Step 2: Deploy Bridge Contracts
  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  DEPLOYING BRIDGE CONTRACTS");
  console.log("=".repeat(70));

  const requiredSignatures = 2; // 2 of 3 validators

  // USDT Bridge
  console.log("\n🌉 Deploying USDT Bridge...");
  const USDTBridge = await ethers.getContractFactory("USDTBridgeNor");
  const usdtBridge = await USDTBridge.deploy(deployedContracts.WUSDT, requiredSignatures);
  await usdtBridge.waitForDeployment();
  deployedContracts.USDTBridge = await usdtBridge.getAddress();
  console.log("✅ USDT Bridge:", deployedContracts.USDTBridge);

  // BNB Bridge
  console.log("\n🌉 Deploying BNB Bridge...");
  const BNBBridge = await ethers.getContractFactory("BNBBridgeNor");
  const bnbBridge = await BNBBridge.deploy(deployedContracts.WBNB, requiredSignatures);
  await bnbBridge.waitForDeployment();
  deployedContracts.BNBBridge = await bnbBridge.getAddress();
  console.log("✅ BNB Bridge:", deployedContracts.BNBBridge);

  // ETH Bridge
  console.log("\n🌉 Deploying ETH Bridge...");
  const ETHBridge = await ethers.getContractFactory("ETHBridgeNor");
  const ethBridge = await ETHBridge.deploy(deployedContracts.WETH, requiredSignatures);
  await ethBridge.waitForDeployment();
  deployedContracts.ETHBridge = await ethBridge.getAddress();
  console.log("✅ ETH Bridge:", deployedContracts.ETHBridge);

  // Step 3: Grant Minter Roles
  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  GRANTING MINTER ROLES");
  console.log("=".repeat(70));

  console.log("\n🔐 Granting roles to bridges...");

  // WUSDT minter
  await wusdt.grantMinterRole(deployedContracts.USDTBridge);
  console.log("✅ WUSDT minter role granted to USDT Bridge");

  // WBNB minter
  await wbnb.grantMinterRole(deployedContracts.BNBBridge);
  console.log("✅ WBNB minter role granted to BNB Bridge");

  // WETH minter
  await weth.grantMinterRole(deployedContracts.ETHBridge);
  console.log("✅ WETH minter role granted to ETH Bridge");

  // Step 4: Add Validators
  console.log("\n" + "=".repeat(70));
  console.log("4️⃣  ADDING VALIDATORS");
  console.log("=".repeat(70));

  const validators = [
    "0x2844Ae34e062BAA32c46702EaAEe70E3B3E4Ae50", // Validator 1
    "0x109E44D07f2dA6eDbB989fc735d790F3D5668f33", // Validator 2
    "0x89DCadbA1C8128b653C63EA3519Cc158ADc67b4f"  // Validator 3
  ];

  console.log("\n👥 Adding validators to all bridges...");
  for (const validator of validators) {
    await usdtBridge.addValidator(validator);
    await bnbBridge.addValidator(validator);
    await ethBridge.addValidator(validator);
    console.log(`✅ Added validator: ${validator}`);
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📋 DEPLOYED CONTRACTS:\n");
  console.log("Wrapped Tokens:");
  console.log(`   WUSDT:  ${deployedContracts.WUSDT}`);
  console.log(`   WBNB:   ${deployedContracts.WBNB}`);
  console.log(`   WETH:   ${deployedContracts.WETH}`);
  console.log("\nBridges:");
  console.log(`   USDT Bridge: ${deployedContracts.USDTBridge}`);
  console.log(`   BNB Bridge:  ${deployedContracts.BNBBridge}`);
  console.log(`   ETH Bridge:  ${deployedContracts.ETHBridge}`);
  console.log("\nValidators:", validators.length);

  console.log("\n💡 NEXT STEPS:");
  console.log("   1. Lock tokens on BSC");
  console.log("   2. Get validator signatures");
  console.log("   3. Mint wrapped tokens on NorChain");
  console.log("   4. Create DEX pairs");
  console.log("   5. Add liquidity");

  // Save deployment info
  const deploymentInfo = {
    network: "NorChain",
    chainId: 65001,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: deployedContracts,
    validators: validators,
    bscTokens: {
      USDT: BSC_USDT,
      WBNB: BSC_WBNB,
      ETH: BSC_ETH
    }
  };

  const fs = await import('fs');
  const path = await import('path');
  const logsDir = path.join(process.cwd(), 'docs', 'deployment-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(logsDir, 'norchain-bridge-system.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment info saved to: docs/deployment-logs/norchain-bridge-system.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
