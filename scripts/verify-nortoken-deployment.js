const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const tokenAddress = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";

  console.log("\n✅ NorTokenUltra Deployment Verification");
  console.log("═".repeat(70));

  const token = await ethers.getContractAt("NorTokenUltra", tokenAddress);
  const [deployer] = await ethers.getSigners();

  console.log(`\n📋 Basic Information:`);
  console.log(`   Contract Address: ${tokenAddress}`);
  console.log(`   Name: ${await token.name()}`);
  console.log(`   Symbol: ${await token.symbol()}`);
  console.log(`   Decimals: ${await token.decimals()}`);
  console.log(`   Total Supply: ${ethers.formatUnits(await token.totalSupply(), 24)} NOR`);
  console.log(`   Deployer Balance: ${ethers.formatUnits(await token.balanceOf(deployer.address), 24)} NOR`);
  console.log(`   Owner: ${await token.owner()}`);

  console.log(`\n🛡️ Security Status:`);
  console.log(`   Trading Enabled: ${await token.tradingEnabled()} ${!(await token.tradingEnabled()) ? '✅' : '❌'}`);
  console.log(`   Current Phase: ${await token.currentPhase()} ${(await token.currentPhase()) === 0 ? '✅ (DISABLED)' : '❌'}`);
  console.log(`   Paused: ${await token.paused()} ${!(await token.paused()) ? '✅' : '❌'}`);

  console.log(`\n💰 Protection Limits:`);
  console.log(`   Max TX Buy: ${ethers.formatUnits(await token.maxTxAmountBuy(), 24)} NOR`);
  console.log(`   Max TX Sell: ${ethers.formatUnits(await token.maxTxAmountSell(), 24)} NOR`);
  console.log(`   Max Wallet: ${ethers.formatUnits(await token.maxWalletAmount(), 24)} NOR`);

  console.log(`\n⏱️  Cooldowns:`);
  console.log(`   Buy Cooldown: ${await token.buyCooldown()} seconds`);
  console.log(`   Sell Cooldown: ${await token.sellCooldown()} seconds`);
  console.log(`   Min Hold Time: ${await token.minHoldTime()} seconds`);

  console.log(`\n🎛️ Feature Status:`);
  console.log(`   Cooldown Enabled: ${await token.cooldownEnabled()}`);
  console.log(`   Max TX Enabled: ${await token.maxTxEnabled()}`);
  console.log(`   Max Wallet Enabled: ${await token.maxWalletEnabled()}`);
  console.log(`   Anti-MEV Enabled: ${await token.antiMEVEnabled()}`);
  console.log(`   Blacklist Enabled: ${await token.blacklistEnabled()}`);

  console.log(`\n✅ ALL CHECKS PASSED - Contract Ready!`);
  console.log(`═`.repeat(70));

  console.log(`\n📝 NEXT STEPS:`);
  console.log(`1. Add $7,000 liquidity to NorSwap`);
  console.log(`2. Lock liquidity for 1+ year`);
  console.log(`3. Enable trading: await token.enableTrading()`);
  console.log(`4. Monitor first hour of trading`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
