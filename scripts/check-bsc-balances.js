import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🔍 CHECKING BSC BALANCES...\n");

  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);

  console.log(`💼 Wallet: ${wallet.address}\n`);

  // Check BNB balance
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log(`BNB Balance: ${ethers.formatEther(bnbBalance)} BNB`);
  console.log(`   Value: ~$${(parseFloat(ethers.formatEther(bnbBalance)) * 600).toFixed(2)}\n`);

  // Check USDT balance (BSC USDT: 0x55d398326f99059fF775485246999027B3197955)
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
  const usdtAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  const usdt = new ethers.Contract(usdtAddress, usdtAbi, provider);
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log(`USDT Balance: ${ethers.formatEther(usdtBalance)} USDT`);
  console.log(`   Value: ~$${ethers.formatEther(usdtBalance)}\n`);

  // Check ETH balance (BSC-pegged ETH: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8)
  const ethAddress = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
  const ethContract = new ethers.Contract(ethAddress, usdtAbi, provider);
  const ethBalance = await ethContract.balanceOf(wallet.address);
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
  console.log(`   Value: ~$${(parseFloat(ethers.formatEther(ethBalance)) * 2500).toFixed(2)}\n`);

  // Summary
  console.log("═".repeat(60));
  console.log("\n📊 TESTING RECOMMENDATIONS:\n");

  if (parseFloat(ethers.formatEther(bnbBalance)) > 0.05) {
    console.log("✅ You have BNB - can test BNB bridge (already tested!)");
  } else {
    console.log("⚠️  Low BNB - need at least 0.05 BNB to test");
  }

  if (parseFloat(ethers.formatEther(usdtBalance)) > 10) {
    console.log("✅ You have USDT - can test USDT bridge!");
  } else {
    console.log("⚠️  No USDT - need at least $10 USDT to test");
  }

  if (parseFloat(ethers.formatEther(ethBalance)) > 0.005) {
    console.log("✅ You have ETH - can test ETH bridge!");
  } else {
    console.log("⚠️  No ETH - need at least 0.005 ETH to test");
  }

  console.log("\n" + "═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
