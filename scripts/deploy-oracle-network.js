/**
 * @title Deploy Nor Chain Oracle Network
 * @notice Deploys OracleAggregator contracts for all price feeds
 * @dev Run with: npx hardhat run scripts/deploy-oracle-network.js --network btcbr
 */

import hre from "hardhat";
import fs from "fs";

const { ethers } = hre;

// Oracle node addresses (your 3 validators or dedicated oracle wallets)
const ORACLE_NODES = [
  process.env.ORACLE_NODE_1 || "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD", // Validator 1
  process.env.ORACLE_NODE_2 || "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3", // Validator 2
  process.env.ORACLE_NODE_3 || "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5", // Validator 3
];

// Price feeds to deploy
const PRICE_FEEDS = [
  { name: "GOLD/USD", symbol: "GOLD_ORACLE" },
  { name: "AED/USD", symbol: "AED_ORACLE" },
  { name: "KES/USD", symbol: "KES_ORACLE" },
  { name: "NOK/USD", symbol: "NOK_ORACLE" },
  { name: "SEK/USD", symbol: "SEK_ORACLE" },
  { name: "DKK/USD", symbol: "DKK_ORACLE" },
];

async function main() {
  console.log("\n🌙 Nor Chain Oracle Network Deployment\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\n📝 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  console.log("📋 Oracle Nodes:");
  ORACLE_NODES.forEach((node, i) => {
    console.log(`   ${i + 1}. ${node}`);
  });
  console.log();

  const deployedOracles = {
    network: "Nor Chain Mainnet",
    chainId: 65001,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    oracleNodes: ORACLE_NODES,
    oracles: {},
  };

  try {
    const OracleAggregator = await ethers.getContractFactory(
      "OracleAggregator"
    );

    // Deploy oracle for each price feed
    for (const feed of PRICE_FEEDS) {
      console.log("=".repeat(60));
      console.log(`📊 Deploying ${feed.name} Oracle Aggregator...`);
      console.log("=".repeat(60));

      const oracle = await OracleAggregator.deploy(feed.name, ORACLE_NODES);

      await oracle.waitForDeployment();
      const oracleAddress = await oracle.getAddress();

      deployedOracles.oracles[feed.symbol] = {
        address: oracleAddress,
        priceFeed: feed.name,
      };

      console.log(`✅ ${feed.name} Oracle deployed to:`, oracleAddress);

      // Get configuration
      const minimumOracles = await oracle.minimumOracles();
      const stalenessThreshold = await oracle.stalenessThreshold();
      const deviationThreshold = await oracle.deviationThreshold();
      const activeOracles = await oracle.getActiveOracles();

      console.log(`   Minimum Oracles: ${minimumOracles}`);
      console.log(
        `   Staleness Threshold: ${stalenessThreshold} seconds (${
          Number(stalenessThreshold) / 3600
        } hours)`
      );
      console.log(`   Deviation Threshold: ${deviationThreshold}%`);
      console.log(`   Active Oracle Count: ${activeOracles.length}`);
      console.log();
    }

    console.log("=".repeat(60));
    console.log("🎉 ORACLE NETWORK DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));

    console.log("\n📝 Deployed Oracle Contracts:");
    Object.entries(deployedOracles.oracles).forEach(([symbol, data]) => {
      console.log(`   ${symbol}: ${data.address}`);
    });

    // Save deployment info to file
    const deploymentFile = `deployments/oracle-network-${Date.now()}.json`;
    fs.mkdirSync("deployments", { recursive: true });
    fs.writeFileSync(deploymentFile, JSON.stringify(deployedOracles, null, 2));

    console.log("\n💾 Deployment info saved to:", deploymentFile);

    // Generate oracle node .env file
    const envContent = `# Nor Chain Oracle Node Configuration
# Generated: ${new Date().toISOString()}

# Blockchain Connection
ORACLE_RPC_URL=https://rpc.norchain.org
ORACLE_PRIVATE_KEY=your_oracle_wallet_private_key_here

# Oracle Contract Addresses
${Object.entries(deployedOracles.oracles)
  .map(([symbol, data]) => {
    return `${symbol}_ADDRESS=${data.address}`;
  })
  .join("\n")}

# API Keys (optional but recommended)
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=

# Update Configuration
UPDATE_INTERVAL_SECONDS=300  # 5 minutes
GAS_PRICE_GWEI=1
`;

    const envFile = `oracle-node/.env.generated`;
    fs.writeFileSync(envFile, envContent);
    console.log("📝 Oracle node .env template saved to:", envFile);

    console.log("\n📋 Next Steps:");
    console.log("   1. Update oracle-node/.env with your ORACLE_PRIVATE_KEY");
    console.log("   2. Install oracle node dependencies:");
    console.log("      cd oracle-node && npm install");
    console.log("   3. Start oracle nodes on each validator:");
    console.log("      npm start");
    console.log("   4. Monitor oracle submissions:");
    console.log(
      "      Check blockchain for PriceSubmitted and PriceAggregated events"
    );

    console.log("\n🌙 Oracle Network Ready! 🌙\n");
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
