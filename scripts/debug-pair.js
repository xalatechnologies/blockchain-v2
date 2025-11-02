import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🔍 Debugging Pair Contract\n");
  console.log("=" .repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);

  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const {
    NOR_TOKEN,
    WUSDT,
    NOORSWAP_FACTORY,
    NOORSWAP_ROUTER
  } = deployment.contracts;

  // Get pair address
  const factory = await ethers.getContractAt("NoorSwapFactory", NOORSWAP_FACTORY);
  const pairAddress = await factory.getPair(NOR_TOKEN, WUSDT);
  console.log("📍 Pair Address:", pairAddress);

  // Get pair contract
  const pair = await ethers.getContractAt("NoorSwapPair", pairAddress);

  // Check pair state
  console.log("\n📊 Pair State:");
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  console.log("  Token0:", token0);
  console.log("  Token1:", token1);

  const reserves = await pair.getReserves();
  console.log("  Reserve0:", reserves[0].toString());
  console.log("  Reserve1:", reserves[1].toString());
  console.log("  BlockTimestampLast:", reserves[2].toString());

  const totalSupply = await pair.totalSupply();
  console.log("  Total Supply:", totalSupply.toString());

  const MINIMUM_LIQUIDITY = await pair.MINIMUM_LIQUIDITY();
  console.log("  MINIMUM_LIQUIDITY:", MINIMUM_LIQUIDITY.toString());

  // Check factory
  const factoryAddress = await pair.factory();
  console.log("  Factory:", factoryAddress);

  // Check if tokens are set correctly
  if (token0 === ethers.ZeroAddress || token1 === ethers.ZeroAddress) {
    console.log("\n❌ ERROR: Tokens not initialized properly!");
  }

  // Try to manually transfer tokens to the pair and call mint
  console.log("\n🧪 Testing manual liquidity addition...");

  const norToken = await ethers.getContractAt("NOR", NOR_TOKEN);
  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);

  // Small test amounts
  const norAmount = ethers.parseUnits("1000", 24);
  const usdtAmount = ethers.parseEther("10");

  try {
    // Transfer tokens directly to pair
    console.log("  Transferring tokens to pair...");

    // Determine which amount goes where based on token order
    const [amount0, amount1] = token0.toLowerCase() === WUSDT.toLowerCase()
      ? [usdtAmount, norAmount]
      : [norAmount, usdtAmount];

    const [tokenContract0, tokenContract1] = token0.toLowerCase() === WUSDT.toLowerCase()
      ? [wusdt, norToken]
      : [norToken, wusdt];

    // Transfer token0
    const transfer0Tx = await tokenContract0.transfer(pairAddress, amount0);
    await transfer0Tx.wait();
    console.log("    ✅ Token0 transferred");

    // Transfer token1
    const transfer1Tx = await tokenContract1.transfer(pairAddress, amount1);
    await transfer1Tx.wait();
    console.log("    ✅ Token1 transferred");

    // Check balances in pair
    const balance0 = await tokenContract0.balanceOf(pairAddress);
    const balance1 = await tokenContract1.balanceOf(pairAddress);
    console.log("  Pair Token0 balance:", ethers.formatEther(balance0));
    console.log("  Pair Token1 balance:", ethers.formatEther(balance1));

    // Call mint
    console.log("\n  Calling mint on pair...");
    const mintTx = await pair.mint(deployer.address);
    const receipt = await mintTx.wait();
    console.log("  ✅ Mint successful!");
    console.log("  Gas used:", receipt.gasUsed.toString());

    // Check LP balance
    const lpBalance = await pair.balanceOf(deployer.address);
    console.log("  LP tokens received:", ethers.formatEther(lpBalance));

    // Check new reserves
    const newReserves = await pair.getReserves();
    console.log("\n📊 New Reserves:");
    console.log("  Reserve0:", ethers.formatEther(newReserves[0]));
    console.log("  Reserve1:", ethers.formatEther(newReserves[1]));

  } catch (error) {
    console.error("\n❌ Error in manual test:");
    console.error("  Message:", error.message);
    if (error.data) {
      console.error("  Data:", error.data);
    }
    if (error.reason) {
      console.error("  Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });