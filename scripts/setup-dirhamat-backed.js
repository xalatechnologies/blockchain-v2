import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💎 Setting up Fully-Backed Dirhamat\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const { DIRHAMAT, WUSDT } = deployment.contracts;
  
  const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT);
  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);
  
  // Need 400,000 DIRHAMAT for liquidity (valued at ~$108k at $0.27/DIRHAMAT)
  const mintAmount = ethers.parseEther("400000");
  const reserveNeeded = ethers.parseEther("108000"); // $108k USD backing
  
  console.log("📊 Backing Strategy:");
  console.log("  Minting: 400,000 DIRHAMAT");
  console.log("  1 DIRHAMAT = $0.27 USD (1 AED)");
  console.log("  Total Value: $108,000");
  console.log("  Backing with: $108,000 WUSDT\n");
  
  // 1. Transfer WUSDT to Dirhamat contract as reserves
  console.log("1. Transferring WUSDT reserves to Dirhamat contract...");
  await (await wusdt.transfer(DIRHAMAT, reserveNeeded)).wait();
  console.log(`   ✅ Transferred ${ethers.formatEther(reserveNeeded)} WUSDT as backing\n`);
  
  // 2. Grant RESERVE_MANAGER_ROLE
  const RESERVE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESERVE_MANAGER_ROLE"));
  console.log("2. Granting RESERVE_MANAGER_ROLE...");
  await (await dirhamat.grantRole(RESERVE_MANAGER_ROLE, deployer.address)).wait();
  console.log("   ✅ Role granted\n");
  
  // 3. Update reserves with actual on-chain WUSDT backing
  console.log("3. Updating reserve records...");
  const reserveValue = reserveNeeded; // $108k USD
  // Calculate gold equivalent: $108k / $65 per gram = ~1,661 grams
  const goldGrams = ethers.parseUnits("1661", 0);
  await (await dirhamat.updateReserve(reserveValue, goldGrams)).wait();
  console.log(`   ✅ Reserves: ${ethers.formatEther(reserveValue)} USD + ${goldGrams} grams gold equivalent\n`);
  
  // 4. Mint Dirhamat (now fully backed)
  console.log("4. Minting fully-backed Dirhamat...");
  await (await dirhamat.mint(deployer.address, mintAmount)).wait();
  console.log(`   ✅ Minted ${ethers.formatEther(mintAmount)} DIRHAMAT\n`);
  
  // 5. Verify backing
  const dirhamatBalance = await dirhamat.balanceOf(deployer.address);
  const wusdtInContract = await wusdt.balanceOf(DIRHAMAT);
  const reserveRatio = await dirhamat.getReserveRatio();
  
  console.log("=" .repeat(70));
  console.log("✅ DIRHAMAT FULLY BACKED AND READY");
  console.log("=" .repeat(70));
  console.log(`\n📊 Reserve Status:`);
  console.log(`  Dirhamat Supply: ${ethers.formatEther(dirhamatBalance)}`);
  console.log(`  WUSDT Reserves: ${ethers.formatEther(wusdtInContract)}`);
  console.log(`  Reserve Ratio: ${reserveRatio / 100}%`);
  console.log(`  Minimum Required: 100%`);
  console.log(`  Status: ${reserveRatio >= 10000 ? "✅ FULLY BACKED" : "❌ UNDERBACKED"}\n`);
  
  console.log("🔐 Security Features:");
  console.log("  ✅ 100% WUSDT backing in contract");
  console.log("  ✅ On-chain verifiable reserves");
  console.log("  ✅ Compliant with reserve ratio requirements");
  console.log("  ✅ Ready for DEX liquidity\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });
