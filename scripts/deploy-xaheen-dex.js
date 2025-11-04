import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n🚀 DEPLOYING XAHEEN DEX (Uniswap V2 Fork)");
  console.log("=".repeat(70));

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 NOR Balance:", ethers.formatEther(balance), "NOR");

  if (balance < ethers.parseEther("1000")) {
    throw new Error(
      "❌ Insufficient NOR balance. Need at least 1000 NOR for deployment."
    );
  }

  console.log("\n📝 STEP 1/4: Deploying WNOR (Wrapped NOR)...");

  // WNOR Contract
  const WNOR = await ethers.getContractFactory(
    "contracts/dex/WNOR.sol:WNOR",
    wallet
  );
  const wxht = await WNOR.deploy();
  await wxht.waitForDeployment();
  const wxhtAddress = await wxht.getAddress();

  console.log("✅ WNOR deployed:", wxhtAddress);

  console.log("\n📝 STEP 2/4: Deploying NorDEXFactory...");

  // Revenue contract (can be zero address for now)
  const revenueContract = "0x0000000000000000000000000000000000000000";

  // Factory Contract
  const Factory = await ethers.getContractFactory(
    "contracts/dex/NorDEXFactory.sol:NorDEXFactory",
    wallet
  );
  const factory = await Factory.deploy(wallet.address, revenueContract); // feeToSetter, revenueContract
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ Factory deployed:", factoryAddress);

  console.log("\n📝 STEP 3/4: Deploying NorDEXRouter...");

  // Router Contract
  const Router = await ethers.getContractFactory(
    "contracts/dex/NorDEXRouter.sol:NorDEXRouter",
    wallet
  );
  const router = await Router.deploy(factoryAddress, wxhtAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();

  console.log("✅ Router deployed:", routerAddress);

  console.log("\n📝 STEP 4/4: Verifying deployment...");

  // Verify Factory-Router connection
  const factoryFromRouter = await router.factory();

  console.log("\n✅ VERIFICATION:");
  console.log("  Factory from Router:", factoryFromRouter);
  console.log("  Match Factory:", factoryFromRouter === factoryAddress);

  // Save deployment addresses
  const deployment = {
    network: "Nor Chain",
    chainId: 65001,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {
      WNOR: wxhtAddress,
      Factory: factoryAddress,
      Router: routerAddress,
    },
    rpc: "https://rpc.xaheen.org",
    explorer: "https://explorer.xaheen.org",
  };

  const deploymentPath = "docs/deployment-logs/xaheen-dex-deployment.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("\n💾 Deployment saved to:", deploymentPath);

  console.log("\n🎉 DEX DEPLOYMENT COMPLETE!");
  console.log("\n📊 CONTRACT ADDRESSES:");
  console.log("  WNOR:", wxhtAddress);
  console.log("  Factory:", factoryAddress);
  console.log("  Router:", routerAddress);

  console.log("\n🔍 VERIFY ON EXPLORER:");
  console.log("  WNOR:", `https://explorer.xaheen.org/address/${wxhtAddress}`);
  console.log(
    "  Factory:",
    `https://explorer.xaheen.org/address/${factoryAddress}`
  );
  console.log(
    "  Router:",
    `https://explorer.xaheen.org/address/${routerAddress}`
  );

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Deploy or bridge USDT:");
  console.log("   node scripts/deploy-test-usdt.js");
  console.log("\n2. Add liquidity:");
  console.log("   node scripts/add-initial-liquidity-xaheen.js");

  console.log("\n" + "=".repeat(70));

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
