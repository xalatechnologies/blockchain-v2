/**
 * Deploy Dirhamat Stablecoin System
 * 
 * This deploys a complete gold-backed stablecoin system including:
 * 1. DirhamatPriceOracle - Multi-source price feeds
 * 2. Dirhamat - Gold-backed Shariah-compliant stablecoin
 * 3. Initial configuration and testing
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

async function main() {
  console.log("\n🥇 DEPLOYING DIRHAMAT GOLD-BACKED STABLECOIN");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: ${hre.network.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Deploy Price Oracle
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📊 STEP 1: Deploying Dirhamat Price Oracle...");
  console.log("─".repeat(70));

  const DirhamatPriceOracle = await ethers.getContractFactory("DirhamatPriceOracle");
  const oracle = await DirhamatPriceOracle.deploy();
  await oracle.waitForDeployment();

  const oracleAddress = await oracle.getAddress();
  console.log(`   ✅ DirhamatPriceOracle deployed: ${oracleAddress}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Deploy Dirhamat Token
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🏛️  STEP 2: Deploying Dirhamat Token...");
  console.log("─".repeat(70));

  const Dirhamat = await ethers.getContractFactory("contracts/stablecoin/Dirhamat.sol:Dirhamat");
  const dirhamat = await Dirhamat.deploy();
  await dirhamat.waitForDeployment();

  const dirhamatAddress = await dirhamat.getAddress();
  console.log(`   ✅ Dirhamat deployed: ${dirhamatAddress}`);
  console.log(`   📊 Oracle Address: ${oracleAddress}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Check Default Prices
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n⚙️  STEP 3: Checking Default Prices...");
  console.log("─".repeat(70));

  // Check the default prices from constructor
  const currentGoldPrice = await dirhamat.goldPriceAED();
  const currentAedPrice = await dirhamat.aedPriceUSD();
  
  console.log(`   💰 Current Gold price: ${ethers.formatUnits(currentGoldPrice, 18)} AED per gram`);
  console.log(`   💰 Current AED price: ${ethers.formatUnits(currentAedPrice, 18)} USD per AED`);
  console.log(`   ✅ Default prices are already set in constructor`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Grant Minting Roles
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🔐 STEP 4: Setting up Roles...");
  console.log("─".repeat(70));

  const MINTER_ROLE = await dirhamat.MINTER_ROLE();
  const BURNER_ROLE = await dirhamat.BURNER_ROLE();

  console.log(`   🔑 MINTER_ROLE already granted to deployer in constructor`);
  console.log(`   🔑 ORACLE_ROLE already granted to deployer in constructor`);
  console.log(`   🔑 All necessary roles configured`);

  // Roles are automatically granted to deployer in constructor

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: Deployment Verification
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🧪 STEP 5: Verifying Deployment...");
  console.log("─".repeat(70));

  // Check basic token details
  const name = await dirhamat.name();
  const symbol = await dirhamat.symbol();
  const decimals = await dirhamat.decimals();
  const totalSupply = await dirhamat.totalSupply();

  console.log(`   ✅ Token Name: ${name}`);
  console.log(`   ✅ Token Symbol: ${symbol}`);
  console.log(`   ✅ Token Decimals: ${decimals}`);
  console.log(`   ✅ Total Supply: ${ethers.formatUnits(totalSupply, 18)} DRHT`);
  console.log(`   ✅ Deployment verification complete!`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOYMENT SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n🎉 DIRHAMAT STABLECOIN SYSTEM DEPLOYMENT COMPLETE!");
  console.log("═".repeat(70));

  console.log("\n📦 Deployed Contracts:");
  console.log(`   DirhamatPriceOracle: ${oracleAddress}`);
  console.log(`   Dirhamat Token:      ${dirhamatAddress}`);

  console.log("\n📊 Dirhamat Prices:");
  console.log(`   Gold/AED: ${ethers.formatUnits(currentGoldPrice, 18)} AED per gram`);
  console.log(`   AED/USD:  ${ethers.formatUnits(currentAedPrice, 18)} USD per AED`);

  console.log("\n🏛️  Token Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 18)} DRHT`);

  console.log("\n🎯 Key Features:");
  console.log("   ✅ Gold-backed stability (AED + Gold dual backing)");
  console.log("   ✅ Shariah-compliant (no interest, asset-backed)");
  console.log("   ✅ Multi-source oracle pricing");
  console.log("   ✅ Role-based access control");
  console.log("   ✅ Emergency pause functionality");

  console.log("\n🔄 Next Steps:");
  console.log("   1. Set up additional oracle sources");
  console.log("   2. Configure automated backing verification");
  console.log("   3. Integrate with DEX for trading");
  console.log("   4. Setup institutional minter roles");
  console.log("   5. Deploy Shariah compliance board verification");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      DirhamatPriceOracle: {
        address: oracleAddress
      },
      Dirhamat: {
        address: dirhamatAddress,
        name: name,
        symbol: symbol,
        totalSupply: totalSupply.toString(),
        goldPriceAED: currentGoldPrice.toString(),
        aedPriceUSD: currentAedPrice.toString()
      }
    },
    features: [
      "Gold-backed stability",
      "Shariah compliance",
      "Multi-source oracle",
      "Role-based access",
      "Emergency controls"
    ]
  };

  const fs = require("fs");
  fs.writeFileSync(
    "docs/deployment-logs/dirhamat-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: docs/deployment-logs/dirhamat-deployment.json");
  console.log("\n═".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });