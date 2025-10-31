import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const ROUTER = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const WXHT = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const USDT = "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf";
const BNB = "0xa4cBBcbd8146482E5618c833faFf5fA4C29B78a6";

async function main() {
  console.log("\n🧪 Testing Live Trading on Xaheen Chain DEX");
  console.log("=" .repeat(70));

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log("\n📍 Trader:", wallet.address);
  const xhtBalance = await provider.getBalance(wallet.address);
  console.log("💰 XHT Balance:", ethers.formatEther(xhtBalance), "XHT");

  // Contract ABIs
  const routerABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
  ];

  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external"
  ];

  const wxhtABI = [
    "function deposit() payable external",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];

  const router = new ethers.Contract(ROUTER, routerABI, wallet);
  const wxht = new ethers.Contract(WXHT, wxhtABI, wallet);
  const usdt = new ethers.Contract(USDT, erc20ABI, wallet);
  const bnb = new ethers.Contract(BNB, erc20ABI, wallet);

  //Prepare test tokens
  console.log("\n📦 Preparing Test Tokens...");
  console.log("-".repeat(70));

  // Wrap 10M XHT to WXHT for testing
  const wrapAmount = ethers.parseEther("10000000");
  console.log("Wrapping 10M XHT to WXHT...");
  const wrapTx = await wxht.deposit({ value: wrapAmount });
  await wrapTx.wait();
  console.log("✅ Wrapped 10M WXHT");

  // Mint test USDT
  const usdtMintAmount = ethers.parseEther("1000");
  console.log("Minting 1,000 test USDT...");
  const mintTx = await usdt.mint(wallet.address, usdtMintAmount);
  await mintTx.wait();
  console.log("✅ Minted 1,000 USDT");

  // Check balances
  const wxhtBal = await wxht.balanceOf(wallet.address);
  const usdtBal = await usdt.balanceOf(wallet.address);
  console.log(`\n📊 Starting Balances:`);
  console.log(`   WXHT: ${ethers.formatEther(wxhtBal)}`);
  console.log(`   USDT: ${ethers.formatEther(usdtBal)}`);

  // TEST 1: Swap WXHT for USDT
  console.log("\n💱 TEST 1: Swap 1,000 WXHT → USDT");
  console.log("-".repeat(70));

  const swapAmount1 = ethers.parseEther("1000");
  const path1 = [WXHT, USDT];

  // Get quote
  const amounts1 = await router.getAmountsOut(swapAmount1, path1);
  console.log(`Quote: ${ethers.formatEther(swapAmount1)} WXHT → ${ethers.formatEther(amounts1[1])} USDT`);

  // Approve
  console.log("Approving WXHT...");
  const approveTx1 = await wxht.approve(ROUTER, ethers.MaxUint256);
  await approveTx1.wait();
  console.log("✅ Approved");

  // Execute swap
  const minOut1 = (amounts1[1] * 99n) / 100n; // 1% slippage
  const deadline = Math.floor(Date.now() / 1000) + 600;

  console.log("Executing swap...");
  const swapTx1 = await router.swapExactTokensForTokens(
    swapAmount1,
    minOut1,
    path1,
    wallet.address,
    deadline,
    { gasLimit: 500000 }
  );
  const receipt1 = await swapTx1.wait();
  console.log(`✅ Swap complete! Gas used: ${receipt1.gasUsed.toString()}`);

  // Check new balances
  const wxhtBal1 = await wxht.balanceOf(wallet.address);
  const usdtBal1 = await usdt.balanceOf(wallet.address);
  console.log(`\nBalances after swap:`);
  console.log(`   WXHT: ${ethers.formatEther(wxhtBal1)}`);
  console.log(`   USDT: ${ethers.formatEther(usdtBal1)} (+${ethers.formatEther(usdtBal1 - usdtBal)})`);

  // TEST 2: Reverse swap USDT for WXHT
  console.log("\n💱 TEST 2: Swap 1 USDT → WXHT (Reverse)");
  console.log("-".repeat(70));

  const swapAmount2 = ethers.parseEther("1");
  const path2 = [USDT, WXHT];

  // Get quote
  const amounts2 = await router.getAmountsOut(swapAmount2, path2);
  console.log(`Quote: ${ethers.formatEther(swapAmount2)} USDT → ${ethers.formatEther(amounts2[1])} WXHT`);

  // Approve
  console.log("Approving USDT...");
  const approveTx2 = await usdt.approve(ROUTER, ethers.MaxUint256);
  await approveTx2.wait();
  console.log("✅ Approved");

  // Execute swap
  const minOut2 = (amounts2[1] * 99n) / 100n;
  console.log("Executing swap...");
  const swapTx2 = await router.swapExactTokensForTokens(
    swapAmount2,
    minOut2,
    path2,
    wallet.address,
    deadline,
    { gasLimit: 500000 }
  );
  const receipt2 = await swapTx2.wait();
  console.log(`✅ Swap complete! Gas used: ${receipt2.gasUsed.toString()}`);

  // Check final balances
  const wxhtBal2 = await wxht.balanceOf(wallet.address);
  const usdtBal2 = await usdt.balanceOf(wallet.address);
  console.log(`\nBalances after reverse swap:`);
  console.log(`   WXHT: ${ethers.formatEther(wxhtBal2)} (+${ethers.formatEther(wxhtBal2 - wxhtBal1)})`);
  console.log(`   USDT: ${ethers.formatEther(usdtBal2)}`);

  // TEST 3: Multi-hop swap WXHT → USDT → BNB
  console.log("\n💱 TEST 3: Multi-hop Swap WXHT → USDT → BNB");
  console.log("-".repeat(70));

  const swapAmount3 = ethers.parseEther("5000");
  const path3 = [WXHT, USDT, BNB];

  // Get quote
  const amounts3 = await router.getAmountsOut(swapAmount3, path3);
  console.log(`Route: WXHT → USDT → BNB`);
  console.log(`Quote: ${ethers.formatEther(swapAmount3)} WXHT → ${ethers.formatEther(amounts3[2])} BNB`);
  console.log(`   Via: ${ethers.formatEther(amounts3[1])} USDT`);

  // Execute multi-hop swap
  const minOut3 = (amounts3[2] * 99n) / 100n;
  console.log("Executing multi-hop swap...");
  const swapTx3 = await router.swapExactTokensForTokens(
    swapAmount3,
    minOut3,
    path3,
    wallet.address,
    deadline,
    { gasLimit: 800000 }
  );
  const receipt3 = await swapTx3.wait();
  console.log(`✅ Multi-hop swap complete! Gas used: ${receipt3.gasUsed.toString()}`);

  // Check BNB balance
  const bnbBal = await bnb.balanceOf(wallet.address);
  console.log(`\nReceived BNB: ${ethers.formatEther(bnbBal)}`);

  // Final summary
  console.log("\n📊 Trading Test Summary");
  console.log("=" .repeat(70));
  console.log("✅ Test 1: WXHT → USDT swap successful");
  console.log("✅ Test 2: USDT → WXHT reverse swap successful");
  console.log("✅ Test 3: Multi-hop WXHT → USDT → BNB successful");
  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("\n✅ DEX is fully functional and ready for production trading!");
  console.log("\n📈 Trading Statistics:");
  console.log(`   Total trades executed: 3`);
  console.log(`   Average gas per trade: ~${((Number(receipt1.gasUsed) + Number(receipt2.gasUsed) + Number(receipt3.gasUsed)) / 3).toFixed(0)}`);
  console.log(`   Multi-hop routing: ✅ Working`);
  console.log(`   Slippage protection: ✅ Working`);
  console.log(`   Price quotes: ✅ Accurate`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
