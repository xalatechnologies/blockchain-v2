import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🌉 DEPLOYING CROSS-CHAIN SWAP ROUTER TO BSC");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.01")) {
    console.log("\n⚠️  WARNING: Low BNB balance!");
    console.log("  Recommended: 0.01 BNB minimum");
    console.log("\n  Continuing with deployment anyway...");
  }

  // Bridge addresses on BSC
  const norBridge = "0xeEBA26529453B39876dAf0bE73216B71cdc07c3E";
  const btcbrBridge = "0x1A2651144788544222544FcC0109DECCE60AD1A6";

  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYING CROSS-CHAIN SWAP ROUTER");
  console.log("=".repeat(70));

  console.log("\n[1/3] Deploying CrossChainSwapRouter contract...");
  console.log("  NOR Bridge:", norBridge);
  console.log("  BTCBR Bridge:", btcbrBridge);

  const CrossChainRouter = await ethers.getContractFactory("CrossChainSwapRouter");
  const router = await CrossChainRouter.deploy(norBridge, btcbrBridge);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();

  console.log("  ✅ CrossChainSwapRouter deployed at:", routerAddress);

  console.log("\n[2/3] Configuring supported tokens...");

  // Token addresses on BSC
  const NOR_BSC = "0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97";
  const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
  const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955"; // Binance-Peg BSC-USD

  console.log("  Adding NOR:", NOR_BSC);
  let tx = await router.addSupportedToken(NOR_BSC);
  await tx.wait();
  console.log("  ✅ NOR added");

  console.log("  Adding BTCBR:", BTCBR_BSC);
  tx = await router.addSupportedToken(BTCBR_BSC);
  await tx.wait();
  console.log("  ✅ BTCBR added");

  console.log("  Adding USDT:", USDT_BSC);
  tx = await router.addSupportedToken(USDT_BSC);
  await tx.wait();
  console.log("  ✅ USDT added");

  console.log("\n[3/3] Verifying configuration...");
  const norSupported = await router.supportedTokens(NOR_BSC);
  const btcbrSupported = await router.supportedTokens(BTCBR_BSC);
  const usdtSupported = await router.supportedTokens(USDT_BSC);

  console.log("  NOR supported:", norSupported ? "✅" : "❌");
  console.log("  BTCBR supported:", btcbrSupported ? "✅" : "❌");
  console.log("  USDT supported:", usdtSupported ? "✅" : "❌");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 CROSS-CHAIN ROUTER DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📝 SAVE THESE DETAILS:");
  console.log("\n  CrossChainSwapRouter:", routerAddress);
  console.log("  NOR Bridge:", norBridge);
  console.log("  BTCBR Bridge:", btcbrBridge);
  console.log("\n  Supported Tokens:");
  console.log("    - NOR:", NOR_BSC);
  console.log("    - BTCBR:", BTCBR_BSC);
  console.log("    - USDT:", USDT_BSC);

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Deploy NorChainSwapHandler to NorChain");
  console.log("  2. Build validator service");
  console.log("  3. Test cross-chain swap");

  console.log("\n🔗 BSCScan:");
  console.log(`  https://bscscan.com/address/${routerAddress}`);

  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\n💰 Final Balance:", ethers.formatEther(finalBalance), "BNB");
  console.log("  Gas used:", ethers.formatEther(balance - finalBalance), "BNB");

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
