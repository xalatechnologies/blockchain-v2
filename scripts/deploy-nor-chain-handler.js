import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("\n🔗 DEPLOYING NOR CHAIN SWAP HANDLER");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR");

  // NorChain contract addresses
  const noorSwapRouter = "0x0cf8e180350253271f4b917ccfb0accc4862f265";
  const norBridge = "0xeEBA26529453B39876dAf0bE73216B71cdc07c3E"; // Will be deployed on NorChain
  const btcbrBridge = "0x1A2651144788544222544FcC0109DECCE60AD1A6"; // Will be deployed on NorChain

  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYING NOR CHAIN SWAP HANDLER");
  console.log("=".repeat(70));

  console.log("\n[1/3] Deploying NorChainSwapHandler contract...");
  console.log("  NoorSwap Router:", noorSwapRouter);
  console.log("  NOR Bridge:", norBridge);
  console.log("  BTCBR Bridge:", btcbrBridge);

  const NorChainHandler = await ethers.getContractFactory("NorChainSwapHandler");
  const handler = await NorChainHandler.deploy(noorSwapRouter, norBridge, btcbrBridge);
  await handler.waitForDeployment();
  const handlerAddress = await handler.getAddress();

  console.log("  ✅ NorChainSwapHandler deployed at:", handlerAddress);

  console.log("\n[2/3] Configuring validators...");

  // Validator addresses
  const validators = [
    "0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE", // Validator 1
    "0x689CF2C189781d9bB6859A830acbF64044E4432f", // Validator 2
    "0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a"  // Validator 3
  ];

  for (let i = 0; i < validators.length; i++) {
    console.log(`  Adding Validator ${i + 1}:`, validators[i]);
    const tx = await handler.addValidator(validators[i]);
    await tx.wait();
    console.log(`  ✅ Validator ${i + 1} added`);
  }

  console.log("\n[3/3] Verifying configuration...");

  // Verify validators
  for (let i = 0; i < validators.length; i++) {
    const isValidator = await handler.validators(validators[i]);
    console.log(`  Validator ${i + 1}:`, isValidator ? "✅" : "❌");
  }

  // Verify router
  const routerAddress = await handler.noorSwapRouter();
  console.log("  NoorSwap Router:", routerAddress === noorSwapRouter ? "✅" : "❌");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 NOR CHAIN HANDLER DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📝 SAVE THESE DETAILS:");
  console.log("\n  NorChainSwapHandler:", handlerAddress);
  console.log("  NoorSwap Router:", noorSwapRouter);
  console.log("  NOR Bridge:", norBridge);
  console.log("  BTCBR Bridge:", btcbrBridge);
  console.log("\n  Validators:");
  validators.forEach((v, i) => {
    console.log(`    ${i + 1}. ${v}`);
  });

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Update CrossChainSwapRouter on BSC with this handler address");
  console.log("  2. Build validator service");
  console.log("  3. Test cross-chain swap flow");

  console.log("\n🔗 NorChain Explorer:");
  console.log(`  https://explorer.norchain.org/address/${handlerAddress}`);

  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\n💰 Final Balance:", ethers.formatEther(finalBalance), "NOR");
  console.log("  Gas used:", ethers.formatEther(balance - finalBalance), "NOR");

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!");

  // Save deployment info
  const deploymentInfo = {
    network: "NorChain",
    chainId: 65001,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      NorChainSwapHandler: handlerAddress,
      NoorSwapRouter: noorSwapRouter,
      NORBridge: norBridge,
      BTCBRBridge: btcbrBridge
    },
    validators: validators,
    gasUsed: ethers.formatEther(balance - finalBalance)
  };

  console.log("\n💾 Deployment info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
