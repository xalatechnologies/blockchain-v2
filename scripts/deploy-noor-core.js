/**
 * @title Nor Chain Core Deployment Script (Without Governance)
 * @notice Deploys core Nor Chain contracts (9 production-ready contracts)
 * @dev Run with: npx hardhat run scripts/deploy-nor-core.js --network btcbr
 *
 * Deployment Order:
 * 1. NOR Token
 * 2. MockOracle (for testing)
 * 3. DEX (Factory, Router)
 * 4. Stablecoins (Dirhamat, Digital KES, NORDCoin)
 * 5. FundUnit
 */

import hre from "hardhat";
import fs from "fs";

const { ethers } = hre;

async function main() {
  console.log("🌙 Nor Chain Core Deployment Started\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\n📝 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  const deployedContracts = {
    network: "Nor Chain Mainnet",
    chainId: 65001,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  try {
    // ==================== 1. NOR TOKEN ====================
    console.log("=".repeat(60));
    console.log("1️⃣  Deploying NOR Token...");
    console.log("=".repeat(60));

    const NOR = await ethers.getContractFactory("NOR");
    const norToken = await NOR.deploy();
    await norToken.waitForDeployment();
    const norAddress = await norToken.getAddress();

    deployedContracts.contracts.NOR = norAddress;

    console.log("✅ NOR Token deployed to:", norAddress);
    const totalSupply = await norToken.totalSupply();
    console.log("   Total Supply:", ethers.formatUnits(totalSupply, 24), "NOR");
    console.log("   Decimals:", await norToken.decimals());

    // ==================== 2. MOCK ORACLE ====================
    console.log("\n" + "=".repeat(60));
    console.log("2️⃣  Deploying Mock Oracle...");
    console.log("=".repeat(60));

    const MockOracle = await ethers.getContractFactory("MockOracle");

    // Deploy oracles for each currency
    const goldOracle = await MockOracle.deploy();
    await goldOracle.waitForDeployment();
    const goldOracleAddress = await goldOracle.getAddress();

    const aedUsdOracle = await MockOracle.deploy();
    await aedUsdOracle.waitForDeployment();
    const aedUsdOracleAddress = await aedUsdOracle.getAddress();

    const kesUsdOracle = await MockOracle.deploy();
    await kesUsdOracle.waitForDeployment();
    const kesUsdOracleAddress = await kesUsdOracle.getAddress();

    const nokUsdOracle = await MockOracle.deploy();
    await nokUsdOracle.waitForDeployment();
    const nokUsdOracleAddress = await nokUsdOracle.getAddress();

    const sekUsdOracle = await MockOracle.deploy();
    await sekUsdOracle.waitForDeployment();
    const sekUsdOracleAddress = await sekUsdOracle.getAddress();

    const dkkUsdOracle = await MockOracle.deploy();
    await dkkUsdOracle.waitForDeployment();
    const dkkUsdOracleAddress = await dkkUsdOracle.getAddress();

    deployedContracts.contracts.Oracles = {
      goldOracle: goldOracleAddress,
      aedUsdOracle: aedUsdOracleAddress,
      kesUsdOracle: kesUsdOracleAddress,
      nokUsdOracle: nokUsdOracleAddress,
      sekUsdOracle: sekUsdOracleAddress,
      dkkUsdOracle: dkkUsdOracleAddress,
    };

    console.log("✅ Mock Oracles deployed:");
    console.log("   Gold Oracle:", goldOracleAddress);
    console.log("   AED/USD Oracle:", aedUsdOracleAddress);
    console.log("   KES/USD Oracle:", kesUsdOracleAddress);
    console.log("   NOK/USD Oracle:", nokUsdOracleAddress);
    console.log("   SEK/USD Oracle:", sekUsdOracleAddress);
    console.log("   DKK/USD Oracle:", dkkUsdOracleAddress);

    // Set initial prices (example values)
    await goldOracle.setPrice(ethers.parseEther("2000")); // $2000/oz
    await aedUsdOracle.setPrice(ethers.parseEther("0.27")); // AED to USD
    await kesUsdOracle.setPrice(ethers.parseEther("0.0077")); // KES to USD
    await nokUsdOracle.setPrice(ethers.parseEther("0.093")); // NOK to USD
    await sekUsdOracle.setPrice(ethers.parseEther("0.096")); // SEK to USD
    await dkkUsdOracle.setPrice(ethers.parseEther("0.145")); // DKK to USD

    console.log("✅ Oracle prices initialized");

    // ==================== 3. DEX ====================
    console.log("\n" + "=".repeat(60));
    console.log("3️⃣  Deploying NorSwap DEX...");
    console.log("=".repeat(60));

    // Deploy Factory
    const Factory = await ethers.getContractFactory("NorSwapFactory");
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    deployedContracts.contracts.NorSwapFactory = factoryAddress;

    console.log("✅ NorSwapFactory deployed to:", factoryAddress);

    // For now, we'll skip WNOR and Router as they may require additional setup
    // They can be deployed separately once WNOR contract is available

    // ==================== 4. STABLECOINS ====================
    console.log("\n" + "=".repeat(60));
    console.log("4️⃣  Deploying Stablecoins...");
    console.log("=".repeat(60));

    // Deploy Dirhamat (AED/Gold)
    const Dirhamat = await ethers.getContractFactory("Dirhamat");
    const dirhamat = await Dirhamat.deploy(
      goldOracleAddress,
      aedUsdOracleAddress,
      ethers.ZeroAddress // Compliance core can be set later
    );
    await dirhamat.waitForDeployment();
    const dirhamatAddress = await dirhamat.getAddress();

    deployedContracts.contracts.Dirhamat = dirhamatAddress;

    console.log("✅ Dirhamat deployed to:", dirhamatAddress);
    console.log("   Name:", await dirhamat.name());
    console.log("   Symbol:", await dirhamat.symbol());

    // Deploy Digital KES
    const DigitalKES = await ethers.getContractFactory("DigitalKES");
    const digitalKES = await DigitalKES.deploy(
      kesUsdOracleAddress,
      ethers.ZeroAddress // Compliance core can be set later
    );
    await digitalKES.waitForDeployment();
    const digitalKESAddress = await digitalKES.getAddress();

    deployedContracts.contracts.DigitalKES = digitalKESAddress;

    console.log("✅ Digital KES deployed to:", digitalKESAddress);
    console.log("   Name:", await digitalKES.name());
    console.log("   Symbol:", await digitalKES.symbol());

    // Deploy NORDCoin (Nordic)
    const NORDCoin = await ethers.getContractFactory("NORDCoin");
    const nordCoin = await NORDCoin.deploy(
      nokUsdOracleAddress,
      sekUsdOracleAddress,
      dkkUsdOracleAddress,
      ethers.ZeroAddress // Compliance core can be set later
    );
    await nordCoin.waitForDeployment();
    const nordCoinAddress = await nordCoin.getAddress();

    deployedContracts.contracts.NORDCoin = nordCoinAddress;

    console.log("✅ NORDCoin deployed to:", nordCoinAddress);
    console.log("   Name:", await nordCoin.name());
    console.log("   Symbol:", await nordCoin.symbol());

    // ==================== 5. FUND UNIT ====================
    console.log("\n" + "=".repeat(60));
    console.log("5️⃣  Deploying FundUnit...");
    console.log("=".repeat(60));

    const FundUnit = await ethers.getContractFactory("FundUnit");
    const fundUnit = await FundUnit.deploy(
      "Gold Savings Fund",
      "GSF",
      "Murabahah",
      norAddress,
      goldOracleAddress,
      ethers.ZeroAddress // Compliance core can be set later
    );
    await fundUnit.waitForDeployment();
    const fundUnitAddress = await fundUnit.getAddress();

    deployedContracts.contracts.FundUnit = fundUnitAddress;

    console.log("✅ FundUnit deployed to:", fundUnitAddress);
    console.log("   Name:", await fundUnit.name());
    console.log("   Symbol:", await fundUnit.symbol());

    // ==================== DEPLOYMENT COMPLETE ====================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));

    console.log("\n📋 Deployment Summary:");
    console.log("   Network: Nor Chain Mainnet (Chain ID: 65001)");
    console.log("   Deployer:", deployer.address);
    console.log("   Timestamp:", deployedContracts.timestamp);
    console.log("\n📝 Deployed Contracts:");
    console.log("   1. NOR Token:", deployedContracts.contracts.NOR);
    console.log(
      "   2. NorSwapFactory:",
      deployedContracts.contracts.NorSwapFactory
    );
    console.log("   3. Dirhamat:", deployedContracts.contracts.Dirhamat);
    console.log("   4. Digital KES:", deployedContracts.contracts.DigitalKES);
    console.log("   5. NORDCoin:", deployedContracts.contracts.NORDCoin);
    console.log("   6. FundUnit:", deployedContracts.contracts.FundUnit);
    console.log("   7. Oracles: 6 mock oracles deployed");

    // Save deployment info to file
    const deploymentFile = `deployments/nor-mainnet-${Date.now()}.json`;
    fs.mkdirSync("deployments", { recursive: true });
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deployedContracts, null, 2)
    );

    console.log("\n💾 Deployment info saved to:", deploymentFile);
    console.log("\n🌙 Nor Chain Core Deployment Successful! 🌙\n");
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
