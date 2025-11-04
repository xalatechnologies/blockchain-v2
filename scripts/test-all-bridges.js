import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Test All 3 Bridges
 *
 * Tests BNB, USDT, and ETH bridges with small amounts
 */

async function main() {
  console.log("\n🧪 TESTING ALL 3 BRIDGES\n");
  console.log("=".repeat(60));

  const [tester] = await ethers.getSigners();
  console.log("💼 Tester:", tester.address);

  const balance = await ethers.provider.getBalance(tester.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.05")) {
    console.error("\n❌ Need at least 0.05 BNB for testing");
    console.log("Please add BNB to:", tester.address);
    process.exit(1);
  }

  console.log("\n=".repeat(60));

  // Test BNB Bridge
  await testBNBBridge(tester);

  // Test USDT Bridge
  await testUSDTBridge(tester);

  // Test ETH Bridge (if has ETH)
  await testETHBridge(tester);

  console.log("\n=".repeat(60));
  console.log("✅ ALL TESTS COMPLETE!\n");
}

async function testBNBBridge(tester) {
  console.log("\n🔵 TEST 1: BNB BRIDGE");
  console.log("─".repeat(60));

  const BNB_BRIDGE_BSC = process.env.BNB_BRIDGE_BSC;
  console.log("Bridge:", BNB_BRIDGE_BSC);

  const bridge = await ethers.getContractAt("BNBBridgeMainnet", BNB_BRIDGE_BSC);

  // Test with 0.01 BNB
  const amount = ethers.parseEther("0.01");
  const recipient = tester.address; // Bridge to same address on Nor

  console.log("\n📊 Test Details:");
  console.log("Amount:", ethers.formatEther(amount), "BNB");
  console.log("Recipient:", recipient);
  console.log(
    "Expected fee:",
    ethers.formatEther((amount * BigInt(20)) / BigInt(10000)),
    "BNB (0.2%)"
  );
  console.log(
    "Expected net:",
    ethers.formatEther((amount * BigInt(9980)) / BigInt(10000)),
    "BNB"
  );

  console.log("\n⏳ Bridging BNB...");

  try {
    const tx = await bridge.bridgeBNB(recipient, { value: amount });
    console.log("Transaction sent:", tx.hash);

    console.log("⏰ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ BNB Bridge Success!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Block:", receipt.blockNumber);

    // Check total fees
    const totalFees = await bridge.totalFees();
    console.log("Total fees in bridge:", ethers.formatEther(totalFees), "BNB");

    console.log("\n📋 Next steps:");
    console.log("1. Add Nor network to MetaMask");
    console.log("2. Check WBNB balance at:", recipient);
    console.log("3. Expected: 0.0098 WBNB");
  } catch (error) {
    console.error("❌ BNB Bridge Failed:", error.message);
  }
}

async function testUSDTBridge(tester) {
  console.log("\n💵 TEST 2: USDT BRIDGE");
  console.log("─".repeat(60));

  const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
  const USDT_BRIDGE_BSC = process.env.USDT_BRIDGE_BSC;

  console.log("USDT Token:", USDT_BSC);
  console.log("Bridge:", USDT_BRIDGE_BSC);

  const usdt = await ethers.getContractAt("IERC20", USDT_BSC);
  const bridge = await ethers.getContractAt(
    "USDTBridgeMainnet",
    USDT_BRIDGE_BSC
  );

  // Check USDT balance
  const usdtBalance = await usdt.balanceOf(tester.address);
  console.log("\n💰 USDT Balance:", ethers.formatEther(usdtBalance), "USDT");

  if (usdtBalance < ethers.parseEther("10")) {
    console.log("⚠️  Insufficient USDT for testing");
    console.log("Need at least 10 USDT");
    console.log("Skipping USDT bridge test");
    return;
  }

  // Test with 10 USDT
  const amount = ethers.parseEther("10");
  const recipient = tester.address;

  console.log("\n📊 Test Details:");
  console.log("Amount:", ethers.formatEther(amount), "USDT");
  console.log("Recipient:", recipient);
  console.log(
    "Expected fee:",
    ethers.formatEther((amount * BigInt(20)) / BigInt(10000)),
    "USDT (0.2%)"
  );
  console.log(
    "Expected net:",
    ethers.formatEther((amount * BigInt(9980)) / BigInt(10000)),
    "USDT"
  );

  try {
    // Check allowance
    const currentAllowance = await usdt.allowance(
      tester.address,
      USDT_BRIDGE_BSC
    );
    console.log(
      "\n⏳ Current allowance:",
      ethers.formatEther(currentAllowance),
      "USDT"
    );

    if (currentAllowance < amount) {
      console.log("Approving USDT...");
      const approveTx = await usdt.approve(USDT_BRIDGE_BSC, ethers.MaxUint256);
      await approveTx.wait();
      console.log("✅ USDT approved");
    }

    console.log("\n⏳ Bridging USDT...");
    const tx = await bridge.bridgeUSDT(recipient, amount);
    console.log("Transaction sent:", tx.hash);

    console.log("⏰ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ USDT Bridge Success!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Block:", receipt.blockNumber);

    // Check total fees
    const totalFees = await bridge.totalFees();
    console.log("Total fees in bridge:", ethers.formatEther(totalFees), "USDT");

    console.log("\n📋 Next steps:");
    console.log("1. Check WUSDT balance on Nor at:", recipient);
    console.log("2. Expected: 9.98 WUSDT");
  } catch (error) {
    console.error("❌ USDT Bridge Failed:", error.message);
  }
}

async function testETHBridge(tester) {
  console.log("\n💠 TEST 3: ETH BRIDGE");
  console.log("─".repeat(60));

  const ETH_BRIDGE_BSC = process.env.ETH_BRIDGE_BSC;
  console.log("Bridge:", ETH_BRIDGE_BSC);

  console.log("\n⚠️  Note: BSC uses BNB, not ETH");
  console.log("To test ETH bridge, you need to:");
  console.log("1. Bridge ETH from Ethereum mainnet to BSC first");
  console.log("2. Or use Binance-pegged ETH on BSC");
  console.log("\nSkipping ETH bridge test for now");
  console.log("You can test manually when you have ETH on BSC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  });
