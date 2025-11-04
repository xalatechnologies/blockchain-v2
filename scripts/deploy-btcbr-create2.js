import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🏭 Deploying BTCBR via CREATE2 for Deterministic Address\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  // ========================================
  // Step 1: Deploy CREATE2Factory
  // ========================================
  console.log("=".repeat(70));
  console.log("📦 DEPLOYING CREATE2 FACTORY");
  console.log("=".repeat(70));

  console.log("\nDeploying CREATE2Factory...");
  const CREATE2Factory = await ethers.getContractFactory("CREATE2Factory");
  const factory = await CREATE2Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ CREATE2Factory deployed to:", factoryAddress);

  // ========================================
  // Step 2: Prepare BTCBR bytecode
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("🔧 PREPARING BTCBR BYTECODE");
  console.log("=".repeat(70));

  const BTCBRFactory = await ethers.getContractFactory("MintableBTCBR");
  const btcbrBytecode = BTCBRFactory.bytecode;
  console.log("\n✅ BTCBR bytecode prepared");
  console.log("   Length:", btcbrBytecode.length, "characters");

  // ========================================
  // Step 3: Compute deterministic address
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("🎯 COMPUTING DETERMINISTIC ADDRESS");
  console.log("=".repeat(70));

  // Use a memorable salt for Nor Chain
  const salt = ethers.keccak256(ethers.toUtf8Bytes("NOOR_CHAIN_BTCBR_V1"));
  console.log("\n📝 Salt:", salt);

  const predictedAddress = await factory.computeAddress(btcbrBytecode, salt);
  console.log("🎯 Predicted BTCBR Address:", predictedAddress);

  // Check if already deployed
  const isDeployed = await factory.isDeployed(predictedAddress);
  if (isDeployed) {
    console.log("⚠️  Contract already deployed at this address!");
    console.log("   Using existing deployment...");
  } else {
    // ========================================
    // Step 4: Deploy BTCBR via CREATE2
    // ========================================
    console.log("\n" + "=".repeat(70));
    console.log("🚀 DEPLOYING BTCBR VIA CREATE2");
    console.log("=".repeat(70));

    console.log("\nDeploying BTCBR to:", predictedAddress);
    const deployTx = await factory.deploy(btcbrBytecode, salt);
    await deployTx.wait();
    console.log("✅ BTCBR deployed successfully!");

    // Verify deployment
    const deployedAddress = await factory.computeAddress(btcbrBytecode, salt);
    const actuallyDeployed = await factory.isDeployed(deployedAddress);
    console.log("✅ Deployment verified:", actuallyDeployed);
  }

  // ========================================
  // Step 5: Connect to BTCBR and mint initial supply
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("💰 MINTING INITIAL SUPPLY");
  console.log("=".repeat(70));

  const btcbr = await ethers.getContractAt("MintableBTCBR", predictedAddress);

  // Mint 21 billion BTCBR (with 18 decimals)
  const initialSupply = ethers.parseEther("21000000000"); // 21 billion
  console.log("\nMinting initial supply...");
  console.log("  Amount: 21,000,000,000 BTCBR");
  console.log("  To:", deployer.address);

  const mintTx = await btcbr.mint(deployer.address, initialSupply);
  await mintTx.wait();
  console.log("✅ Initial supply minted!");

  // Verify balance
  const balance_btcbr = await btcbr.balanceOf(deployer.address);
  console.log(
    "\n📊 Deployer BTCBR Balance:",
    ethers.formatEther(balance_btcbr),
    "BTCBR"
  );

  // ========================================
  // Step 6: Save deployment info
  // ========================================
  const deployment = {
    timestamp: new Date().toISOString(),
    network: "norchain",
    chainId: "65001",
    deployer: deployer.address,
    contracts: {
      CREATE2_FACTORY: factoryAddress,
      BTCBR: predictedAddress,
    },
    deployment: {
      method: "CREATE2",
      salt: salt,
      bytecode: btcbrBytecode,
    },
    supply: {
      initial: "21000000000",
      decimals: 18,
      holder: deployer.address,
    },
  };

  // Update or create deployment file
  let existingDeployment = {};
  try {
    existingDeployment = JSON.parse(
      fs.readFileSync("./deployments/dex-infrastructure.json", "utf8")
    );
  } catch (e) {
    // File doesn't exist, create new
  }

  existingDeployment.btcbr = deployment;
  fs.writeFileSync(
    "./deployments/dex-infrastructure.json",
    JSON.stringify(existingDeployment, null, 2)
  );

  // ========================================
  // Final Summary
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("✅ BTCBR DEPLOYED VIA CREATE2");
  console.log("=".repeat(70));

  console.log("\n📋 Deployment Details:");
  console.log("  CREATE2 Factory:", factoryAddress);
  console.log("  BTCBR Address:", predictedAddress);
  console.log("  Initial Supply: 21 billion BTCBR");
  console.log("  Decimals: 18");
  console.log("  Deployment Method: CREATE2");

  console.log("\n🎯 Key Advantages:");
  console.log("  ✅ Deterministic address (same across all chains)");
  console.log("  ✅ Can pre-compute address before deployment");
  console.log("  ✅ Same address if redeployed with same salt");
  console.log("  ✅ No genesis modification needed");

  console.log(
    "\n💾 Deployment saved to: deployments/dex-infrastructure.json\n"
  );

  return {
    factory: factoryAddress,
    btcbr: predictedAddress,
    supply: "21 billion BTCBR",
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
