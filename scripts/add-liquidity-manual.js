import hre from "hardhat";
const { ethers } = hre;

/**
 * Add liquidity manually using WBNB and our router
 * This works around the addLiquidityETH issue
 */

async function main() {
  console.log("\n💧 ADDING LIQUIDITY TO BSC MAINNET");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  // Deployed contract addresses
  const wbnbAddress = "0xAE7501469a47e52ecbc57741dC810bA35F0b3E48";
  const routerAddress = "0xBF4d461B2C83061df8eD3D7bD0aEd7a5b9C8b708";
  const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
  const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

  // Get contracts
  const WBNB = await ethers.getContractAt("WBNB", wbnbAddress);
  const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
  const XHN = await ethers.getContractAt("XHN", xhnAddress);
  const router = await ethers.getContractAt("NorDEXRouter", routerAddress);

  // Amounts
  const bnbAmount = ethers.parseEther("0.104"); // ~$75
  const btcbrAmount = ethers.parseEther("7500");
  const xhnAmount = ethers.parseEther("7500");

  console.log("\n💰 Liquidity amounts:");
  console.log("  BNB per pair:", ethers.formatEther(bnbAmount), "BNB (~$75)");
  console.log("  BTCBR:", ethers.formatEther(btcbrAmount));
  console.log("  XHN:", ethers.formatEther(xhnAmount));

  // Step 1: Wrap BNB to WBNB
  console.log("\n[1/5] Wrapping BNB to WBNB...");
  const wrapAmount = ethers.parseEther("0.208"); // 0.104 * 2 pairs
  const wrapTx = await WBNB.deposit({ value: wrapAmount });
  await wrapTx.wait();
  console.log("   ✅ Wrapped", ethers.formatEther(wrapAmount), "BNB to WBNB");

  // Step 2: Approve tokens
  console.log("\n[2/5] Approving tokens...");
  await (await WBNB.approve(routerAddress, ethers.MaxUint256)).wait();
  await (await BTCBR.approve(routerAddress, ethers.MaxUint256)).wait();
  await (await XHN.approve(routerAddress, ethers.MaxUint256)).wait();
  console.log("   ✅ All tokens approved");

  // Step 3: Add WBNB/BTCBR liquidity
  console.log("\n[3/5] Adding WBNB/BTCBR liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const addLiq1Tx = await router.addLiquidity(
    wbnbAddress,
    btcbrAddress,
    bnbAmount,
    btcbrAmount,
    0,
    0,
    deployer.address,
    deadline
  );
  await addLiq1Tx.wait();
  console.log("   ✅ WBNB/BTCBR liquidity added");

  // Step 4: Add WBNB/XHN liquidity
  console.log("\n[4/5] Adding WBNB/XHN liquidity...");
  const addLiq2Tx = await router.addLiquidity(
    wbnbAddress,
    xhnAddress,
    bnbAmount,
    xhnAmount,
    0,
    0,
    deployer.address,
    deadline
  );
  await addLiq2Tx.wait();
  console.log("   ✅ WBNB/XHN liquidity added");

  // Step 5: Add BTCBR/XHN liquidity
  console.log("\n[5/5] Adding BTCBR/XHN liquidity...");
  const addLiq3Tx = await router.addLiquidity(
    btcbrAddress,
    xhnAddress,
    btcbrAmount,
    xhnAmount,
    0,
    0,
    deployer.address,
    deadline
  );
  await addLiq3Tx.wait();
  console.log("   ✅ BTCBR/XHN liquidity added");

  console.log("\n" + "=".repeat(70));
  console.log("✅ LIQUIDITY ADDED SUCCESSFULLY!");
  console.log("=".repeat(70));

  console.log("\n📊 Summary:");
  console.log("  WBNB/BTCBR: 0.104 BNB + 7,500 BTCBR");
  console.log("  WBNB/XHN: 0.104 BNB + 7,500 XHN");
  console.log("  BTCBR/XHN: 7,500 BTCBR + 7,500 XHN");
  console.log("\n💰 Total liquidity: ~$150 USD");

  console.log("\n🔗 Trading pairs:");
  console.log("  BNB/BTCBR: 0x8f8671977908f8329aef73E71f1e6e7aCF9039de");
  console.log("  BNB/XHN: 0x2F75c15a476Db2503F0c07A7469Af63Ba1F00F43");
  console.log("  BTCBR/XHN: 0x8ea64673f0d4F618ccbf3F3AceA2abDF889F3B4B");

  console.log("\n🌐 PancakeSwap URLs:");
  console.log(
    "  BTCBR:",
    `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}`
  );
  console.log(
    "  XHN:",
    `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}`
  );

  console.log("\n✅ DONE! Your tokens are now PUBLIC on BSC!");
  console.log("   MetaMask will show USD values within 30 minutes! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
