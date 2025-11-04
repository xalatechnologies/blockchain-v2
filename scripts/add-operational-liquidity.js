import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💧 ADDING OPERATIONAL LIQUIDITY (UNLOCKED)");
  console.log("=".repeat(70));

  // Load deployment info
  const dexDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/xaheen-dex-deployment.json", "utf8")
  );
  const usdtDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/test-usdt-deployment.json", "utf8")
  );
  const liquidityInfo = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/xaheen-liquidity-deployed.json",
      "utf8"
    )
  );

  const ROUTER_ADDRESS = dexDeployment.contracts.Router;
  const USDT_ADDRESS = usdtDeployment.contract.address;
  const PAIR_ADDRESS = liquidityInfo.pair;

  console.log("\n📍 Contract Addresses:");
  console.log("  Router:", ROUTER_ADDRESS);
  console.log("  USDT:", USDT_ADDRESS);
  console.log("  Pair:", PAIR_ADDRESS);

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Wallet:", wallet.address);

  // Check current balances
  const xhtBalance = await provider.getBalance(wallet.address);
  const usdt = new ethers.Contract(
    USDT_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
      "function mint(address,uint256) public",
    ],
    wallet
  );
  const usdtBalance = await usdt.balanceOf(wallet.address);

  console.log("\n💰 Current Balances:");
  console.log("  NOR:", ethers.formatEther(xhtBalance), "NOR");
  console.log("  USDT:", ethers.formatUnits(usdtBalance, 18), "USDT");

  // Get current price from pair
  const pair = new ethers.Contract(
    PAIR_ADDRESS,
    [
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function token0() view returns (address)",
    ],
    provider
  );

  const reserves = await pair.getReserves();
  const token0 = await pair.token0();

  let xhtReserve, usdtReserve;
  if (token0.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
    usdtReserve = reserves[0];
    xhtReserve = reserves[1];
  } else {
    xhtReserve = reserves[0];
    usdtReserve = reserves[1];
  }

  const currentPrice = Number(usdtReserve) / Number(xhtReserve);

  console.log("\n📊 Current Pool State:");
  console.log("  NOR Reserve:", ethers.formatEther(xhtReserve), "WNOR");
  console.log("  USDT Reserve:", ethers.formatUnits(usdtReserve, 18), "USDT");
  console.log("  Current Price: $" + currentPrice.toFixed(10) + " USDT/NOR");

  // Calculate operational liquidity amounts
  // Option 1: $5,000 operational (2.5k NOR side + 2.5k USDT side)
  // Option 2: $10,000 operational (5k NOR side + 5k USDT side)
  // Let's do $10,000 to match the locked amount

  const OPERATIONAL_VALUE_USD = 10000; // $10,000 operational
  const USDT_SIDE_USD = OPERATIONAL_VALUE_USD / 2; // $5,000 USDT

  const USDT_AMOUNT = ethers.parseUnits(USDT_SIDE_USD.toString(), 18);
  const NOR_AMOUNT = ethers.parseEther(
    (USDT_SIDE_USD / currentPrice).toString()
  );

  console.log("\n💧 OPERATIONAL LIQUIDITY TO ADD:");
  console.log("  Total Value: $" + OPERATIONAL_VALUE_USD.toLocaleString());
  console.log(
    "  NOR Side: " +
      ethers.formatEther(NOR_AMOUNT) +
      " NOR (~$" +
      USDT_SIDE_USD.toLocaleString() +
      ")"
  );
  console.log(
    "  USDT Side: " +
      ethers.formatUnits(USDT_AMOUNT, 18) +
      " USDT ($" +
      USDT_SIDE_USD.toLocaleString() +
      ")"
  );
  console.log("\n  💡 This liquidity will NOT be locked");
  console.log("  💡 You can earn fees immediately");
  console.log("  💡 You can withdraw anytime");

  // Check if we need to mint more USDT
  if (usdtBalance < USDT_AMOUNT) {
    const needToMint = USDT_AMOUNT - usdtBalance;
    console.log("\n📝 Minting additional USDT...");
    console.log("  Need:", ethers.formatUnits(needToMint, 18), "USDT");

    const mintTx = await usdt.mint(wallet.address, needToMint, {
      gasLimit: 100000,
    });
    console.log("  Transaction:", mintTx.hash);
    await mintTx.wait();
    console.log("  ✅ USDT minted!");
  }

  // Verify balances
  const xhtBalanceCheck = await provider.getBalance(wallet.address);
  const usdtBalanceCheck = await usdt.balanceOf(wallet.address);

  if (xhtBalanceCheck < NOR_AMOUNT) {
    throw new Error(
      "❌ Insufficient NOR balance. Need: " +
        ethers.formatEther(NOR_AMOUNT) +
        " NOR"
    );
  }
  if (usdtBalanceCheck < USDT_AMOUNT) {
    throw new Error(
      "❌ Insufficient USDT balance. Need: " +
        ethers.formatUnits(USDT_AMOUNT, 18) +
        " USDT"
    );
  }

  console.log("\n✅ Balance check passed!");

  // Load router
  const router = new ethers.Contract(
    ROUTER_ADDRESS,
    [
      "function addLiquidityNOR(address token, uint amountTokenDesired, uint amountTokenMin, uint amountNORMin, address to, uint deadline) payable returns (uint amountToken, uint amountNOR, uint liquidity)",
    ],
    wallet
  );

  // Step 1: Approve USDT
  console.log("\n📝 STEP 1/2: Approving USDT...");
  const approveTx = await usdt.approve(ROUTER_ADDRESS, USDT_AMOUNT, {
    gasLimit: 100000,
  });
  console.log("  Transaction:", approveTx.hash);
  await approveTx.wait();
  console.log("  ✅ USDT approved!");

  // Step 2: Add liquidity
  console.log("\n📝 STEP 2/2: Adding operational liquidity...");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const slippage = 5; // 5% slippage tolerance

  const amountTokenMin = (USDT_AMOUNT * BigInt(100 - slippage)) / 100n;
  const amountNORMin = (NOR_AMOUNT * BigInt(100 - slippage)) / 100n;

  console.log("  Slippage tolerance: 5%");
  console.log("  Deadline:", new Date(deadline * 1000).toISOString());

  const tx = await router.addLiquidityNOR(
    USDT_ADDRESS,
    USDT_AMOUNT,
    amountTokenMin,
    amountNORMin,
    wallet.address,
    deadline,
    { value: NOR_AMOUNT, gasLimit: 5000000 }
  );

  console.log("  Transaction:", tx.hash);
  console.log("  ⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("  ✅ Operational liquidity added!");

  // Get updated pair info
  const reservesAfter = await pair.getReserves();
  let xhtReserveAfter, usdtReserveAfter;
  if (token0.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
    usdtReserveAfter = reservesAfter[0];
    xhtReserveAfter = reservesAfter[1];
  } else {
    xhtReserveAfter = reservesAfter[0];
    usdtReserveAfter = reservesAfter[1];
  }

  const priceAfter = Number(usdtReserveAfter) / Number(xhtReserveAfter);
  const totalLiquidityUSD =
    Number(ethers.formatEther(xhtReserveAfter)) * priceAfter +
    Number(ethers.formatUnits(usdtReserveAfter, 18));

  // Get LP token balance
  const lpToken = new ethers.Contract(
    PAIR_ADDRESS,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );
  const lpBalance = await lpToken.balanceOf(wallet.address);

  console.log("\n📊 UPDATED POOL STATE:");
  console.log("  NOR Reserve:", ethers.formatEther(xhtReserveAfter), "WNOR");
  console.log(
    "  USDT Reserve:",
    ethers.formatUnits(usdtReserveAfter, 18),
    "USDT"
  );
  console.log("  Current Price: $" + priceAfter.toFixed(10) + " USDT/NOR");
  console.log("  Total Liquidity: $" + totalLiquidityUSD.toFixed(2));

  console.log("\n💰 YOUR LP TOKENS:");
  console.log("  New LP Balance:", ethers.formatEther(lpBalance), "LP tokens");
  console.log("  Value: ~$" + OPERATIONAL_VALUE_USD.toLocaleString());
  console.log("  Status: 🔓 UNLOCKED (can withdraw anytime)");

  console.log("\n📊 LIQUIDITY BREAKDOWN:");
  console.log("  🔒 Locked (Timelock): ~$10,000 (50%)");
  console.log(
    "  🔓 Operational (Your Wallet): ~$" +
      OPERATIONAL_VALUE_USD.toLocaleString() +
      " (50%)"
  );
  console.log("  💧 Total Pool: ~$" + totalLiquidityUSD.toFixed(2));

  console.log("\n✅ OPERATIONAL LIQUIDITY ADDED!");

  // Save operational liquidity info
  const operationalInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    pair: PAIR_ADDRESS,
    router: ROUTER_ADDRESS,
    operationalLiquidity: {
      xhtAmount: ethers.formatEther(NOR_AMOUNT) + " NOR",
      usdtAmount: ethers.formatUnits(USDT_AMOUNT, 18) + " USDT",
      valueUSD: "$" + OPERATIONAL_VALUE_USD.toLocaleString(),
      lpTokens: ethers.formatEther(lpBalance) + " LP tokens",
      status: "UNLOCKED",
    },
    totalPool: {
      xhtReserve: ethers.formatEther(xhtReserveAfter) + " WNOR",
      usdtReserve: ethers.formatUnits(usdtReserveAfter, 18) + " USDT",
      totalLiquidityUSD: "$" + totalLiquidityUSD.toFixed(2),
      price: "$" + priceAfter.toFixed(10) + " USDT/NOR",
    },
    breakdown: {
      locked: {
        value: "$10,000",
        percentage: "50%",
        timelock: "0x02938F8c35A08126b0be008AaEb0B29B7E48d355",
        unlockDate: "October 30, 2026",
      },
      operational: {
        value: "$" + OPERATIONAL_VALUE_USD.toLocaleString(),
        percentage: "50%",
        status: "UNLOCKED - Can earn fees and withdraw anytime",
      },
    },
    transactions: {
      approve: approveTx.hash,
      addLiquidity: receipt.hash,
    },
    verification: {
      pair: `https://explorer.xaheen.org/address/${PAIR_ADDRESS}`,
      transaction: `https://explorer.xaheen.org/tx/${receipt.hash}`,
    },
  };

  fs.writeFileSync(
    "docs/deployment-logs/operational-liquidity.json",
    JSON.stringify(operationalInfo, null, 2)
  );

  console.log(
    "\n💾 Operational liquidity info saved to: docs/deployment-logs/operational-liquidity.json"
  );

  console.log("\n🔗 VERIFICATION:");
  console.log("  Pair:", `https://explorer.xaheen.org/address/${PAIR_ADDRESS}`);
  console.log(
    "  Transaction:",
    `https://explorer.xaheen.org/tx/${receipt.hash}`
  );

  console.log("\n💡 WHAT THIS MEANS:");
  console.log("  ✅ You can now earn trading fees immediately");
  console.log("  ✅ You can withdraw this liquidity anytime");
  console.log("  ✅ 50% of pool is still locked (anti-rug proof)");
  console.log("  ✅ 50% is operational (flexibility + income)");

  console.log("\n💰 HOW TO EARN FEES:");
  console.log("  1. Users trade on NorSwap");
  console.log("  2. Each trade pays 0.3% fee");
  console.log("  3. Fees distributed to LP providers (you)");
  console.log("  4. Your LP tokens automatically increase in value");
  console.log("  5. Withdraw anytime to realize gains");

  console.log("\n📈 EXAMPLE FEE EARNINGS:");
  console.log("  If $10,000 trades daily:");
  console.log("    Daily fees: $30 (0.3% of volume)");
  console.log("    Your share (50% of pool): $15/day");
  console.log("    Monthly: ~$450");
  console.log("    Yearly: ~$5,400");
  console.log("\n  If $100,000 trades daily:");
  console.log("    Daily fees: $300");
  console.log("    Your share: $150/day");
  console.log("    Monthly: ~$4,500");
  console.log("    Yearly: ~$54,000");

  console.log("\n🚀 NEXT STEPS:");
  console.log("  1. Monitor trading activity");
  console.log("  2. Track LP token value growth");
  console.log("  3. Withdraw fees whenever you want:");
  console.log("     node scripts/withdraw-operational-liquidity.js");
  console.log("  4. Launch marketing to drive trading volume");
  console.log("  5. More volume = More fees = More income!");

  console.log("\n" + "=".repeat(70));
  console.log("💧 OPERATIONAL LIQUIDITY READY TO EARN! 💰");
  console.log("=".repeat(70));

  return operationalInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
