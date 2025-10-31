import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🛒 BUYING TEST TOKENS ON PANCAKESWAP...\n");

  const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC);
  const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);

  console.log(`💼 Wallet: ${wallet.address}\n`);

  // Check BNB balance
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log(`Current BNB Balance: ${ethers.formatEther(bnbBalance)} BNB\n`);

  if (parseFloat(ethers.formatEther(bnbBalance)) < 0.07) {
    console.log("❌ Not enough BNB! Need at least 0.07 BNB for swaps + gas");
    process.exit(1);
  }

  // PancakeSwap Router V2
  const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const routerAbi = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
  ];
  const router = new ethers.Contract(routerAddress, routerAbi, wallet);

  // Token addresses
  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // WBNB on BSC
  const USDT = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC
  const ETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";  // ETH on BSC

  // Deadline: 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  console.log("═".repeat(60));
  console.log("\n💱 SWAP 1: BNB → USDT\n");

  // Swap 1: 0.03 BNB → USDT
  const bnbAmountForUSDT = ethers.parseEther("0.03");
  const pathUSDT = [WBNB, USDT];

  // Get expected USDT amount
  const expectedUSDT = await router.getAmountsOut(bnbAmountForUSDT, pathUSDT);
  console.log(`Swapping: ${ethers.formatEther(bnbAmountForUSDT)} BNB`);
  console.log(`Expected: ${ethers.formatEther(expectedUSDT[1])} USDT`);
  console.log(`Minimum: ${ethers.formatEther(expectedUSDT[1] * 95n / 100n)} USDT (5% slippage)\n`);

  // Execute swap
  const minUSDT = expectedUSDT[1] * 95n / 100n; // 5% slippage tolerance
  const swapTx1 = await router.swapExactETHForTokens(
    minUSDT,
    pathUSDT,
    wallet.address,
    deadline,
    { value: bnbAmountForUSDT, gasLimit: 300000 }
  );

  console.log(`Swap TX: ${swapTx1.hash}`);
  console.log(`View: https://bscscan.com/tx/${swapTx1.hash}`);
  console.log("\n⏳ Waiting for confirmation...");

  await swapTx1.wait();
  console.log("✅ USDT swap confirmed!\n");

  // Check USDT balance
  const usdtAbi = ["function balanceOf(address) view returns (uint256)"];
  const usdtContract = new ethers.Contract(USDT, usdtAbi, provider);
  const usdtBalance = await usdtContract.balanceOf(wallet.address);
  console.log(`✅ New USDT Balance: ${ethers.formatEther(usdtBalance)} USDT\n`);

  console.log("═".repeat(60));
  console.log("\n💱 SWAP 2: BNB → ETH\n");

  // Swap 2: 0.03 BNB → ETH
  const bnbAmountForETH = ethers.parseEther("0.03");
  const pathETH = [WBNB, ETH];

  // Get expected ETH amount
  const expectedETH = await router.getAmountsOut(bnbAmountForETH, pathETH);
  console.log(`Swapping: ${ethers.formatEther(bnbAmountForETH)} BNB`);
  console.log(`Expected: ${ethers.formatEther(expectedETH[1])} ETH`);
  console.log(`Minimum: ${ethers.formatEther(expectedETH[1] * 95n / 100n)} ETH (5% slippage)\n`);

  // Execute swap
  const minETH = expectedETH[1] * 95n / 100n; // 5% slippage tolerance
  const swapTx2 = await router.swapExactETHForTokens(
    minETH,
    pathETH,
    wallet.address,
    deadline,
    { value: bnbAmountForETH, gasLimit: 300000 }
  );

  console.log(`Swap TX: ${swapTx2.hash}`);
  console.log(`View: https://bscscan.com/tx/${swapTx2.hash}`);
  console.log("\n⏳ Waiting for confirmation...");

  await swapTx2.wait();
  console.log("✅ ETH swap confirmed!\n");

  // Check ETH balance
  const ethContract = new ethers.Contract(ETH, usdtAbi, provider);
  const ethBalance = await ethContract.balanceOf(wallet.address);
  console.log(`✅ New ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

  console.log("═".repeat(60));
  console.log("\n🎉 ALL SWAPS COMPLETE!\n");

  // Final summary
  const finalBnbBalance = await provider.getBalance(wallet.address);
  const bnbSpent = bnbBalance - finalBnbBalance;

  console.log("📊 SUMMARY:");
  console.log(`   BNB Spent: ${ethers.formatEther(bnbSpent)} BNB (~$${(parseFloat(ethers.formatEther(bnbSpent)) * 600).toFixed(2)})`);
  console.log(`   USDT Received: ${ethers.formatEther(usdtBalance)} USDT`);
  console.log(`   ETH Received: ${ethers.formatEther(ethBalance)} ETH`);
  console.log(`   Remaining BNB: ${ethers.formatEther(finalBnbBalance)} BNB\n`);

  console.log("═".repeat(60));
  console.log("\n🎯 NEXT STEPS:\n");
  console.log("1. Test USDT Bridge:");
  console.log("   npx hardhat run scripts/test-usdt-bridge.js --network bsc\n");
  console.log("2. Test ETH Bridge:");
  console.log("   npx hardhat run scripts/test-eth-bridge.js --network bsc\n");
  console.log("3. Check validator logs:");
  console.log("   pm2 logs bridge-validator\n");
  console.log("═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
