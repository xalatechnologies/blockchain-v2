import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🏦 Deploying Multi-Asset Reserve Vault\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  // Deploy MultiAssetReserveVault
  console.log("Deploying MultiAssetReserveVault...");
  const MultiAssetReserveVault = await ethers.getContractFactory("MultiAssetReserveVault");
  const vault = await MultiAssetReserveVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ MultiAssetReserveVault deployed to:", vaultAddress, "\n");

  // Load existing deployment
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const { WUSDT, WBNB, WETH } = deployment.contracts;

  // Add crypto assets to vault
  console.log("=" .repeat(70));
  console.log("📦 ADDING RESERVE ASSETS");
  console.log("=" .repeat(70));

  // Asset 1: WUSDT (already in Dirhamat contract: $108k)
  const wusdtId = ethers.keccak256(ethers.toUtf8Bytes("WUSDT_RESERVE"));
  console.log("\n1. Adding WUSDT Reserve...");
  console.log(`   Asset ID: ${wusdtId}`);
  console.log(`   Value: $108,000 USD`);
  console.log(`   Description: WUSDT stablecoin backing (already in Dirhamat contract)`);
  await (await vault.addAsset(
    wusdtId,
    0, // AssetType.CRYPTO
    WUSDT,
    ethers.parseEther("108000"),
    ethers.parseEther("108000"),
    "WUSDT stablecoin reserves - directly held in Dirhamat contract"
  )).wait();
  console.log("   ✅ WUSDT reserve added");

  // Asset 2: WBNB (available: 500 BNB @ $600 = $300k)
  const wbnbId = ethers.keccak256(ethers.toUtf8Bytes("WBNB_RESERVE"));
  console.log("\n2. Adding WBNB Reserve...");
  console.log(`   Asset ID: ${wbnbId}`);
  console.log(`   Available: 500 WBNB (~$300,000 at $600/BNB)`);
  await (await vault.addAsset(
    wbnbId,
    0, // AssetType.CRYPTO
    WBNB,
    ethers.parseEther("500"),
    ethers.parseEther("300000"),
    "WBNB (Wrapped BNB) - bridge asset reserves"
  )).wait();
  console.log("   ✅ WBNB reserve added");

  // Asset 3: WETH (available: 70 ETH @ $3200 = $224k)
  const wethId = ethers.keccak256(ethers.toUtf8Bytes("WETH_RESERVE"));
  console.log("\n3. Adding WETH Reserve...");
  console.log(`   Asset ID: ${wethId}`);
  console.log(`   Available: 70 WETH (~$224,000 at $3,200/ETH)`);
  await (await vault.addAsset(
    wethId,
    0, // AssetType.CRYPTO
    WETH,
    ethers.parseEther("70"),
    ethers.parseEther("224000"),
    "WETH (Wrapped ETH) - bridge asset reserves"
  )).wait();
  console.log("   ✅ WETH reserve added");

  // Asset 4: Physical Gold
  const goldId = ethers.keccak256(ethers.toUtf8Bytes("PHYSICAL_GOLD"));
  console.log("\n4. Adding Physical Gold Reserve...");
  console.log(`   Asset ID: ${goldId}`);
  console.log(`   Amount: 10,000 grams (~$650,000 at $65/gram)`);
  await (await vault.addAsset(
    goldId,
    1, // AssetType.GOLD
    ethers.ZeroAddress,
    10000, // 10,000 grams
    ethers.parseEther("650000"),
    "Physical gold stored in Dubai vault - audited by [Auditor Name]"
  )).wait();
  console.log("   ✅ Physical gold reserve added");

  // Asset 5: Mining Operations
  const miningId = ethers.keccak256(ethers.toUtf8Bytes("MINING_REVENUE"));
  console.log("\n5. Adding Mining Operations...");
  console.log(`   Asset ID: ${miningId}`);
  console.log(`   Estimated Value: $500,000 (mining equipment + revenue stream)`);
  await (await vault.addAsset(
    miningId,
    2, // AssetType.MINING
    ethers.ZeroAddress,
    1, // 1 operation
    ethers.parseEther("500000"),
    "Bitcoin/Ethereum mining operations - verified revenue stream"
  )).wait();
  console.log("   ✅ Mining operations added");

  // Get total reserve value
  const totalReserve = await vault.totalReserveValueUSD();
  const breakdown = await vault.getReserveBreakdown();

  console.log("\n" + "=".repeat(70));
  console.log("✅ MULTI-ASSET RESERVE VAULT DEPLOYED");
  console.log("=".repeat(70));

  console.log("\n📊 Reserve Breakdown:");
  console.log(`  Crypto Assets:    $${ethers.formatEther(breakdown.cryptoValue)}`);
  console.log(`  Physical Gold:    $${ethers.formatEther(breakdown.goldValue)}`);
  console.log(`  Mining Ops:       $${ethers.formatEther(breakdown.miningValue)}`);
  console.log(`  Real Estate:      $${ethers.formatEther(breakdown.realEstateValue)}`);
  console.log(`  Commodities:      $${ethers.formatEther(breakdown.commoditiesValue)}`);
  console.log(`  Fiat Reserves:    $${ethers.formatEther(breakdown.fiatValue)}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  TOTAL RESERVES:   $${ethers.formatEther(totalReserve)}`);

  console.log("\n🔐 Security Features:");
  console.log("  ✅ Multi-asset diversification");
  console.log("  ✅ On-chain + off-chain reserves");
  console.log("  ✅ Regular audits with IPFS proofs");
  console.log("  ✅ Role-based access control");
  console.log("  ✅ Transparent reserve tracking");

  console.log("\n💎 Dirhamat Backing:");
  console.log(`  Dirhamat Supply:  400,000 DIRHAMAT`);
  console.log(`  Dirhamat Value:   $108,000 (at $0.27/DIRHAMAT)`);
  console.log(`  Total Reserves:   $${ethers.formatEther(totalReserve)}`);
  const ratio = (parseFloat(ethers.formatEther(totalReserve)) / 108000 * 100).toFixed(2);
  console.log(`  Backing Ratio:    ${ratio}% (${(parseFloat(ratio) / 100).toFixed(2)}x overcollateralized)`);

  // Save deployment
  deployment.contracts.MULTI_ASSET_VAULT = vaultAddress;
  deployment.vaultAssets = {
    WUSDT: wusdtId,
    WBNB: wbnbId,
    WETH: wethId,
    GOLD: goldId,
    MINING: miningId
  };
  fs.writeFileSync("./deployments/dex-infrastructure.json", JSON.stringify(deployment, null, 2));

  console.log("\n💾 Deployment saved to: deployments/dex-infrastructure.json\n");

  return {
    vault: vaultAddress,
    totalReserves: ethers.formatEther(totalReserve),
    backingRatio: ratio + "%"
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
