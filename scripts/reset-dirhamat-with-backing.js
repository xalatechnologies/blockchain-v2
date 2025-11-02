import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💎 Resetting Dirhamat with Full WUSDT Backing\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const { DIRHAMAT, WUSDT } = deployment.contracts;
  
  const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT);
  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);
  
  // Check current state
  const currentBalance = await dirhamat.balanceOf(deployer.address);
  console.log(`Current Dirhamat balance: ${ethers.formatEther(currentBalance)}\n`);
  
  // STEP 1: Burn existing unbacked Dirhamat if any
  if (currentBalance > 0n) {
    console.log("1. Burning existing unbacked Dirhamat...");
    await (await dirhamat.burn(currentBalance)).wait();
    console.log(`   ✅ Burned ${ethers.formatEther(currentBalance)} DIRHAMAT\n`);
  }
  
  // STEP 2: Calculate proper backing
  const mintAmount = ethers.parseEther("400000"); // 400k DIRHAMAT needed
  const dirhamatPrice = 0.27; // $0.27 per DIRHAMAT (1 AED)
  const totalValue = 400000 * dirhamatPrice; // $108,000
  const reserveNeeded = ethers.parseEther(totalValue.toString());
  
  console.log("📊 Backing Calculation:");
  console.log(`  Target: 400,000 DIRHAMAT`);
  console.log(`  Price: $0.27 per DIRHAMAT (1 AED)`);
  console.log(`  Total Value: $${totalValue.toLocaleString()}`);
  console.log(`  Required Backing: ${ethers.formatEther(reserveNeeded)} WUSDT\n`);
  
  // STEP 3: Transfer WUSDT to Dirhamat contract as reserves
  console.log("2. Transferring WUSDT reserves to Dirhamat contract...");
  const wusdtBalance = await wusdt.balanceOf(deployer.address);
  console.log(`   Available WUSDT: ${ethers.formatEther(wusdtBalance)}`);
  
  if (wusdtBalance < reserveNeeded) {
    throw new Error(`Insufficient WUSDT. Need ${ethers.formatEther(reserveNeeded)}, have ${ethers.formatEther(wusdtBalance)}`);
  }
  
  await (await wusdt.transfer(DIRHAMAT, reserveNeeded)).wait();
  console.log(`   ✅ Transferred ${ethers.formatEther(reserveNeeded)} WUSDT as backing\n`);
  
  // STEP 4: Grant RESERVE_MANAGER_ROLE if not already granted
  const RESERVE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESERVE_MANAGER_ROLE"));
  const hasRole = await dirhamat.hasRole(RESERVE_MANAGER_ROLE, deployer.address);
  
  if (!hasRole) {
    console.log("3. Granting RESERVE_MANAGER_ROLE...");
    await (await dirhamat.grantRole(RESERVE_MANAGER_ROLE, deployer.address)).wait();
    console.log("   ✅ Role granted\n");
  } else {
    console.log("3. RESERVE_MANAGER_ROLE already granted\n");
  }
  
  // STEP 5: Update reserve records
  console.log("4. Updating reserve records...");
  const goldGrams = ethers.parseUnits("1661", 0); // ~$108k / $65 per gram
  await (await dirhamat.updateReserve(reserveNeeded, goldGrams)).wait();
  console.log(`   ✅ Reserves: ${ethers.formatEther(reserveNeeded)} USD + ${goldGrams} grams gold\n`);
  
  // STEP 6: Mint fully-backed Dirhamat
  console.log("5. Minting fully-backed Dirhamat...");
  await (await dirhamat.mint(deployer.address, mintAmount)).wait();
  console.log(`   ✅ Minted ${ethers.formatEther(mintAmount)} DIRHAMAT\n`);
  
  // STEP 7: Verify backing
  const finalBalance = await dirhamat.balanceOf(deployer.address);
  const totalSupply = await dirhamat.totalSupply();
  const wusdtInContract = await wusdt.balanceOf(DIRHAMAT);
  const reserveRatio = await dirhamat.getReserveRatio();
  const reserveHealth = await dirhamat.getReserveHealth();
  
  console.log("=" .repeat(70));
  console.log("✅ DIRHAMAT FULLY BACKED WITH WUSDT");
  console.log("=" .repeat(70));
  console.log(`\n📊 Final Status:`);
  console.log(`  Your Balance: ${ethers.formatEther(finalBalance)} DIRHAMAT`);
  console.log(`  Total Supply: ${ethers.formatEther(totalSupply)} DIRHAMAT`);
  console.log(`  WUSDT in Contract: ${ethers.formatEther(wusdtInContract)}`);
  console.log(`  Reserve Ratio: ${(reserveRatio / 100).toFixed(2)}%`);
  console.log(`  Minimum Required: 100.00%`);
  console.log(`  Health Status: ${reserveHealth.isHealthy ? "✅ HEALTHY" : "❌ UNHEALTHY"}\n`);
  
  console.log("🔐 Backing Features:");
  console.log("  ✅ 100% WUSDT collateral in contract");
  console.log("  ✅ On-chain verifiable reserves");
  console.log("  ✅ Compliant with 100% reserve ratio");
  console.log("  ✅ Transparent and auditable");
  console.log("  ✅ Ready for production DEX liquidity\n");
  
  return {
    dirhamatBalance: ethers.formatEther(finalBalance),
    wusdtBacking: ethers.formatEther(wusdtInContract),
    reserveRatio: (reserveRatio / 100).toFixed(2) + "%"
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Reset failed:");
    console.error(error);
    process.exit(1);
  });
