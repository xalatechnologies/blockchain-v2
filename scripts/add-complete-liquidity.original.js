import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💰 Nor Chain DEX - Complete $800K Liquidity Deployment\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  // Load deployment info
  const deployment = JSON.parse(
    fs.readFileSync("./deployments/dex-infrastructure.json", "utf8")
  );
  const {
    NOR_TOKEN,
    WNOR,
    WUSDT,
    WBNB,
    WETH,
    DIRHAMAT,
    NOORSWAP_FACTORY,
    NOORSWAP_ROUTER,
  } = deployment.contracts;

  console.log("📋 Contract Addresses:");
  console.log(`  NOR Token:       ${NOR_TOKEN}`);
  console.log(`  WNOR:            ${WNOR}`);
  console.log(`  WUSDT:           ${WUSDT}`);
  console.log(`  WBNB:            ${WBNB}`);
  console.log(`  WETH:            ${WETH}`);
  console.log(`  Dirhamat:        ${DIRHAMAT}`);
  console.log(`  Factory:         ${NOORSWAP_FACTORY}`);
  console.log(`  Router:          ${NOORSWAP_ROUTER}\n`);

  // Get contract instances
  const norToken = await ethers.getContractAt("NOR", NOR_TOKEN);
  const wnor = await ethers.getContractAt("WNOR", WNOR);
  const wusdt = await ethers.getContractAt("WUSDTToken", WUSDT);
  const wbnb = await ethers.getContractAt("WBNBToken", WBNB);
  const weth = await ethers.getContractAt("WETHToken", WETH);
  const dirhamat = await ethers.getContractAt("Dirhamat", DIRHAMAT);
  const factory = await ethers.getContractAt(
    "NorSwapFactory",
    NOORSWAP_FACTORY
  );
  const router = await ethers.getContractAt("NorSwapRouter", NOORSWAP_ROUTER);

  console.log("=".repeat(70));
  console.log("💰 LIQUIDITY ALLOCATION PLAN - $800,000 TOTAL");
  console.log("=".repeat(70));
  console.log("1. NOR/WUSDT:      $250,000 (31.25%) - 1 NOR = $0.01");
  console.log("2. NOR/WBNB:       $200,000 (25.00%) - Bridge asset priority");
  console.log("3. NOR/WETH:       $150,000 (18.75%) - Bridge asset priority");
  console.log("4. NOR/Dirhamat:   $150,000 (18.75%) - Regional adoption");
  console.log("5. Dirhamat/WUSDT: $50,000  (6.25%)  - Stable arbitrage\n");

  const pairs = [];
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  // ============================================================
  // PAIR 1: NOR/WUSDT - $250,000 (Main USD pair)
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 1/5: NOR/WUSDT - $250,000 Liquidity");
  console.log("=".repeat(70));

  const norAmount1 = ethers.parseUnits("12500000", 24); // 12.5M NOR (24 decimals)
  const usdtAmount1 = ethers.parseEther("125000"); // $125k WUSDT (18 decimals)

  console.log(`  Adding: ${ethers.formatUnits(norAmount1, 24)} NOR`);
  console.log(`  Adding: ${ethers.formatEther(usdtAmount1)} WUSDT`);
  console.log(`  Target Price: 1 NOR = $0.01 USD`);

  // Wrap NOR to WNOR
  console.log("\n  🔄 Wrapping NOR to WNOR...");
  const wrapTx1 = await wnor.deposit({ value: norAmount1 });
  await wrapTx1.wait();
  console.log("  ✅ Wrapped NOR to WNOR");

  // Approve tokens
  console.log("  🔐 Approving tokens for Router...");
  await (await wnor.approve(NOORSWAP_ROUTER, norAmount1)).wait();
  await (await wusdt.approve(NOORSWAP_ROUTER, usdtAmount1)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair
  console.log("  🏭 Creating NOR/WUSDT pair...");
  const createPairTx1 = await factory.createPair(WNOR, WUSDT);
  await createPairTx1.wait();
  const pair1Address = await factory.getPair(WNOR, WUSDT);
  console.log(`  ✅ Pair created: ${pair1Address}`);

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx1 = await router.addLiquidity(
    WNOR,
    WUSDT,
    norAmount1,
    usdtAmount1,
    norAmount1,
    usdtAmount1,
    deployer.address,
    deadline
  );
  await addLiqTx1.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify reserves
  const pair1 = await ethers.getContractAt("INorSwapPair", pair1Address);
  const reserves1 = await pair1.getReserves();
  const token0 = await pair1.token0();
  const [reserve0, reserve1] = reserves1;

  const norReserve1 =
    token0.toLowerCase() === WNOR.toLowerCase() ? reserve0 : reserve1;
  const usdtReserve1 =
    token0.toLowerCase() === WNOR.toLowerCase() ? reserve1 : reserve0;

  console.log("\n  📊 Verified Reserves:");
  console.log(`    WNOR:  ${ethers.formatUnits(norReserve1, 18)}`);
  console.log(`    WUSDT: ${ethers.formatEther(usdtReserve1)}`);

  const price1 = Number(usdtReserve1) / Number(norReserve1);
  console.log(`  💵 Price: 1 NOR = $${price1.toFixed(6)} USD`);

  pairs.push({
    name: "NOR/WUSDT",
    address: pair1Address,
    token0: WNOR,
    token1: WUSDT,
    reserve0: norReserve1.toString(),
    reserve1: usdtReserve1.toString(),
    liquidity: "$250,000",
    targetPrice: "$0.01",
    actualPrice: `$${price1.toFixed(6)}`,
  });

  // ============================================================
  // PAIR 2: NOR/WBNB - $200,000 (Bridge asset)
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 2/5: NOR/WBNB - $200,000 Liquidity");
  console.log("=".repeat(70));

  const norAmount2 = ethers.parseUnits("10000000", 24); // 10M NOR
  const bnbAmount2 = ethers.parseEther("333"); // 333 BNB (~$200k at $600/BNB)

  console.log(`  Adding: ${ethers.formatUnits(norAmount2, 24)} NOR`);
  console.log(`  Adding: ${ethers.formatEther(bnbAmount2)} WBNB`);
  console.log(`  Target Price: 1 NOR = 0.0000333 BNB`);

  // Wrap NOR
  console.log("\n  🔄 Wrapping NOR to WNOR...");
  const wrapTx2 = await wnor.deposit({ value: norAmount2 });
  await wrapTx2.wait();
  console.log("  ✅ Wrapped NOR to WNOR");

  // Approve tokens
  console.log("  🔐 Approving tokens for Router...");
  await (await wnor.approve(NOORSWAP_ROUTER, norAmount2)).wait();
  await (await wbnb.approve(NOORSWAP_ROUTER, bnbAmount2)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair
  console.log("  🏭 Creating NOR/WBNB pair...");
  const createPairTx2 = await factory.createPair(WNOR, WBNB);
  await createPairTx2.wait();
  const pair2Address = await factory.getPair(WNOR, WBNB);
  console.log(`  ✅ Pair created: ${pair2Address}`);

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx2 = await router.addLiquidity(
    WNOR,
    WBNB,
    norAmount2,
    bnbAmount2,
    norAmount2,
    bnbAmount2,
    deployer.address,
    deadline
  );
  await addLiqTx2.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify reserves
  const pair2 = await ethers.getContractAt("INorSwapPair", pair2Address);
  const reserves2 = await pair2.getReserves();
  const token0_p2 = await pair2.token0();
  const [reserve0_p2, reserve1_p2] = reserves2;

  const norReserve2 =
    token0_p2.toLowerCase() === WNOR.toLowerCase() ? reserve0_p2 : reserve1_p2;
  const bnbReserve2 =
    token0_p2.toLowerCase() === WNOR.toLowerCase() ? reserve1_p2 : reserve0_p2;

  console.log("\n  📊 Verified Reserves:");
  console.log(`    WNOR: ${ethers.formatUnits(norReserve2, 18)}`);
  console.log(`    WBNB: ${ethers.formatEther(bnbReserve2)}`);

  const price2 = Number(bnbReserve2) / Number(norReserve2);
  console.log(`  💵 Price: 1 NOR = ${price2.toFixed(9)} BNB`);

  pairs.push({
    name: "NOR/WBNB",
    address: pair2Address,
    token0: WNOR,
    token1: WBNB,
    reserve0: norReserve2.toString(),
    reserve1: bnbReserve2.toString(),
    liquidity: "$200,000",
    targetPrice: "0.0000333 BNB",
    actualPrice: `${price2.toFixed(9)} BNB`,
  });

  // ============================================================
  // PAIR 3: NOR/WETH - $150,000 (Bridge asset)
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 3/5: NOR/WETH - $150,000 Liquidity");
  console.log("=".repeat(70));

  const norAmount3 = ethers.parseUnits("7500000", 24); // 7.5M NOR
  const ethAmount3 = ethers.parseEther("47"); // 47 ETH (~$150k at $3200/ETH)

  console.log(`  Adding: ${ethers.formatUnits(norAmount3, 24)} NOR`);
  console.log(`  Adding: ${ethers.formatEther(ethAmount3)} WETH`);
  console.log(`  Target Price: 1 NOR = 0.00000627 ETH`);

  // Wrap NOR
  console.log("\n  🔄 Wrapping NOR to WNOR...");
  const wrapTx3 = await wnor.deposit({ value: norAmount3 });
  await wrapTx3.wait();
  console.log("  ✅ Wrapped NOR to WNOR");

  // Approve tokens
  console.log("  🔐 Approving tokens for Router...");
  await (await wnor.approve(NOORSWAP_ROUTER, norAmount3)).wait();
  await (await weth.approve(NOORSWAP_ROUTER, ethAmount3)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair
  console.log("  🏭 Creating NOR/WETH pair...");
  const createPairTx3 = await factory.createPair(WNOR, WETH);
  await createPairTx3.wait();
  const pair3Address = await factory.getPair(WNOR, WETH);
  console.log(`  ✅ Pair created: ${pair3Address}`);

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx3 = await router.addLiquidity(
    WNOR,
    WETH,
    norAmount3,
    ethAmount3,
    norAmount3,
    ethAmount3,
    deployer.address,
    deadline
  );
  await addLiqTx3.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify reserves
  const pair3 = await ethers.getContractAt("INorSwapPair", pair3Address);
  const reserves3 = await pair3.getReserves();
  const token0_p3 = await pair3.token0();
  const [reserve0_p3, reserve1_p3] = reserves3;

  const norReserve3 =
    token0_p3.toLowerCase() === WNOR.toLowerCase() ? reserve0_p3 : reserve1_p3;
  const ethReserve3 =
    token0_p3.toLowerCase() === WNOR.toLowerCase() ? reserve1_p3 : reserve0_p3;

  console.log("\n  📊 Verified Reserves:");
  console.log(`    WNOR: ${ethers.formatUnits(norReserve3, 18)}`);
  console.log(`    WETH: ${ethers.formatEther(ethReserve3)}`);

  const price3 = Number(ethReserve3) / Number(norReserve3);
  console.log(`  💵 Price: 1 NOR = ${price3.toFixed(11)} ETH`);

  pairs.push({
    name: "NOR/WETH",
    address: pair3Address,
    token0: WNOR,
    token1: WETH,
    reserve0: norReserve3.toString(),
    reserve1: ethReserve3.toString(),
    liquidity: "$150,000",
    targetPrice: "0.00000627 ETH",
    actualPrice: `${price3.toFixed(11)} ETH`,
  });

  // ============================================================
  // PAIR 4: NOR/Dirhamat - $150,000 (Regional pair)
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 4/5: NOR/Dirhamat - $150,000 Liquidity");
  console.log("=".repeat(70));

  const norAmount4 = ethers.parseUnits("7500000", 24); // 7.5M NOR
  const dirhamatAmount4 = ethers.parseEther("277778"); // 277,778 DIRHAMAT (~$75k at $0.27)

  console.log(`  Adding: ${ethers.formatUnits(norAmount4, 24)} NOR`);
  console.log(`  Adding: ${ethers.formatEther(dirhamatAmount4)} DIRHAMAT`);
  console.log(`  Target Price: 1 DIRHAMAT = 27 NOR`);

  // Wrap NOR
  console.log("\n  🔄 Wrapping NOR to WNOR...");
  const wrapTx4 = await wnor.deposit({ value: norAmount4 });
  await wrapTx4.wait();
  console.log("  ✅ Wrapped NOR to WNOR");

  // Approve tokens
  console.log("  🔐 Approving tokens for Router...");
  await (await wnor.approve(NOORSWAP_ROUTER, norAmount4)).wait();
  await (await dirhamat.approve(NOORSWAP_ROUTER, dirhamatAmount4)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair
  console.log("  🏭 Creating NOR/Dirhamat pair...");
  const createPairTx4 = await factory.createPair(WNOR, DIRHAMAT);
  await createPairTx4.wait();
  const pair4Address = await factory.getPair(WNOR, DIRHAMAT);
  console.log(`  ✅ Pair created: ${pair4Address}`);

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx4 = await router.addLiquidity(
    WNOR,
    DIRHAMAT,
    norAmount4,
    dirhamatAmount4,
    norAmount4,
    dirhamatAmount4,
    deployer.address,
    deadline
  );
  await addLiqTx4.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify reserves
  const pair4 = await ethers.getContractAt("INorSwapPair", pair4Address);
  const reserves4 = await pair4.getReserves();
  const token0_p4 = await pair4.token0();
  const [reserve0_p4, reserve1_p4] = reserves4;

  const norReserve4 =
    token0_p4.toLowerCase() === WNOR.toLowerCase() ? reserve0_p4 : reserve1_p4;
  const dirhamatReserve4 =
    token0_p4.toLowerCase() === WNOR.toLowerCase() ? reserve1_p4 : reserve0_p4;

  console.log("\n  📊 Verified Reserves:");
  console.log(`    WNOR:     ${ethers.formatUnits(norReserve4, 18)}`);
  console.log(`    DIRHAMAT: ${ethers.formatEther(dirhamatReserve4)}`);

  const price4 = Number(norReserve4) / Number(dirhamatReserve4);
  console.log(`  💵 Price: 1 DIRHAMAT = ${price4.toFixed(2)} NOR`);

  pairs.push({
    name: "NOR/Dirhamat",
    address: pair4Address,
    token0: WNOR,
    token1: DIRHAMAT,
    reserve0: norReserve4.toString(),
    reserve1: dirhamatReserve4.toString(),
    liquidity: "$150,000",
    targetPrice: "27 NOR",
    actualPrice: `${price4.toFixed(2)} NOR`,
  });

  // ============================================================
  // PAIR 5: Dirhamat/WUSDT - $50,000 (Stable arbitrage)
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("📍 PAIR 5/5: Dirhamat/WUSDT - $50,000 Liquidity");
  console.log("=".repeat(70));

  const dirhamatAmount5 = ethers.parseEther("92593"); // 92,593 DIRHAMAT (~$25k)
  const usdtAmount5 = ethers.parseEther("25000"); // $25k WUSDT

  console.log(`  Adding: ${ethers.formatEther(dirhamatAmount5)} DIRHAMAT`);
  console.log(`  Adding: ${ethers.formatEther(usdtAmount5)} WUSDT`);
  console.log(`  Target Price: 1 DIRHAMAT = $0.27 USD`);

  // Approve tokens
  console.log("\n  🔐 Approving tokens for Router...");
  await (await dirhamat.approve(NOORSWAP_ROUTER, dirhamatAmount5)).wait();
  await (await wusdt.approve(NOORSWAP_ROUTER, usdtAmount5)).wait();
  console.log("  ✅ Tokens approved");

  // Create pair
  console.log("  🏭 Creating Dirhamat/WUSDT pair...");
  const createPairTx5 = await factory.createPair(DIRHAMAT, WUSDT);
  await createPairTx5.wait();
  const pair5Address = await factory.getPair(DIRHAMAT, WUSDT);
  console.log(`  ✅ Pair created: ${pair5Address}`);

  // Add liquidity
  console.log("  💧 Adding liquidity...");
  const addLiqTx5 = await router.addLiquidity(
    DIRHAMAT,
    WUSDT,
    dirhamatAmount5,
    usdtAmount5,
    dirhamatAmount5,
    usdtAmount5,
    deployer.address,
    deadline
  );
  await addLiqTx5.wait();
  console.log("  ✅ Liquidity added successfully");

  // Verify reserves
  const pair5 = await ethers.getContractAt("INorSwapPair", pair5Address);
  const reserves5 = await pair5.getReserves();
  const token0_p5 = await pair5.token0();
  const [reserve0_p5, reserve1_p5] = reserves5;

  const dirhamatReserve5 =
    token0_p5.toLowerCase() === DIRHAMAT.toLowerCase()
      ? reserve0_p5
      : reserve1_p5;
  const usdtReserve5 =
    token0_p5.toLowerCase() === DIRHAMAT.toLowerCase()
      ? reserve1_p5
      : reserve0_p5;

  console.log("\n  📊 Verified Reserves:");
  console.log(`    DIRHAMAT: ${ethers.formatEther(dirhamatReserve5)}`);
  console.log(`    WUSDT:    ${ethers.formatEther(usdtReserve5)}`);

  const price5 = Number(usdtReserve5) / Number(dirhamatReserve5);
  console.log(`  💵 Price: 1 DIRHAMAT = $${price5.toFixed(4)} USD`);

  pairs.push({
    name: "Dirhamat/WUSDT",
    address: pair5Address,
    token0: DIRHAMAT,
    token1: WUSDT,
    reserve0: dirhamatReserve5.toString(),
    reserve1: usdtReserve5.toString(),
    liquidity: "$50,000",
    targetPrice: "$0.27",
    actualPrice: `$${price5.toFixed(4)}`,
  });

  // ============================================================
  // DEPLOYMENT SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(70));
  console.log("✅ LIQUIDITY DEPLOYMENT COMPLETE - $800,000 DEPLOYED");
  console.log("=".repeat(70));

  console.log("\n📋 Deployed Pairs Summary:\n");
  pairs.forEach((pair, index) => {
    console.log(`${index + 1}. ${pair.name}`);
    console.log(`   Address: ${pair.address}`);
    console.log(`   Liquidity: ${pair.liquidity}`);
    console.log(`   Target Price: ${pair.targetPrice}`);
    console.log(`   Actual Price: ${pair.actualPrice}`);
    console.log("");
  });

  // Save deployment data
  const liquidityDeployment = {
    timestamp: new Date().toISOString(),
    network: "btcbr",
    chainId: "65001",
    deployer: deployer.address,
    totalLiquidity: "$800,000",
    pairs: pairs,
  };

  fs.writeFileSync(
    "./deployments/liquidity-deployment.json",
    JSON.stringify(liquidityDeployment, null, 2)
  );

  console.log(
    "💾 Deployment data saved to: deployments/liquidity-deployment.json"
  );

  console.log("\n" + "=".repeat(70));
  console.log("🎉 NOOR CHAIN DEX NOW LIVE WITH $800K LIQUIDITY!");
  console.log("=".repeat(70));
  console.log("\n🚀 Next Step: Lock LP tokens for 12 months");
  console.log(
    "   Run: npx hardhat run scripts/lock-all-lp-tokens.js --network btcbr\n"
  );

  return liquidityDeployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Liquidity deployment failed:");
    console.error(error);
    process.exit(1);
  });
