import hre from "hardhat";
const { ethers } = hre;

// Fix SSL certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * BALANCE NORCHAIN DEX PRICE TO MATCH BSC
 *
 * Current: 2.08B NOR + 5k USDT = $0.0000024/NOR
 * Target: Match BSC price of $0.0065/NOR
 *
 * Strategy: Add proportional liquidity to shift price ratio
 */

async function main() {
  console.log("\n💰 BALANCING NORCHAIN DEX PRICE");
  console.log("=".repeat(70));

  // Connect to NorChain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Account:", wallet.address);

  // Existing deployment
  const ROUTER_ADDRESS = "0x4A82C98A950125F17943F56273efae39dDe81763";
  const PAIR_ADDRESS = "0x59a09aCEb22A5dE82222ddA235490eD7317Eb7f9";
  const WNOR_ADDRESS = "0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c";
  const USDT_ADDRESS = "0xA37C1f80Bd02D9d70ce0188831A85c65fdFBeEDe";

  // ABIs
  const pairABI = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function totalSupply() external view returns (uint256)"
  ];

  const routerABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
  ];

  const erc20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  // Get contracts
  const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, wallet);
  const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);
  const wnor = new ethers.Contract(WNOR_ADDRESS, erc20ABI, wallet);
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20ABI, wallet);

  // Check current reserves
  console.log("\n📊 CURRENT POOL STATE:");
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  let norReserve, usdtReserve;
  if (token0.toLowerCase() === WNOR_ADDRESS.toLowerCase()) {
    norReserve = reserve0;
    usdtReserve = reserve1;
  } else {
    norReserve = reserve1;
    usdtReserve = reserve0;
  }

  const currentPrice = Number(ethers.formatEther(usdtReserve)) / Number(ethers.formatEther(norReserve));

  console.log("  NOR Reserve:", ethers.formatEther(norReserve), "NOR");
  console.log("  USDT Reserve:", ethers.formatEther(usdtReserve), "USDT");
  console.log("  Current Price:", currentPrice.toFixed(10), "USDT per NOR");

  // Target price from BSC
  const TARGET_PRICE = 0.0065; // $0.0065 per NOR from BSC
  console.log("\n🎯 TARGET PRICE:", TARGET_PRICE, "USDT per NOR");

  // Calculate price difference
  const priceDiff = ((TARGET_PRICE - currentPrice) / currentPrice * 100);
  console.log("  Price Difference:", priceDiff.toFixed(2) + "%");

  if (currentPrice >= TARGET_PRICE * 0.95) {
    console.log("\n✅ Price is already close to target!");
    console.log("   Current:", currentPrice.toFixed(6));
    console.log("   Target:", TARGET_PRICE);
    console.log("   Difference: <5%");
    return;
  }

  // Strategy: Calculate how much to add to reach target price
  // For AMM: price = y/x (USDT per NOR)
  // To increase price, we need to add more USDT or remove NOR
  // Since we can only add, we'll add USDT-heavy liquidity

  console.log("\n📝 CALCULATION:");
  console.log("  To reach $0.0065/NOR, we need to shift the ratio");
  console.log("  Current ratio:", (Number(ethers.formatEther(norReserve)) / Number(ethers.formatEther(usdtReserve))).toFixed(2), "NOR per USDT");
  console.log("  Target ratio:", (1 / TARGET_PRICE).toFixed(2), "NOR per USDT (153.8)");

  // Calculate optimal addition
  // We want: (usdtReserve + addedUSDT) / (norReserve + addedNOR) = TARGET_PRICE
  // For proportional add: addedUSDT / addedNOR = TARGET_PRICE
  // Let's add: 50,000 USDT + (50,000 / 0.0065) NOR = 50k USDT + 7.7M NOR

  const USDT_TO_ADD = ethers.parseEther("50000"); // 50k USDT
  const NOR_TO_ADD = ethers.parseEther((50000 / TARGET_PRICE).toString()); // ~7.7M NOR

  console.log("\n💧 LIQUIDITY TO ADD:");
  console.log("  USDT:", ethers.formatEther(USDT_TO_ADD), "USDT");
  console.log("  NOR:", ethers.formatEther(NOR_TO_ADD), "NOR");

  // Calculate expected new price
  const newNORReserve = Number(ethers.formatEther(norReserve)) + Number(ethers.formatEther(NOR_TO_ADD));
  const newUSDTReserve = Number(ethers.formatEther(usdtReserve)) + Number(ethers.formatEther(USDT_TO_ADD));
  const expectedPrice = newUSDTReserve / newNORReserve;

  console.log("\n📈 EXPECTED RESULT:");
  console.log("  New NOR Reserve:", newNORReserve.toFixed(2), "NOR");
  console.log("  New USDT Reserve:", newUSDTReserve.toFixed(2), "USDT");
  console.log("  Expected Price:", expectedPrice.toFixed(6), "USDT per NOR");
  console.log("  Target Price:", TARGET_PRICE, "USDT per NOR");
  console.log("  Match:", expectedPrice >= TARGET_PRICE * 0.95 ? "✅" : "⚠️ Need more USDT");

  // Check balances
  console.log("\n💰 CHECKING BALANCES:");
  const norBalance = await wnor.balanceOf(wallet.address);
  const usdtBalance = await usdt.balanceOf(wallet.address);

  console.log("  Your WNOR:", ethers.formatEther(norBalance), "WNOR");
  console.log("  Your USDT:", ethers.formatEther(usdtBalance), "USDT");

  if (usdtBalance < USDT_TO_ADD) {
    console.log("\n❌ INSUFFICIENT USDT BALANCE");
    console.log("   Need:", ethers.formatEther(USDT_TO_ADD), "USDT");
    console.log("   Have:", ethers.formatEther(usdtBalance), "USDT");
    console.log("\n💡 OPTIONS:");
    console.log("   1. Bridge more USDT from BSC to NorChain");
    console.log("   2. Deploy test USDT on NorChain (for testing)");
    console.log("   3. Add less liquidity (script will be created)");
    return;
  }

  if (norBalance < NOR_TO_ADD) {
    console.log("\n❌ INSUFFICIENT WNOR BALANCE");
    console.log("   Need:", ethers.formatEther(NOR_TO_ADD), "WNOR");
    console.log("   Have:", ethers.formatEther(norBalance), "WNOR");
    console.log("\n💡 TIP: You need to wrap NOR to WNOR first");
    console.log("   Your native NOR balance should be used to wrap");
    return;
  }

  // Approve tokens
  console.log("\n[1/3] Approving tokens...");

  const norAllowance = await wnor.allowance(wallet.address, ROUTER_ADDRESS);
  if (norAllowance < NOR_TO_ADD) {
    console.log("  Approving WNOR...");
    const approveTx = await wnor.approve(ROUTER_ADDRESS, NOR_TO_ADD);
    await approveTx.wait();
    console.log("  ✅ WNOR approved");
  } else {
    console.log("  ✅ WNOR already approved");
  }

  const usdtAllowance = await usdt.allowance(wallet.address, ROUTER_ADDRESS);
  if (usdtAllowance < USDT_TO_ADD) {
    console.log("  Approving USDT...");
    const approveTx = await usdt.approve(ROUTER_ADDRESS, USDT_TO_ADD);
    await approveTx.wait();
    console.log("  ✅ USDT approved");
  } else {
    console.log("  ✅ USDT already approved");
  }

  // Add liquidity
  console.log("\n[2/3] Adding liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const addLiqTx = await router.addLiquidity(
    WNOR_ADDRESS,
    USDT_ADDRESS,
    NOR_TO_ADD,
    USDT_TO_ADD,
    0, // Accept any amount (slippage)
    0,
    wallet.address,
    deadline,
    { gasLimit: 500000 }
  );

  console.log("  📤 Transaction sent:", addLiqTx.hash);
  console.log("  ⏳ Waiting for confirmation...");

  const receipt = await addLiqTx.wait();
  console.log("  ✅ Liquidity added!");

  // Check new reserves
  console.log("\n[3/3] Verifying new price...");
  const [newReserve0, newReserve1] = await pair.getReserves();

  let finalNORReserve, finalUSDTReserve;
  if (token0.toLowerCase() === WNOR_ADDRESS.toLowerCase()) {
    finalNORReserve = newReserve0;
    finalUSDTReserve = newReserve1;
  } else {
    finalNORReserve = newReserve1;
    finalUSDTReserve = newReserve0;
  }

  const finalPrice = Number(ethers.formatEther(finalUSDTReserve)) / Number(ethers.formatEther(finalNORReserve));

  console.log("\n" + "=".repeat(70));
  console.log("🎉 PRICE BALANCED!");
  console.log("=".repeat(70));

  console.log("\n📊 BEFORE → AFTER:");
  console.log("  NOR Reserve:", ethers.formatEther(norReserve), "→", ethers.formatEther(finalNORReserve));
  console.log("  USDT Reserve:", ethers.formatEther(usdtReserve), "→", ethers.formatEther(finalUSDTReserve));
  console.log("  Price:", currentPrice.toFixed(6), "→", finalPrice.toFixed(6), "USDT per NOR");

  console.log("\n🎯 TARGET vs ACTUAL:");
  console.log("  Target Price:", TARGET_PRICE, "USDT per NOR");
  console.log("  Actual Price:", finalPrice.toFixed(6), "USDT per NOR");
  console.log("  Match:", finalPrice >= TARGET_PRICE * 0.95 ? "✅ Within 5%" : "⚠️ Need more adjustment");

  console.log("\n💡 WHAT HAPPENS NEXT:");
  console.log("  1. Arbitrage bots may still adjust the price");
  console.log("  2. Trading will help balance to exact BSC price");
  console.log("  3. Monitor price over next 24 hours");

  console.log("\n✅ COMPLETE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);

    if (error.message.includes("insufficient")) {
      console.log("\n💡 Check your USDT and WNOR balances");
    }

    process.exit(1);
  });
