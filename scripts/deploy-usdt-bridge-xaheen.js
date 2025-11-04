import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Deploy USDT Bridge to Nor Chain
 *
 * Deploys WUSDT token and bridge contract on Nor
 */

async function main() {
  console.log("\n🚀 DEPLOYING USDT BRIDGE TO XAHEEN CHAIN\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("💼 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR");

  console.log("\n📋 CONFIGURATION:");

  // Validators (same as BNB bridge)
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  ];
  console.log("Validators:", validators.length);
  console.log("Required signatures: 2 (2-of-3 multisig)");

  console.log("\n=".repeat(60));
  console.log("🔨 DEPLOYING CONTRACTS...\n");

  // Deploy WUSDT token
  console.log("1️⃣ Deploying WUSDT Token...");
  const WUSDTToken = await ethers.getContractFactory("WUSDTToken");
  const wusdt = await WUSDTToken.deploy();
  await wusdt.waitForDeployment();

  const wusdtAddress = await wusdt.getAddress();
  console.log("   ✅ WUSDT deployed at:", wusdtAddress);

  // Deploy bridge
  console.log("\n2️⃣ Deploying USDTBridgeNor...");
  const USDTBridgeNor = await ethers.getContractFactory("USDTBridgeNor");
  const bridgeNor = await USDTBridgeNor.deploy(wusdtAddress, 2); // 2-of-3 multisig
  await bridgeNor.waitForDeployment();

  const bridgeAddress = await bridgeNor.getAddress();
  console.log("   ✅ Bridge deployed at:", bridgeAddress);

  // Grant MINTER_ROLE to bridge
  console.log("\n3️⃣ Granting MINTER_ROLE to bridge...");
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const tx1 = await wusdt.grantRole(MINTER_ROLE, bridgeAddress);
  await tx1.wait();
  console.log("   ✅ MINTER_ROLE granted");

  // Add validators to bridge
  console.log("\n4️⃣ Adding validators to bridge...");
  for (let i = 0; i < validators.length; i++) {
    console.log(
      `   Adding validator ${i + 1}:`,
      validators[i].slice(0, 10) + "..."
    );
    const tx = await bridgeNor.addValidator(validators[i]);
    await tx.wait();
  }
  console.log("   ✅ All validators added");

  console.log("\n=".repeat(60));
  console.log("✅ DEPLOYMENT SUCCESSFUL!\n");

  console.log("📝 CONTRACT ADDRESSES:");
  console.log("WUSDT_TOKEN_XAHEEN=" + wusdtAddress);
  console.log("USDT_BRIDGE_XAHEEN=" + bridgeAddress);

  console.log("\n=".repeat(60));
  console.log("📊 BRIDGE CONFIGURATION:");
  console.log("Token: WUSDT (Wrapped USDT)");
  console.log("Decimals: 18");
  console.log("Validators: 3 (2-of-3 multisig)");
  console.log("=".repeat(60));

  console.log("\n🔗 VIEW ON XAHEEN EXPLORER:");
  console.log("WUSDT: https://explorer.xaheen.org/address/" + wusdtAddress);
  console.log("Bridge: https://explorer.xaheen.org/address/" + bridgeAddress);

  console.log("\n📋 ADD TO .ENV:");
  console.log("WUSDT_TOKEN_XAHEEN=" + wusdtAddress);
  console.log("USDT_BRIDGE_XAHEEN=" + bridgeAddress);

  console.log("\n💡 HOW TO USE:");
  console.log("1. Lock USDT on BSC (USDTBridgeMainnet)");
  console.log("2. Validators sign mint transaction");
  console.log("3. Call mintWUSDT() on Nor with signatures");
  console.log("4. User receives WUSDT on Nor");

  console.log("\n💰 REVENUE STREAM:");
  console.log("0.2% fee on every bridge = PURE PROFIT!");
  console.log("$100K/month volume = $200/month revenue");
  console.log("$1M/month volume = $2,000/month revenue");

  console.log("\n✅ XAHEEN DEPLOYMENT COMPLETE!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });
