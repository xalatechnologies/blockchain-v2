import hre from "hardhat";
const { ethers } = hre;

// Fix SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * ADD LIQUIDITY TO CROSS-CHAIN DEX PAIRS
 *
 * IMPORTANT: You must bridge tokens from BSC first!
 *
 * This script adds liquidity to:
 * - NOR/WUSDT
 * - NOR/WBNB
 * - NOR/WETH
 * - BTCBR/WUSDT
 */

// Contract Addresses
const NOR_TOKEN = "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80";
const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

const WUSDT = "0x7Ad030f7549F02B7258F1c54E6B909b1d5F49d82";
const WBNB = "0x1a49C061d9131c90e9141D8D9754Bf4c8Bd2c82A";
const WETH = "0xEd511294b4Fa418458B2abD577F26104cdB3D4af";

const ROUTER = "0x22344B3995cB5f9882fcf1775C2e072A96CA8588";

// Liquidity Amounts (adjust as needed)
const LIQUIDITY = {
  NOR_WUSDT: {
    norAmount: ethers.parseEther("10000"),      // 10,000 NOR
    wusdtAmount: ethers.parseEther("100"),      // 100 USDT
    minNOR: ethers.parseEther("9500"),          // 5% slippage
    minWUSDT: ethers.parseEther("95")
  },
  NOR_WBNB: {
    norAmount: ethers.parseEther("10000"),      // 10,000 NOR
    wbnbAmount: ethers.parseEther("1"),         // 1 BNB
    minNOR: ethers.parseEther("9500"),
    minWBNB: ethers.parseEther("0.95")
  },
  NOR_WETH: {
    norAmount: ethers.parseEther("10000"),      // 10,000 NOR
    wethAmount: ethers.parseEther("0.05"),      // 0.05 ETH
    minNOR: ethers.parseEther("9500"),
    minWETH: ethers.parseEther("0.0475")
  },
  BTCBR_WUSDT: {
    btcbrAmount: ethers.parseEther("1000"),     // 1,000 BTCBR
    wusdtAmount: ethers.parseEther("50"),       // 50 USDT
    minBTCBR: ethers.parseEther("950"),
    minWUSDT: ethers.parseEther("47.5")
  }
};

async function checkBalance(token, address, requiredAmount, symbol) {
  const tokenContract = await ethers.getContractAt("IERC20", token);
  const balance = await tokenContract.balanceOf(address);

  console.log(`   ${symbol} balance: ${ethers.formatEther(balance)}`);

  if (balance < requiredAmount) {
    throw new Error(`Insufficient ${symbol}! Need ${ethers.formatEther(requiredAmount)}, have ${ethers.formatEther(balance)}`);
  }

  return true;
}

async function approveToken(token, spender, amount, symbol) {
  const tokenContract = await ethers.getContractAt("IERC20", token);
  const allowance = await tokenContract.allowance(await ethers.provider.getSigner().getAddress(), spender);

  if (allowance < amount) {
    console.log(`   Approving ${symbol}...`);
    const tx = await tokenContract.approve(spender, amount);
    await tx.wait();
    console.log("   ✅ Approved");
  } else {
    console.log(`   ✅ ${symbol} already approved`);
  }
}

async function addLiquidity(tokenA, tokenB, amountA, amountB, minA, minB, router, deployer, pairName) {
  console.log(`\n📊 Adding liquidity to ${pairName}...`);

  // Approve tokens
  await approveToken(tokenA, router, amountA, "Token A");
  await approveToken(tokenB, router, amountB, "Token B");

  // Add liquidity
  const routerContract = await ethers.getContractAt("NorSwapRouter", router);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  const tx = await routerContract.addLiquidity(
    tokenA,
    tokenB,
    amountA,
    amountB,
    minA,
    minB,
    deployer,
    deadline
  );

  const receipt = await tx.wait();
  console.log(`   ✅ Liquidity added! TX: ${receipt.hash}`);

  return receipt;
}

