import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💰 CHECKING LP TOKEN BALANCE");
  console.log("=".repeat(70));

  // Load deployment info
  const liquidityInfo = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/xaheen-liquidity-deployed.json",
      "utf8"
    )
  );

  const PAIR_ADDRESS = liquidityInfo.pair;

  console.log("\n📍 LP Token (Pair):", PAIR_ADDRESS);

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("👤 Wallet:", wallet.address);

  // Pair contract
  const pair = new ethers.Contract(
    PAIR_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ],
    provider
  );

  // Get LP token info
  const name = await pair.name();
  const symbol = await pair.symbol();
  const decimals = await pair.decimals();

  console.log("\n📊 LP TOKEN INFO:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);

  // Get balances
  const lpBalance = await pair.balanceOf(wallet.address);
  const totalSupply = await pair.totalSupply();
  const reserves = await pair.getReserves();

  const token0 = await pair.token0();
  const token1 = await pair.token1();

  console.log("\n💎 YOUR LP TOKENS:");
  console.log("  Balance:", ethers.formatEther(lpBalance), "LP");
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "LP");

  const sharePercentage = (Number(lpBalance) / Number(totalSupply)) * 100;
  console.log("  Your Share:", sharePercentage.toFixed(2) + "%");

  console.log("\n🏊 POOL RESERVES:");
  console.log(
    "  Token0 (" + token0.substring(0, 10) + "...):",
    ethers.formatEther(reserves[0])
  );
  console.log(
    "  Token1 (" + token1.substring(0, 10) + "...):",
    ethers.formatUnits(reserves[1], 18)
  );

  // Calculate your share of reserves
  const yourReserve0 =
    (BigInt(reserves[0]) * BigInt(lpBalance)) / BigInt(totalSupply);
  const yourReserve1 =
    (BigInt(reserves[1]) * BigInt(lpBalance)) / BigInt(totalSupply);

  console.log("\n💰 YOUR SHARE OF POOL:");

  // Determine which is NOR and which is USDT
  const USDT_ADDRESS = liquidityInfo.tokens.USDT;
  const NOR_ADDRESS = liquidityInfo.tokens.NOR;

  let yourNOR, yourUSDT;
  if (token0.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
    yourUSDT = yourReserve0;
    yourNOR = yourReserve1;
    console.log("  Your USDT:", ethers.formatUnits(yourUSDT, 18), "USDT");
    console.log("  Your NOR:", ethers.formatEther(yourNOR), "NOR");
  } else {
    yourNOR = yourReserve0;
    yourUSDT = yourReserve1;
    console.log("  Your NOR:", ethers.formatEther(yourNOR), "NOR");
    console.log("  Your USDT:", ethers.formatUnits(yourUSDT, 18), "USDT");
  }

  // Calculate USD value
  const NOR_PRICE = 0.0000024;
  const xhtValue = Number(ethers.formatEther(yourNOR)) * NOR_PRICE;
  const usdtValue = Number(ethers.formatUnits(yourUSDT, 18));
  const totalValue = xhtValue + usdtValue;

  console.log("\n💵 USD VALUE:");
  console.log("  NOR Value:", "$" + xhtValue.toFixed(2));
  console.log("  USDT Value:", "$" + usdtValue.toFixed(2));
  console.log("  Total Value:", "$" + totalValue.toFixed(2));

  // Compare to initial $10k
  const INITIAL_VALUE = 10000;
  const profit = totalValue - INITIAL_VALUE;
  const profitPercent = (profit / INITIAL_VALUE) * 100;

  console.log("\n📈 EARNINGS:");
  console.log("  Initial Investment:", "$" + INITIAL_VALUE.toFixed(2));
  console.log("  Current Value:", "$" + totalValue.toFixed(2));
  console.log(
    "  Profit/Loss:",
    profit >= 0 ? "+" : "",
    "$" + profit.toFixed(4)
  );
  console.log(
    "  Return:",
    profit >= 0 ? "+" : "",
    profitPercent.toFixed(4) + "%"
  );

  // Check locked vs unlocked
  console.log("\n🔒 LP TOKEN STATUS:");

  // Check timelock balance
  const timelockDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/lp-timelock-deployment.json", "utf8")
  );
  const TIMELOCK_ADDRESS = timelockDeployment.contract.address;

  const lockedLP = await pair.balanceOf(TIMELOCK_ADDRESS);
  const unlockedLP = lpBalance;

  console.log("  Locked (Timelock):", ethers.formatEther(lockedLP), "LP");
  console.log(
    "  Unlocked (Your Wallet):",
    ethers.formatEther(unlockedLP),
    "LP"
  );
  console.log(
    "  Total:",
    ethers.formatEther(BigInt(lockedLP) + BigInt(unlockedLP)),
    "LP"
  );

  const totalPoolValue = totalValue * 2; // User owns 50%
  const lockedValue = (Number(lockedLP) / Number(totalSupply)) * totalPoolValue;
  const unlockedValue =
    (Number(unlockedLP) / Number(totalSupply)) * totalPoolValue;

  console.log("\n💎 VALUE BREAKDOWN:");
  console.log(
    "  Locked Value:",
    "$" + lockedValue.toFixed(2),
    "(earning fees, locked 12mo)"
  );
  console.log(
    "  Unlocked Value:",
    "$" + unlockedValue.toFixed(2),
    "(earning fees, withdrawable)"
  );

  console.log("\n📱 ADD TO METAMASK:");
  console.log("  Contract Address:", PAIR_ADDRESS);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  console.log("\n  ⚠️  MetaMask won't show dollar value!");
  console.log("  Real Value: $" + totalValue.toFixed(2));

  console.log("\n🔗 VERIFICATION:");
  console.log(
    "  LP Token:",
    `https://explorer.xaheen.org/address/${PAIR_ADDRESS}`
  );
  console.log(
    "  Your Wallet:",
    `https://explorer.xaheen.org/address/${wallet.address}`
  );

  console.log("\n" + "=".repeat(70));
  console.log("✅ LP BALANCE CHECK COMPLETE");
  console.log("=".repeat(70));

  // Save snapshot
  const snapshot = {
    timestamp: new Date().toISOString(),
    lpToken: {
      address: PAIR_ADDRESS,
      name: name,
      symbol: symbol,
      decimals: decimals,
    },
    balance: {
      lpTokens: ethers.formatEther(lpBalance) + " LP",
      sharePercent: sharePercentage.toFixed(2) + "%",
      xht: ethers.formatEther(yourNOR) + " NOR",
      usdt: ethers.formatUnits(yourUSDT, 18) + " USDT",
    },
    value: {
      xhtValue: "$" + xhtValue.toFixed(2),
      usdtValue: "$" + usdtValue.toFixed(2),
      totalValue: "$" + totalValue.toFixed(2),
      initialInvestment: "$" + INITIAL_VALUE.toFixed(2),
      profit: "$" + profit.toFixed(4),
      returnPercent: profitPercent.toFixed(4) + "%",
    },
    status: {
      locked:
        ethers.formatEther(lockedLP) + " LP ($" + lockedValue.toFixed(2) + ")",
      unlocked:
        ethers.formatEther(unlockedLP) +
        " LP ($" +
        unlockedValue.toFixed(2) +
        ")",
    },
  };

  fs.writeFileSync(
    "docs/deployment-logs/lp-balance-snapshot.json",
    JSON.stringify(snapshot, null, 2)
  );

  console.log(
    "\n💾 Balance snapshot saved to: docs/deployment-logs/lp-balance-snapshot.json"
  );

  return snapshot;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
