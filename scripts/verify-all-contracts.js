/**
 * Verify All Deployed Contracts
 *
 * This script verifies all contracts deployed for the $100k liquidity launch:
 * - NorTokenUltra (main token)
 * - LiquidityLockUltra (lock contract)
 * - Future: LP tokens after liquidity addition
 *
 * Verification includes:
 * - Contract address confirmation
 * - Owner verification
 * - Function accessibility
 * - State variables check
 * - Security settings validation
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// Deployed contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const LIQUIDITY_LOCK = "0x30ca927fA0d57C975A16c055BB0fc4fb9Fc3AB63";

async function main() {
  console.log("\n🔍 VERIFYING ALL DEPLOYED CONTRACTS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📋 Verifier: ${deployer.address}`);
  console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

  let allVerified = true;
  const verificationResults = [];

  // ═══════════════════════════════════════════════════════════════════
  // 1. VERIFY NORTOKENULTRA
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n1️⃣  VERIFYING NORTOKENULTRA`);
  console.log("═".repeat(70));
  console.log(`   Address: ${NOR_TOKEN}`);

  try {
    const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

    // Basic info
    const name = await norToken.name();
    const symbol = await norToken.symbol();
    const decimals = await norToken.decimals();
    const totalSupply = await norToken.totalSupply();
    const owner = await norToken.owner();

    console.log(`\n   📊 Token Information:`);
    console.log(`      Name: ${name}`);
    console.log(`      Symbol: ${symbol}`);
    console.log(`      Decimals: ${decimals}`);
    console.log(`      Total Supply: ${ethers.formatUnits(totalSupply, 24)} NOR`);
    console.log(`      Owner: ${owner}`);

    // Security settings
    const tradingEnabled = await norToken.tradingEnabled();
    const currentPhase = await norToken.currentPhase();
    const paused = await norToken.paused();

    console.log(`\n   🛡️ Security Status:`);
    console.log(`      Trading Enabled: ${tradingEnabled} ${!tradingEnabled ? '✅' : '⚠️'}`);
    console.log(`      Current Phase: ${currentPhase} (${['DISABLED', 'PHASE1', 'PHASE2', 'PHASE3', 'OPEN'][Number(currentPhase)]})`);
    console.log(`      Paused: ${paused} ${!paused ? '✅' : '⚠️'}`);

    // Protection limits
    const maxTxBuy = await norToken.maxTxAmountBuy();
    const maxTxSell = await norToken.maxTxAmountSell();
    const maxWallet = await norToken.maxWalletAmount();

    console.log(`\n   💰 Protection Limits:`);
    console.log(`      Max TX Buy: ${ethers.formatUnits(maxTxBuy, 24)} NOR`);
    console.log(`      Max TX Sell: ${ethers.formatUnits(maxTxSell, 24)} NOR`);
    console.log(`      Max Wallet: ${ethers.formatUnits(maxWallet, 24)} NOR`);

    // Cooldowns
    const buyCooldown = await norToken.buyCooldown();
    const sellCooldown = await norToken.sellCooldown();
    const minHoldTime = await norToken.minHoldTime();

    console.log(`\n   ⏱️  Cooldowns:`);
    console.log(`      Buy Cooldown: ${buyCooldown} seconds`);
    console.log(`      Sell Cooldown: ${sellCooldown} seconds`);
    console.log(`      Min Hold Time: ${minHoldTime} seconds`);

    // Feature toggles
    const cooldownEnabled = await norToken.cooldownEnabled();
    const maxTxEnabled = await norToken.maxTxEnabled();
    const maxWalletEnabled = await norToken.maxWalletEnabled();
    const antiMEVEnabled = await norToken.antiMEVEnabled();
    const blacklistEnabled = await norToken.blacklistEnabled();

    console.log(`\n   🎛️ Feature Status:`);
    console.log(`      Cooldown Enabled: ${cooldownEnabled ? '✅' : '❌'}`);
    console.log(`      Max TX Enabled: ${maxTxEnabled ? '✅' : '❌'}`);
    console.log(`      Max Wallet Enabled: ${maxWalletEnabled ? '✅' : '❌'}`);
    console.log(`      Anti-MEV Enabled: ${antiMEVEnabled ? '✅' : '❌'}`);
    console.log(`      Blacklist Enabled: ${blacklistEnabled ? '✅' : '❌'}`);

    // Validation
    const norTokenValid =
      name === "Nor Token Ultra" &&
      symbol === "NOR" &&
      decimals === 24 &&
      totalSupply === ethers.parseUnits("21000000000", 24) &&
      !tradingEnabled &&
      Number(currentPhase) === 0 &&
      !paused;

    console.log(`\n   ${norTokenValid ? '✅' : '❌'} NorTokenUltra Verification: ${norTokenValid ? 'PASSED' : 'FAILED'}`);

    verificationResults.push({
      contract: "NorTokenUltra",
      address: NOR_TOKEN,
      status: norTokenValid ? "VERIFIED" : "FAILED",
      details: {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, 24),
        owner,
        tradingEnabled,
        currentPhase: Number(currentPhase),
        paused
      }
    });

    if (!norTokenValid) allVerified = false;

  } catch (error) {
    console.error(`\n   ❌ Error verifying NorTokenUltra:`, error.message);
    allVerified = false;
    verificationResults.push({
      contract: "NorTokenUltra",
      address: NOR_TOKEN,
      status: "ERROR",
      error: error.message
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. VERIFY LIQUIDITYLOCKULTRA
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n2️⃣  VERIFYING LIQUIDITYLOCKULTRA`);
  console.log("═".repeat(70));
  console.log(`   Address: ${LIQUIDITY_LOCK}`);

  try {
    const lockContract = await ethers.getContractAt("LiquidityLockUltra", LIQUIDITY_LOCK);

    // Basic info
    const owner = await lockContract.owner();
    const totalLocksCreated = await lockContract.totalLocksCreated();
    const totalValueLocked = await lockContract.totalValueLocked();

    console.log(`\n   📋 Contract Information:`);
    console.log(`      Owner: ${owner}`);
    console.log(`      Total Locks Created: ${totalLocksCreated}`);
    console.log(`      Total Value Locked: ${ethers.formatEther(totalValueLocked)} tokens`);

    // Constants
    const minLockPeriod = await lockContract.MIN_LOCK_PERIOD();
    const recommendedLock = await lockContract.RECOMMENDED_LOCK();
    const emergencyUnlockDelay = await lockContract.EMERGENCY_UNLOCK_DELAY();

    console.log(`\n   ⚙️  Lock Parameters:`);
    console.log(`      Min Lock Period: ${Number(minLockPeriod) / 86400} days`);
    console.log(`      Recommended Lock: ${Number(recommendedLock) / 86400} days`);
    console.log(`      Emergency Unlock Delay: ${Number(emergencyUnlockDelay) / 86400} days`);

    // Validation
    const lockContractValid =
      owner === deployer.address &&
      totalLocksCreated === 0n &&
      Number(minLockPeriod) === 365 * 24 * 60 * 60;

    console.log(`\n   ${lockContractValid ? '✅' : '❌'} LiquidityLockUltra Verification: ${lockContractValid ? 'PASSED' : 'FAILED'}`);

    verificationResults.push({
      contract: "LiquidityLockUltra",
      address: LIQUIDITY_LOCK,
      status: lockContractValid ? "VERIFIED" : "FAILED",
      details: {
        owner,
        totalLocksCreated: Number(totalLocksCreated),
        totalValueLocked: ethers.formatEther(totalValueLocked),
        minLockPeriod: Number(minLockPeriod) / 86400 + " days",
        recommendedLock: Number(recommendedLock) / 86400 + " days"
      }
    });

    if (!lockContractValid) allVerified = false;

  } catch (error) {
    console.error(`\n   ❌ Error verifying LiquidityLockUltra:`, error.message);
    allVerified = false;
    verificationResults.push({
      contract: "LiquidityLockUltra",
      address: LIQUIDITY_LOCK,
      status: "ERROR",
      error: error.message
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n\n📊 VERIFICATION SUMMARY`);
  console.log("═".repeat(70));

  verificationResults.forEach((result, index) => {
    const icon = result.status === "VERIFIED" ? "✅" : result.status === "FAILED" ? "❌" : "⚠️";
    console.log(`\n${index + 1}. ${icon} ${result.contract}`);
    console.log(`   Address: ${result.address}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n\n${allVerified ? '✅' : '❌'} Overall Status: ${allVerified ? 'ALL VERIFIED' : 'VERIFICATION FAILED'}`);

  // Save verification report
  const report = {
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    verifier: deployer.address,
    allVerified,
    results: verificationResults
  };

  console.log(`\n💾 Verification Report:`);
  console.log(JSON.stringify(report, null, 2));

  console.log(`\n\n📝 NEXT STEPS:`);
  console.log("═".repeat(70));
  if (allVerified) {
    console.log(`\n✅ All contracts verified successfully!`);
    console.log(`\n1. Add $100k liquidity to all pairs:`);
    console.log(`   npx hardhat run scripts/add-100k-liquidity-all-pairs.js --network btcbr`);
    console.log(`\n2. Lock all liquidity for 3 years:`);
    console.log(`   npx hardhat run scripts/lock-all-liquidity.js --network btcbr`);
    console.log(`\n3. Announce lock publicly (wait 24h)`);
    console.log(`\n4. Enable trading:`);
    console.log(`   npx hardhat run scripts/enable-trading.js --network btcbr`);
  } else {
    console.log(`\n❌ Some contracts failed verification!`);
    console.log(`\nPlease review the errors above and redeploy if necessary.`);
  }

  console.log(`\n═`.repeat(70));
  console.log(`${allVerified ? '✅' : '❌'} Contract Verification Complete`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification Failed:");
    console.error(error);
    process.exit(1);
  });
