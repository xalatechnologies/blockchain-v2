import hre from "hardhat";
import hre from "hardhat";
import fs from "fs";
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(80));
  console.log("DEPLOYING GOVERNANCE, STAKING, FARMING & ORACLES");
  console.log("=".repeat(80));
  console.log("\nDeploying with account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.getBalance()).toString(),
    "wei\n"
  );

  const deployments = {};

  // Token addresses (already deployed)
  const NOR_TOKEN = "0xCbE0EA61FDab09Cbd013C50cBF7c1dD969193C9b";
  const BTCBR_TOKEN = "0x1f4b942Bba4E923D4b663B3B4Dfd6E27f3dEa2c3";
  const DIRHAMAT_TOKEN = "0xd1a00bb0f0af75c20D58ABcF11590780003133D7";

  // LP Token addresses (already deployed pairs)
  const BTCBR_NOR_LP = "0x6509341929d0dC8376d2158d920287EF94594c53";
  const BTCBR_WETH_LP = "0xe28B0755E978f7B7302dddC14269ef4A209F74Ef";
  const NOR_WETH_LP = "0x820821265339b51c493d0D656AEBEFC2035e4CC4";
  const DIRHAMAT_WUSDT_LP = "0x16E5a61032F9280Ae650E740c933242FDA0FA373";

  // ========================================================================
  // 1. Deploy Governance
  // ========================================================================
  console.log("\n1. Deploying NorGovernance...");
  const NorGovernance = await ethers.getContractFactory("NorGovernance");
  const governance = await NorGovernance.deploy(
    NOR_TOKEN,
    deployer.address // Guardian
  );
  await governance.deployed();
  console.log("   ✓ NorGovernance deployed:", governance.address);
  deployments.governance = governance.address;

  // ========================================================================
  // 2. Deploy Staking
  // ========================================================================
  console.log("\n2. Deploying NorStaking...");
  const NorStaking = await ethers.getContractFactory("NorStaking");
  const staking = await NorStaking.deploy(
    NOR_TOKEN, // Staking token
    NOR_TOKEN // Reward token (same as staking)
  );
  await staking.deployed();
  console.log("   ✓ NorStaking deployed:", staking.address);
  deployments.staking = staking.address;

  // ========================================================================
  // 3. Deploy Farming
  // ========================================================================
  console.log("\n3. Deploying NorFarming...");
  const currentBlock = await ethers.provider.getBlockNumber();
  const NorFarming = await ethers.getContractFactory("NorFarming");
  const farming = await NorFarming.deploy(
    NOR_TOKEN,
    currentBlock + 100 // Start in 100 blocks (~20 minutes)
  );
  await farming.deployed();
  console.log("   ✓ NorFarming deployed:", farming.address);
  console.log("   ✓ Start block:", currentBlock + 100);
  deployments.farming = farming.address;

  // Add farming pools
  console.log("\n   Adding farming pools...");

  // BTCBR/NOR LP - Highest allocation (40%)
  await farming.addPool(4000, BTCBR_NOR_LP, false);
  console.log("   ✓ Added BTCBR/NOR LP pool (40% allocation)");

  // NOR/WETH LP - 30% allocation
  await farming.addPool(3000, NOR_WETH_LP, false);
  console.log("   ✓ Added NOR/WETH LP pool (30% allocation)");

  // DIRHAMAT/WUSDT LP - 20% allocation
  await farming.addPool(2000, DIRHAMAT_WUSDT_LP, false);
  console.log("   ✓ Added DIRHAMAT/WUSDT LP pool (20% allocation)");

  // BTCBR/WETH LP - 10% allocation
  await farming.addPool(1000, BTCBR_WETH_LP, false);
  console.log("   ✓ Added BTCBR/WETH LP pool (10% allocation)");

  // ========================================================================
  // 4. Deploy Price Oracle
  // ========================================================================
  console.log("\n4. Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy(
    [deployer.address], // Oracles
    [deployer.address] // Validators
  );
  await oracle.deployed();
  console.log("   ✓ PriceOracle deployed:", oracle.address);
  deployments.oracle = oracle.address;

  // Initialize prices
  console.log("\n   Initializing token prices...");

  // BTCBR: $0.0001
  await oracle.emergencySetPrice(
    BTCBR_TOKEN,
    ethers.utils.parseUnits("0.0001", 18),
    10000
  );
  console.log("   ✓ BTCBR price set: $0.0001");

  // NOR: $0.01
  await oracle.emergencySetPrice(
    NOR_TOKEN,
    ethers.utils.parseUnits("0.01", 18),
    10000
  );
  console.log("   ✓ NOR price set: $0.01");

  // Dirhamat: $0.27 (AED peg)
  await oracle.emergencySetPrice(
    DIRHAMAT_TOKEN,
    ethers.utils.parseUnits("0.27", 18),
    10000
  );
  console.log("   ✓ Dirhamat price set: $0.27");

  // ========================================================================
  // 5. Deploy Chainlink Aggregators
  // ========================================================================
  console.log("\n5. Deploying Chainlink Price Aggregators...");
  const ChainlinkAggregator = await ethers.getContractFactory(
    "ChainlinkPriceAggregator"
  );

  // BTCBR/USD Feed
  const btcbrFeed = await ChainlinkAggregator.deploy("BTCBR/USD", 8);
  await btcbrFeed.deployed();
  await btcbrFeed.updateAnswer(10000); // $0.0001 with 8 decimals
  console.log("   ✓ BTCBR/USD Feed:", btcbrFeed.address);
  deployments.btcbrFeed = btcbrFeed.address;

  // NOR/USD Feed
  const norFeed = await ChainlinkAggregator.deploy("NOR/USD", 8);
  await norFeed.deployed();
  await norFeed.updateAnswer(1000000); // $0.01 with 8 decimals
  console.log("   ✓ NOR/USD Feed:", norFeed.address);
  deployments.norFeed = norFeed.address;

  // DIRHAMAT/USD Feed
  const dirhamatFeed = await ChainlinkAggregator.deploy("DIRHAMAT/USD", 8);
  await dirhamatFeed.deployed();
  await dirhamatFeed.updateAnswer(27000000); // $0.27 with 8 decimals
  console.log("   ✓ DIRHAMAT/USD Feed:", dirhamatFeed.address);
  deployments.dirhamatFeed = dirhamatFeed.address;

  // ========================================================================
  // Summary
  // ========================================================================
  console.log("\n" + "=".repeat(80));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(80));
  console.log("\nGovernance & DAO:");
  console.log("  NorGovernance:", deployments.governance);
  console.log("\nStaking & Farming:");
  console.log("  NorStaking:", deployments.staking);
  console.log("  NorFarming:", deployments.farming);
  console.log("\nPrice Oracles:");
  console.log("  PriceOracle:", deployments.oracle);
  console.log("  BTCBR/USD Feed:", deployments.btcbrFeed);
  console.log("  NOR/USD Feed:", deployments.norFeed);
  console.log("  DIRHAMAT/USD Feed:", deployments.dirhamatFeed);

  console.log("\n" + "=".repeat(80));
  console.log("NEXT STEPS:");
  console.log("=".repeat(80));
  console.log("1. Fund staking contract with NOR rewards");
  console.log("2. Fund farming contract with NOR rewards");
  console.log("3. Create governance proposals for parameter updates");
  console.log("4. Users can now stake NOR and farm LP tokens");
  console.log("5. Price feeds available for external integrations");
  console.log("=".repeat(80));

  // Save deployment info
  const deploymentData = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: deployments,
  };

  fs.writeFileSync(
    "deployments/nor-governance-staking-oracles.json",
    JSON.stringify(deploymentData, null, 2)
  );

  console.log(
    "\n✓ Deployment info saved to deployments/nor-governance-staking-oracles.json\n"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
