import hre from "hardhat";
const { ethers } = hre;

/**
 * SMART TRADING BOT
 *
 * Makes small trades on PancakeSwap to:
 * 1. Generate trading volume
 * 2. Trigger price aggregator indexing (CoinGecko, DexScreener)
 * 3. Help MetaMask show USD values
 * 4. Create market activity
 *
 * Strategy:
 * - Buy small amount of BTCBR with BNB
 * - Sell some BTCBR back to BNB
 * - Buy small amount of XHN with BNB
 * - Sell some XHN back to BNB
 * - Repeat with random intervals
 */

async function main() {
    console.log("\n🤖 SMART TRADING BOT STARTING");
    console.log("=".repeat(70));

    const [trader] = await ethers.getSigners();
    console.log("\n📍 Trader:", trader.address);

    // Contract addresses
    const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

    const routerABI = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
    ];

    const tokenABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const router = new ethers.Contract(PANCAKE_ROUTER, routerABI, trader);
    const btcbr = new ethers.Contract(BTCBR_BSC, tokenABI, trader);
    const xhn = new ethers.Contract(XHN_BSC, tokenABI, trader);

    // Check initial balance
    const initialBnb = await ethers.provider.getBalance(trader.address);
    console.log("\n💰 Starting Balance:", ethers.formatEther(initialBnb), "BNB");

    if (initialBnb < ethers.parseEther("0.01")) {
        console.log("\n⚠️  Need at least 0.01 BNB for trading");
        console.log("  Current:", ethers.formatEther(initialBnb), "BNB");
        return;
    }

    // Trading parameters
    const tradeAmount = ethers.parseEther("0.001"); // 0.001 BNB per trade (~$0.72)
    const numTrades = 5; // Number of trades per token
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    console.log("\n🎯 TRADING PARAMETERS:");
    console.log("  Amount per trade:", ethers.formatEther(tradeAmount), "BNB (~$0.72)");
    console.log("  Number of trades:", numTrades, "per token");
    console.log("  Total trades:", numTrades * 4, "(buy+sell for 2 tokens)");
    console.log("  Estimated total:", ethers.formatEther(tradeAmount * BigInt(numTrades) * 2n), "BNB");

    console.log("\n" + "=".repeat(70));
    console.log("STARTING TRADING SEQUENCE");
    console.log("=".repeat(70));

    // Trade 1: Buy BTCBR
    console.log("\n[1/4] 🟢 BUYING BTCBR...");
    for (let i = 0; i < numTrades; i++) {
        try {
            const pathBuy = [WBNB, BTCBR_BSC];
            const amountsOut = await router.getAmountsOut(tradeAmount, pathBuy);
            const expectedBtcbr = amountsOut[1];

            console.log(`\n  Trade ${i + 1}/${numTrades}:`);
            console.log(`    Spending: ${ethers.formatEther(tradeAmount)} BNB`);
            console.log(`    Expected: ${ethers.formatEther(expectedBtcbr)} BTCBR`);

            const buyTx = await router.swapExactETHForTokens(
                0, // Accept any amount
                pathBuy,
                trader.address,
                deadline,
                { value: tradeAmount }
            );

            const receipt = await buyTx.wait();
            console.log(`    ✅ Success! TX: ${receipt.hash}`);

            // Wait a bit between trades
            if (i < numTrades - 1) {
                const waitTime = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
                console.log(`    ⏳ Waiting ${(waitTime / 1000).toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        } catch (error) {
            console.log(`    ❌ Trade failed:`, error.message);
        }
    }

    // Check BTCBR balance
    const btcbrBalance = await btcbr.balanceOf(trader.address);
    console.log(`\n  📊 BTCBR Balance: ${ethers.formatEther(btcbrBalance)} BTCBR`);

    // Trade 2: Sell half of BTCBR back
    console.log("\n[2/4] 🔴 SELLING BTCBR...");
    if (btcbrBalance > 0n) {
        const sellAmount = btcbrBalance / 2n;

        // Approve router
        console.log(`  Approving ${ethers.formatEther(sellAmount)} BTCBR...`);
        await (await btcbr.approve(PANCAKE_ROUTER, sellAmount)).wait();
        console.log("  ✅ Approved");

        try {
            const pathSell = [BTCBR_BSC, WBNB];
            const amountsOut = await router.getAmountsOut(sellAmount, pathSell);
            const expectedBnb = amountsOut[1];

            console.log(`\n  Selling: ${ethers.formatEther(sellAmount)} BTCBR`);
            console.log(`  Expected: ${ethers.formatEther(expectedBnb)} BNB`);

            const sellTx = await router.swapExactTokensForETH(
                sellAmount,
                0,
                pathSell,
                trader.address,
                deadline
            );

            const receipt = await sellTx.wait();
            console.log(`  ✅ Success! TX: ${receipt.hash}`);
        } catch (error) {
            console.log(`  ❌ Sell failed:`, error.message);
        }
    }

    // Trade 3: Buy XHN
    console.log("\n[3/4] 🟢 BUYING XHN...");
    for (let i = 0; i < numTrades; i++) {
        try {
            const pathBuy = [WBNB, XHN_BSC];
            const amountsOut = await router.getAmountsOut(tradeAmount, pathBuy);
            const expectedXhn = amountsOut[1];

            console.log(`\n  Trade ${i + 1}/${numTrades}:`);
            console.log(`    Spending: ${ethers.formatEther(tradeAmount)} BNB`);
            console.log(`    Expected: ${ethers.formatEther(expectedXhn)} XHN`);

            const buyTx = await router.swapExactETHForTokens(
                0,
                pathBuy,
                trader.address,
                deadline,
                { value: tradeAmount }
            );

            const receipt = await buyTx.wait();
            console.log(`    ✅ Success! TX: ${receipt.hash}`);

            if (i < numTrades - 1) {
                const waitTime = Math.floor(Math.random() * 3000) + 2000;
                console.log(`    ⏳ Waiting ${(waitTime / 1000).toFixed(1)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        } catch (error) {
            console.log(`    ❌ Trade failed:`, error.message);
        }
    }

    // Check XHN balance
    const xhnBalance = await xhn.balanceOf(trader.address);
    console.log(`\n  📊 XHN Balance: ${ethers.formatEther(xhnBalance)} XHN`);

    // Trade 4: Sell half of XHN back
    console.log("\n[4/4] 🔴 SELLING XHN...");
    if (xhnBalance > 0n) {
        const sellAmount = xhnBalance / 2n;

        console.log(`  Approving ${ethers.formatEther(sellAmount)} XHN...`);
        await (await xhn.approve(PANCAKE_ROUTER, sellAmount)).wait();
        console.log("  ✅ Approved");

        try {
            const pathSell = [XHN_BSC, WBNB];
            const amountsOut = await router.getAmountsOut(sellAmount, pathSell);
            const expectedBnb = amountsOut[1];

            console.log(`\n  Selling: ${ethers.formatEther(sellAmount)} XHN`);
            console.log(`  Expected: ${ethers.formatEther(expectedBnb)} BNB`);

            const sellTx = await router.swapExactTokensForETH(
                sellAmount,
                0,
                pathSell,
                trader.address,
                deadline
            );

            const receipt = await sellTx.wait();
            console.log(`  ✅ Success! TX: ${receipt.hash}`);
        } catch (error) {
            console.log(`  ❌ Sell failed:`, error.message);
        }
    }

    // Final balances
    const finalBnb = await ethers.provider.getBalance(trader.address);
    const finalBtcbr = await btcbr.balanceOf(trader.address);
    const finalXhn = await xhn.balanceOf(trader.address);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 TRADING COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n💰 FINAL BALANCES:");
    console.log("  BNB:", ethers.formatEther(finalBnb), "BNB");
    console.log("  BTCBR:", ethers.formatEther(finalBtcbr), "BTCBR");
    console.log("  XHN:", ethers.formatEther(finalXhn), "XHN");

    const bnbSpent = initialBnb - finalBnb;
    console.log("\n📊 TRADING SUMMARY:");
    console.log("  Total BNB spent:", ethers.formatEther(bnbSpent), "BNB");
    console.log("  Cost: ~$" + (parseFloat(ethers.formatEther(bnbSpent)) * 720).toFixed(2));

    console.log("\n✅ BENEFITS:");
    console.log("  ✅ Generated trading volume");
    console.log("  ✅ Created price history");
    console.log("  ✅ Triggered aggregator indexing");
    console.log("  ✅ MetaMask should show USD soon (30min-2hrs)");

    console.log("\n📈 NEXT STEPS:");
    console.log("  1. Check DexScreener: https://dexscreener.com/bsc/" + BTCBR_BSC);
    console.log("  2. Check DexScreener: https://dexscreener.com/bsc/" + XHN_BSC);
    console.log("  3. Wait 30-60 minutes for MetaMask USD display");
    console.log("  4. Check PancakeSwap charts for activity");

    console.log("\n💡 TO RUN AGAIN:");
    console.log("  npx hardhat run scripts/trading-bot.js --network bsc");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
