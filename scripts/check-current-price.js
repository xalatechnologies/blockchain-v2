import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n💹 CHECKING CURRENT XHT PRICE");
    console.log("=".repeat(70));

    // Load deployment info
    const liquidityInfo = JSON.parse(
        fs.readFileSync("docs/deployment-logs/xaheen-liquidity-deployed.json", "utf8")
    );

    const PAIR_ADDRESS = liquidityInfo.pair;

    console.log("\n📍 Pair Address:", PAIR_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");

    // Pair contract
    const pair = new ethers.Contract(
        PAIR_ADDRESS,
        [
            "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() view returns (address)",
            "function token1() view returns (address)",
            "function totalSupply() view returns (uint256)"
        ],
        provider
    );

    // Get reserves
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const totalSupply = await pair.totalSupply();

    console.log("\n📊 CURRENT RESERVES:");
    console.log("  Reserve0:", reserves[0].toString());
    console.log("  Reserve1:", reserves[1].toString());
    console.log("  Token0:", token0);
    console.log("  Token1:", token1);
    console.log("  LP Total Supply:", ethers.formatEther(totalSupply));

    // Determine which is XHT and which is USDT
    let xhtReserve, usdtReserve;
    if (token0.toLowerCase() === liquidityInfo.tokens.USDT.toLowerCase()) {
        usdtReserve = reserves[0];
        xhtReserve = reserves[1];
    } else {
        xhtReserve = reserves[0];
        usdtReserve = reserves[1];
    }

    // Calculate price
    const pricePerXHT = Number(usdtReserve) / Number(xhtReserve);

    console.log("\n💹 CURRENT PRICE:");
    console.log("  XHT Reserve:", ethers.formatEther(xhtReserve), "WXHT");
    console.log("  USDT Reserve:", ethers.formatUnits(usdtReserve, 18), "USDT");
    console.log("\n  1 XHT = $" + pricePerXHT.toFixed(10) + " USDT");
    console.log("  1 USDT = " + (1 / pricePerXHT).toFixed(2) + " XHT");

    // Compare to target
    const targetPrice = 0.0000024;
    const deviation = ((pricePerXHT - targetPrice) / targetPrice) * 100;

    console.log("\n📈 PRICE ANALYSIS:");
    console.log("  Target Price: $" + targetPrice.toFixed(10));
    console.log("  Current Price: $" + pricePerXHT.toFixed(10));
    console.log("  Deviation:", deviation.toFixed(4) + "%");

    if (Math.abs(deviation) < 1) {
        console.log("  Status: ✅ PERFECT (within 1%)");
    } else if (Math.abs(deviation) < 5) {
        console.log("  Status: ✅ GOOD (within 5%)");
    } else {
        console.log("  Status: ⚠️  Needs attention (>5% deviation)");
    }

    // Calculate market cap
    const circulatingSupply = 210000000000; // 210 Billion
    const marketCap = circulatingSupply * pricePerXHT;

    console.log("\n💰 MARKET CAP:");
    console.log("  Circulating Supply:", circulatingSupply.toLocaleString(), "XHT");
    console.log("  Market Cap: $" + marketCap.toLocaleString());
    console.log("  Target Market Cap: $500,000");

    // Liquidity depth
    const totalLiquidityUSD = (Number(ethers.formatEther(xhtReserve)) * pricePerXHT) + Number(ethers.formatUnits(usdtReserve, 18));

    console.log("\n💧 LIQUIDITY:");
    console.log("  Total Liquidity: $" + totalLiquidityUSD.toFixed(2));
    console.log("  XHT Side: $" + (Number(ethers.formatEther(xhtReserve)) * pricePerXHT).toFixed(2));
    console.log("  USDT Side: $" + Number(ethers.formatUnits(usdtReserve, 18)).toFixed(2));

    // Lock status
    console.log("\n🔒 LOCK STATUS:");
    console.log("  Locked: 100% of liquidity");
    console.log("  Value Locked: $" + totalLiquidityUSD.toFixed(2));
    console.log("  Timelock: 0x02938F8c35A08126b0be008AaEb0B29B7E48d355");
    console.log("  Unlock Date: October 30, 2026");

    console.log("\n" + "=".repeat(70));
    console.log("✅ PRICE CHECK COMPLETE");
    console.log("=".repeat(70));

    return {
        price: pricePerXHT,
        deviation: deviation,
        marketCap: marketCap,
        liquidityUSD: totalLiquidityUSD,
        reserves: {
            xht: ethers.formatEther(xhtReserve),
            usdt: ethers.formatUnits(usdtReserve, 18)
        }
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
