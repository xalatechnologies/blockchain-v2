import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💰 DEPLOYING ALL TOKENOMICS CONTRACTS");
  console.log("=".repeat(70));

  // Load DEX deployment info
  const dexDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/xaheen-dex-deployment.json", "utf8")
  );
  const usdtDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/test-usdt-deployment.json", "utf8")
  );
  const liquidityInfo = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/xaheen-liquidity-deployed.json",
      "utf8"
    )
  );

  const ROUTER_ADDR = dexDeployment.contracts.Router;
  const FACTORY_ADDR = dexDeployment.contracts.Factory;
  const WNOR_ADDR = dexDeployment.contracts.WNOR;
  const USDT_ADDR = usdtDeployment.contract.address;
  const PAIR_ADDR = liquidityInfo.pair;

  console.log("\n📍 Contract Addresses:");
  console.log("  Router:", ROUTER_ADDR);
  console.log("  Factory:", FACTORY_ADDR);
  console.log("  WNOR:", WNOR_ADDR);
  console.log("  USDT:", USDT_ADDR);
  console.log("  NOR/USDT Pair:", PAIR_ADDR);

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("  Balance:", ethers.formatEther(balance), "NOR");

  const deployments = {};

  // 1. Deploy NORCharity
  console.log("\n" + "=".repeat(70));
  console.log("📝 DEPLOYING NOR CHARITY CONTRACT");
  console.log("=".repeat(70));

  const NORCharity = await ethers.getContractFactory("NORCharity", wallet);
  console.log("\n⏳ Deploying NORCharity...");

  const charityContract = await NORCharity.deploy();
  await charityContract.waitForDeployment();
  const charityAddr = await charityContract.getAddress();

  console.log("✅ NORCharity deployed:", charityAddr);

  // Verify
  const charityOwner = await charityContract.owner();

  console.log("\n🔍 Verification:");
  console.log("  Owner:", charityOwner);

  deployments.charity = {
    address: charityAddr,
    owner: charityOwner,
  };

  // 2. Deploy WeeklyBuyback
  console.log("\n" + "=".repeat(70));
  console.log("📝 DEPLOYING WEEKLY BUYBACK CONTRACT");
  console.log("=".repeat(70));

  const WeeklyBuyback = await ethers.getContractFactory(
    "WeeklyBuyback",
    wallet
  );
  console.log("\n⏳ Deploying WeeklyBuyback...");

  // WeeklyBuyback needs: NOR token, USDT, Router, Treasury, LP Manager
  // NOR token is WNOR (the wrapped native token)
  // Treasury and LP Manager can be the deployer wallet for now
  const buybackContract = await WeeklyBuyback.deploy(
    WNOR_ADDR, // NOR token
    USDT_ADDR, // USDT token
    ROUTER_ADDR, // Router
    wallet.address, // Treasury (deployer wallet)
    wallet.address // LP Manager (deployer wallet)
  );
  await buybackContract.waitForDeployment();
  const buybackAddr = await buybackContract.getAddress();

  console.log("✅ WeeklyBuyback deployed:", buybackAddr);

  // Verify
  const router = await buybackContract.router();
  const xhtToken = await buybackContract.xhtToken();
  const usdtToken = await buybackContract.usdtToken();
  const treasury = await buybackContract.treasury();
  const lpManager = await buybackContract.lpManager();

  console.log("\n🔍 Verification:");
  console.log("  Router:", router);
  console.log("  NOR Token:", xhtToken);
  console.log("  USDT Token:", usdtToken);
  console.log("  Treasury:", treasury);
  console.log("  LP Manager:", lpManager);

  deployments.buyback = {
    address: buybackAddr,
    router: router,
    xhtToken: xhtToken,
    usdtToken: usdtToken,
    treasury: treasury,
    lpManager: lpManager,
  };

  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    chainId: 65001,
    deployer: wallet.address,
    contracts: deployments,
  };

  fs.writeFileSync(
    "docs/deployment-logs/tokenomics-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log(
    "💾 Deployment info saved to: docs/deployment-logs/tokenomics-deployment.json"
  );

  console.log("\n📊 DEPLOYMENT SUMMARY:");
  console.log("\n🎗️  Charity Contract:");
  console.log("  Address:", charityAddr);
  console.log("  Owner:", charityOwner);
  console.log(
    "  Explorer:",
    `https://explorer.xaheen.org/address/${charityAddr}`
  );

  console.log("\n🔄 Buyback Contract:");
  console.log("  Address:", buybackAddr);
  console.log("  Router:", router);
  console.log("  NOR Token:", xhtToken);
  console.log("  USDT Token:", usdtToken);
  console.log("  Treasury:", treasury);
  console.log("  LP Manager:", lpManager);
  console.log(
    "  Explorer:",
    `https://explorer.xaheen.org/address/${buybackAddr}`
  );

  console.log("\n" + "=".repeat(70));
  console.log("🎉 ALL TOKENOMICS CONTRACTS DEPLOYED!");
  console.log("=".repeat(70));

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Fund buyback contract with USDT:");
  console.log("   node scripts/fund-buyback-contract.js");
  console.log("\n2. Execute first buyback:");
  console.log("   node scripts/execute-buyback.js");
  console.log("\n3. Configure revenue distribution");
  console.log("\n4. Setup charity campaigns");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
