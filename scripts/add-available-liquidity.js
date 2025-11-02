import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💰 Noor Chain DEX - Adding Available Liquidity\n");
  console.log("=" .repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);

  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  const {
    NOR_TOKEN,
    WUSDT,
    WETH,
    DIRHAMAT,
    NOORSWAP_FACTORY,
    NOORSWAP_ROUTER
  } = deployment.contracts;

  // Get contract instances
  const norToken = await ethers.getContractAt("NOR", NOR_TOKEN);
  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);
  const weth = await ethers.getContractAt("WETHToken", WETH);
  const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT);
  const factory = await ethers.getContractAt("NoorSwapFactory", NOORSWAP_FACTORY);
  const router = await ethers.getContractAt("NoorSwapRouter", NOORSWAP_ROUTER);

  // Check balances
  console.log("\n📊 Available Balances:");
  const norBalance = await norToken.balanceOf(deployer.address);
  console.log("  NOR:", ethers.formatUnits(norBalance, 24));
  const wusdtBalance = await wusdt.balanceOf(deployer.address);
  console.log("  WUSDT:", ethers.formatEther(wusdtBalance));
  const wethBalance = await weth.balanceOf(deployer.address);
  console.log("  WETH:", ethers.formatEther(wethBalance));
  const dirhamatBalance = await dirhamat.balanceOf(deployer.address);
  console.log("  Dirhamat:", ethers.formatEther(dirhamatBalance));

  console.log("\n" + "=".repeat(70));
  console.log("💰 LIQUIDITY PLAN (Based on Available Tokens)");
  console.log("=" .repeat(70));
  console.log("1. NOR/WUSDT: Already added ✅");
  console.log("2. NOR/WETH:  7.5M NOR + 47 WETH");
  console.log("3. NOR/Dirhamat: 7.5M NOR + 277,778 DIRHAMAT");
  console.log("4. Dirhamat/WUSDT: 92,593 DIRHAMAT + 25,000 WUSDT\n");

  const pairs = [];
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // ============================================================
  // PAIR 1: NOR/WETH - $150,000
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 1/3: NOR/WETH");
  console.log("=".repeat(70));

  const norAmount1 = ethers.parseUnits("7500000", 24); // 7.5M NOR
  const ethAmount1 = ethers.parseEther("47"); // 47 WETH

  console.log(`  Adding: ${ethers.formatUnits(norAmount1, 24)} NOR`);
  console.log(`  Adding: ${ethers.formatEther(ethAmount1)} WETH`);

  // Approve tokens
  console.log("\n  🔐 Approving tokens for Router...");
  await (await norToken.approve(NOORSWAP_ROUTER, norAmount1)).wait();
  await (await weth.approve(NOORSWAP_ROUTER, ethAmount1)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair if needed
  console.log("  🏭 Checking NOR/WETH pair...");
  let pair1Address = await factory.getPair(NOR_TOKEN, WETH);
  if (pair1Address === ethers.ZeroAddress) {
    console.log("  Creating new pair...");
    const createPairTx1 = await factory.createPair(NOR_TOKEN, WETH);
    await createPairTx1.wait();
    pair1Address = await factory.getPair(NOR_TOKEN, WETH);
    console.log(`  ✅ Pair created: ${pair1Address}`);
  } else {
    console.log(`  ℹ️ Pair exists: ${pair1Address}`);
  }

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx1 = await router.addLiquidity(
    NOR_TOKEN,
    WETH,
    norAmount1,
    ethAmount1,
    norAmount1 * 95n / 100n,
    ethAmount1 * 95n / 100n,
    deployer.address,
    deadline
  );
  await addLiqTx1.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify
  const pair1 = await ethers.getContractAt("NoorSwapPair", pair1Address);
  const lpBalance1 = await pair1.balanceOf(deployer.address);
  console.log(`  🎫 LP tokens received: ${ethers.formatEther(lpBalance1)}`);

  pairs.push({
    name: "NOR/WETH",
    address: pair1Address,
    lpTokens: lpBalance1.toString()
  });

  // ============================================================
  // PAIR 2: NOR/Dirhamat - $150,000
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 2/3: NOR/Dirhamat");
  console.log("=".repeat(70));

  const norAmount2 = ethers.parseUnits("7500000", 24); // 7.5M NOR
  const dirhamatAmount2 = ethers.parseEther("277778"); // 277,778 DIRHAMAT

  console.log(`  Adding: ${ethers.formatUnits(norAmount2, 24)} NOR`);
  console.log(`  Adding: ${ethers.formatEther(dirhamatAmount2)} DIRHAMAT`);

  // Approve tokens
  console.log("\n  🔐 Approving tokens for Router...");
  await (await norToken.approve(NOORSWAP_ROUTER, norAmount2)).wait();
  await (await dirhamat.approve(NOORSWAP_ROUTER, dirhamatAmount2)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair if needed
  console.log("  🏭 Checking NOR/Dirhamat pair...");
  let pair2Address = await factory.getPair(NOR_TOKEN, DIRHAMAT);
  if (pair2Address === ethers.ZeroAddress) {
    console.log("  Creating new pair...");
    const createPairTx2 = await factory.createPair(NOR_TOKEN, DIRHAMAT);
    await createPairTx2.wait();
    pair2Address = await factory.getPair(NOR_TOKEN, DIRHAMAT);
    console.log(`  ✅ Pair created: ${pair2Address}`);
  } else {
    console.log(`  ℹ️ Pair exists: ${pair2Address}`);
  }

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx2 = await router.addLiquidity(
    NOR_TOKEN,
    DIRHAMAT,
    norAmount2,
    dirhamatAmount2,
    norAmount2 * 95n / 100n,
    dirhamatAmount2 * 95n / 100n,
    deployer.address,
    deadline
  );
  await addLiqTx2.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify
  const pair2 = await ethers.getContractAt("NoorSwapPair", pair2Address);
  const lpBalance2 = await pair2.balanceOf(deployer.address);
  console.log(`  🎫 LP tokens received: ${ethers.formatEther(lpBalance2)}`);

  pairs.push({
    name: "NOR/Dirhamat",
    address: pair2Address,
    lpTokens: lpBalance2.toString()
  });

  // ============================================================
  // PAIR 3: Dirhamat/WUSDT - $50,000
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 3/3: Dirhamat/WUSDT");
  console.log("=".repeat(70));

  const dirhamatAmount3 = ethers.parseEther("92593"); // 92,593 DIRHAMAT
  const usdtAmount3 = ethers.parseEther("25000"); // 25,000 WUSDT

  console.log(`  Adding: ${ethers.formatEther(dirhamatAmount3)} DIRHAMAT`);
  console.log(`  Adding: ${ethers.formatEther(usdtAmount3)} WUSDT`);

  // Approve tokens
  console.log("\n  🔐 Approving tokens for Router...");
  await (await dirhamat.approve(NOORSWAP_ROUTER, dirhamatAmount3)).wait();
  await (await wusdt.approve(NOORSWAP_ROUTER, usdtAmount3)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair if needed
  console.log("  🏭 Checking Dirhamat/WUSDT pair...");
  let pair3Address = await factory.getPair(DIRHAMAT, WUSDT);
  if (pair3Address === ethers.ZeroAddress) {
    console.log("  Creating new pair...");
    const createPairTx3 = await factory.createPair(DIRHAMAT, WUSDT);
    await createPairTx3.wait();
    pair3Address = await factory.getPair(DIRHAMAT, WUSDT);
    console.log(`  ✅ Pair created: ${pair3Address}`);
  } else {
    console.log(`  ℹ️ Pair exists: ${pair3Address}`);
  }

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx3 = await router.addLiquidity(
    DIRHAMAT,
    WUSDT,
    dirhamatAmount3,
    usdtAmount3,
    dirhamatAmount3 * 95n / 100n,
    usdtAmount3 * 95n / 100n,
    deployer.address,
    deadline
  );
  await addLiqTx3.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify
  const pair3 = await ethers.getContractAt("NoorSwapPair", pair3Address);
  const lpBalance3 = await pair3.balanceOf(deployer.address);
  console.log(`  🎫 LP tokens received: ${ethers.formatEther(lpBalance3)}`);

  pairs.push({
    name: "Dirhamat/WUSDT",
    address: pair3Address,
    lpTokens: lpBalance3.toString()
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("✅ LIQUIDITY DEPLOYMENT COMPLETE");
  console.log("=".repeat(70));

  console.log("\n📋 Deployed Pairs:");
  console.log("  1. NOR/WUSDT: Already deployed in previous run ✅");
  pairs.forEach((pair, index) => {
    console.log(`  ${index + 2}. ${pair.name}: ${pair.address}`);
    console.log(`     LP Tokens: ${ethers.formatEther(pair.lpTokens)}`);
  });

  // Check remaining balances
  console.log("\n📊 Remaining Balances:");
  const finalNorBalance = await norToken.balanceOf(deployer.address);
  console.log("  NOR:", ethers.formatUnits(finalNorBalance, 24));
  const finalWusdtBalance = await wusdt.balanceOf(deployer.address);
  console.log("  WUSDT:", ethers.formatEther(finalWusdtBalance));
  const finalWethBalance = await weth.balanceOf(deployer.address);
  console.log("  WETH:", ethers.formatEther(finalWethBalance));
  const finalDirhamatBalance = await dirhamat.balanceOf(deployer.address);
  console.log("  Dirhamat:", ethers.formatEther(finalDirhamatBalance));

  // Save deployment data
  const liquidityDeployment = {
    timestamp: new Date().toISOString(),
    network: "btcbr",
    chainId: "65001",
    deployer: deployer.address,
    totalPairs: 4,
    pairs: [
      {
        name: "NOR/WUSDT",
        address: await factory.getPair(NOR_TOKEN, WUSDT),
        status: "Previously deployed"
      },
      ...pairs
    ]
  };

  fs.writeFileSync(
    "./deployments/liquidity-deployment.json",
    JSON.stringify(liquidityDeployment, null, 2)
  );

  console.log("\n💾 Deployment data saved to: deployments/liquidity-deployment.json");
  console.log("\n🎉 NOOR CHAIN DEX NOW LIVE WITH LIQUIDITY!");
  console.log("\n🚀 Next: Lock LP tokens for 12 months");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });