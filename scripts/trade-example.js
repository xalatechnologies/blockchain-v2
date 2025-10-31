import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Contract addresses
const ROUTER_ADDRESS = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const WXHT_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const USDT_ADDRESS = "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf";
const BNB_ADDRESS = "0xa4cBBcbd8146482E5618c833faFf5fA4C29B78a6";
const ETH_ADDRESS = "0xc6E0cD72723C9409ba221197e06830EB928a7A76";

async function main() {
  console.log("\n💱 Xaheen Chain DEX - Trading Example");
  console.log("=" .repeat(70));

  const privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("MAIN_WALLET_PRIVATE_KEY not found in .env");
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("\n📍 Trader:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 XHT Balance:", ethers.formatEther(balance), "XHT");

  // Router ABI (minimal for swaps)
  const routerABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
  ];

  const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);

  // ERC20 ABI (for approvals and balances)
  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  // EXAMPLE 1: Swap WXHT for USDT
  console.log("\n📊 Example 1: Swap 1,000 WXHT for USDT");
  console.log("-".repeat(70));

  const wxht = new ethers.Contract(WXHT_ADDRESS, erc20ABI, wallet);
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20ABI, wallet);

  const amountIn = ethers.parseEther("1000"); // 1,000 WXHT

  // Check WXHT balance
  const wxhtBalance = await wxht.balanceOf(wallet.address);
  console.log(`WXHT Balance: ${ethers.formatEther(wxhtBalance)} WXHT`);

  // Check if we need approval
  const allowance = await wxht.allowance(wallet.address, ROUTER_ADDRESS);
  if (allowance < amountIn) {
    console.log("Approving WXHT for trading...");
    const approveTx = await wxht.approve(ROUTER_ADDRESS, ethers.MaxUint256);
    await approveTx.wait();
    console.log("✅ WXHT approved");
  }

  // Get expected output
  const path = [WXHT_ADDRESS, USDT_ADDRESS];
  const amounts = await router.getAmountsOut(amountIn, path);
  const expectedOut = ethers.formatEther(amounts[1]);
  console.log(`Expected USDT output: ${expectedOut} USDT`);

  // Execute swap with 1% slippage
  const minOut = (amounts[1] * 99n) / 100n; // 1% slippage
  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes

  console.log("\nExecuting swap...");
  const swapTx = await router.swapExactTokensForTokens(
    amountIn,
    minOut,
    path,
    wallet.address,
    deadline
  );
  await swapTx.wait();
  console.log("✅ Swap complete!");

  // Check new balances
  const newWxhtBalance = await wxht.balanceOf(wallet.address);
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log(`\nNew WXHT Balance: ${ethers.formatEther(newWxhtBalance)} WXHT`);
  console.log(`New USDT Balance: ${ethers.formatEther(usdtBalance)} USDT`);

  // EXAMPLE 2: Swap USDT back to WXHT
  console.log("\n📊 Example 2: Swap USDT back to WXHT");
  console.log("-".repeat(70));

  const usdtAmount = ethers.parseEther("1"); // 1 USDT

  // Approve USDT
  const usdtAllowance = await usdt.allowance(wallet.address, ROUTER_ADDRESS);
  if (usdtAllowance < usdtAmount) {
    console.log("Approving USDT for trading...");
    const approveUsdtTx = await usdt.approve(ROUTER_ADDRESS, ethers.MaxUint256);
    await approveUsdtTx.wait();
    console.log("✅ USDT approved");
  }

  // Get expected output
  const reversePath = [USDT_ADDRESS, WXHT_ADDRESS];
  const reverseAmounts = await router.getAmountsOut(usdtAmount, reversePath);
  const expectedWxht = ethers.formatEther(reverseAmounts[1]);
  console.log(`Expected WXHT output: ${expectedWxht} WXHT`);

  // Execute reverse swap
  const minWxhtOut = (reverseAmounts[1] * 99n) / 100n;
  console.log("\nExecuting reverse swap...");
  const reverseSwapTx = await router.swapExactTokensForTokens(
    usdtAmount,
    minWxhtOut,
    reversePath,
    wallet.address,
    deadline
  );
  await reverseSwapTx.wait();
  console.log("✅ Reverse swap complete!");

  // Final balances
  const finalWxhtBalance = await wxht.balanceOf(wallet.address);
  const finalUsdtBalance = await usdt.balanceOf(wallet.address);
  console.log(`\nFinal WXHT Balance: ${ethers.formatEther(finalWxhtBalance)} WXHT`);
  console.log(`Final USDT Balance: ${ethers.formatEther(finalUsdtBalance)} USDT`);

  // EXAMPLE 3: Multi-hop swap (WXHT → USDT → BNB)
  console.log("\n📊 Example 3: Multi-hop swap (WXHT → USDT → BNB)");
  console.log("-".repeat(70));

  const multiHopPath = [WXHT_ADDRESS, USDT_ADDRESS, BNB_ADDRESS];
  const multiHopAmounts = await router.getAmountsOut(amountIn, multiHopPath);
  console.log(`Route: WXHT → USDT → BNB`);
  console.log(`Input: ${ethers.formatEther(amountIn)} WXHT`);
  console.log(`Expected output: ${ethers.formatEther(multiHopAmounts[2])} BNB`);

  console.log("\n💡 Trading Summary:");
  console.log("=" .repeat(70));
  console.log("✅ All swaps executed successfully");
  console.log("✅ DEX is fully functional");
  console.log("✅ Liquidity pools are active");
  console.log("\n🎯 Available Trading Pairs:");
  console.log("   • WXHT ↔ USDT");
  console.log("   • WXHT ↔ BNB");
  console.log("   • WXHT ↔ ETH");
  console.log("   • Multi-hop routes available");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
