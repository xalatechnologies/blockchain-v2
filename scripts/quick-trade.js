import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Configuration
const ROUTER = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const TOKENS = {
  WXHT: "0x26c0eaF731885b14c031cc50dB79b36458E0b355",
  USDT: "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf",
  BNB: "0xa4cBBcbd8146482E5618c833faFf5fA4C29B78a6",
  ETH: "0xc6E0cD72723C9409ba221197e06830EB928a7A76"
};

async function trade(fromToken, toToken, amount, slippage = 1) {
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`\n💱 Trading ${amount} ${fromToken} → ${toToken}`);
  console.log("-".repeat(50));

  const routerABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
  ];

  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  const router = new ethers.Contract(ROUTER, routerABI, wallet);
  const fromContract = new ethers.Contract(TOKENS[fromToken], erc20ABI, wallet);

  const amountIn = ethers.parseEther(amount.toString());
  const path = [TOKENS[fromToken], TOKENS[toToken]];

  // Check balance
  const balance = await fromContract.balanceOf(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ${fromToken}`);

  if (balance < amountIn) {
    throw new Error(`Insufficient ${fromToken} balance`);
  }

  // Approve if needed
  const allowance = await fromContract.allowance(wallet.address, ROUTER);
  if (allowance < amountIn) {
    console.log("Approving token...");
    const tx = await fromContract.approve(ROUTER, ethers.MaxUint256);
    await tx.wait();
    console.log("✅ Approved");
  }

  // Get quote
  const amounts = await router.getAmountsOut(amountIn, path);
  const expectedOut = ethers.formatEther(amounts[1]);
  console.log(`Expected: ${expectedOut} ${toToken}`);

  // Execute swap
  const minOut = (amounts[1] * BigInt(100 - slippage)) / 100n;
  const deadline = Math.floor(Date.now() / 1000) + 600;

  console.log("Executing swap...");
  const swapTx = await router.swapExactTokensForTokens(
    amountIn,
    minOut,
    path,
    wallet.address,
    deadline
  );
  const receipt = await swapTx.wait();
  console.log(`✅ Swap complete! Gas used: ${receipt.gasUsed.toString()}`);

  // Show new balance
  const toContract = new ethers.Contract(TOKENS[toToken], erc20ABI, wallet);
  const newBalance = await toContract.balanceOf(wallet.address);
  console.log(`New ${toToken} balance: ${ethers.formatEther(newBalance)}`);

  return receipt;
}

async function getPrice(fromToken, toToken, amount = 1) {
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const routerABI = [
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
  ];
  const router = new ethers.Contract(ROUTER, routerABI, provider);

  const amountIn = ethers.parseEther(amount.toString());
  const path = [TOKENS[fromToken], TOKENS[toToken]];
  const amounts = await router.getAmountsOut(amountIn, path);

  const price = Number(ethers.formatEther(amounts[1])) / amount;
  return price;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help") {
    console.log("\n💱 Quick Trade CLI");
    console.log("=" .repeat(50));
    console.log("\nUsage:");
    console.log("  node scripts/quick-trade.js <from> <to> <amount> [slippage]");
    console.log("\nExamples:");
    console.log("  node scripts/quick-trade.js WXHT USDT 1000");
    console.log("  node scripts/quick-trade.js USDT WXHT 10 2");
    console.log("  node scripts/quick-trade.js price WXHT USDT");
    console.log("\nTokens: WXHT, USDT, BNB, ETH");
    console.log("Default slippage: 1%\n");
    return;
  }

  if (args[0] === "price") {
    const from = args[1];
    const to = args[2];
    const amount = args[3] ? parseFloat(args[3]) : 1;

    const price = await getPrice(from, to, amount);
    console.log(`\n💰 Price: 1 ${from} = ${price.toFixed(8)} ${to}`);
    if (amount !== 1) {
      console.log(`   ${amount} ${from} = ${(price * amount).toFixed(6)} ${to}`);
    }
    return;
  }

  const from = args[0];
  const to = args[1];
  const amount = parseFloat(args[2]);
  const slippage = args[3] ? parseFloat(args[3]) : 1;

  if (!TOKENS[from] || !TOKENS[to]) {
    throw new Error("Invalid token symbol. Use: WXHT, USDT, BNB, ETH");
  }

  await trade(from, to, amount, slippage);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
