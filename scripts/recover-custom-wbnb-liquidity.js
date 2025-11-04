import hre from "hardhat";
const { ethers } = hre;

/**
 * RECOVER CUSTOM WBNB LIQUIDITY
 *
 * This script will:
 * 1. Remove liquidity from custom WBNB pairs
 * 2. Unwrap custom WBNB back to BNB
 * 3. You'll have ~0.09 BNB more to use!
 *
 * This recovers your $130 trapped liquidity!
 */

async function main() {
  console.log("\n💰 RECOVERING CUSTOM WBNB LIQUIDITY");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Your address:", deployer.address);

  // Custom WBNB (the one we deployed)
  const customWBNB = "0xAE7501469a47e52ecbc57741dC810bA35F0b3E48";

  // Our deployed contracts
  const factoryAddress = "0xbb744e536Cc7049bb619d859178ED2b01051D274";
  const routerAddress = "0xBF4d461B2C83061df8eD3D7bD0aEd7a5b9C8b708";
  const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
  const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

  // Get contracts
  const factory = await ethers.getContractAt("NorDEXFactory", factoryAddress);
  const router = await ethers.getContractAt("NorDEXRouter", routerAddress);
  const WBNB = await ethers.getContractAt("WBNB", customWBNB);
  const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
  const XHN = await ethers.getContractAt("XHN", xhnAddress);

  // Get pair addresses
  const btcbrPair = await factory.getPair(customWBNB, btcbrAddress);
  const xhnPair = await factory.getPair(customWBNB, xhnAddress);

  console.log("\n📊 CUSTOM WBNB PAIRS:");
  console.log("  WBNB/BTCBR pair:", btcbrPair);
  console.log("  WBNB/XHN pair:", xhnPair);

  // Check your LP token balances
  const btcbrLPContract = await ethers.getContractAt("NorDEXPair", btcbrPair);
  const xhnLPContract = await ethers.getContractAt("NorDEXPair", xhnPair);

  const btcbrLPBalance = await btcbrLPContract.balanceOf(deployer.address);
  const xhnLPBalance = await xhnLPContract.balanceOf(deployer.address);

  console.log("\n💎 YOUR LP TOKEN BALANCES:");
  console.log("  WBNB/BTCBR LP:", ethers.formatEther(btcbrLPBalance));
  console.log("  WBNB/XHN LP:", ethers.formatEther(xhnLPBalance));

  if (btcbrLPBalance === 0n && xhnLPBalance === 0n) {
    console.log(
      "\n❌ No LP tokens found! Liquidity may have been removed already."
    );
    return;
  }

  // Check current balances
  const bnbBefore = await ethers.provider.getBalance(deployer.address);
  const wbnbBefore = await WBNB.balanceOf(deployer.address);
  const btcbrBefore = await BTCBR.balanceOf(deployer.address);
  const xhnBefore = await XHN.balanceOf(deployer.address);

  console.log("\n💰 BALANCES BEFORE RECOVERY:");
  console.log("  BNB:", ethers.formatEther(bnbBefore));
  console.log("  Custom WBNB:", ethers.formatEther(wbnbBefore));
  console.log("  BTCBR:", ethers.formatEther(btcbrBefore));
  console.log("  XHN:", ethers.formatEther(xhnBefore));

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Step 1: Remove WBNB/BTCBR liquidity
  if (btcbrLPBalance > 0n) {
    console.log("\n[1/4] Removing WBNB/BTCBR liquidity...");

    // Approve LP tokens
    console.log("  Approving LP tokens...");
    await (await btcbrLPContract.approve(routerAddress, btcbrLPBalance)).wait();

    // Remove liquidity
    console.log("  Removing liquidity...");
    const removeTx1 = await router.removeLiquidity(
      customWBNB,
      btcbrAddress,
      btcbrLPBalance,
      0, // Accept any amount of WBNB
      0, // Accept any amount of BTCBR
      deployer.address,
      deadline
    );
    await removeTx1.wait();
    console.log("  ✅ WBNB/BTCBR liquidity removed!");
  }

  // Step 2: Remove WBNB/XHN liquidity
  if (xhnLPBalance > 0n) {
    console.log("\n[2/4] Removing WBNB/XHN liquidity...");

    // Approve LP tokens
    console.log("  Approving LP tokens...");
    await (await xhnLPContract.approve(routerAddress, xhnLPBalance)).wait();

    // Remove liquidity
    console.log("  Removing liquidity...");
    const removeTx2 = await router.removeLiquidity(
      customWBNB,
      xhnAddress,
      xhnLPBalance,
      0, // Accept any amount of WBNB
      0, // Accept any amount of XHN
      deployer.address,
      deadline
    );
    await removeTx2.wait();
    console.log("  ✅ WBNB/XHN liquidity removed!");
  }

  // Step 3: Check WBNB balance after removal
  const wbnbAfterRemoval = await WBNB.balanceOf(deployer.address);
  console.log(
    "\n[3/4] Custom WBNB balance after removal:",
    ethers.formatEther(wbnbAfterRemoval)
  );

  // Step 4: Unwrap ALL custom WBNB to BNB
  if (wbnbAfterRemoval > 0n) {
    console.log("\n[4/4] Unwrapping custom WBNB to BNB...");
    const unwrapTx = await WBNB.withdraw(wbnbAfterRemoval);
    await unwrapTx.wait();
    console.log(
      "  ✅ Unwrapped",
      ethers.formatEther(wbnbAfterRemoval),
      "WBNB to BNB!"
    );
  }

  // Final balances
  const bnbAfter = await ethers.provider.getBalance(deployer.address);
  const wbnbAfter = await WBNB.balanceOf(deployer.address);
  const btcbrAfter = await BTCBR.balanceOf(deployer.address);
  const xhnAfter = await XHN.balanceOf(deployer.address);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 RECOVERY COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n💰 BALANCES AFTER RECOVERY:");
  console.log(
    "  BNB:",
    ethers.formatEther(bnbAfter),
    `(+${ethers.formatEther(bnbAfter - bnbBefore)} BNB)`
  );
  console.log(
    "  Custom WBNB:",
    ethers.formatEther(wbnbAfter),
    `(${ethers.formatEther(wbnbAfter - wbnbBefore)} change)`
  );
  console.log(
    "  BTCBR:",
    ethers.formatEther(btcbrAfter),
    `(+${ethers.formatEther(btcbrAfter - btcbrBefore)} BTCBR)`
  );
  console.log(
    "  XHN:",
    ethers.formatEther(xhnAfter),
    `(+${ethers.formatEther(xhnAfter - xhnBefore)} XHN)`
  );

  const bnbRecovered = bnbAfter - bnbBefore;
  const bnbValue = parseFloat(ethers.formatEther(bnbRecovered)) * 720;

  console.log("\n💵 VALUE RECOVERED:");
  console.log("  BNB recovered:", ethers.formatEther(bnbRecovered), "BNB");
  console.log("  USD value:", `~$${bnbValue.toFixed(2)}`);

  console.log("\n✅ YOUR LIQUIDITY HAS BEEN RECOVERED!");
  console.log("  All custom WBNB converted back to BNB");
  console.log("  All tokens returned to your wallet");
  console.log(
    "  You can now use this BNB to add liquidity with OFFICIAL WBNB!"
  );

  console.log("\n📋 NEXT STEPS:");
  console.log("  1. You now have more BNB available");
  console.log("  2. Run: node scripts/add-liquidity-official-wbnb.js");
  console.log("  3. This will add liquidity with OFFICIAL BSC WBNB");
  console.log("  4. PancakeSwap will work!");
  console.log("  5. MetaMask will show USD values!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  });
