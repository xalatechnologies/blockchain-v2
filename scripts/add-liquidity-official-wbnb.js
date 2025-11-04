import hre from "hardhat";
const { ethers } = hre;

/**
 * ADD LIQUIDITY WITH OFFICIAL BSC WBNB
 *
 * This uses PancakeSwap's router with OFFICIAL WBNB
 * PancakeSwap will recognize this liquidity!
 */

async function main() {
  console.log("\n🥞 ADDING LIQUIDITY WITH OFFICIAL WBNB");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Your address:", deployer.address);

  // OFFICIAL BSC WBNB (the one everyone uses)
  const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

  // PancakeSwap V2 Router (widely used, high liquidity)
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  // Your tokens
  const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
  const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

  // Get contracts
  const pancakeRouter = await ethers.getContractAt(
    "NorDEXRouter",
    PANCAKE_ROUTER
  );
  const WBNB = await ethers.getContractAt("WBNB", OFFICIAL_WBNB);
  const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
  const XHN = await ethers.getContractAt("XHN", xhnAddress);

  // Check balances
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  const btcbrBalance = await BTCBR.balanceOf(deployer.address);
  const xhnBalance = await XHN.balanceOf(deployer.address);

  console.log("\n💰 YOUR CURRENT BALANCES:");
  console.log("  BNB:", ethers.formatEther(bnbBalance));
  console.log("  BTCBR:", ethers.formatEther(btcbrBalance));
  console.log("  XHN:", ethers.formatEther(xhnBalance));

  if (bnbBalance < ethers.parseEther("0.02")) {
    console.log("\n⚠️  WARNING: Low BNB balance!");
    console.log("  Recommended: At least 0.02 BNB for liquidity + gas");
    console.log("  You have:", ethers.formatEther(bnbBalance), "BNB");
    console.log("\n  Proceeding with available BNB...");
  }

  // Calculate amounts (use most of your BNB, leave some for gas)
  const bnbForLiquidity = bnbBalance - ethers.parseEther("0.004"); // Leave 0.004 for gas
  const halfBnb = bnbForLiquidity / 2n;

  // Token amounts (adjust these based on your desired ratio)
  const btcbrAmount = ethers.parseEther("7500");
  const xhnAmount = ethers.parseEther("7500");

  console.log("\n📊 LIQUIDITY TO ADD:");
  console.log(
    "  WBNB/BTCBR: ",
    ethers.formatEther(halfBnb),
    "BNB +",
    ethers.formatEther(btcbrAmount),
    "BTCBR"
  );
  console.log(
    "  WBNB/XHN: ",
    ethers.formatEther(halfBnb),
    "BNB +",
    ethers.formatEther(xhnAmount),
    "XHN"
  );
  console.log("  Total BNB:", ethers.formatEther(bnbForLiquidity), "BNB");
  console.log("  Gas reserve:", "0.004 BNB");

  const bnbValue = parseFloat(ethers.formatEther(bnbForLiquidity)) * 720;
  console.log("  USD value:", `~$${bnbValue.toFixed(2)}`);

  // Check token balances
  if (btcbrBalance < btcbrAmount) {
    console.log("\n❌ Insufficient BTCBR!");
    console.log("  Need:", ethers.formatEther(btcbrAmount));
    console.log("  Have:", ethers.formatEther(btcbrBalance));
    return;
  }

  if (xhnBalance < xhnAmount) {
    console.log("\n❌ Insufficient XHN!");
    console.log("  Need:", ethers.formatEther(xhnAmount));
    console.log("  Have:", ethers.formatEther(xhnBalance));
    return;
  }

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Approve tokens
  console.log("\n[1/3] Approving tokens...");
  await (await BTCBR.approve(PANCAKE_ROUTER, btcbrAmount)).wait();
  await (await XHN.approve(PANCAKE_ROUTER, xhnAmount)).wait();
  console.log("  ✅ Tokens approved");

  // Add WBNB/BTCBR liquidity (with ETH, it auto-wraps to WBNB)
  console.log("\n[2/3] Adding WBNB/BTCBR liquidity...");
  const addLiq1Tx = await pancakeRouter.addLiquidityETH(
    btcbrAddress,
    btcbrAmount,
    0, // Accept any amount of tokens
    0, // Accept any amount of ETH
    deployer.address,
    deadline,
    { value: halfBnb }
  );
  await addLiq1Tx.wait();
  console.log("  ✅ WBNB/BTCBR liquidity added!");

  // Add WBNB/XHN liquidity
  console.log("\n[3/3] Adding WBNB/XHN liquidity...");
  const addLiq2Tx = await pancakeRouter.addLiquidityETH(
    xhnAddress,
    xhnAmount,
    0, // Accept any amount of tokens
    0, // Accept any amount of ETH
    deployer.address,
    deadline,
    { value: halfBnb }
  );
  await addLiq2Tx.wait();
  console.log("  ✅ WBNB/XHN liquidity added!");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 LIQUIDITY ADDED WITH OFFICIAL WBNB!");
  console.log("=".repeat(70));

  console.log("\n✅ SUCCESS! Your tokens are now on PancakeSwap!");
  console.log("  Using OFFICIAL BSC WBNB: ", OFFICIAL_WBNB);
  console.log("  PancakeSwap can now find your liquidity!");

  console.log("\n🌐 TEST YOUR TOKENS:");
  console.log(
    "  BTCBR:",
    `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}&chain=bsc`
  );
  console.log(
    "  XHN:",
    `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}&chain=bsc`
  );

  console.log("\n💡 TRY A TEST TRADE:");
  console.log("  1. Go to PancakeSwap link above");
  console.log("  2. Try buying with 0.001 BNB");
  console.log("  3. Set slippage to 5-10%");
  console.log("  4. It should WORK now! ✅");

  console.log("\n⏰ METAMASK USD DISPLAY:");
  console.log("  After first trade: 30 minutes to 2 hours");
  console.log("  DexScreener will index automatically");
  console.log("  MetaMask will pull prices from aggregators");

  console.log("\n🎯 YOUR GOAL ACHIEVED:");
  console.log("  ✅ Tokens deployed to BSC mainnet");
  console.log("  ✅ Liquidity added with official WBNB");
  console.log("  ✅ PancakeSwap integration working");
  console.log("  ⏳ MetaMask USD display (coming soon!)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
