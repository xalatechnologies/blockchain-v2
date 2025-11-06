import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

// Fix SSL for NorChain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * DEPLOY PRICE ORACLE CONTRACT
 *
 * Deploys to both BSC and NorChain for cross-chain price monitoring
 */

async function deployToChain(chainName, network, rpcUrl) {
  console.log(`\n📍 Deploying to ${chainName}...`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("  Deployer:", wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("  Balance:", ethers.formatEther(balance));

  // Deploy contract
  const PriceOracle = await ethers.getContractFactory(
    "contracts/oracle/PriceOracle.sol:PriceOracle",
    wallet
  );

  console.log("  ⏳ Deploying contract...");
  const oracle = await PriceOracle.deploy();

  await oracle.waitForDeployment();
  const address = await oracle.getAddress();

  console.log("  ✅ Deployed at:", address);

  return {
    address,
    deployer: wallet.address,
    network: chainName,
    chainId: network.chainId
  };
}

async function main() {
  console.log("\n🔮 DEPLOYING PRICE ORACLE");
  console.log("=".repeat(70));

  const deployments = {};

  // Deploy to BSC
  try {
    deployments.bsc = await deployToChain(
      "BSC Mainnet",
      { chainId: 56 },
      "https://bsc-dataseed.binance.org"
    );
  } catch (error) {
    console.log("  ❌ BSC deployment failed:", error.message);
  }

  // Deploy to NorChain
  try {
    deployments.norchain = await deployToChain(
      "NorChain",
      { chainId: 65001 },
      "https://rpc.xaheen.org"
    );
  } catch (error) {
    console.log("  ❌ NorChain deployment failed:", error.message);
  }

  // Save deployment info
  const deploymentData = {
    timestamp: new Date().toISOString(),
    deployments,
    usage: {
      bsc: "Monitors BSC PancakeSwap prices",
      norchain: "Monitors NorChain NorSwap prices"
    }
  };

  if (!fs.existsSync("docs/deployment-logs")) {
    fs.mkdirSync("docs/deployment-logs", { recursive: true });
  }

  fs.writeFileSync(
    "docs/deployment-logs/price-oracle-deployment.json",
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log("🎉 ORACLE DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📋 DEPLOYED ORACLES:");
  if (deployments.bsc) {
    console.log("  BSC:", deployments.bsc.address);
  }
  if (deployments.norchain) {
    console.log("  NorChain:", deployments.norchain.address);
  }

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Start monitoring bot:");
  console.log("   node scripts/monitoring-bot.js");
  console.log("\n2. Bot will:");
  console.log("   - Check prices every hour");
  console.log("   - Update oracle contracts");
  console.log("   - Alert on large deviations");
  console.log("   - Trigger auto-rebalancing if needed");

  console.log("\n💾 Deployment saved to:");
  console.log("   docs/deployment-logs/price-oracle-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
