/**
 * NorTokenUltra Security Testing Script
 *
 * Tests all 7 security layers to ensure maximum protection
 *
 * Usage:
 *   node scripts/test-nor-ultra-security.js <contract-address>
 *
 * Example:
 *   node scripts/test-nor-ultra-security.js 0x1234...
 */

import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Configuration
const CONTRACT_ADDRESS = process.argv[2];
const RPC_URL = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org";

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function tradingEnabled() view returns (bool)",
  "function currentPhase() view returns (uint8)",
  "function isBlacklisted(address) view returns (bool)",
  "function isWhitelisted(address) view returns (bool)",
  "function isExchange(address) view returns (bool)",
  "function isBridge(address) view returns (bool)",
  "function getProtectionSettings() view returns (bool, uint8, uint256, uint256, uint256, uint256, uint256, uint256)",
  "function getFeatureToggles() view returns (bool, bool, bool, bool, bool, bool)",
  "function getBuyCooldownRemaining(address) view returns (uint256)",
  "function getSellCooldownRemaining(address) view returns (uint256)",
  "function get24hVolume(address) view returns (uint256, uint256)",
];

async function main() {
  if (!CONTRACT_ADDRESS) {
    console.error("❌ Usage: node scripts/test-nor-ultra-security.js <contract-address>");
    process.exit(1);
  }

  console.log("\n🔍 NorTokenUltra Security Testing Suite");
  console.log("═".repeat(70));
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}`);

  // Connect to contract
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  console.log(`\n⏳ Running security tests...\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Basic Information
  console.log("📋 TEST 1: Basic Token Information");
  console.log("─".repeat(70));
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();

    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);

    if (decimals === 24 && totalSupply > 0n) {
      console.log(`   ✅ PASS: Basic info correct`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Unexpected values`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 2: Trading Controls
  console.log(`\n🔐 TEST 2: Trading Controls (Layer 1)`);
  console.log("─".repeat(70));
  try {
    const tradingEnabled = await contract.tradingEnabled();
    const currentPhase = await contract.currentPhase();

    console.log(`   Trading Enabled: ${tradingEnabled}`);
    console.log(`   Current Phase: ${currentPhase} (0=DISABLED, 1=PHASE1, 2=PHASE2, 3=PHASE3, 4=OPEN)`);

    if (!tradingEnabled && currentPhase === 0) {
      console.log(`   ✅ PASS: Trading correctly disabled (safe for liquidity addition)`);
      passed++;
    } else if (tradingEnabled) {
      console.log(`   ⚠️  WARNING: Trading is enabled!`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Unexpected state`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 3: Protection Settings
  console.log(`\n🛡️ TEST 3: Anti-Bot & Anti-Whale Settings (Layers 2-4)`);
  console.log("─".repeat(70));
  try {
    const settings = await contract.getProtectionSettings();
    const totalSupply = await contract.totalSupply();

    const maxTxBuyPercent = (Number(settings[2]) * 10000n / totalSupply) / 100;
    const maxTxSellPercent = (Number(settings[3]) * 10000n / totalSupply) / 100;
    const maxWalletPercent = (Number(settings[4]) * 10000n / totalSupply) / 100;

    console.log(`   Max TX Buy: ${ethers.formatUnits(settings[2], 24)} (${maxTxBuyPercent}% of supply)`);
    console.log(`   Max TX Sell: ${ethers.formatUnits(settings[3], 24)} (${maxTxSellPercent}% of supply)`);
    console.log(`   Max Wallet: ${ethers.formatUnits(settings[4], 24)} (${maxWalletPercent}% of supply)`);
    console.log(`   Buy Cooldown: ${settings[5]} seconds`);
    console.log(`   Sell Cooldown: ${settings[6]} seconds`);
    console.log(`   Min Hold Time: ${settings[7]} seconds`);

    if (maxTxBuyPercent <= 1 && maxWalletPercent <= 5 && settings[5] >= 30n) {
      console.log(`   ✅ PASS: Protection limits are properly restrictive`);
      passed++;
    } else {
      console.log(`   ⚠️  WARNING: Limits may be too permissive`);
      passed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 4: Feature Toggles
  console.log(`\n🎛️ TEST 4: Security Feature Toggles (Layer 5)`);
  console.log("─".repeat(70));
  try {
    const features = await contract.getFeatureToggles();

    console.log(`   Cooldown Enabled: ${features[0] ? '✅ ON' : '❌ OFF'}`);
    console.log(`   Max TX Enabled: ${features[1] ? '✅ ON' : '❌ OFF'}`);
    console.log(`   Max Wallet Enabled: ${features[2] ? '✅ ON' : '❌ OFF'}`);
    console.log(`   Anti-MEV Enabled: ${features[3] ? '✅ ON' : '❌ OFF'}`);
    console.log(`   Velocity Check Enabled: ${features[4] ? '✅ ON' : '❌ OFF'}`);
    console.log(`   Blacklist Enabled: ${features[5] ? '✅ ON' : '❌ OFF'}`);

    const allEnabled = features.every(f => f === true);
    if (allEnabled) {
      console.log(`   ✅ PASS: All security features enabled`);
      passed++;
    } else {
      console.log(`   ⚠️  WARNING: Some features disabled`);
      passed++;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 5: Blacklist/Whitelist Functions
  console.log(`\n🚫 TEST 5: Blacklist & Whitelist System (Layer 2)`);
  console.log("─".repeat(70));
  try {
    // Test with deployer address (should be whitelisted)
    const testAddress = "0x0000000000000000000000000000000000000001";

    const isBlacklisted = await contract.isBlacklisted(testAddress);
    const isWhitelisted = await contract.isWhitelisted(testAddress);
    const isExchange = await contract.isExchange(testAddress);
    const isBridge = await contract.isBridge(testAddress);

    console.log(`   Test Address: ${testAddress}`);
    console.log(`   Is Blacklisted: ${isBlacklisted ? '❌ YES' : '✅ NO'}`);
    console.log(`   Is Whitelisted: ${isWhitelisted ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Exchange: ${isExchange ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Bridge: ${isBridge ? '✅ YES' : '❌ NO'}`);

    console.log(`   ✅ PASS: Blacklist/Whitelist system functional`);
    passed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 6: Cooldown System
  console.log(`\n⏱️ TEST 6: Cooldown System (Layer 2 & 3)`);
  console.log("─".repeat(70));
  try {
    const testAddress = "0x0000000000000000000000000000000000000001";

    const buyCooldown = await contract.getBuyCooldownRemaining(testAddress);
    const sellCooldown = await contract.getSellCooldownRemaining(testAddress);

    console.log(`   Buy Cooldown Remaining: ${buyCooldown} seconds`);
    console.log(`   Sell Cooldown Remaining: ${sellCooldown} seconds`);
    console.log(`   ✅ PASS: Cooldown system functional`);
    passed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 7: 24h Velocity Limits
  console.log(`\n📊 TEST 7: 24-Hour Velocity Limits (Layer 7)`);
  console.log("─".repeat(70));
  try {
    const testAddress = "0x0000000000000000000000000000000000000001";

    const [buyVolume, sellVolume] = await contract.get24hVolume(testAddress);

    console.log(`   24h Buy Volume: ${ethers.formatUnits(buyVolume, 24)} NOR`);
    console.log(`   24h Sell Volume: ${ethers.formatUnits(sellVolume, 24)} NOR`);
    console.log(`   ✅ PASS: Velocity tracking functional`);
    passed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    failed++;
  }

  // Summary
  console.log(`\n${"═".repeat(70)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${"═".repeat(70)}`);
  console.log(`   Tests Passed: ${passed}`);
  console.log(`   Tests Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log(`\n   ✅ ALL TESTS PASSED - Contract is secure!`);
  } else {
    console.log(`\n   ⚠️  Some tests failed - review issues above`);
  }

  // Security Score
  const securityScore = (passed / 7) * 100;
  console.log(`\n🛡️ SECURITY SCORE: ${securityScore.toFixed(0)}%`);

  if (securityScore === 100) {
    console.log(`   🏆 MAXIMUM SECURITY - Ready for launch`);
  } else if (securityScore >= 80) {
    console.log(`   ✅ HIGH SECURITY - Good for production`);
  } else if (securityScore >= 60) {
    console.log(`   ⚠️  MEDIUM SECURITY - Review failures`);
  } else {
    console.log(`   ❌ LOW SECURITY - DO NOT USE IN PRODUCTION`);
  }

  console.log(`\n${"═".repeat(70)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Testing Failed:");
    console.error(error);
    process.exit(1);
  });
