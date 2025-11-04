import hre from "hardhat";
const { ethers } = hre;

/**
 * Smart Trading Bot
 *
 * Creates organic-looking trading activity on Nor DEX to:
 * 1. Attract arbitrage bots
 * 2. Generate volume
 * 3. Earn fees
 * 4. Show liquidity is real
 *
 * Strategy: Make small random trades at varying intervals
 */

const ROUTER_ADDRESS = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const WNOR_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT (if bridged)

// Trading parameters
const MIN_TRADE_USD = 10; // $10 minimum
const MAX_TRADE_USD = 500; // $500 maximum
const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_INTERVAL = 30 * 60 * 1000; // 30 minutes

async function main() {
  console.log("\n🤖 SMART TRADING BOT STARTING\n");
  console.log("═".repeat(60));

  const [trader] = await ethers.getSigners();
  console.log("💼 Trader:", trader.address);

  const balance = await ethers.provider.getBalance(trader.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    ROUTER_ADDRESS
  );
  const wxht = await ethers.getContractAt("IERC20", WNOR_ADDRESS);

  console.log("📊 Trading Configuration:");
  console.log(`   Min trade: $${MIN_TRADE_USD}`);
  console.log(`   Max trade: $${MAX_TRADE_USD}`);
  console.log(
    `   Interval: ${MIN_INTERVAL / 60000}-${MAX_INTERVAL / 60000} minutes`
  );
  console.log(`   Strategy: Random buy/sell to create activity\n`);

  console.log("═".repeat(60));
  console.log("🎯 WHY THIS WORKS:");
  console.log("═".repeat(60));
  console.log("✅ Creates real trading volume");
  console.log("✅ Attracts arbitrage bots");
  console.log("✅ Generates price movement");
  console.log("✅ YOU earn 0.3% on every trade!");
  console.log("✅ Bots see activity and join in\n");

  let tradeCount = 0;
  let totalVolume = 0;

  // Trading loop
  while (true) {
    try {
      await executeTrade();
      tradeCount++;

      // Random wait time
      const waitTime = getRandomInterval();
      console.log(
        `⏰ Waiting ${Math.floor(
          waitTime / 60000
        )} minutes until next trade...\n`
      );
      await sleep(waitTime);
    } catch (error) {
      console.error("❌ Trade failed:", error.message);
      console.log("⏰ Waiting 5 minutes before retry...\n");
      await sleep(5 * 60 * 1000);
    }
  }

  async function executeTrade() {
    // Random trade size
    const tradeSize = getRandomTradeSize();
    const isBuy = Math.random() > 0.5; // 50/50 buy or sell

    if (isBuy) {
      await buyNOR(tradeSize);
    } else {
      await sellNOR(tradeSize);
    }

    totalVolume += tradeSize;

    console.log(`📈 Trade ${tradeCount + 1} Summary:`);
    console.log(`   Total volume: $${totalVolume.toFixed(2)}`);
    console.log(`   Your fees earned: $${(totalVolume * 0.003).toFixed(2)}`);
  }

  async function buyNOR(amountUSD) {
    console.log(`\n🟢 BUY: $${amountUSD} worth of NOR`);

    // Assuming NOR price ~$0.001
    const xhtAmount = ethers.parseEther((amountUSD / 0.001).toString());
    const slippage = 0.05; // 5% slippage tolerance
    const minXhtOut = (xhtAmount * BigInt(95)) / BigInt(100);

    // Path: NOR → (if USDT pair exists, otherwise direct)
    const path = [WNOR_ADDRESS]; // Simplified for example

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    console.log(`   Amount: ${ethers.formatEther(xhtAmount)} NOR`);
    console.log(`   Min expected: ${ethers.formatEther(minXhtOut)} NOR`);
    console.log(`   Slippage: 5%`);

    // Execute swap
    const tx = await router.swapExactTokensForTokens(
      xhtAmount,
      minXhtOut,
      path,
      trader.address,
      deadline,
      { gasLimit: 300000 }
    );

    await tx.wait();
    console.log(`   ✅ Trade successful!`);
    console.log(`   TX: https://explorer.xaheen.org/tx/${tx.hash}`);
  }

  async function sellNOR(amountUSD) {
    console.log(`\n🔴 SELL: $${amountUSD} worth of NOR`);

    const xhtAmount = ethers.parseEther((amountUSD / 0.001).toString());
    const slippage = 0.05;
    const minOut = (xhtAmount * BigInt(95)) / BigInt(100);

    const path = [WNOR_ADDRESS]; // Simplified

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    console.log(`   Amount: ${ethers.formatEther(xhtAmount)} NOR`);
    console.log(`   Min expected output`);
    console.log(`   Slippage: 5%`);

    const tx = await router.swapExactTokensForTokens(
      xhtAmount,
      minOut,
      path,
      trader.address,
      deadline,
      { gasLimit: 300000 }
    );

    await tx.wait();
    console.log(`   ✅ Trade successful!`);
    console.log(`   TX: https://explorer.xaheen.org/tx/${tx.hash}`);
  }
}

function getRandomTradeSize() {
  return Math.random() * (MAX_TRADE_USD - MIN_TRADE_USD) + MIN_TRADE_USD;
}

function getRandomInterval() {
  return Math.random() * (MAX_INTERVAL - MIN_INTERVAL) + MIN_INTERVAL;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
