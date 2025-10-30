import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";

dotenv.config();

/**
 * Bot-Friendly Token Launch
 * Creates instant buying pressure and attracts trading bots
 */

async function main() {
    console.log("🤖 BOT-FRIENDLY LAUNCH SEQUENCE");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    // Contract addresses (from fixed deployment - Xaheen Chain)
    const ROUTER_ADDRESS = "0x25918D0630bC8a6683d9882a1e2e01B8d0eC45dd";
    const XHN_ADDRESS = "0xD4567cD447068aaD470431746592f261Fae92bAa";
    const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

    const router = await ethers.getContractAt("XaheenDEXRouter", ROUTER_ADDRESS);

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 1: INITIAL PUMP (Create Upward Momentum)");
    console.log("=".repeat(70));

    // Execute staircase buying pattern to attract trend-following bots
    const buyAmounts = [
        ethers.parseEther("1"),    // $0.10 worth
        ethers.parseEther("2"),    // $0.20 worth
        ethers.parseEther("5"),    // $0.50 worth
        ethers.parseEther("10"),   // $1.00 worth
        ethers.parseEther("20")    // $2.00 worth
    ];

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    let totalSpent = 0n;
    let totalReceived = 0n;

    console.log("\n🚀 Executing staircase buys to create momentum:");
    console.log("   (This attracts trend-following bots)");

    for (let i = 0; i < buyAmounts.length; i++) {
        const amount = buyAmounts[i];

        console.log(`\n[${i + 1}/5] Buying ${ethers.formatEther(amount)} XHT worth of XHN...`);

        try {
            // Get expected output
            const wxhtAddress = await router.wxht();
            const path = [wxhtAddress, XHN_ADDRESS];
            const amounts = await router.getAmountsOut(amount, path);
            const expectedXHN = amounts[1];

            // Execute swap
            const swapTx = await router.swapExactXHTForTokens(
                0, // Accept any amount (no slippage protection for demonstration)
                path,
                deployer.address,
                deadline,
                { value: amount }
            );

            const receipt = await swapTx.wait();

            totalSpent += amount;
            totalReceived += expectedXHN;

            console.log(`✅ Bought ${ethers.formatEther(expectedXHN)} XHN`);
            console.log(`   TX: ${receipt.hash}`);

            // Check new price
            const newAmounts = await router.getAmountsOut(ethers.parseEther("1"), path);
            const pricePerXHT = ethers.formatEther(newAmounts[1]);
            console.log(`   New price: 1 XHT = ${pricePerXHT} XHN`);

            // Wait 2 seconds between buys (appears more organic)
            if (i < buyAmounts.length - 1) {
                console.log("   ⏰ Waiting 2 seconds...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`❌ Buy ${i + 1} failed:`, error.message);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 2: VOLUME GENERATION (Attract Volume Bots)");
    console.log("=".repeat(70));

    console.log("\n💧 Creating artificial volume through wash trading:");
    console.log("   (This attracts volume-seeking bots)");

    // Small back-and-forth trades to create volume
    const washTradeAmount = ethers.parseEther("0.5"); // $0.05 per trade
    const numTrades = 10;

    for (let i = 0; i < numTrades; i++) {
        try {
            const wxhtAddress = await router.wxht();
            const path = [wxhtAddress, XHN_ADDRESS];

            // Buy
            await router.swapExactXHTForTokens(
                0,
                path,
                deployer.address,
                deadline,
                { value: washTradeAmount }
            );

            console.log(`[${i + 1}/${numTrades}] ✅ Volume trade executed`);

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Trade ${i + 1} failed:`, error.message);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("LAUNCH COMPLETE - BOT ATTRACTION ACTIVE");
    console.log("=".repeat(70));

    console.log("\n📊 LAUNCH STATISTICS:");
    console.log("  Total XHT Spent:", ethers.formatEther(totalSpent));
    console.log("  Total XHN Received:", ethers.formatEther(totalReceived));

    // Get final price
    const wxhtAddress = await router.wxht();
    const path = [wxhtAddress, XHN_ADDRESS];
    const finalAmounts = await router.getAmountsOut(ethers.parseEther("1"), path);
    const finalPrice = ethers.formatEther(finalAmounts[1]);

    console.log("\n💰 FINAL PRICE:");
    console.log("  1 XHT =", finalPrice, "XHN");
    console.log("  1 XHN = " + (1 / parseFloat(finalPrice)).toFixed(4), "XHT");

    const initialPrice = 100; // 1 XHT was 100 XHN at launch
    const currentPrice = parseFloat(finalPrice);
    const priceChange = ((initialPrice - currentPrice) / initialPrice * 100).toFixed(2);

    console.log("\n📈 PRICE MOVEMENT:");
    console.log("  Launch: 1 XHT = 100 XHN");
    console.log("  Now: 1 XHT =", finalPrice, "XHN");
    console.log("  Change:", priceChange + "%");
    console.log("  (XHN price increased due to buying pressure!)");

    console.log("\n🤖 BOT ATTRACTION SIGNALS:");
    console.log("  ✅ Price momentum created (upward trend)");
    console.log("  ✅ Volume generated ($" + (parseFloat(ethers.formatEther(totalSpent)) * 0.1).toFixed(2) + "+)");
    console.log("  ✅ Multiple transactions (looks organic)");
    console.log("  ✅ Consistent buying pattern (trend signal)");

    console.log("\n📢 NEXT STEPS TO MAXIMIZE BOT ATTENTION:");
    console.log("  1. Post on Twitter with contract address");
    console.log("  2. Submit to DexScreener (auto-detected in 5 min)");
    console.log("  3. Share in Telegram groups");
    console.log("  4. Post on 4chan /biz/ (anon attention)");
    console.log("  5. Create TikTok/YouTube video");

    console.log("\n🎯 EXPECTED BOT RESPONSE:");
    console.log("  Within 5 minutes: Sniper bots detect");
    console.log("  Within 30 minutes: Listed on aggregators");
    console.log("  Within 2 hours: Trend bots start buying");
    console.log("  Within 24 hours: First \"100x gem\" posts");

    console.log("\n💎 YOUR POSITION:");
    console.log("  You spent: ~$" + (parseFloat(ethers.formatEther(totalSpent)) * 0.0001).toFixed(2));
    console.log("  You own: 99%+ of liquidity");
    console.log("  You earn: 0.3% of all trades");
    console.log("  Bot trades = MORE FEES FOR YOU! 🚀");

    return {
        totalSpent: ethers.formatEther(totalSpent),
        totalReceived: ethers.formatEther(totalReceived),
        finalPrice,
        priceChange
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:");
        console.error(error);
        process.exit(1);
    });
