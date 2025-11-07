/**
 * NorTokenUltra Deployment Script
 *
 * Deploys the most secure token contract with all 7 security layers
 *
 * Networks:
 * - BSC Mainnet: --network bsc
 * - BSC Testnet: --network bscTestnet
 * - NorChain: --network btcbr
 *
 * Usage:
 *   npx hardhat run scripts/deploy-nor-ultra.js --network bsc
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

async function main() {
  console.log("\n🚀 DEPLOYING NorTokenUltra - Maximum Security Token");
  console.log("═".repeat(70));

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Deployment Configuration:`);
  console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ${(await ethers.provider.getNetwork()).name === 'bsc' ? 'BNB' : 'ETH'}`);

  if (balance === 0n) {
    throw new Error("❌ Deployer has zero balance. Need gas for deployment!");
  }

  // Token configuration
  const TOKEN_NAME = "Nor Token Ultra";
  const TOKEN_SYMBOL = "NOR";
  const INITIAL_SUPPLY = ethers.parseUnits("21000000000", 24); // 21 billion with 24 decimals

  console.log(`\n📊 Token Configuration:`);
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);
  console.log(`   Decimals: 24`);
  console.log(`   Initial Supply: ${ethers.formatUnits(INITIAL_SUPPLY, 24)} NOR`);

  // Deploy contract
  console.log(`\n⏳ Deploying NorTokenUltra contract...`);

  const NorTokenUltra = await ethers.getContractFactory("NorTokenUltra");
  const token = await NorTokenUltra.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);

  console.log(`   Transaction hash: ${token.deploymentTransaction().hash}`);
  console.log(`   Waiting for confirmations...`);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log(`\n✅ NorTokenUltra deployed successfully!`);
  console.log(`   Contract Address: ${tokenAddress}`);

  // Verify deployment
  console.log(`\n🔍 Verifying Deployment...`);

  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const deployerBalance = await token.balanceOf(deployer.address);
  const tradingEnabled = await token.tradingEnabled();
  const currentPhase = await token.currentPhase();

  console.log(`   Name: ${name} ${name === TOKEN_NAME ? '✅' : '❌'}`);
  console.log(`   Symbol: ${symbol} ${symbol === TOKEN_SYMBOL ? '✅' : '❌'}`);
  console.log(`   Decimals: ${decimals} ${decimals === 24 ? '✅' : '❌'}`);
  console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 24)} NOR ${totalSupply === INITIAL_SUPPLY ? '✅' : '❌'}`);
  console.log(`   Deployer Balance: ${ethers.formatUnits(deployerBalance, 24)} NOR ${deployerBalance === INITIAL_SUPPLY ? '✅' : '❌'}`);
  console.log(`   Trading Enabled: ${tradingEnabled} ${!tradingEnabled ? '✅' : '❌ WARNING: Should be false!'}`);
  console.log(`   Phase: ${currentPhase} ${currentPhase === 0 ? '✅ (DISABLED)' : '❌ WARNING!'}`);

  // Get protection settings
  const settings = await token.getProtectionSettings();
  console.log(`\n🛡️ Security Settings:`);
  console.log(`   Max TX Buy: ${ethers.formatUnits(settings._maxTxBuy, 24)} NOR (${Number(settings._maxTxBuy) * 100n / totalSupply / 100n}%)`);
  console.log(`   Max TX Sell: ${ethers.formatUnits(settings._maxTxSell, 24)} NOR (${Number(settings._maxTxSell) * 100n / totalSupply / 100n}%)`);
  console.log(`   Max Wallet: ${ethers.formatUnits(settings._maxWallet, 24)} NOR (${Number(settings._maxWallet) * 100n / totalSupply / 100n}%)`);
  console.log(`   Buy Cooldown: ${settings._buyCooldown} seconds`);
  console.log(`   Sell Cooldown: ${settings._sellCooldown} seconds`);
  console.log(`   Min Hold Time: ${settings._minHoldTime} seconds`);

  // Get feature toggles
  const features = await token.getFeatureToggles();
  console.log(`\n🎛️ Feature Toggles:`);
  console.log(`   Cooldown Enabled: ${features._cooldownEnabled ? '✅' : '❌'}`);
  console.log(`   Max TX Enabled: ${features._maxTxEnabled ? '✅' : '❌'}`);
  console.log(`   Max Wallet Enabled: ${features._maxWalletEnabled ? '✅' : '❌'}`);
  console.log(`   Anti-MEV Enabled: ${features._antiMEVEnabled ? '✅' : '❌'}`);
  console.log(`   Velocity Check Enabled: ${features._velocityCheckEnabled ? '✅' : '❌'}`);
  console.log(`   Blacklist Enabled: ${features._blacklistEnabled ? '✅' : '❌'}`);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: tokenAddress,
    deployer: deployer.address,
    tokenName: TOKEN_NAME,
    tokenSymbol: TOKEN_SYMBOL,
    decimals: 24,
    initialSupply: INITIAL_SUPPLY.toString(),
    deploymentTime: new Date().toISOString(),
    transactionHash: token.deploymentTransaction().hash,
    blockNumber: token.deploymentTransaction().blockNumber,
  };

  console.log(`\n💾 Deployment Info:`);
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Important next steps
  console.log(`\n📝 NEXT STEPS:`);
  console.log(`═`.repeat(70));
  console.log(`\n1. ⚠️  CRITICAL: Verify contract on BSCScan/Explorer`);
  console.log(`   npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${tokenAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" "${INITIAL_SUPPLY}"`);

  console.log(`\n2. 🔐 Configure Security (BEFORE enabling trading):`);
  console.log(`   - Whitelist exchanges: token.setExchange(address, true)`);
  console.log(`   - Whitelist bridges: token.setBridge(address, true)`);
  console.log(`   - Whitelist team addresses: token.whitelist(address)`);

  console.log(`\n3. 💰 Add Liquidity (MUST DO BEFORE ENABLING TRADING):`);
  console.log(`   - Minimum: $50,000 USDT + equivalent NOR`);
  console.log(`   - Recommended: $100,000+ for better protection`);
  console.log(`   - IMPORTANT: Trading is still DISABLED, safe to add liquidity`);

  console.log(`\n4. 🔒 Lock Liquidity (CRITICAL - DO THIS BEFORE STEP 5):`);
  console.log(`   - Use Team Finance: https://www.team.finance/`);
  console.log(`   - Lock for 2+ years minimum`);
  console.log(`   - Get lock proof URL`);
  console.log(`   - Publish lock proof publicly`);

  console.log(`\n5. 🚀 Enable Trading (FINAL STEP - CANNOT BE REVERSED):`);
  console.log(`   - Verify all above steps are complete`);
  console.log(`   - Announce launch time 24h in advance`);
  console.log(`   - At launch time: token.enableTrading()`);
  console.log(`   - Monitor closely for first 1 hour`);

  console.log(`\n6. 📊 Monitor & Manage:`);
  console.log(`   - Phase 1 (First hour): Strict limits active`);
  console.log(`   - Advance to Phase 2: token.advancePhase() after ~1 hour`);
  console.log(`   - Advance to Phase 3: token.advancePhase() after ~6 hours`);
  console.log(`   - Advance to OPEN: token.advancePhase() after ~7 days`);
  console.log(`   - Blacklist bots if needed: token.blacklist(address)`);

  console.log(`\n⚠️  SECURITY WARNINGS:`);
  console.log(`   - Trading is DISABLED by default ✅`);
  console.log(`   - Only enableTrading() once ALL preparations are complete`);
  console.log(`   - enableTrading() is ONE-WAY - cannot be disabled again`);
  console.log(`   - Emergency pause available: token.pause("reason")`);
  console.log(`   - Transfer ownership to multi-sig for production`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ Deployment Complete!`);
  console.log(`═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
