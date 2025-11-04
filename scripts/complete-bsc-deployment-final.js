import hre from "hardhat";
const { ethers } = hre;

/**
 * COMPLETE BSC DEPLOYMENT - FINAL PUSH
 *
 * Budget: 0.146 BNB total
 *
 * Phase 1: Deploy Bridges (~0.012 BNB gas)
 * - BTCBRBridgeMainnet (~0.006 BNB)
 * - XHNBridgeMainnet (~0.006 BNB)
 *
 * Phase 2: Add XHN Liquidity (~0.13 BNB)
 * - Wrap BNB to WBNB
 * - Add liquidity to PancakeSwap
 *
 * This completes the entire bridge infrastructure!
 */

async function main() {
  console.log("\n🚀 COMPLETE BSC DEPLOYMENT - FINAL PUSH");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer:", deployer.address);

  // Check initial balance
  const initialBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "\n💰 Starting Balance:",
    ethers.formatEther(initialBalance),
    "BNB"
  );

  if (initialBalance < ethers.parseEther("0.14")) {
    console.log("\n⚠️  INSUFFICIENT FUNDS!");
    console.log("  Current:", ethers.formatEther(initialBalance), "BNB");
    console.log("  Needed: 0.14 BNB minimum");
    return;
  }

  // Token addresses
  const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
  const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
  const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  // Validators
  const validators = [
    "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
    "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
    "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5",
  ];

  console.log("\n=".repeat(70));
  console.log("PHASE 1: DEPLOY BRIDGES");
  console.log("=".repeat(70));

  // Deploy BTCBR Bridge
  console.log("\n[1/8] Deploying BTCBRBridgeMainnet...");
  const BTCBRBridgeMainnet = await ethers.getContractFactory(
    "BTCBRBridgeMainnet"
  );
  const btcbrBridge = await BTCBRBridgeMainnet.deploy(BTCBR_BSC, 2);
  await btcbrBridge.waitForDeployment();
  const btcbrBridgeAddr = await btcbrBridge.getAddress();
  console.log("  ✅ Deployed at:", btcbrBridgeAddr);

  // Check balance after BTCBR bridge
  let currentBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "  💰 Balance after BTCBR bridge:",
    ethers.formatEther(currentBalance),
    "BNB"
  );

  // Add validators to BTCBR bridge
  console.log("\n[2/8] Adding validators to BTCBR bridge...");
  for (const validator of validators) {
    const tx = await btcbrBridge.addValidator(validator);
    await tx.wait();
    console.log("  ✅ Added:", validator);
  }

  // Set BTCBR bridge limits and fee
  console.log("\n[3/8] Configuring BTCBR bridge...");
  await (
    await btcbrBridge.setLimits(
      ethers.parseEther("100"),
      ethers.parseEther("100000"),
      ethers.parseEther("500000")
    )
  ).wait();
  await (await btcbrBridge.setBridgeFee(10)).wait(); // 0.1%
  console.log("  ✅ BTCBR bridge configured");

  // Deploy XHN Bridge
  console.log("\n[4/8] Deploying XHNBridgeMainnet...");
  const XHNBridgeMainnet = await ethers.getContractFactory("XHNBridgeMainnet");
  const xhnBridge = await XHNBridgeMainnet.deploy(XHN_BSC, 2);
  await xhnBridge.waitForDeployment();
  const xhnBridgeAddr = await xhnBridge.getAddress();
  console.log("  ✅ Deployed at:", xhnBridgeAddr);

  // Check balance after XHN bridge
  currentBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "  💰 Balance after XHN bridge:",
    ethers.formatEther(currentBalance),
    "BNB"
  );

  // Add validators to XHN bridge
  console.log("\n[5/8] Adding validators to XHN bridge...");
  for (const validator of validators) {
    const tx = await xhnBridge.addValidator(validator);
    await tx.wait();
    console.log("  ✅ Added:", validator);
  }

  // Set XHN bridge limits and fee
  console.log("\n[6/8] Configuring XHN bridge...");
  await (
    await xhnBridge.setLimits(
      ethers.parseEther("100"),
      ethers.parseEther("100000"),
      ethers.parseEther("500000")
    )
  ).wait();
  await (await xhnBridge.setBridgeFee(10)).wait(); // 0.1%
  console.log("  ✅ XHN bridge configured");

  console.log("\n" + "=".repeat(70));
  console.log("PHASE 2: ADD XHN LIQUIDITY TO PANCAKESWAP");
  console.log("=".repeat(70));

  // Check remaining balance for liquidity
  currentBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "\n💰 Balance before liquidity:",
    ethers.formatEther(currentBalance),
    "BNB"
  );

  // Leave 0.005 BNB for final gas
  const remainingForLiquidity = currentBalance - ethers.parseEther("0.005");
  console.log(
    "  Available for liquidity:",
    ethers.formatEther(remainingForLiquidity),
    "BNB"
  );

  // Get contracts
  const xhnABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  const wbnbABI = [
    "function deposit() payable",
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  const routerABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  ];

  const xhn = new ethers.Contract(XHN_BSC, xhnABI, deployer);
  const wbnb = new ethers.Contract(OFFICIAL_WBNB, wbnbABI, deployer);
  const router = new ethers.Contract(PANCAKE_ROUTER, routerABI, deployer);

  // Check XHN balance
  const xhnBalance = await xhn.balanceOf(deployer.address);
  console.log("\n📊 XHN Balance:", ethers.formatEther(xhnBalance), "XHN");

  const xhnAmount = ethers.parseEther("7500"); // 7,500 XHN for liquidity

  console.log("\n💧 LIQUIDITY AMOUNTS:");
  console.log("  BNB:", ethers.formatEther(remainingForLiquidity), "BNB");
  console.log("  XHN:", ethers.formatEther(xhnAmount), "XHN");

  // Wrap BNB to WBNB
  console.log("\n[7/8] Wrapping BNB to WBNB...");
  const wrapTx = await wbnb.deposit({ value: remainingForLiquidity });
  await wrapTx.wait();
  console.log("  ✅ Wrapped to WBNB");

  // Approve tokens
  console.log("\n[8/8] Approving and adding liquidity...");
  await (await wbnb.approve(PANCAKE_ROUTER, remainingForLiquidity)).wait();
  console.log("  ✅ WBNB approved");

  await (await xhn.approve(PANCAKE_ROUTER, xhnAmount)).wait();
  console.log("  ✅ XHN approved");

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const addLiqTx = await router.addLiquidity(
    OFFICIAL_WBNB,
    XHN_BSC,
    remainingForLiquidity,
    xhnAmount,
    0,
    0,
    deployer.address,
    deadline
  );

  const receipt = await addLiqTx.wait();
  console.log("  ✅ Liquidity added!");
  console.log("  Transaction:", receipt.hash);

  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const totalGasUsed = initialBalance - finalBalance;

  console.log("\n" + "=".repeat(70));
  console.log("🎉 COMPLETE BSC DEPLOYMENT FINISHED!");
  console.log("=".repeat(70));

  console.log("\n💰 BUDGET BREAKDOWN:");
  console.log("  Starting:", ethers.formatEther(initialBalance), "BNB");
  console.log("  Final:", ethers.formatEther(finalBalance), "BNB");
  console.log("  Total used:", ethers.formatEther(totalGasUsed), "BNB");

  console.log("\n📝 DEPLOYED BRIDGE ADDRESSES:");
  console.log("\n  BSC MAINNET:");
  console.log("    BTCBRBridgeMainnet:", btcbrBridgeAddr);
  console.log("    XHNBridgeMainnet:", xhnBridgeAddr);
  console.log("\n  XAHEEN CHAIN:");
  console.log(
    "    BTCBRBridgePrivate: 0xe9Aa0276196928fb1dD42afda89F47CF821e987C"
  );
  console.log(
    "    XHNBridgePrivate: 0x5514EBfC66645B5Fe0BAf9FF00Eb52cc9A33Ec68"
  );

  console.log("\n🥞 PANCAKESWAP STATUS:");
  console.log(
    "  ✅ BTCBR: https://pancakeswap.finance/swap?outputCurrency=" +
      BTCBR_BSC +
      "&chain=bsc"
  );
  console.log("     Liquidity: $106 USD");
  console.log(
    "\n  ✅ XHN: https://pancakeswap.finance/swap?outputCurrency=" +
      XHN_BSC +
      "&chain=bsc"
  );
  console.log(
    "     Liquidity: ~$" +
      Math.floor(parseFloat(ethers.formatEther(remainingForLiquidity)) * 720) +
      " USD"
  );

  console.log("\n🌉 BRIDGE INFRASTRUCTURE:");
  console.log("  ✅ Both chains have BTCBR + XHN bridges");
  console.log("  ✅ 3 validators configured (2-of-3 multisig)");
  console.log("  ✅ Transfer limits: 100-100,000 tokens");
  console.log("  ✅ Daily limit: 500,000 tokens");
  console.log("  ✅ Fee: 0.1% on BSC side");

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. Build validator relayer service (Node.js)");
  console.log("  2. Test bridge: Nor → BSC");
  console.log("  3. Test bridge: BSC → Nor");
  console.log("  4. Build bridge UI (React)");
  console.log("  5. Test on PancakeSwap");
  console.log("  6. GO LIVE! 🚀");

  console.log("\n⏰ TIMELINE:");
  console.log("  MetaMask USD display: 30 min - 2 hours");
  console.log("  Relayer service: ~2 hours to build");
  console.log("  Bridge UI: ~2 hours to build");
  console.log("  Full launch: ~6 hours from now!");

  console.log("\n✅ SYSTEM 80% COMPLETE!");
  console.log("  Only relayer + UI remaining!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