async function main() {
  console.log("\n💧 ADDING CROSS-CHAIN LIQUIDITY");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 From:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   NOR Balance:", ethers.formatEther(balance));

  // Check all token balances first
  console.log("\n" + "=".repeat(70));
  console.log("💰 CHECKING TOKEN BALANCES");
  console.log("=".repeat(70));

  try {
    await checkBalance(NOR_TOKEN, deployer.address,
      LIQUIDITY.NOR_WUSDT.norAmount + LIQUIDITY.NOR_WBNB.norAmount + LIQUIDITY.NOR_WETH.norAmount,
      "NOR"
    );
    await checkBalance(WUSDT, deployer.address,
      LIQUIDITY.NOR_WUSDT.wusdtAmount + LIQUIDITY.BTCBR_WUSDT.wusdtAmount,
      "WUSDT"
    );
    await checkBalance(WBNB, deployer.address, LIQUIDITY.NOR_WBNB.wbnbAmount, "WBNB");
    await checkBalance(WETH, deployer.address, LIQUIDITY.NOR_WETH.wethAmount, "WETH");
    await checkBalance(BTCBR, deployer.address, LIQUIDITY.BTCBR_WUSDT.btcbrAmount, "BTCBR");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.log("\n💡 You need to bridge tokens from BSC first!");
    console.log("   See: docs/CROSS_CHAIN_BRIDGE_GUIDE.md");
    process.exit(1);
  }

  const router = await ethers.getContractAt("NorSwapRouter", ROUTER);
  console.log("\n✅ Router loaded:", ROUTER);

  // Add liquidity to NOR/WUSDT
  console.log("\n" + "=".repeat(70));
  console.log("1️⃣  NOR/WUSDT PAIR");
  console.log("=".repeat(70));
  await addLiquidity(
    NOR_TOKEN,
    WUSDT,
    LIQUIDITY.NOR_WUSDT.norAmount,
    LIQUIDITY.NOR_WUSDT.wusdtAmount,
    LIQUIDITY.NOR_WUSDT.minNOR,
    LIQUIDITY.NOR_WUSDT.minWUSDT,
    ROUTER,
    deployer.address,
    "NOR/WUSDT"
  );

  // Add liquidity to NOR/WBNB
  console.log("\n" + "=".repeat(70));
  console.log("2️⃣  NOR/WBNB PAIR");
  console.log("=".repeat(70));
  await addLiquidity(
    NOR_TOKEN,
    WBNB,
    LIQUIDITY.NOR_WBNB.norAmount,
    LIQUIDITY.NOR_WBNB.wbnbAmount,
    LIQUIDITY.NOR_WBNB.minNOR,
    LIQUIDITY.NOR_WBNB.minWBNB,
    ROUTER,
    deployer.address,
    "NOR/WBNB"
  );

  // Add liquidity to NOR/WETH
  console.log("\n" + "=".repeat(70));
  console.log("3️⃣  NOR/WETH PAIR");
  console.log("=".repeat(70));
  await addLiquidity(
    NOR_TOKEN,
    WETH,
    LIQUIDITY.NOR_WETH.norAmount,
    LIQUIDITY.NOR_WETH.wethAmount,
    LIQUIDITY.NOR_WETH.minNOR,
    LIQUIDITY.NOR_WETH.minWETH,
    ROUTER,
    deployer.address,
    "NOR/WETH"
  );

  // Add liquidity to BTCBR/WUSDT
  console.log("\n" + "=".repeat(70));
  console.log("4️⃣  BTCBR/WUSDT PAIR");
  console.log("=".repeat(70));
  await addLiquidity(
    BTCBR,
    WUSDT,
    LIQUIDITY.BTCBR_WUSDT.btcbrAmount,
    LIQUIDITY.BTCBR_WUSDT.wusdtAmount,
    LIQUIDITY.BTCBR_WUSDT.minBTCBR,
    LIQUIDITY.BTCBR_WUSDT.minWUSDT,
    ROUTER,
    deployer.address,
    "BTCBR/WUSDT"
  );

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ ALL LIQUIDITY ADDED!");
  console.log("=".repeat(70));

  console.log("\n💡 NEXT STEPS:\n");
  console.log("   1. Verify liquidity on pairs");
  console.log("   2. Deploy liquidity lock contract:");
  console.log("      node scripts/deploy-liquidity-lock.js");
  console.log("   3. Lock LP tokens for 1+ year");
  console.log("   4. Announce DEX launch!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ LIQUIDITY ADDITION FAILED:", error);
    process.exit(1);
  });
