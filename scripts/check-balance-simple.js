/**
 * Simple balance checker for main wallet
 */

import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

// CORRECT NOR ADDRESS ON BSC
const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

async function main() {
  const [wallet] = await ethers.getSigners();

  console.log("\n========================================");
  console.log("🔍 Checking Your Balances on BSC");
  console.log("========================================\n");
  console.log(`Your Wallet: ${wallet.address}\n`);

  // Get NOR token
  const nor = await ethers.getContractAt("NOR_BSC", NOR_BSC);

  // Get balance
  const norBalance = await nor.balanceOf(wallet.address);
  const bnbBalance = await ethers.provider.getBalance(wallet.address);

  console.log("💰 BALANCES:\n");
  console.log(`  NOR:  ${ethers.formatEther(norBalance)} NOR`);
  console.log(`  BNB:  ${ethers.formatEther(bnbBalance)} BNB\n`);

  console.log("========================================");
  console.log("📝 Add NOR to MetaMask:");
  console.log("========================================\n");
  console.log("1. Open MetaMask");
  console.log("2. Switch to BSC Mainnet");
  console.log("3. Click 'Import tokens'");
  console.log("4. Copy and paste this address:\n");
  console.log(`   ${NOR_BSC}\n`);
  console.log("5. Symbol (NOR) and Decimals (18) will auto-fill");
  console.log("6. Click 'Add Custom Token'\n");
  console.log(`✅ You should see: ${ethers.formatEther(norBalance)} NOR\n`);

  console.log("========================================");
  console.log("🔗 View on BSCScan:");
  console.log("========================================\n");
  console.log(`https://bscscan.com/token/${NOR_BSC}?a=${wallet.address}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
