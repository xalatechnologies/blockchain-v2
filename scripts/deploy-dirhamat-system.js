/**
 * Deploy Dirhamat Stablecoin System
 * 
 * Components:
 * 1. DirhamatPriceOracle - Gold/AED/USD price feeds
 * 2. Dirhamat - Gold-backed stablecoin contract
 * 3. Initial price feeds and reserve management
 * 
 * Features:
 * - Gold-backed stability
 * - Shariah compliance
 * - Multi-oracle price feeds
 * - Reserve management
 * - Zakat calculation
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// Initial configuration
const INITIAL_GOLD_PRICE_AED = ethers.parseUnits("250", 18);  // 250 AED per gram
const INITIAL_AED_PRICE_USD = ethers.parseUnits("0.272", 18); // 0.272 USD per AED
const INITIAL_GOLD_RESERVES = ethers.parseUnits("1000", 6);   // 1000 grams of gold
const INITIAL_AED_RESERVES = ethers.parseUnits("250000", 18); // 250,000 AED

// Oracle configuration
const ORACLE_ADDRESSES = [
  "0xdD779a290C937144F80Eb75b75d814c834536B1b", // Deployer as initial oracle
  // Add more oracle addresses as needed
];

const ORACLE_WEIGHTS = [10000]; // 100% weight for single oracle initially

async function main() {
  console.log("\n🪙 DEPLOYING DIRHAMAT STABLECOIN SYSTEM");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: ${hre.network.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Deploy Price Oracle
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 1: Deploying Price Oracle...");
  console.log("─".repeat(70));

  const DirhamatPriceOracle = await ethers.getContractFactory("DirhamatPriceOracle");
  const priceOracle = await DirhamatPriceOracle.deploy();
  await priceOracle.waitForDeployment();

  const oracleAddress = await priceOracle.getAddress();
  console.log(`   ✅ DirhamatPriceOracle deployed: ${oracleAddress}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Deploy Dirhamat Token
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 2: Deploying Dirhamat Token...");
  console.log("─".repeat(70));

  const Dirhamat = await ethers.getContractFactory("Dirhamat");
  const dirhamat = await Dirhamat.deploy();
  await dirhamat.waitForDeployment();

  const dirhamatAddress = await dirhamat.getAddress();
  console.log(`   ✅ Dirhamat deployed: ${dirhamatAddress}`);
  console.log(`   💰 Name: Dirhamat`);
  console.log(`   💰 Symbol: DRHM`);
  console.log(`   💰 Decimals: 18`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Configure Price Oracle
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n⚙️  STEP 3: Configuring Price Oracle...");
  console.log("─".repeat(70));

  // Add oracles for each asset
  const GOLD_AED = ethers.keccak256(ethers.toUtf8Bytes("GOLD_AED"));
  const AED_USD = ethers.keccak256(ethers.toUtf8Bytes("AED_USD"));
  const GOLD_USD = ethers.keccak256(ethers.toUtf8Bytes("GOLD_USD"));

  console.log(`   🔧 Adding oracles for GOLD_AED...`);
  for (let i = 0; i < ORACLE_ADDRESSES.length; i++) {
    if (ORACLE_ADDRESSES[i] && ORACLE_WEIGHTS[i]) {
      await (await priceOracle.addOracle(
        GOLD_AED,
        ORACLE_ADDRESSES[i],
        ORACLE_WEIGHTS[i],
        `Gold Price Feed ${i + 1}`
      )).wait();
      console.log(`     ✅ Added oracle ${i + 1}: ${ORACLE_ADDRESSES[i]}`);
    }
  }

  console.log(`   🔧 Adding oracles for AED_USD...`);
  for (let i = 0; i < ORACLE_ADDRESSES.length; i++) {
    if (ORACLE_ADDRESSES[i] && ORACLE_WEIGHTS[i]) {
      await (await priceOracle.addOracle(
        AED_USD,
        ORACLE_ADDRESSES[i],
        ORACLE_WEIGHTS[i],
        `AED Price Feed ${i + 1}`
      )).wait();
      console.log(`     ✅ Added oracle ${i + 1}: ${ORACLE_ADDRESSES[i]}`);
    }
  }

  // Submit initial prices
  console.log(`   💱 Submitting initial prices...`);
  
  console.log(`     📊 Gold Price: ${ethers.formatUnits(INITIAL_GOLD_PRICE_AED, 18)} AED/gram`);
  await (await priceOracle.submitPrice(GOLD_AED, INITIAL_GOLD_PRICE_AED)).wait();
  
  console.log(`     📊 AED Price: ${ethers.formatUnits(INITIAL_AED_PRICE_USD, 18)} USD/AED`);
  await (await priceOracle.submitPrice(AED_USD, INITIAL_AED_PRICE_USD)).wait();

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Configure Dirhamat Contract
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n⚙️  STEP 4: Configuring Dirhamat Contract...");
  console.log("─".repeat(70));

  // Grant roles
  const MINTER_ROLE = await dirhamat.MINTER_ROLE();
  const ORACLE_ROLE = await dirhamat.ORACLE_ROLE();
  const AUDITOR_ROLE = await dirhamat.AUDITOR_ROLE();

  console.log(`   🏷️  Granting ORACLE_ROLE to price oracle...`);
  await (await dirhamat.grantRole(ORACLE_ROLE, oracleAddress)).wait();

  console.log(`   🏷️  Granting AUDITOR_ROLE to deployer (temporary)...`);
  await (await dirhamat.grantRole(AUDITOR_ROLE, deployer.address)).wait();

  // Update prices in Dirhamat contract
  console.log(`   💱 Setting initial prices in Dirhamat...`);
  await (await dirhamat.updatePrices(INITIAL_GOLD_PRICE_AED, INITIAL_AED_PRICE_USD)).wait();

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: Add Initial Reserves
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n💰 STEP 5: Adding Initial Reserves...");
  console.log("─".repeat(70));

  const auditHash = "QmPlaceholderAuditHashForInitialReserves";
  
  console.log(`   🥇 Adding gold reserves: ${ethers.formatUnits(INITIAL_GOLD_RESERVES, 6)} grams`);
  console.log(`   💵 Adding AED reserves: ${ethers.formatUnits(INITIAL_AED_RESERVES, 18)} AED`);
  
  await (await dirhamat.addReserves(
    INITIAL_GOLD_RESERVES,
    INITIAL_AED_RESERVES,
    0, // No USD reserves initially
    auditHash
  )).wait();

  console.log(`   ✅ Reserves added successfully`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 6: Test Minting
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🧪 STEP 6: Testing Dirhamat Minting...");
  console.log("─".repeat(70));

  // Enable deployer as Shariah-approved for testing
  await (await dirhamat.updateShariahCompliance(deployer.address, true)).wait();
  console.log(`   ✅ Deployer approved for Shariah compliance`);

  // Test mint 1000 DRHM
  const testMintAmount = ethers.parseUnits("1000", 18); // 1000 DRHM
  const testGoldBacking = ethers.parseUnits("4", 6);    // 4 grams of gold
  const testAedBacking = ethers.parseUnits("1000", 18); // 1000 AED

  console.log(`   🪙 Minting test amount: ${ethers.formatUnits(testMintAmount, 18)} DRHM`);
  console.log(`     🥇 Gold backing: ${ethers.formatUnits(testGoldBacking, 6)} grams`);
  console.log(`     💵 AED backing: ${ethers.formatUnits(testAedBacking, 18)} AED`);

  await (await dirhamat.mint(
    deployer.address,
    testMintAmount,
    testGoldBacking,
    testAedBacking
  )).wait();

  const balance = await dirhamat.balanceOf(deployer.address);
  console.log(`   ✅ Minted successfully! Balance: ${ethers.formatUnits(balance, 18)} DRHM`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 7: Check System Status
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📊 STEP 7: System Status Check...");
  console.log("─".repeat(70));

  // Get reserve status
  const reserveStatus = await dirhamat.getReserveStatus();
  console.log(`   📊 Reserve Status:`);
  console.log(`     Gold Price: ${ethers.formatUnits(reserveStatus[0], 18)} AED/gram`);
  console.log(`     AED Price: ${ethers.formatUnits(reserveStatus[1], 18)} USD/AED`);
  console.log(`     Total Gold: ${ethers.formatUnits(reserveStatus[2], 6)} grams`);
  console.log(`     Total AED: ${ethers.formatUnits(reserveStatus[3], 18)} AED`);
  console.log(`     Collateral Ratio: ${reserveStatus[4]}%`);
  console.log(`     Total Supply: ${ethers.formatUnits(reserveStatus[5], 18)} DRHM`);

  // Check oracle prices
  const [goldPrice, goldTimestamp, goldConfidence] = await priceOracle.getPrice(GOLD_AED);
  const [aedPrice, aedTimestamp, aedConfidence] = await priceOracle.getPrice(AED_USD);
  
  console.log(`   📊 Oracle Status:`);
  console.log(`     Gold Price: ${ethers.formatUnits(goldPrice, 18)} AED/gram (confidence: ${goldConfidence/100}%)`);
  console.log(`     AED Price: ${ethers.formatUnits(aedPrice, 18)} USD/AED (confidence: ${aedConfidence/100}%)`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOYMENT SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n🎉 DIRHAMAT SYSTEM DEPLOYMENT COMPLETE!");
  console.log("═".repeat(70));

  console.log("\n📦 Deployed Contracts:");
  console.log(`   DirhamatPriceOracle:   ${oracleAddress}`);
  console.log(`   Dirhamat (DRHM):       ${dirhamatAddress}`);

  console.log("\n💰 Initial Configuration:");
  console.log(`   Gold Price:     ${ethers.formatUnits(INITIAL_GOLD_PRICE_AED, 18)} AED/gram`);
  console.log(`   AED Price:      ${ethers.formatUnits(INITIAL_AED_PRICE_USD, 18)} USD/AED`);
  console.log(`   Gold Reserves:  ${ethers.formatUnits(INITIAL_GOLD_RESERVES, 6)} grams`);
  console.log(`   AED Reserves:   ${ethers.formatUnits(INITIAL_AED_RESERVES, 18)} AED`);
  console.log(`   Collateral Ratio: ${reserveStatus[4]}%`);

  console.log("\n🏛️  Shariah Features:");
  console.log(`   ✅ No interest-based mechanisms`);
  console.log(`   ✅ Profit-sharing model`);
  console.log(`   ✅ Zakat calculation built-in`);
  console.log(`   ✅ Shariah board governance`);
  console.log(`   ✅ Halal compliance monitoring`);

  console.log("\n🔄 Next Steps:");
  console.log("   1. Add more price oracles for redundancy");
  console.log("   2. Configure Shariah board members");
  console.log("   3. Integrate with DEX for trading pairs");
  console.log("   4. Setup automated reserve auditing");
  console.log("   5. Deploy cross-chain bridge contracts");
  console.log("   6. Configure emergency pause mechanisms");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      DirhamatPriceOracle: {
        address: oracleAddress,
        assets: ["GOLD_AED", "AED_USD", "GOLD_USD"],
        oracleCount: ORACLE_ADDRESSES.length
      },
      Dirhamat: {
        address: dirhamatAddress,
        name: "Dirhamat",
        symbol: "DRHM",
        decimals: 18,
        priceOracle: oracleAddress
      }
    },
    initialConfig: {
      goldPriceAED: INITIAL_GOLD_PRICE_AED.toString(),
      aedPriceUSD: INITIAL_AED_PRICE_USD.toString(),
      goldReserves: INITIAL_GOLD_RESERVES.toString(),
      aedReserves: INITIAL_AED_RESERVES.toString(),
      collateralRatio: Number(reserveStatus[4])
    },
    testMint: {
      amount: testMintAmount.toString(),
      recipient: deployer.address,
      balance: balance.toString()
    }
  };

  const fs = require("fs");
  fs.writeFileSync(
    "docs/deployment-logs/dirhamat-system-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: docs/deployment-logs/dirhamat-system-deployment.json");
  console.log("\n═".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });