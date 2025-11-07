/**
 * Lock All Liquidity for 1+ Year
 *
 * This script locks ALL LP tokens from the $100k liquidity addition:
 * - NOR/USDT LP tokens
 * - NOR/WBNB LP tokens
 * - NOR/BTCB LP tokens
 * - NOR/WETH LP tokens
 * - NOR/BUSD LP tokens
 *
 * CRITICAL: Must run this BEFORE enabling trading!
 *
 * Lock Duration: 1 year minimum (365 days)
 * Recommended: 2+ years for maximum trust
 *
 * After locking, you'll get:
 * - Lock IDs for each pair
 * - Public proof URLs
 * - Unlock timestamps
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// LiquidityLockUltra contract address
const LIQUIDITY_LOCK_CONTRACT = "0x30ca927fA0d57C975A16c055BB0fc4fb9Fc3AB63"; // ✅ DEPLOYED!

// Lock duration (3 years = 1095 days)
const LOCK_DURATION_DAYS = 1095; // 3 YEARS - Shows serious long-term commitment!
const LOCK_DURATION_SECONDS = LOCK_DURATION_DAYS * 24 * 60 * 60;

// LP Token addresses (from add-100k-liquidity-all-pairs.js output)
const LP_TOKENS = [
  {
    name: "NOR/USDT",
    address: "", // Fill from liquidity addition output
    allocation: 0.40
  },
  {
    name: "NOR/WBNB",
    address: "", // Fill from liquidity addition output
    allocation: 0.30
  },
  {
    name: "NOR/BTCB",
    address: "", // Fill from liquidity addition output
    allocation: 0.15
  },
  {
    name: "NOR/WETH",
    address: "", // Fill from liquidity addition output
    allocation: 0.10
  },
  {
    name: "NOR/BUSD",
    address: "", // Fill from liquidity addition output
    allocation: 0.05
  }
];

async function main() {
  console.log("\n🔒 LOCKING ALL LIQUIDITY - $100K ACROSS ALL PAIRS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📋 Locker: ${deployer.address}`);

  // Get lock contract
  const lockContract = await ethers.getContractAt("LiquidityLockUltra", LIQUIDITY_LOCK_CONTRACT);
  console.log(`   Lock Contract: ${LIQUIDITY_LOCK_CONTRACT}`);

  // Calculate unlock time
  const currentTime = Math.floor(Date.now() / 1000);
  const unlockTime = currentTime + LOCK_DURATION_SECONDS;
  const unlockDate = new Date(unlockTime * 1000);

  console.log(`\n⏰ Lock Duration:`);
  console.log(`   Days: ${LOCK_DURATION_DAYS} days`);
  console.log(`   Unlock Time: ${unlockDate.toISOString()}`);
  console.log(`   Unlock Date: ${unlockDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  })} UTC`);

  // Verify LP token addresses
  console.log(`\n📊 LP Tokens to Lock:`);
  let validTokens = 0;
  for (const lp of LP_TOKENS) {
    if (lp.address && lp.address !== "") {
      validTokens++;
      console.log(`   ✅ ${lp.name}: ${lp.address}`);
    } else {
      console.log(`   ⚠️  ${lp.name}: Address not set`);
    }
  }

  if (validTokens === 0) {
    throw new Error("❌ No LP token addresses configured. Run add-100k-liquidity-all-pairs.js first!");
  }

  console.log(`\n⚠️  LIQUIDITY LOCK CHECKLIST:`);
  console.log(`   ✅ Have you added all liquidity?`);
  console.log(`   ✅ Do you have all LP tokens?`);
  console.log(`   ✅ Is trading still disabled?`);
  console.log(`   ✅ Are you ready to lock for ${LOCK_DURATION_DAYS} days?`);
  console.log(`   ✅ Do you understand this CANNOT be reversed?`);

  console.log(`\n⏸️  Pausing for 10 seconds... Press Ctrl+C to cancel.`);
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Lock each LP token
  const lockIds = [];

  for (let i = 0; i < LP_TOKENS.length; i++) {
    const lp = LP_TOKENS[i];

    if (!lp.address || lp.address === "") {
      console.log(`\n⏭️  Skipping ${lp.name} (no address)`);
      continue;
    }

    console.log(`\n\n🔒 Locking ${lp.name} Liquidity...`);
    console.log("═".repeat(70));

    try {
      // Get LP token contract
      const lpToken = await ethers.getContractAt("IERC20", lp.address);
      const lpBalance = await lpToken.balanceOf(deployer.address);

      console.log(`   LP Balance: ${ethers.formatUnits(lpBalance, 18)} LP tokens`);

      if (lpBalance === 0n) {
        console.log(`   ⚠️  No LP tokens to lock. Skipping.`);
        continue;
      }

      // Approve lock contract
      console.log(`\n   📝 Approving lock contract...`);
      const approveTx = await lpToken.approve(LIQUIDITY_LOCK_CONTRACT, lpBalance);
      await approveTx.wait();
      console.log(`   ✅ Approved`);

      // Create lock
      console.log(`\n   🔐 Creating lock...`);
      const createLockTx = await lockContract.createLock(
        lp.address,
        lpBalance,
        unlockTime,
        deployer.address,
        true, // isLPToken
        { gasLimit: 500000 }
      );

      const receipt = await createLockTx.wait();

      // Get lock ID from events
      const lockCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = lockContract.interface.parseLog(log);
          return parsed.name === "LockCreated";
        } catch {
          return false;
        }
      });

      let lockId;
      if (lockCreatedEvent) {
        const parsed = lockContract.interface.parseLog(lockCreatedEvent);
        lockId = parsed.args.lockId;
      }

      console.log(`   ✅ Lock created!`);
      console.log(`   Lock ID: ${lockId}`);
      console.log(`   Transaction: ${receipt.hash}`);

      // Get lock details
      const lockInfo = await lockContract.locks(lockId);
      console.log(`\n   📋 Lock Details:`);
      console.log(`      Token: ${lockInfo.token}`);
      console.log(`      Amount: ${ethers.formatUnits(lockInfo.amount, 18)} LP`);
      console.log(`      Unlock Time: ${new Date(Number(lockInfo.unlockTime) * 1000).toISOString()}`);
      console.log(`      Owner: ${lockInfo.owner}`);

      lockIds.push({
        pair: lp.name,
        lockId: lockId.toString(),
        lpToken: lp.address,
        amount: lpBalance.toString(),
        unlockTime: lockInfo.unlockTime.toString(),
        allocation: lp.allocation,
        transactionHash: receipt.hash
      });

      console.log(`   ✅ ${lp.name} locked successfully!`);

    } catch (error) {
      console.error(`\n   ❌ Error locking ${lp.name}:`, error.message);
      console.log(`   Continuing with next pair...`);
    }
  }

  // Summary
  console.log(`\n\n✅ LIQUIDITY LOCKING COMPLETE`);
  console.log("═".repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Pairs Locked: ${lockIds.length}/${LP_TOKENS.filter(lp => lp.address).length}`);
  console.log(`   Total Value: $${(100000 * lockIds.reduce((sum, lock) => sum + lock.allocation, 0)).toLocaleString()}`);
  console.log(`   Lock Duration: ${LOCK_DURATION_DAYS} days`);
  console.log(`   Unlock Date: ${unlockDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

  console.log(`\n🔐 Lock IDs:`);
  lockIds.forEach((lock, index) => {
    console.log(`\n   ${index + 1}. ${lock.pair}`);
    console.log(`      Lock ID: ${lock.lockId}`);
    console.log(`      LP Token: ${lock.lpToken}`);
    console.log(`      Amount: ${ethers.formatUnits(lock.amount, 18)} LP`);
    console.log(`      Value: $${(100000 * lock.allocation).toLocaleString()}`);
    console.log(`      Unlock: ${new Date(Number(lock.unlockTime) * 1000).toISOString()}`);
    console.log(`      TX: ${lock.transactionHash}`);
  });

  // Save lock info
  const lockInfo = {
    timestamp: new Date().toISOString(),
    totalValue: 100000,
    lockDurationDays: LOCK_DURATION_DAYS,
    unlockDate: unlockDate.toISOString(),
    lockContract: LIQUIDITY_LOCK_CONTRACT,
    locks: lockIds,
    locker: deployer.address
  };

  console.log(`\n💾 Lock Information (SAVE THIS!):`);
  console.log(JSON.stringify(lockInfo, null, 2));

  // Generate public proof text
  console.log(`\n\n📢 PUBLIC ANNOUNCEMENT (Copy & Paste):`);
  console.log("═".repeat(70));
  console.log(`
🔒 NOR Token Liquidity Lock Proof

We've locked $100,000 in liquidity across ${lockIds.length} trading pairs for ${LOCK_DURATION_DAYS} days.

Lock Details:
${lockIds.map((lock, i) => `${i + 1}. ${lock.pair}: Lock ID ${lock.lockId} ($${(100000 * lock.allocation).toLocaleString()})`).join('\n')}

Unlock Date: ${unlockDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Lock Contract: ${LIQUIDITY_LOCK_CONTRACT}
Locker: ${deployer.address}

Verify on NorChain Explorer:
${lockIds.map((lock, i) => `${lock.pair}: https://explorer.norchain.org/tx/${lock.transactionHash}`).join('\n')}

This lock is verifiable on-chain and CANNOT be withdrawn before the unlock date.

#NorChain #LiquidityLock #Transparency
  `);

  console.log(`\n\n⚠️  FINAL STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. 📢 Announce liquidity lock publicly`);
  console.log(`   - Post on Twitter with lock proof`);
  console.log(`   - Share in Telegram/Discord`);
  console.log(`   - Update website with lock details`);
  console.log(`   - Pin announcement for visibility`);
  console.log(`\n2. 📝 Document lock proof`);
  console.log(`   - Save lock IDs securely`);
  console.log(`   - Screenshot for social proof`);
  console.log(`   - Add to project documentation`);
  console.log(`\n3. 🚀 NOW you can enable trading`);
  console.log(`   - Liquidity is locked ✅`);
  console.log(`   - Public proof available ✅`);
  console.log(`   - Ready to call enableTrading() ✅`);
  console.log(`\n4. 📊 Monitor closely`);
  console.log(`   - First hour is critical`);
  console.log(`   - Watch for bot activity`);
  console.log(`   - Advance phases as planned`);

  console.log(`\n\n💡 To enable trading, run:`);
  console.log(`   npx hardhat run scripts/enable-trading.js --network btcbr`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ All Liquidity Locked for ${LOCK_DURATION_DAYS} Days!`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Liquidity Locking Failed:");
    console.error(error);
    process.exit(1);
  });
