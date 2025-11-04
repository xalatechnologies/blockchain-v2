import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🏭 Deploying NEW NorSwap Factory with Fixed Pair Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  // Deploy new factory
  console.log("1️⃣ Deploying NorSwapFactory...");
  const NorSwapFactory = await ethers.getContractFactory("NorSwapFactory");
  const factory = await NorSwapFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ NorSwapFactory deployed to:", factoryAddress);
  console.log("   Fee To Setter:", deployer.address);

  // Deploy new router for the new factory
  console.log("\n2️⃣ Deploying NorSwapRouter for new factory...");

  // Load existing deployment for WNOR
  const deployment = JSON.parse(
    fs.readFileSync("./deployments/dex-infrastructure.json", "utf8")
  );
  const WNOR = deployment.contracts.WNOR;

  const NorSwapRouter = await ethers.getContractFactory("NorSwapRouter");
  const router = await NorSwapRouter.deploy(factoryAddress, WNOR);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ NorSwapRouter deployed to:", routerAddress);
  console.log("   Factory:", factoryAddress);
  console.log("   WNOR:", WNOR);

  // Update deployment file
  const newDeployment = {
    timestamp: new Date().toISOString(),
    network: "btcbr",
    chainId: "65001",
    deployer: deployer.address,
    contracts: {
      NOR_TOKEN: deployment.contracts.NOR_TOKEN,
      NOORSWAP_FACTORY: factoryAddress,
      DIRHAMAT: deployment.contracts.DIRHAMAT,
      WNOR: deployment.contracts.WNOR,
      WUSDT: deployment.contracts.WUSDT,
      WBNB: deployment.contracts.WBNB,
      WETH: deployment.contracts.WETH,
      NOORSWAP_ROUTER: routerAddress,
      LIQUIDITY_LOCK: deployment.contracts.LIQUIDITY_LOCK,
      MULTI_ASSET_VAULT: deployment.contracts.MULTI_ASSET_VAULT,
    },
  };

  fs.writeFileSync(
    "./deployments/dex-infrastructure.json",
    JSON.stringify(newDeployment, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log("✅ NEW DEX INFRASTRUCTURE DEPLOYED WITH FIXED PAIR CONTRACT");
  console.log("=".repeat(70));
  console.log("\n📋 New Contract Addresses:");
  console.log("  NorSwapFactory:", factoryAddress, "⭐ NEW");
  console.log("  NorSwapRouter:", routerAddress, "⭐ NEW");
  console.log(
    "\n💾 Updated deployment file: ./deployments/dex-infrastructure.json"
  );
  console.log("\n🚀 Next: Run liquidity deployment script");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
