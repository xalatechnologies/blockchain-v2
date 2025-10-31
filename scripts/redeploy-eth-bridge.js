import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🚀 REDEPLOYING FIXED ETH BRIDGE...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}\n`);

  // Binance-Peg Ethereum Token on BSC
  const ethTokenAddress = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
  const requiredSignatures = 2;

  console.log("📋 DEPLOYMENT PARAMETERS:");
  console.log(`ETH Token: ${ethTokenAddress}`);
  console.log(`Required Signatures: ${requiredSignatures}\n`);

  // Deploy ETH Bridge on BSC
  console.log("🌉 Deploying ETH Bridge (BSC)...");
  const ETHBridgeMainnet = await ethers.getContractFactory("ETHBridgeMainnet");
  const ethBridgeBSC = await ETHBridgeMainnet.deploy(ethTokenAddress, requiredSignatures);
  await ethBridgeBSC.waitForDeployment();

  const ethBridgeBSCAddress = await ethBridgeBSC.getAddress();
  console.log(`✅ ETH Bridge (BSC) deployed: ${ethBridgeBSCAddress}\n`);

  // Add validators to BSC bridge
  console.log("👥 Adding validators to BSC bridge...");
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5"
  ];

  for (const validator of validators) {
    const tx = await ethBridgeBSC.addValidator(validator);
    await tx.wait();
    console.log(`  ✅ Added validator: ${validator}`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("\n✅ ETH BRIDGE (BSC) DEPLOYMENT COMPLETE!\n");
  console.log(`New Bridge Address: ${ethBridgeBSCAddress}`);
  console.log(`\n📝 UPDATE .env FILE:`);
  console.log(`ETH_BRIDGE_BSC=${ethBridgeBSCAddress}`);
  console.log(`\n🔗 Verify on BSCScan:`);
  console.log(`https://bscscan.com/address/${ethBridgeBSCAddress}`);
  console.log("\n" + "═".repeat(60));
  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Update .env with new ETH_BRIDGE_BSC address");
  console.log("2. Restart validator: pm2 restart bridge-validator");
  console.log("3. Run: npx hardhat run scripts/test-eth-bridge.js --network bsc\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
