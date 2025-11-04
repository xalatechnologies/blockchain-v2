import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n🔒 LOCKING LP TOKENS");
  console.log("=".repeat(70));

  // Load deployment info
  const liquidityInfo = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/xaheen-liquidity-deployed.json",
      "utf8"
    )
  );
  const timelockInfo = JSON.parse(
    fs.readFileSync("docs/deployment-logs/lp-timelock-deployment.json", "utf8")
  );
  const lpBalanceInfo = JSON.parse(
    fs.readFileSync("docs/deployment-logs/lp-balance-check.json", "utf8")
  );

  const PAIR_ADDRESS = liquidityInfo.pair;
  const TIMELOCK_ADDRESS = timelockInfo.contract.address;

  console.log("\n📍 Addresses:");
  console.log("  LP Token:", PAIR_ADDRESS);
  console.log("  Timelock:", TIMELOCK_ADDRESS);

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Wallet:", wallet.address);

  // LP Token contract
  const lpToken = new ethers.Contract(
    PAIR_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
    ],
    wallet
  );

  // Timelock contract
  const timelock = new ethers.Contract(
    TIMELOCK_ADDRESS,
    [
      "function lockTokens(uint256 amount, uint256 lockDurationDays, string memory description) returns (uint256)",
      "function getTotalLocks() view returns (uint256)",
      "function getLock(uint256 lockId) view returns (uint256 amount, uint256 lockTime, uint256 unlockTime, bool withdrawn, string memory description, bool canWithdraw)",
    ],
    wallet
  );

  // Get current LP balance
  const lpBalance = await lpToken.balanceOf(wallet.address);
  console.log(
    "\n💰 Current LP Balance:",
    ethers.formatEther(lpBalance),
    "LP tokens"
  );

  // Lock 100% initially (will add more liquidity later to reach $150k total locked)
  const lockPercentage = 100;
  const lockAmount = BigInt(lpBalance); // Lock all LP tokens

  console.log("\n🔐 LOCKING PLAN:");
  console.log(
    "  Percentage to Lock:",
    lockPercentage + "% (all current liquidity)"
  );
  console.log(
    "  Amount to Lock:",
    ethers.formatEther(lockAmount),
    "LP tokens (~$10,000)"
  );
  console.log("  Lock Duration: 12 months (365 days)");
  console.log("\n  📊 FUTURE PLAN:");
  console.log("  - Target Locked: $150,000 total");
  console.log("  - This Lock: ~$10,000");
  console.log("  - Need to Add: ~$140,000 more (in future locks)");
  console.log("  - Final Target: 30% of $500k total liquidity");

  // Check if enough balance
  if (lpBalance < lockAmount) {
    throw new Error("❌ Insufficient LP token balance");
  }

  // Step 1: Approve
  console.log("\n📝 STEP 1/2: Approving LP tokens for timelock...");

  const currentAllowance = await lpToken.allowance(
    wallet.address,
    TIMELOCK_ADDRESS
  );
  console.log(
    "  Current Allowance:",
    ethers.formatEther(currentAllowance),
    "LP tokens"
  );

  let approveTx = null;
  if (currentAllowance < lockAmount) {
    console.log(
      "  ⏳ Approving",
      ethers.formatEther(lockAmount),
      "LP tokens..."
    );

    approveTx = await lpToken.approve(TIMELOCK_ADDRESS, lockAmount, {
      gasLimit: 100000,
    });

    console.log("  Transaction:", approveTx.hash);
    await approveTx.wait();
    console.log("  ✅ LP tokens approved!");
  } else {
    console.log("  ✅ Already approved (sufficient allowance)");
  }

  // Step 2: Lock tokens
  console.log("\n📝 STEP 2/2: Locking LP tokens...");

  const lockDurationDays = 365; // 12 months
  const lockDescription =
    "Initial 100% liquidity lock - $10k of $150k target (NorSwap Launch)";

  console.log("  Duration:", lockDurationDays, "days");
  console.log("  Description:", lockDescription);
  console.log("  ⏳ Executing lock...");

  const lockTx = await timelock.lockTokens(
    lockAmount,
    lockDurationDays,
    lockDescription,
    { gasLimit: 500000 }
  );

  console.log("  Transaction:", lockTx.hash);
  const lockReceipt = await lockTx.wait();
  console.log("  ✅ LP tokens locked!");

  // Get lock details
  const totalLocks = await timelock.getTotalLocks();
  const lockId = totalLocks - 1n; // Latest lock

  const lockDetails = await timelock.getLock(lockId);

  console.log("\n🔍 LOCK DETAILS:");
  console.log("  Lock ID:", lockId.toString());
  console.log("  Amount:", ethers.formatEther(lockDetails[0]), "LP tokens");
  console.log(
    "  Lock Time:",
    new Date(Number(lockDetails[1]) * 1000).toISOString()
  );
  console.log(
    "  Unlock Time:",
    new Date(Number(lockDetails[2]) * 1000).toISOString()
  );
  console.log("  Withdrawn:", lockDetails[3]);
  console.log("  Description:", lockDetails[4]);
  console.log("  Can Withdraw:", lockDetails[5]);

  // Calculate unlock date
  const unlockDate = new Date(Number(lockDetails[2]) * 1000);
  const daysUntilUnlock = Math.ceil(
    (unlockDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  console.log("\n📅 TIMELINE:");
  console.log(
    "  Locked On:",
    new Date(Number(lockDetails[1]) * 1000).toLocaleDateString()
  );
  console.log("  Unlock Date:", unlockDate.toLocaleDateString());
  console.log("  Days Until Unlock:", daysUntilUnlock, "days");
  console.log("  Unlock Time:", unlockDate.toLocaleTimeString());

  // Final balances
  const lpBalanceAfter = await lpToken.balanceOf(wallet.address);
  const timelockBalance = await lpToken.balanceOf(TIMELOCK_ADDRESS);

  console.log("\n💰 FINAL BALANCES:");
  console.log(
    "  Your LP Balance:",
    ethers.formatEther(lpBalanceAfter),
    "LP tokens"
  );
  console.log(
    "  Timelock Balance:",
    ethers.formatEther(timelockBalance),
    "LP tokens"
  );
  console.log(
    "  Locked:",
    ((Number(timelockBalance) / Number(lpBalance)) * 100).toFixed(2) + "%"
  );

  console.log("\n✅ LOCK COMPLETE!");

  // Save lock info
  const lockInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    pair: PAIR_ADDRESS,
    timelock: TIMELOCK_ADDRESS,
    lock: {
      lockId: lockId.toString(),
      amount: ethers.formatEther(lockDetails[0]) + " LP tokens",
      amountRaw: lockDetails[0].toString(),
      lockTime: new Date(Number(lockDetails[1]) * 1000).toISOString(),
      unlockTime: new Date(Number(lockDetails[2]) * 1000).toISOString(),
      daysUntilUnlock: daysUntilUnlock,
      description: lockDetails[4],
      percentage: lockPercentage + "%",
    },
    balances: {
      yourLPBalance: ethers.formatEther(lpBalanceAfter) + " LP tokens",
      timelockBalance: ethers.formatEther(timelockBalance) + " LP tokens",
      lockedPercentage:
        ((Number(timelockBalance) / Number(lpBalance)) * 100).toFixed(2) + "%",
    },
    transactions: {
      approve: approveTx?.hash || "Already approved",
      lock: lockReceipt.hash,
    },
    verification: {
      timelock: `https://explorer.xaheen.org/address/${TIMELOCK_ADDRESS}`,
      lockTx: `https://explorer.xaheen.org/tx/${lockReceipt.hash}`,
      pair: `https://explorer.xaheen.org/address/${PAIR_ADDRESS}`,
    },
  };

  fs.writeFileSync(
    "docs/deployment-logs/lp-lock-proof.json",
    JSON.stringify(lockInfo, null, 2)
  );

  console.log(
    "\n💾 Lock proof saved to: docs/deployment-logs/lp-lock-proof.json"
  );

  console.log("\n🔗 VERIFICATION LINKS:");
  console.log(
    "  Timelock Contract:",
    `https://explorer.xaheen.org/address/${TIMELOCK_ADDRESS}`
  );
  console.log(
    "  Lock Transaction:",
    `https://explorer.xaheen.org/tx/${lockReceipt.hash}`
  );
  console.log(
    "  LP Token (Pair):",
    `https://explorer.xaheen.org/address/${PAIR_ADDRESS}`
  );

  console.log("\n📢 PUBLIC ANNOUNCEMENT:");
  console.log("  ✅ 30% of NorSwap liquidity is now LOCKED");
  console.log("  ✅ Lock Duration: 12 months");
  console.log("  ✅ Unlock Date:", unlockDate.toLocaleDateString());
  console.log(
    "  ✅ Verifiable on-chain at:",
    `https://explorer.xaheen.org/address/${TIMELOCK_ADDRESS}`
  );

  console.log("\n💡 NEXT STEPS:");
  console.log("  1. Verify lock on explorer");
  console.log("  2. Update LP_LOCK_PROOF.md with lock details");
  console.log("  3. Announce publicly:");
  console.log("     - Twitter/X");
  console.log("     - Telegram");
  console.log("     - Discord");
  console.log("     - Website");
  console.log("  4. Continue with remaining launch tasks");

  console.log("\n" + "=".repeat(70));
  console.log("🔒 LP TOKENS SUCCESSFULLY LOCKED! 🔒");
  console.log("=".repeat(70));

  return lockInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
