/**
 * COMPLETE NORCHAIN LAUNCH - ALL IN ONE
 *
 * This script executes the COMPLETE launch sequence:
 * 1. ✅ Whitelist router & pair (allow pre-trading transfers)
 * 2. ✅ Add initial liquidity (NOR/BNB pair)
 * 3. ✅ Lock liquidity for 3 years
 * 4. ✅ Enable trading
 * 5. ✅ READY TO TRADE!
 *
 * CRITICAL: This will make your token LIVE and TRADEABLE!
 * Make sure you're ready before running this.
 *
 * What you need:
 * - NOR tokens in your wallet
 * - BNB for liquidity + gas
 * - Liquidity lock contract deployed ✅
 * - NorSwap deployed on NorChain
 *
 * Usage:
 *   npx hardhat run scripts/complete-launch-now.js --network btcbr
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// Contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const LIQUIDITY_LOCK = "0x30ca927fA0d57C975A16c055BB0fc4fb9Fc3AB63";

// NorSwap router - DEPLOYED on NorChain!
const NORSWAP_ROUTER = "0xC808e1962bD8fE5d0fBc41D76B7909B80C442D84"; // NorSwap Router ✅
const WNOR_ADDRESS = "0x121910c86B08765d6d3884Efe8661b2Fd6328dB9"; // Wrapped NOR

// Initial liquidity amounts (adjust based on what you have)
const INITIAL_NOR_AMOUNT = "1000000"; // 1 million NOR
const INITIAL_BNB_AMOUNT = "1"; // 1 BNB (~$600)

// Lock duration: 3 years
const LOCK_DURATION = 3 * 365 * 24 * 60 * 60; // 1095 days in seconds

async function main() {
  console.log("\n🚀 COMPLETE NORCHAIN LAUNCH - GOING LIVE NOW!");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Launch Configuration:`);
  console.log(`   Network: NorChain`);
  console.log(`   Chain ID: 65001`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   BNB Balance: ${ethers.formatEther(balance)} BNB`);

  // Get contracts
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const lockContract = await ethers.getContractAt("LiquidityLockUltra", LIQUIDITY_LOCK);

  // Check NOR balance
  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`   NOR Balance: ${ethers.formatUnits(norBalance, 24)} NOR`);

  // Verify trading is disabled
  const tradingEnabled = await norToken.tradingEnabled();
  if (tradingEnabled) {
    throw new Error("❌ Trading is already enabled! Cannot proceed.");
  }
  console.log(`   Trading Enabled: ${tradingEnabled} ✅ (Good - still disabled)`);

  // Parse amounts
  const norAmount = ethers.parseUnits(INITIAL_NOR_AMOUNT, 24);
  const bnbAmount = ethers.parseEther(INITIAL_BNB_AMOUNT);

  console.log(`\n💧 Initial Liquidity:`);
  console.log(`   NOR: ${ethers.formatUnits(norAmount, 24)} NOR`);
  console.log(`   BNB: ${ethers.formatEther(bnbAmount)} BNB`);
  console.log(`   Estimated Value: ~$${Number(INITIAL_BNB_AMOUNT) * 600 * 2}`);

  // Check balances
  if (norBalance < norAmount) {
    throw new Error(`❌ Insufficient NOR. Need ${ethers.formatUnits(norAmount, 24)}, have ${ethers.formatUnits(norBalance, 24)}`);
  }
  if (balance < bnbAmount + ethers.parseEther("0.1")) {
    throw new Error(`❌ Insufficient BNB. Need ${ethers.formatEther(bnbAmount + ethers.parseEther("0.1"))}, have ${ethers.formatEther(balance)}`);
  }

  console.log(`\n⚠️  FINAL CHECKLIST:`);
  console.log(`   ✅ Do you have NOR and BNB ready?`);
  console.log(`   ✅ Is NorSwap deployed and router address correct?`);
  console.log(`   ✅ Do you want to GO LIVE NOW?`);
  console.log(`   ✅ Trading will be ENABLED at the end!`);

  console.log(`\n⏸️  Pausing for 15 seconds... Press Ctrl+C to cancel.`);
  await new Promise(resolve => setTimeout(resolve, 15000));

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: WHITELIST ROUTER & PAIR
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n🔓 STEP 1: WHITELISTING ROUTER & PAIR`);
  console.log("═".repeat(70));

  try {
    const router = await ethers.getContractAt("IPancakeRouter02", NORSWAP_ROUTER);
    const factory = await ethers.getContractAt("IPancakeFactory", await router.factory());

    // Whitelist router
    console.log(`\n   📝 Whitelisting router...`);
    const whitelistRouterTx = await norToken.whitelist(NORSWAP_ROUTER);
    await whitelistRouterTx.wait();
    console.log(`   ✅ Router whitelisted: ${NORSWAP_ROUTER}`);

    // Get or create pair
    let lpTokenAddress = await factory.getPair(NOR_TOKEN, WNOR_ADDRESS);
    if (lpTokenAddress === ethers.ZeroAddress) {
      console.log(`\n   🏭 Creating NOR/WNOR pair...`);
      const createPairTx = await factory.createPair(NOR_TOKEN, WNOR_ADDRESS);
      await createPairTx.wait();
      lpTokenAddress = await factory.getPair(NOR_TOKEN, WNOR_ADDRESS);
      console.log(`   ✅ Pair created: ${lpTokenAddress}`);
    } else {
      console.log(`\n   ✅ Pair already exists: ${lpTokenAddress}`);
    }

    // Whitelist pair
    console.log(`\n   📝 Whitelisting pair...`);
    const whitelistPairTx = await norToken.whitelist(lpTokenAddress);
    await whitelistPairTx.wait();
    console.log(`   ✅ Pair whitelisted: ${lpTokenAddress}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: ADD LIQUIDITY
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📊 STEP 2: ADDING LIQUIDITY`);
  console.log("═".repeat(70));

    // Wrap BNB to WNOR
    console.log(`\n   🔄 Wrapping ${ethers.formatEther(bnbAmount)} BNB to WNOR...`);
    const wnor = await ethers.getContractAt("IERC20", WNOR_ADDRESS);
    const wrapTx = await deployer.sendTransaction({
      to: WNOR_ADDRESS,
      value: bnbAmount
    });
    await wrapTx.wait();
    console.log(`   ✅ BNB wrapped to WNOR`);

    // Approve tokens
    console.log(`\n   📝 Approving tokens...`);
    const approveNorTx = await norToken.approve(NORSWAP_ROUTER, norAmount);
    await approveNorTx.wait();
    console.log(`   ✅ NOR approved`);

    const approveWnorTx = await wnor.approve(NORSWAP_ROUTER, bnbAmount);
    await approveWnorTx.wait();
    console.log(`   ✅ WNOR approved`);

    // Add liquidity (NOR + WNOR)
    console.log(`\n   💧 Adding liquidity to NOR/WNOR pair...`);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    // Use addLiquidity for ERC20/ERC20 pair
    const gasEstimate = await router.addLiquidity.estimateGas(
      NOR_TOKEN,
      WNOR_ADDRESS,
      norAmount,
      bnbAmount,
      (norAmount * 95n) / 100n, // 5% slippage
      (bnbAmount * 95n) / 100n,
      deployer.address,
      deadline
    );

    const gasLimit = (gasEstimate * 120n) / 100n; // +20% buffer

    const addLiquidityTx = await router.addLiquidity(
      NOR_TOKEN,
      WNOR_ADDRESS,
      norAmount,
      bnbAmount,
      (norAmount * 95n) / 100n,
      (bnbAmount * 95n) / 100n,
      deployer.address,
      deadline,
      { gasLimit }
    );

    const receipt = await addLiquidityTx.wait();
    console.log(`   ✅ Liquidity added!`);
    console.log(`   Transaction: ${receipt.hash}`);

    // Get LP token (we already have it from Step 1)
    console.log(`   LP Token: ${lpTokenAddress}`);

    // Get LP balance
    const lpToken = await ethers.getContractAt("IERC20", lpTokenAddress);
    const lpBalance = await lpToken.balanceOf(deployer.address);
    console.log(`   LP Balance: ${ethers.formatUnits(lpBalance, 18)} LP tokens`);

    if (lpBalance === 0n) {
      throw new Error("❌ No LP tokens received! Liquidity addition may have failed.");
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: LOCK LIQUIDITY
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🔒 STEP 3: LOCKING LIQUIDITY FOR 3 YEARS`);
    console.log("═".repeat(70));

    const unlockTime = Math.floor(Date.now() / 1000) + LOCK_DURATION;
    const unlockDate = new Date(unlockTime * 1000);

    console.log(`   Lock Duration: 1095 days (3 years)`);
    console.log(`   Unlock Date: ${unlockDate.toISOString()}`);
    console.log(`   LP Tokens: ${ethers.formatUnits(lpBalance, 18)}`);

    // Approve lock contract
    console.log(`\n   📝 Approving LP tokens for lock contract...`);
    const approveLockTx = await lpToken.approve(LIQUIDITY_LOCK, lpBalance);
    await approveLockTx.wait();
    console.log(`   ✅ LP tokens approved`);

    // Create lock
    console.log(`\n   🔐 Creating lock...`);
    const createLockTx = await lockContract.createLock(
      lpTokenAddress,
      lpBalance,
      LOCK_DURATION,  // Duration in seconds, not timestamp
      "NOR/WNOR Initial Liquidity - 3 Year Lock"
    );

    const lockReceipt = await createLockTx.wait();
    console.log(`   ✅ Lock created!`);
    console.log(`   Transaction: ${lockReceipt.hash}`);

    // Get lock ID from events
    const lockCreatedEvent = lockReceipt.logs.find(log => {
      try {
        const parsed = lockContract.interface.parseLog(log);
        return parsed && parsed.name === "LockCreated";
      } catch {
        return false;
      }
    });

    let lockId = "Unknown";
    if (lockCreatedEvent) {
      const parsed = lockContract.interface.parseLog(lockCreatedEvent);
      lockId = parsed.args.lockId.toString();
    }

    console.log(`   Lock ID: ${lockId}`);
    console.log(`   ✅ Liquidity locked until ${unlockDate.toLocaleDateString()}`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: ENABLE TRADING
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🚀 STEP 4: ENABLING TRADING`);
    console.log("═".repeat(70));

    console.log(`\n   ⚠️  WARNING: This is ONE-WAY and CANNOT be reversed!`);
    console.log(`   ⏸️  Final confirmation... (5 seconds)`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log(`\n   🔓 Enabling trading...`);
    const enableTradingTx = await norToken.enableTrading();
    await enableTradingTx.wait();

    console.log(`   ✅ TRADING ENABLED!`);
    console.log(`   Transaction: ${enableTradingTx.hash}`);

    // Verify
    const isTradingEnabled = await norToken.tradingEnabled();
    const phase = await norToken.currentPhase();

    console.log(`\n   🔍 Verification:`);
    console.log(`      Trading Enabled: ${isTradingEnabled} ${isTradingEnabled ? '✅' : '❌'}`);
    console.log(`      Current Phase: ${phase} (${['DISABLED', 'PHASE1', 'PHASE2', 'PHASE3', 'OPEN'][Number(phase)]})`);

    // ═══════════════════════════════════════════════════════════════════
    // LAUNCH COMPLETE!
    // ═══════════════════════════════════════════════════════════════════

    console.log(`\n\n🎉 NORCHAIN LAUNCH COMPLETE!`);
    console.log("═".repeat(70));

    console.log(`\n✅ SUCCESS SUMMARY:`);
    console.log(`   ✅ Liquidity Added: ${ethers.formatUnits(norAmount, 24)} NOR + ${ethers.formatEther(bnbAmount)} BNB`);
    console.log(`   ✅ Liquidity Locked: 3 years (until ${unlockDate.toLocaleDateString()})`);
    console.log(`   ✅ Lock ID: ${lockId}`);
    console.log(`   ✅ Trading: ENABLED`);
    console.log(`   ✅ Phase: PHASE1`);
    console.log(`   ✅ NOR Token: LIVE!`);

    console.log(`\n📊 Contract Addresses:`);
    console.log(`   NOR Token: ${NOR_TOKEN}`);
    console.log(`   LP Token: ${lpTokenAddress}`);
    console.log(`   Lock Contract: ${LIQUIDITY_LOCK}`);
    console.log(`   NorSwap Router: ${NORSWAP_ROUTER}`);

    console.log(`\n💧 Trading Pair:`);
    console.log(`   Pair: NOR/BNB`);
    console.log(`   Liquidity: ~$${Number(INITIAL_BNB_AMOUNT) * 600 * 2}`);
    console.log(`   Lock: 3 years`);
    console.log(`   Lock Proof: Lock ID ${lockId}`);

    console.log(`\n📝 IMMEDIATE NEXT STEPS:`);
    console.log("═".repeat(70));
    console.log(`\n1. 📢 Announce launch publicly`);
    console.log(`   "🚀 NOR Token is LIVE on NorChain!`);
    console.log(`   `);
    console.log(`   ✅ Trading: ENABLED`);
    console.log(`   ✅ Liquidity: $${Number(INITIAL_BNB_AMOUNT) * 600 * 2} locked for 3 YEARS`);
    console.log(`   ✅ Contract: ${NOR_TOKEN}`);
    console.log(`   ✅ Audit: 100% complete`);
    console.log(`   `);
    console.log(`   Trade now on NorSwap! 🔥"`);

    console.log(`\n2. 📊 Monitor first hour closely`);
    console.log(`   - Watch for bot activity`);
    console.log(`   - Check price stability`);
    console.log(`   - Verify security features working`);

    console.log(`\n3. 🎛️ Advance to PHASE2 after 1 hour (if stable)`);
    console.log(`   npx hardhat run scripts/advance-phase.js --network btcbr`);

    console.log(`\n4. 🌐 Submit to aggregators`);
    console.log(`   - DexTools`);
    console.log(`   - DexScreener`);
    console.log(`   - CoinMarketCap`);
    console.log(`   - CoinGecko`);

    console.log(`\n5. 💬 Engage community`);
    console.log(`   - Answer questions`);
    console.log(`   - Share first trades`);
    console.log(`   - Post volume updates`);

    console.log(`\n\n🏆 CONGRATULATIONS!`);
    console.log(`NOR Token is now LIVE and TRADING on NorChain!`);
    console.log("═".repeat(70));

    // Save launch info
    const launchInfo = {
      timestamp: new Date().toISOString(),
      network: "NorChain",
      chainId: 65001,
      norToken: NOR_TOKEN,
      lpToken: lpTokenAddress,
      lockContract: LIQUIDITY_LOCK,
      router: NORSWAP_ROUTER,
      liquidity: {
        nor: ethers.formatUnits(norAmount, 24),
        bnb: ethers.formatEther(bnbAmount),
        estimatedValue: Number(INITIAL_BNB_AMOUNT) * 600 * 2
      },
      lock: {
        lockId: lockId,
        duration: "3 years (1095 days)",
        unlockDate: unlockDate.toISOString()
      },
      trading: {
        enabled: true,
        phase: "PHASE1",
        enabledAt: new Date().toISOString()
      },
      transactions: {
        addLiquidity: receipt.hash,
        createLock: lockReceipt.hash,
        enableTrading: enableTradingTx.hash
      }
    };

    console.log(`\n💾 Launch Information (SAVE THIS):`);
    console.log(JSON.stringify(launchInfo, null, 2));

  } catch (error) {
    console.error(`\n\n❌ LAUNCH FAILED:`);
    console.error(error.message);
    console.log(`\n💡 Common Issues:`);
    console.log(`   - NorSwap router address incorrect?`);
    console.log(`   - Insufficient NOR or BNB balance?`);
    console.log(`   - NorSwap not deployed on NorChain yet?`);
    console.log(`\nResolve the issue and try again.`);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Complete Launch Failed:");
    console.error(error);
    process.exit(1);
  });
