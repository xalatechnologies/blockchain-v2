import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n🔥 EXECUTING WEEKLY BUYBACK");
    console.log("=".repeat(70));

    // Load deployment info
    const buybackDeployment = JSON.parse(
        fs.readFileSync("docs/deployment-logs/weekly-buyback-deployment.json", "utf8")
    );

    const BUYBACK_ADDRESS = buybackDeployment.contract.address;

    console.log("\n📍 Buyback Contract:", BUYBACK_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("👤 Executor:", wallet.address);

    // Buyback contract
    const buyback = new ethers.Contract(
        BUYBACK_ADDRESS,
        [
            "function executeBuyback(uint256) external",
            "function isBuybackDue() view returns (bool)",
            "function timeUntilNextBuyback() view returns (uint256)",
            "function getAvailableUSDT() view returns (uint256)",
            "function getStatistics() view returns (uint256, uint256, uint256, uint256, uint256)"
        ],
        wallet
    );

    // Check if buyback is due
    const isBuybackDue = await buyback.isBuybackDue();
    console.log("\n⏰ Buyback Due:", isBuybackDue ? "YES ✅" : "NO ❌");

    if (!isBuybackDue) {
        const timeUntil = await buyback.timeUntilNextBuyback();
        const daysUntil = Math.ceil(Number(timeUntil) / 86400);
        const hoursUntil = Math.ceil(Number(timeUntil) / 3600);

        console.log("  Time Until Next Buyback:", daysUntil, "days (" + hoursUntil + " hours)");
        console.log("\n⚠️  Cannot execute buyback yet.");
        console.log("  Please wait", daysUntil, "more days.");
        console.log("\n  OR you can wait and run this script again after the time passes.");
        return;
    }

    // Check available USDT
    const availableUSDT = await buyback.getAvailableUSDT();
    console.log("\n💰 Available USDT:", ethers.formatUnits(availableUSDT, 18), "USDT");

    if (availableUSDT < ethers.parseUnits("500", 18)) {
        throw new Error("❌ Insufficient USDT in contract. Minimum: 500 USDT");
    }

    // Use available USDT (capped at 2000)
    const maxBuyback = ethers.parseUnits("2000", 18);
    const buybackAmount = availableUSDT > maxBuyback ? maxBuyback : availableUSDT;

    console.log("  Buyback Amount:", ethers.formatUnits(buybackAmount, 18), "USDT");

    // Get statistics before
    const statsBefore = await buyback.getStatistics();
    console.log("\n📊 BEFORE BUYBACK:");
    console.log("  Total Buybacks:", statsBefore[0].toString());
    console.log("  Total USDT Spent:", ethers.formatUnits(statsBefore[1], 18), "USDT");
    console.log("  Total XHT Burned:", ethers.formatEther(statsBefore[2]), "XHT");

    console.log("\n🔥 EXECUTING BUYBACK...");
    console.log("  This will:");
    console.log("  1. Buy XHT from DEX with " + ethers.formatUnits(buybackAmount, 18) + " USDT");
    console.log("  2. Burn 50% of purchased XHT");
    console.log("  3. Send 30% to Treasury");
    console.log("  4. Send 20% to LP Manager");

    const tx = await buyback.executeBuyback(buybackAmount, {
        gasLimit: 1000000
    });

    console.log("\n  Transaction:", tx.hash);
    console.log("  ⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("  ✅ Buyback executed!");

    // Get statistics after
    const statsAfter = await buyback.getStatistics();
    console.log("\n📊 AFTER BUYBACK:");
    console.log("  Total Buybacks:", statsAfter[0].toString());
    console.log("  Total USDT Spent:", ethers.formatUnits(statsAfter[1], 18), "USDT");
    console.log("  Total XHT Burned:", ethers.formatEther(statsAfter[2]), "XHT");

    const usdtSpent = Number(statsAfter[1]) - Number(statsBefore[1]);
    const xhtBurned = Number(statsAfter[2]) - Number(statsBefore[2]);

    console.log("\n💥 THIS BUYBACK:");
    console.log("  USDT Spent:", ethers.formatUnits(usdtSpent, 18), "USDT");
    console.log("  XHT Burned:", ethers.formatEther(xhtBurned), "XHT");

    // Calculate supply impact
    const circulatingSupply = 210000000000; // 210 Billion
    const supplyReduction = (Number(ethers.formatEther(xhtBurned)) / circulatingSupply) * 100;

    console.log("  Supply Reduction:", supplyReduction.toFixed(4) + "%");

    console.log("\n✅ BUYBACK COMPLETE!");

    // Save execution info
    const executionInfo = {
        timestamp: new Date().toISOString(),
        network: "Xaheen Chain",
        buybackContract: BUYBACK_ADDRESS,
        buybackNumber: Number(statsAfter[0]),
        execution: {
            usdtSpent: ethers.formatUnits(usdtSpent, 18) + " USDT",
            xhtBurned: ethers.formatEther(xhtBurned) + " XHT",
            supplyReductionPercent: supplyReduction.toFixed(4) + "%"
        },
        cumulative: {
            totalBuybacks: Number(statsAfter[0]),
            totalUSDTSpent: ethers.formatUnits(statsAfter[1], 18) + " USDT",
            totalXHTBurned: ethers.formatEther(statsAfter[2]) + " XHT"
        },
        transaction: receipt.hash,
        verification: `https://explorer.xaheen.org/tx/${receipt.hash}`
    };

    const filename = `buyback-execution-${Number(statsAfter[0])}.json`;
    fs.writeFileSync(
        `docs/deployment-logs/${filename}`,
        JSON.stringify(executionInfo, null, 2)
    );

    console.log("\n💾 Execution info saved to: docs/deployment-logs/" + filename);

    console.log("\n🔗 VERIFICATION:");
    console.log("  Transaction:", `https://explorer.xaheen.org/tx/${receipt.hash}`);
    console.log("  Contract:", `https://explorer.xaheen.org/address/${BUYBACK_ADDRESS}`);

    console.log("\n📢 SOCIAL MEDIA ANNOUNCEMENT:");
    console.log("───────────────────────────────────────────────────────────────────");
    console.log("🔥 #BuyXaheenFriday BUYBACK EXECUTED! 🔥");
    console.log("");
    console.log("📊 This Week's Stats:");
    console.log("• Bought: " + Math.round(Number(ethers.formatEther(xhtBurned)) * 2).toLocaleString() + " XHT");
    console.log("• Spent: $" + ethers.formatUnits(usdtSpent, 18) + " USDT");
    console.log("• Burned: " + Math.round(Number(ethers.formatEther(xhtBurned))).toLocaleString() + " XHT (50%)");
    console.log("• Added to Treasury: " + Math.round(Number(ethers.formatEther(xhtBurned)) * 0.6).toLocaleString() + " XHT (30%)");
    console.log("• Added to LP: " + Math.round(Number(ethers.formatEther(xhtBurned)) * 0.4).toLocaleString() + " XHT (20%)");
    console.log("");
    console.log("🔗 Verify: explorer.xaheen.org/tx/" + receipt.hash.substring(0, 10) + "...");
    console.log("");
    console.log("📈 Total Supply Reduced by " + supplyReduction.toFixed(4) + "%");
    console.log("🔒 Proof of Commitment to Community");
    console.log("");
    console.log("#BuyXaheenFriday #XaheenChain #Buyback");
    console.log("───────────────────────────────────────────────────────────────────");

    console.log("\n💡 NEXT STEPS:");
    console.log("  1. Copy announcement above and post on:");
    console.log("     - Twitter/X");
    console.log("     - Telegram");
    console.log("     - Discord");
    console.log("  2. Fund contract for next week:");
    console.log("     node scripts/fund-buyback-contract.js");
    console.log("  3. Next buyback in 7 days!");

    console.log("\n" + "=".repeat(70));
    console.log("🔥 BUYBACK #" + Number(statsAfter[0]) + " COMPLETE! 🔥");
    console.log("=".repeat(70));

    return executionInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
