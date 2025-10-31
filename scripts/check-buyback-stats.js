import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n📊 BUYBACK STATISTICS");
    console.log("=".repeat(70));

    // Load deployment info
    const buybackDeployment = JSON.parse(
        fs.readFileSync("docs/deployment-logs/weekly-buyback-deployment.json", "utf8")
    );

    const BUYBACK_ADDRESS = buybackDeployment.contract.address;

    console.log("\n📍 Buyback Contract:", BUYBACK_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");

    // Buyback contract
    const buyback = new ethers.Contract(
        BUYBACK_ADDRESS,
        [
            "function isBuybackDue() view returns (bool)",
            "function timeUntilNextBuyback() view returns (uint256)",
            "function getAvailableUSDT() view returns (uint256)",
            "function getStatistics() view returns (uint256, uint256, uint256, uint256, uint256)",
            "function burnPercentage() view returns (uint256)",
            "function treasuryPercentage() view returns (uint256)",
            "function lpPercentage() view returns (uint256)"
        ],
        provider
    );

    // Get statistics
    const stats = await buyback.getStatistics();
    const isBuybackDue = await buyback.isBuybackDue();
    const timeUntil = await buyback.timeUntilNextBuyback();
    const availableUSDT = await buyback.getAvailableUSDT();

    console.log("\n💰 CUMULATIVE STATISTICS:");
    console.log("  Total Buybacks:", stats[0].toString());
    console.log("  Total USDT Spent:", ethers.formatUnits(stats[1], 18), "USDT");
    console.log("  Total XHT Burned:", ethers.formatEther(stats[2]), "XHT");

    // Calculate supply impact
    const circulatingSupply = 210000000000; // 210 Billion
    const totalBurnedNum = Number(ethers.formatEther(stats[2]));
    const supplyReduction = (totalBurnedNum / circulatingSupply) * 100;

    console.log("\n📉 SUPPLY IMPACT:");
    console.log("  Original Circulating:", circulatingSupply.toLocaleString(), "XHT");
    console.log("  Burned:", totalBurnedNum.toLocaleString(), "XHT");
    console.log("  Reduction:", supplyReduction.toFixed(4) + "%");
    console.log("  Current Circulating:", (circulatingSupply - totalBurnedNum).toLocaleString(), "XHT");

    // Get split settings
    const burnPercent = await buyback.burnPercentage();
    const treasuryPercent = await buyback.treasuryPercentage();
    const lpPercent = await buyback.lpPercentage();

    console.log("\n⚙️  SPLIT CONFIGURATION:");
    console.log("  Burn:", (Number(burnPercent) / 100) + "%");
    console.log("  Treasury:", (Number(treasuryPercent) / 100) + "%");
    console.log("  LP:", (Number(lpPercent) / 100) + "%");

    console.log("\n⏰ NEXT BUYBACK:");
    console.log("  Buyback Due:", isBuybackDue ? "YES ✅" : "NO");

    if (!isBuybackDue) {
        const daysUntil = Math.floor(Number(timeUntil) / 86400);
        const hoursUntil = Math.floor((Number(timeUntil) % 86400) / 3600);
        const minutesUntil = Math.floor((Number(timeUntil) % 3600) / 60);

        console.log("  Time Until Next:", daysUntil + "d " + hoursUntil + "h " + minutesUntil + "m");

        const nextBuybackTime = new Date(Number(stats[4]) * 1000);
        console.log("  Next Buyback Time:", nextBuybackTime.toLocaleString());
    } else {
        console.log("  Status: READY TO EXECUTE!");
        console.log("  Run: node scripts/execute-buyback.js");
    }

    console.log("\n💵 CONTRACT BALANCE:");
    console.log("  Available USDT:", ethers.formatUnits(availableUSDT, 18), "USDT");

    if (availableUSDT < ethers.parseUnits("500", 18)) {
        console.log("  Status: ⚠️  LOW - Need to fund contract");
        console.log("  Run: node scripts/fund-buyback-contract.js");
    } else if (availableUSDT < ethers.parseUnits("2000", 18)) {
        console.log("  Status: ⚠️  Below optimal");
    } else {
        console.log("  Status: ✅ Sufficient");
    }

    // Calculate projections
    console.log("\n📈 PROJECTIONS:");

    const weeklyBuybackUSDT = 2000;
    const currentPrice = 0.0000024;
    const weeklyXHTBought = weeklyBuybackUSDT / currentPrice;
    const weeklyXHTBurned = weeklyXHTBought * 0.5;

    console.log("  Weekly Buyback: $" + weeklyBuybackUSDT);
    console.log("  XHT Bought/Week: ~" + Math.round(weeklyXHTBought).toLocaleString() + " XHT");
    console.log("  XHT Burned/Week: ~" + Math.round(weeklyXHTBurned).toLocaleString() + " XHT");

    console.log("\n  Yearly Projections:");
    console.log("    Total USDT: $" + (weeklyBuybackUSDT * 52).toLocaleString());
    console.log("    Total Burned: ~" + Math.round(weeklyXHTBurned * 52).toLocaleString() + " XHT");
    console.log("    Supply Reduction: ~" + ((weeklyXHTBurned * 52 / circulatingSupply) * 100).toFixed(2) + "%/year");

    console.log("\n🔗 VERIFICATION:");
    console.log("  Contract:", `https://explorer.xaheen.org/address/${BUYBACK_ADDRESS}`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ STATISTICS CHECK COMPLETE");
    console.log("=".repeat(70));

    // Save stats snapshot
    const snapshot = {
        timestamp: new Date().toISOString(),
        contract: BUYBACK_ADDRESS,
        statistics: {
            totalBuybacks: Number(stats[0]),
            totalUSDTSpent: ethers.formatUnits(stats[1], 18) + " USDT",
            totalXHTBurned: ethers.formatEther(stats[2]) + " XHT",
            supplyReductionPercent: supplyReduction.toFixed(4) + "%"
        },
        status: {
            buybackDue: isBuybackDue,
            timeUntilNext: Number(timeUntil) + " seconds",
            availableUSDT: ethers.formatUnits(availableUSDT, 18) + " USDT"
        },
        projections: {
            weeklyBuybackUSDT: "$" + weeklyBuybackUSDT,
            yearlyTotalUSDT: "$" + (weeklyBuybackUSDT * 52).toLocaleString(),
            yearlyBurnedXHT: Math.round(weeklyXHTBurned * 52).toLocaleString() + " XHT",
            yearlySupplyReduction: ((weeklyXHTBurned * 52 / circulatingSupply) * 100).toFixed(2) + "%"
        }
    };

    fs.writeFileSync(
        "docs/deployment-logs/buyback-stats-snapshot.json",
        JSON.stringify(snapshot, null, 2)
    );

    console.log("\n💾 Stats snapshot saved to: docs/deployment-logs/buyback-stats-snapshot.json");

    return snapshot;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
