/**
 * Add $100k Liquidity Across All Pairs on NorSwap
 *
 * Professional Launch Strategy:
 * - NOR/USDT:  $40k (40%) - Primary trading pair
 * - NOR/WBNB:  $30k (30%) - BSC bridge compatibility
 * - NOR/BTCB:  $15k (15%) - Bitcoin exposure
 * - NOR/WETH:  $10k (10%) - Ethereum exposure
 * - NOR/BUSD:  $5k (5%)   - Stable alternative
 *
 * Total: $100,000
 *
 * CRITICAL: Run this BEFORE enabling trading!
 * Trading must remain disabled until liquidity is locked.
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// NorSwap Router address (PancakeSwap fork)
const NORSWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Update with actual NorSwap address

// Token addresses on NorChain
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const USDT = "0x55d398326f99059fF775485246999027B3197955"; // Bridged USDT
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // Wrapped BNB
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9C"; // Bitcoin BEP2
const WETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"; // Wrapped ETH
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // Binance USD

// Liquidity allocation ($100k total)
const LIQUIDITY_CONFIG = [
  {
    name: "NOR/USDT",
    token: USDT,
    norAmount: "40000", // $40k worth of NOR
    tokenAmount: "40000", // $40k USDT
    allocation: 0.40,
    priority: "PRIMARY"
  },
  {
    name: "NOR/WBNB",
    token: WBNB,
    norAmount: "30000", // $30k worth of NOR
    tokenAmount: "50", // $30k in BNB (assuming $600/BNB)
    allocation: 0.30,
    priority: "HIGH"
  },
  {
    name: "NOR/BTCB",
    token: BTCB,
    norAmount: "15000", // $15k worth of NOR
    tokenAmount: "0.25", // $15k in BTC (assuming $60k/BTC)
    allocation: 0.15,
    priority: "MEDIUM"
  },
  {
    name: "NOR/WETH",
    token: WETH,
    norAmount: "10000", // $10k worth of NOR
    tokenAmount: "3", // $10k in ETH (assuming $3.3k/ETH)
    allocation: 0.10,
    priority: "MEDIUM"
  },
  {
    name: "NOR/BUSD",
    token: BUSD,
    norAmount: "5000", // $5k worth of NOR
    tokenAmount: "5000", // $5k BUSD
    allocation: 0.05,
    priority: "LOW"
  }
];

async function main() {
  console.log("\n💰 ADDING $100K LIQUIDITY TO NORSWAP - ALL PAIRS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`\n📋 Deployer: ${deployer.address}`);

  // Get contracts
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const router = await ethers.getContractAt("IPancakeRouter02", NORSWAP_ROUTER);

  // Check NOR balance
  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`   NOR Balance: ${ethers.formatUnits(norBalance, 24)} NOR`);

  // Verify trading is disabled
  const tradingEnabled = await norToken.tradingEnabled();
  if (tradingEnabled) {
    throw new Error("❌ CRITICAL: Trading is already enabled! Cannot add liquidity safely.");
  }
  console.log(`   Trading Enabled: ${tradingEnabled} ✅ (Good - still disabled)`);

  console.log(`\n📊 Liquidity Distribution Strategy ($100,000):`);
  console.log("═".repeat(70));

  let totalNorNeeded = 0n;
  LIQUIDITY_CONFIG.forEach((pair, index) => {
    const norAmount = ethers.parseUnits(pair.norAmount, 24);
    totalNorNeeded += norAmount;
    console.log(`\n${index + 1}. ${pair.name}`);
    console.log(`   Allocation: ${(pair.allocation * 100).toFixed(0)}% ($${(100000 * pair.allocation).toLocaleString()})`);
    console.log(`   NOR Amount: ${ethers.formatUnits(norAmount, 24)} NOR`);
    console.log(`   Token Amount: ${pair.tokenAmount}`);
    console.log(`   Priority: ${pair.priority}`);
  });

  console.log(`\n💵 Total NOR Required: ${ethers.formatUnits(totalNorNeeded, 24)} NOR`);

  if (norBalance < totalNorNeeded) {
    throw new Error(`❌ Insufficient NOR balance. Need ${ethers.formatUnits(totalNorNeeded, 24)}, have ${ethers.formatUnits(norBalance, 24)}`);
  }

  console.log(`\n⚠️  LIQUIDITY ADDITION CHECKLIST:`);
  console.log(`   ✅ Do you have all tokens ready?`);
  console.log(`   ✅ Do you have enough gas?`);
  console.log(`   ✅ Is trading still disabled? ${!tradingEnabled ? '✅' : '❌'}`);
  console.log(`   ✅ Will you lock liquidity IMMEDIATELY after?`);

  console.log(`\n⏸️  Pausing for 10 seconds... Press Ctrl+C to cancel.`);
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Add liquidity to each pair
  const lpTokens = [];

  for (let i = 0; i < LIQUIDITY_CONFIG.length; i++) {
    const pair = LIQUIDITY_CONFIG[i];
    console.log(`\n\n🔄 Adding Liquidity to ${pair.name} (${(pair.allocation * 100).toFixed(0)}%)...`);
    console.log("═".repeat(70));

    try {
      const norAmount = ethers.parseUnits(pair.norAmount, 24);
      const tokenAmount = ethers.parseUnits(pair.tokenAmount, await getDecimals(pair.token));

      // Get token contract
      const token = await ethers.getContractAt("IERC20", pair.token);
      const tokenBalance = await token.balanceOf(deployer.address);

      console.log(`   Your ${pair.name.split('/')[1]} balance: ${ethers.formatUnits(tokenBalance, await getDecimals(pair.token))}`);

      if (tokenBalance < tokenAmount) {
        console.log(`   ⚠️  WARNING: Insufficient ${pair.name.split('/')[1]} balance. Skipping this pair.`);
        continue;
      }

      // Approve NOR
      console.log(`\n   📝 Approving NOR...`);
      const approveTx1 = await norToken.approve(NORSWAP_ROUTER, norAmount);
      await approveTx1.wait();
      console.log(`   ✅ NOR approved`);

      // Approve other token
      console.log(`   📝 Approving ${pair.name.split('/')[1]}...`);
      const approveTx2 = await token.approve(NORSWAP_ROUTER, tokenAmount);
      await approveTx2.wait();
      console.log(`   ✅ ${pair.name.split('/')[1]} approved`);

      // Add liquidity
      console.log(`\n   💧 Adding liquidity...`);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      const addLiquidityTx = await router.addLiquidity(
        NOR_TOKEN,
        pair.token,
        norAmount,
        tokenAmount,
        (norAmount * 95n) / 100n, // 5% slippage
        (tokenAmount * 95n) / 100n,
        deployer.address,
        deadline,
        { gasLimit: 3000000 }
      );

      const receipt = await addLiquidityTx.wait();
      console.log(`   ✅ Liquidity added!`);
      console.log(`   Transaction: ${receipt.hash}`);

      // Get LP token address
      const factory = await ethers.getContractAt("IPancakeFactory", await router.factory());
      const lpTokenAddress = await factory.getPair(NOR_TOKEN, pair.token);
      console.log(`   LP Token: ${lpTokenAddress}`);

      // Get LP balance
      const lpToken = await ethers.getContractAt("IERC20", lpTokenAddress);
      const lpBalance = await lpToken.balanceOf(deployer.address);
      console.log(`   LP Balance: ${ethers.formatUnits(lpBalance, 18)} LP tokens`);

      lpTokens.push({
        pair: pair.name,
        address: lpTokenAddress,
        balance: lpBalance,
        allocation: pair.allocation
      });

      console.log(`   ✅ ${pair.name} pair complete!`);

    } catch (error) {
      console.error(`\n   ❌ Error adding liquidity to ${pair.name}:`, error.message);
      console.log(`   Continuing with next pair...`);
    }
  }

  // Summary
  console.log(`\n\n✅ LIQUIDITY ADDITION COMPLETE`);
  console.log("═".repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Pairs Created: ${lpTokens.length}/${LIQUIDITY_CONFIG.length}`);
  console.log(`   Total Value: $${(100000 * lpTokens.reduce((sum, lp) => sum + lp.allocation, 0)).toLocaleString()}`);

  console.log(`\n💧 LP Tokens Received:`);
  lpTokens.forEach((lp, index) => {
    console.log(`\n   ${index + 1}. ${lp.pair}`);
    console.log(`      Address: ${lp.address}`);
    console.log(`      Balance: ${ethers.formatUnits(lp.balance, 18)} LP`);
    console.log(`      Value: $${(100000 * lp.allocation).toLocaleString()}`);
  });

  // Save LP token info for locking
  const lpInfo = {
    timestamp: new Date().toISOString(),
    totalValue: 100000,
    pairs: lpTokens,
    deployer: deployer.address,
    router: NORSWAP_ROUTER,
    norToken: NOR_TOKEN
  };

  console.log(`\n💾 LP Token Information (save this for locking):`);
  console.log(JSON.stringify(lpInfo, null, 2));

  console.log(`\n\n⚠️  CRITICAL NEXT STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. 🔒 LOCK LIQUIDITY IMMEDIATELY (BEFORE enabling trading)`);
  console.log(`   - Use LiquidityLockUltra contract`);
  console.log(`   - Lock for 1+ year minimum`);
  console.log(`   - Get public proof of lock`);
  console.log(`\n2. 📢 Announce liquidity lock publicly`);
  console.log(`   - Share lock proof URL`);
  console.log(`   - Post on Twitter/Telegram`);
  console.log(`   - Update documentation`);
  console.log(`\n3. 🚀 Only then enable trading`);
  console.log(`   - Call norToken.enableTrading()`);
  console.log(`   - This is ONE-WAY, cannot reverse`);
  console.log(`   - Monitor first hour closely`);

  console.log(`\n\n💡 To lock liquidity, run:`);
  console.log(`   npx hardhat run scripts/lock-all-liquidity.js --network btcbr`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ $100k Liquidity Addition Complete!`);
  console.log(`═`.repeat(70));
}

async function getDecimals(tokenAddress) {
  const token = await ethers.getContractAt("IERC20Metadata", tokenAddress);
  return await token.decimals();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Liquidity Addition Failed:");
    console.error(error);
    process.exit(1);
  });
