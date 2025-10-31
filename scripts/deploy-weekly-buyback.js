import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n🔥 DEPLOYING WEEKLY BUYBACK SYSTEM");
    console.log("=".repeat(70));

    // Load deployment info
    const dexDeployment = JSON.parse(
        fs.readFileSync("docs/deployment-logs/xaheen-dex-deployment.json", "utf8")
    );
    const usdtDeployment = JSON.parse(
        fs.readFileSync("docs/deployment-logs/test-usdt-deployment.json", "utf8")
    );
    const liquidityInfo = JSON.parse(
        fs.readFileSync("docs/deployment-logs/xaheen-liquidity-deployed.json", "utf8")
    );

    const ROUTER_ADDRESS = dexDeployment.contracts.Router;
    const USDT_ADDRESS = usdtDeployment.contract.address;
    const WXHT_ADDRESS = liquidityInfo.tokens.XHT;

    // For this demo, we'll use WXHT as "XHT token"
    // In production, you'd have a separate XHT ERC20 token
    const XHT_TOKEN_ADDRESS = WXHT_ADDRESS;

    console.log("\n📍 Configuration:");
    console.log("  XHT Token:", XHT_TOKEN_ADDRESS);
    console.log("  USDT Token:", USDT_ADDRESS);
    console.log("  Router:", ROUTER_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("\n👤 Deployer:", wallet.address);

    // Treasury and LP manager addresses (using deployer for now)
    const TREASURY_ADDRESS = wallet.address;
    const LP_MANAGER_ADDRESS = wallet.address;

    console.log("  Treasury:", TREASURY_ADDRESS);
    console.log("  LP Manager:", LP_MANAGER_ADDRESS);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("\n💰 Balance:", ethers.formatEther(balance), "XHT");

    if (balance < ethers.parseEther("0.1")) {
        throw new Error("❌ Insufficient balance for deployment");
    }

    console.log("\n📝 DEPLOYING CONTRACT...");

    // Deploy WeeklyBuyback
    const WeeklyBuyback = await ethers.getContractFactory(
        "contracts/tokenomics/WeeklyBuyback.sol:WeeklyBuyback",
        wallet
    );

    console.log("  ⏳ Deploying WeeklyBuyback...");

    const buyback = await WeeklyBuyback.deploy(
        XHT_TOKEN_ADDRESS,
        USDT_ADDRESS,
        ROUTER_ADDRESS,
        TREASURY_ADDRESS,
        LP_MANAGER_ADDRESS,
        { gasLimit: 3000000 }
    );

    await buyback.waitForDeployment();
    const buybackAddress = await buyback.getAddress();

    console.log("  ✅ WeeklyBuyback deployed!");
    console.log("  Contract:", buybackAddress);

    // Verify deployment
    console.log("\n🔍 VERIFYING DEPLOYMENT...");

    const xhtToken = await buyback.xhtToken();
    const usdtToken = await buyback.usdtToken();
    const router = await buyback.router();
    const treasury = await buyback.treasury();
    const lpManager = await buyback.lpManager();

    console.log("  XHT Token:", xhtToken);
    console.log("  USDT Token:", usdtToken);
    console.log("  Router:", router);
    console.log("  Treasury:", treasury);
    console.log("  LP Manager:", lpManager);

    // Get settings
    const burnPercentage = await buyback.burnPercentage();
    const treasuryPercentage = await buyback.treasuryPercentage();
    const lpPercentage = await buyback.lpPercentage();

    console.log("\n⚙️  SPLIT SETTINGS:");
    console.log("  Burn:", (Number(burnPercentage) / 100).toFixed(0) + "%");
    console.log("  Treasury:", (Number(treasuryPercentage) / 100).toFixed(0) + "%");
    console.log("  LP:", (Number(lpPercentage) / 100).toFixed(0) + "%");

    // Get statistics
    const stats = await buyback.getStatistics();
    console.log("\n📊 INITIAL STATISTICS:");
    console.log("  Total Buybacks:", stats[0].toString());
    console.log("  Total USDT Spent:", ethers.formatUnits(stats[1], 18), "USDT");
    console.log("  Total XHT Burned:", ethers.formatEther(stats[2]), "XHT");

    // Check if buyback is due
    const isBuybackDue = await buyback.isBuybackDue();
    console.log("  Buyback Due:", isBuybackDue ? "YES" : "NO");

    console.log("\n✅ DEPLOYMENT SUCCESSFUL!");

    // Save deployment info
    const deploymentInfo = {
        network: "Xaheen Chain",
        timestamp: new Date().toISOString(),
        contract: {
            name: "WeeklyBuyback",
            address: buybackAddress,
            xhtToken: xhtToken,
            usdtToken: usdtToken,
            router: router,
            treasury: treasury,
            lpManager: lpManager
        },
        settings: {
            burnPercentage: (Number(burnPercentage) / 100) + "%",
            treasuryPercentage: (Number(treasuryPercentage) / 100) + "%",
            lpPercentage: (Number(lpPercentage) / 100) + "%",
            minBuybackAmount: "500 USDT",
            maxBuybackAmount: "5000 USDT",
            interval: "7 days (weekly)"
        },
        deployer: wallet.address,
        verificationUrl: `https://explorer.xaheen.org/address/${buybackAddress}`
    };

    fs.writeFileSync(
        "docs/deployment-logs/weekly-buyback-deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n💾 Deployment info saved to: docs/deployment-logs/weekly-buyback-deployment.json");

    console.log("\n🔗 VERIFICATION:");
    console.log("  Contract:", `https://explorer.xaheen.org/address/${buybackAddress}`);

    console.log("\n💡 NEXT STEPS:");
    console.log("  1. Fund the contract with USDT:");
    console.log("     node scripts/fund-buyback-contract.js");
    console.log("\n  2. Execute first buyback (after 7 days):");
    console.log("     node scripts/execute-buyback.js");
    console.log("\n  3. Monitor statistics:");
    console.log("     node scripts/check-buyback-stats.js");
    console.log("\n  4. Announce on social media:");
    console.log("     #BuyXaheenFriday is LIVE!");

    console.log("\n" + "=".repeat(70));
    console.log("🔥 WEEKLY BUYBACK SYSTEM DEPLOYED! 🔥");
    console.log("=".repeat(70));

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
