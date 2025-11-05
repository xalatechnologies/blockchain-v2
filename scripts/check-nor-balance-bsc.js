/**
 * Check NOR balance on BSC for the main wallet
 */

import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const NOR_BSC_ADDRESS = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

async function main() {
  console.log("\n🔍 Checking NOR Balance on BSC Mainnet\n");
  console.log("======================================\n");

  const [wallet] = await ethers.getSigners();

  console.log(`Wallet: ${wallet.address}`);
  console.log(`NOR Token: ${NOR_BSC_ADDRESS}\n`);

  // Get NOR token contract
  const norToken = await ethers.getContractAt("NOR_BSC", NOR_BSC_ADDRESS);

  // Get token info
  const name = await norToken.name();
  const symbol = await norToken.symbol();
  const decimals = await norToken.decimals();

  console.log(`Token: ${name} (${symbol})`);
  console.log(`Decimals: ${decimals}\n`);

  // Get balance
  const balance = await norToken.balanceOf(wallet.address);
  const formattedBalance = ethers.formatUnits(balance, decimals);

  console.log(`✅ Balance: ${formattedBalance} ${symbol}`);
  console.log(`   Raw: ${balance.toString()}\n`);

  // Get BNB balance for comparison
  const bnbBalance = await ethers.provider.getBalance(wallet.address);
  console.log(`💰 BNB Balance: ${ethers.formatEther(bnbBalance)} BNB\n`);

  console.log("======================================\n");
  console.log("📝 To add NOR to MetaMask:");
  console.log(`   1. Open MetaMask`);
  console.log(`   2. Switch to BSC Mainnet`);
  console.log(`   3. Click "Import tokens"`);
  console.log(`   4. Paste: ${NOR_BSC_ADDRESS}`);
  console.log(`   5. Confirm (symbol & decimals auto-fill)\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
