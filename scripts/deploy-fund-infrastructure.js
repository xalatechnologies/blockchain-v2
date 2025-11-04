import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🏦 Deploying Nor Chain Fund Infrastructure\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  // Load existing deployment
  const deployment = JSON.parse(
    fs.readFileSync("./deployments/dex-infrastructure.json", "utf8")
  );

  // ========================================
  // Step 1: Deploy NorFundFactory
  // ========================================
  console.log("=".repeat(70));
  console.log("📦 DEPLOYING FUND FACTORY");
  console.log("=".repeat(70));

  console.log("\nDeploying NorFundFactory...");
  const NorFundFactory = await ethers.getContractFactory("NorFundFactory");
  const factory = await NorFundFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ NorFundFactory deployed to:", factoryAddress);

  // ========================================
  // Step 2: Create Gold Savings Fund (Pilot)
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("🥇 CREATING GOLD SAVINGS FUND (PILOT)");
  console.log("=".repeat(70));

  console.log("\nFund Parameters:");
  console.log("  Name: Nor Gold Savings Fund Shares");
  console.log("  Symbol: NGSF");
  console.log("  Shariah Structure: Murabahah / Wakalah");
  console.log("  Management Fee: 1.5% annually (150 basis points)");
  console.log("  Minimum Investment: $1,000 USD");

  const goldFundTx = await factory.createFund(
    "Nor Gold Savings Fund Shares", // Token name
    "NGSF", // Token symbol
    "Gold Savings Fund", // Display name
    "Murabahah / Wakalah", // Shariah structure
    150, // 1.5% annual management fee
    ethers.parseEther("1000") // $1,000 minimum investment
  );

  console.log("\nWaiting for fund creation transaction...");
  const receipt = await goldFundTx.wait();

  // Extract fund address from event
  const fundCreatedEvent = receipt.logs.find((log) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed && parsed.name === "FundCreated";
    } catch {
      return false;
    }
  });

  const goldFundAddress = fundCreatedEvent
    ? factory.interface.parseLog(fundCreatedEvent).args.fundAddress
    : null;
  console.log("✅ Gold Savings Fund deployed to:", goldFundAddress);

  // ========================================
  // Step 3: Configure Gold Savings Fund
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("⚙️  CONFIGURING GOLD SAVINGS FUND");
  console.log("=".repeat(70));

  const goldFund = await ethers.getContractAt("NorFund", goldFundAddress);

  // Grant FUND_MANAGER_ROLE to deployer
  console.log("\n0. Granting FUND_MANAGER_ROLE to deployer...");
  const FUND_MANAGER_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("FUND_MANAGER_ROLE")
  );
  await (await goldFund.grantRole(FUND_MANAGER_ROLE, deployer.address)).wait();
  console.log("   ✅ Role granted");

  // Add gold asset from MultiAssetReserveVault
  console.log("\n1. Adding Physical Gold Asset...");
  const goldAssetId = ethers.keccak256(
    ethers.toUtf8Bytes("GOLD_VAULT_PRIMARY")
  );

  await (
    await goldFund.addAsset(
      goldAssetId,
      1, // AssetType.GOLD
      ethers.ZeroAddress,
      10000, // 10,000 grams
      ethers.parseEther("650000"), // $650k value
      "Physical gold stored in Dubai vault - audited",
      true // Shariah compliant
    )
  ).wait();
  console.log("   ✅ Gold asset added: 10,000 grams = $650,000");

  // Add Dirhamat liquidity
  console.log("\n2. Adding Dirhamat Liquidity...");
  const dirhamatAssetId = ethers.keccak256(
    ethers.toUtf8Bytes("DIRHAMAT_LIQUIDITY")
  );

  await (
    await goldFund.addAsset(
      dirhamatAssetId,
      5, // AssetType.CASH_EQUIVALENTS
      deployment.contracts.DIRHAMAT,
      ethers.parseEther("200000"), // 200,000 DIRHAMAT
      ethers.parseEther("54000"), // $54k value (at $0.27/DIRHAMAT)
      "Dirhamat stablecoin reserves for liquidity",
      true // Shariah compliant
    )
  ).wait();
  console.log("   ✅ Dirhamat asset added: 200,000 DIRHAMAT = $54,000");

  // Add WUSDT reserve
  console.log("\n3. Adding WUSDT Reserve...");
  const wusdtAssetId = ethers.keccak256(ethers.toUtf8Bytes("WUSDT_RESERVE"));

  await (
    await goldFund.addAsset(
      wusdtAssetId,
      5, // AssetType.CASH_EQUIVALENTS
      deployment.contracts.WUSDT,
      ethers.parseEther("50000"), // 50,000 WUSDT
      ethers.parseEther("50000"), // $50k value
      "WUSDT stablecoin reserves for redemptions",
      true // Shariah compliant
    )
  ).wait();
  console.log("   ✅ WUSDT asset added: 50,000 WUSDT = $50,000");

  // ========================================
  // Step 4: Set Initial NAV
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("📊 SETTING INITIAL NAV");
  console.log("=".repeat(70));

  // Grant NAV_ORACLE_ROLE to deployer
  console.log("\nGranting NAV_ORACLE_ROLE to deployer...");
  const NAV_ORACLE_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("NAV_ORACLE_ROLE")
  );
  await (await goldFund.grantRole(NAV_ORACLE_ROLE, deployer.address)).wait();
  console.log("✅ Role granted");

  const totalAssetValue = 650000 + 54000 + 50000; // $754,000
  console.log("\nTotal Asset Value: $" + totalAssetValue.toLocaleString());

  await (
    await goldFund.updateNAV(
      ethers.parseEther(totalAssetValue.toString()),
      "QmInitialNAV" // Placeholder IPFS hash
    )
  ).wait();
  console.log("✅ Initial NAV set: $" + totalAssetValue.toLocaleString());

  // ========================================
  // Step 5: Get Fund Status
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("📈 FUND STATUS");
  console.log("=".repeat(70));

  const metrics = await goldFund.getPerformanceMetrics();
  const allocation = await goldFund.getAssetAllocation();

  console.log("\n💎 Gold Savings Fund Metrics:");
  console.log("  NAV: $" + ethers.formatEther(metrics.totalAssetValue));
  console.log(
    "  Share Price: $" + ethers.formatEther(metrics.currentSharePrice)
  );
  console.log("  Total Shares: " + ethers.formatEther(metrics.totalShares));
  console.log(
    "  Management Fee: " + Number(metrics.managementFeeAnnual) / 100 + "%"
  );
  console.log("  Total Investors: " + metrics.numberOfInvestors.toString());

  console.log("\n📊 Asset Allocation:");
  console.log(
    "  Gold: $" +
      ethers.formatEther(allocation.goldValue) +
      " (" +
      (
        (Number(ethers.formatEther(allocation.goldValue)) / totalAssetValue) *
        100
      ).toFixed(1) +
      "%)"
  );
  console.log(
    "  Cash/Dirhamat: $" +
      ethers.formatEther(allocation.cashValue) +
      " (" +
      (
        (Number(ethers.formatEther(allocation.cashValue)) / totalAssetValue) *
        100
      ).toFixed(1) +
      "%)"
  );

  // ========================================
  // Step 6: Save Deployment
  // ========================================
  deployment.funds = {
    FACTORY: factoryAddress,
    GOLD_SAVINGS_FUND: goldFundAddress,
  };

  deployment.fundAssets = {
    GOLD: goldAssetId,
    DIRHAMAT: dirhamatAssetId,
    WUSDT: wusdtAssetId,
  };

  fs.writeFileSync(
    "./deployments/dex-infrastructure.json",
    JSON.stringify(deployment, null, 2)
  );

  // ========================================
  // Final Summary
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("✅ FUND INFRASTRUCTURE DEPLOYED SUCCESSFULLY");
  console.log("=".repeat(70));

  console.log("\n📋 Deployed Contracts:");
  console.log("  Factory: " + factoryAddress);
  console.log("  Gold Savings Fund: " + goldFundAddress);

  console.log("\n🏦 Gold Savings Fund Details:");
  console.log("  Total Value: $" + totalAssetValue.toLocaleString());
  console.log("  Asset Allocation:");
  console.log("    - Gold (86.2%): $650,000");
  console.log("    - Dirhamat (7.2%): $54,000");
  console.log("    - WUSDT (6.6%): $50,000");
  console.log("  Management Fee: 1.5% annually");
  console.log("  Minimum Investment: $1,000");
  console.log("  Share Price: $1.00 (initial)");

  console.log("\n🎯 Next Steps:");
  console.log("  1. Verify fund with regulator");
  console.log("  2. Test subscription ($1,000 minimum)");
  console.log("  3. Test redemption flow");
  console.log("  4. Deploy fund dashboard");
  console.log("  5. Open for public subscriptions");

  console.log(
    "\n💾 Deployment saved to: deployments/dex-infrastructure.json\n"
  );

  return {
    factory: factoryAddress,
    goldFund: goldFundAddress,
    nav: "$" + totalAssetValue.toLocaleString(),
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
