import hre from "hardhat";
const { ethers } = hre;

// Fix SSL for NorChain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * COMPLETE NORCHAIN DEX DEPLOYMENT
 *
 * Deploys:
 * 1. WNOR (Wrapped NOR)
 * 2. NorSwap Factory
 * 3. NorSwap Router
 * 4. Creates NOR/USDT pair
 * 5. Adds initial liquidity
 */

async function main() {
  console.log("\n🚀 NORCHAIN DEX COMPLETE DEPLOYMENT");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "NOR");

  if (balance < ethers.parseEther("1")) {
    throw new Error("Insufficient balance for deployment (need at least 1 NOR for gas)");
  }

  // Step 1: Deploy WNOR
  console.log("\n" + "=".repeat(70));
  console.log("1️⃣  DEPLOYING WNOR (Wrapped NOR)");
  console.log("=".repeat(70));

  const WNOR = await ethers.getContractFactory("WNOR");
  const wnor = await WNOR.deploy();
  await wnor.waitForDeployment();
  const wnorAddress = await wnor.getAddress();

  console.log("✅ WNOR deployed at:", wnorAddress);

  // Verify WNOR
  const wnorName = await wnor.name();
  const wnorSymbol = await wnor.symbol();
  console.log("   Name:", wnorName);
  console.log("   Symbol:", wnorSymbol);

  // Step 2: Deploy Factory
  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  DEPLOYING NORSWAP FACTORY");
  console.log("=".repeat(70));

  const Factory = await ethers.getContractFactory("NorSwapFactory");
  const factory = await Factory.deploy(deployer.address); // feeToSetter
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ Factory deployed at:", factoryAddress);
  console.log("   Fee Setter:", deployer.address);

  // Step 3: Deploy Router
  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  DEPLOYING NORSWAP ROUTER");
  console.log("=".repeat(70));

  const Router = await ethers.getContractFactory("NorSwapRouter");
  const router = await Router.deploy(factoryAddress, wnorAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();

  console.log("✅ Router deployed at:", routerAddress);
  console.log("   Factory:", factoryAddress);
  console.log("   WNOR:", wnorAddress);

  // Save deployment info
  console.log("\n" + "=".repeat(70));
  console.log("💾 SAVING DEPLOYMENT INFO");
  console.log("=".repeat(70));

  const deploymentInfo = {
    network: "NorChain",
    chainId: 65001,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      WNOR: {
        address: wnorAddress,
        name: wnorName,
        symbol: wnorSymbol
      },
      Factory: {
        address: factoryAddress,
        feeToSetter: deployer.address
      },
      Router: {
        address: routerAddress,
        factory: factoryAddress,
        wnor: wnorAddress
      }
    }
  };

  const fs = await import("fs");
  const deploymentPath = "docs/deployment-logs/norchain-dex-deployment.json";

  if (!fs.existsSync("docs/deployment-logs")) {
    fs.mkdirSync("docs/deployment-logs", { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📋 DEPLOYED CONTRACTS:\n");
  console.log(`   WNOR:    ${wnorAddress}`);
  console.log(`   Factory: ${factoryAddress}`);
  console.log(`   Router:  ${routerAddress}`);

  console.log("\n📝 NEXT STEPS:\n");
  console.log("   1. Verify contracts on block explorer");
  console.log("   2. Create trading pairs:");
  console.log(`      node scripts/create-norchain-pairs.js`);
  console.log("   3. Add liquidity:");
  console.log(`      node scripts/add-norchain-liquidity.js`);

  console.log("\n💡 QUICK START:\n");
  console.log(`   export WNOR_ADDRESS=${wnorAddress}`);
  console.log(`   export FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`   export ROUTER_ADDRESS=${routerAddress}`);

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:", error);
    process.exit(1);
  });
