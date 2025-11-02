import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🧪 Testing Simple Liquidity Addition\n");
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

  // Get contract instances
  const norToken = await ethers.getContractAt("NOR", NOR_TOKEN);
  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);
  const factory = await ethers.getContractAt("NoorSwapFactory", NOORSWAP_FACTORY);
  const router = await ethers.getContractAt("NoorSwapRouter", NOORSWAP_ROUTER);

  // Check balances
  const norBalance = await norToken.balanceOf(deployer.address);
  const wusdtBalance = await wusdt.balanceOf(deployer.address);
  console.log("💰 NOR Balance:", ethers.formatUnits(norBalance, 24));
  console.log("💰 WUSDT Balance:", ethers.formatEther(wusdtBalance));

  // Get pair address
  const pairAddress = await factory.getPair(NOR_TOKEN, WUSDT);
  console.log("\n📍 Pair Address:", pairAddress);

  // Test amounts - very small to test
  const norAmount = ethers.parseUnits("1000", 24); // 1000 NOR
  const usdtAmount = ethers.parseEther("10"); // 10 WUSDT

  console.log("\n🧪 Test amounts:");
  console.log("  NOR:", ethers.formatUnits(norAmount, 24));
  console.log("  WUSDT:", ethers.formatEther(usdtAmount));

  // Approve tokens
  console.log("\n🔐 Approving tokens...");
  const norApproveTx = await norToken.approve(NOORSWAP_ROUTER, norAmount);
  await norApproveTx.wait();
  console.log("  ✅ NOR approved");

  const usdtApproveTx = await wusdt.approve(NOORSWAP_ROUTER, usdtAmount);
  await usdtApproveTx.wait();
  console.log("  ✅ WUSDT approved");

  // Check allowances
  const norAllowance = await norToken.allowance(deployer.address, NOORSWAP_ROUTER);
  const usdtAllowance = await wusdt.allowance(deployer.address, NOORSWAP_ROUTER);
  console.log("\n✅ Allowances:");
  console.log("  NOR:", ethers.formatUnits(norAllowance, 24));
  console.log("  WUSDT:", ethers.formatEther(usdtAllowance));

  // Try to add liquidity
  console.log("\n💧 Attempting to add liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  try {
    // First, let's check if we're using the right token order
    const pair = await ethers.getContractAt("NoorSwapPair", pairAddress);
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    console.log("  Token0:", token0, token0 === WUSDT ? "(WUSDT)" : "(NOR)");
    console.log("  Token1:", token1, token1 === WUSDT ? "(WUSDT)" : "(NOR)");

    // Let's use the correct token order
    const [tokenA, tokenB, amountA, amountB] = token0 === WUSDT
      ? [WUSDT, NOR_TOKEN, usdtAmount, norAmount]
      : [NOR_TOKEN, WUSDT, norAmount, usdtAmount];

    console.log("\n  Using token order:");
    console.log("    TokenA:", tokenA === WUSDT ? "WUSDT" : "NOR");
    console.log("    TokenB:", tokenB === WUSDT ? "WUSDT" : "NOR");

    const addLiqTx = await router.addLiquidity(
      tokenA,
      tokenB,
      amountA,
      amountB,
      0n, // Accept any amount of tokens (for testing)
      0n, // Accept any amount of tokens (for testing)
      deployer.address,
      deadline
    );

    console.log("  📡 Transaction sent:", addLiqTx.hash);
    const receipt = await addLiqTx.wait();
    console.log("  ✅ Liquidity added successfully!");
    console.log("  Gas used:", receipt.gasUsed.toString());

    // Check reserves
    const reserves = await pair.getReserves();
    console.log("\n📊 New Reserves:");
    console.log("  Reserve0:", ethers.formatEther(reserves[0]));
    console.log("  Reserve1:", ethers.formatEther(reserves[1]));

    // Check LP balance
    const lpBalance = await pair.balanceOf(deployer.address);
    console.log("  LP tokens received:", ethers.formatEther(lpBalance));

  } catch (error) {
    console.error("\n❌ Error adding liquidity:");
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