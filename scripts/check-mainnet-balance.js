import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceBNB = parseFloat(ethers.formatEther(balance));
    const bnbPrice = 720;

    console.log("\n🔍 BSC MAINNET BALANCE CHECK");
    console.log("=".repeat(50));
    console.log("Address:", deployer.address);
    console.log("Balance:", balanceBNB.toFixed(4), "BNB");
    console.log("USD Value: $" + (balanceBNB * bnbPrice).toFixed(2));

    if (balanceBNB >= 0.6) {
        console.log("\n✅ EXCELLENT! You have enough for full deployment!");
        console.log("\n📋 You can deploy:");
        console.log("- Full ecosystem with $500 liquidity");
        console.log("- Bot-friendly launch with volume");
        console.log("- MetaMask will show USD within 30 min!");
    } else if (balanceBNB >= 0.3) {
        console.log("\n✅ Good! You have enough for basic deployment");
        console.log("\n📋 You can deploy:");
        console.log("- Core contracts + minimal liquidity ($150-200)");
        console.log("- MetaMask will show USD!");
    } else if (balanceBNB >= 0.1) {
        console.log("\n⚠️  Tight budget - contracts only");
        console.log("\n📋 You can deploy:");
        console.log("- Core contracts without liquidity");
        console.log("- Can add liquidity later manually");
    } else {
        console.log("\n❌ Need more BNB for mainnet deployment");
        console.log("Required: At least 0.1 BNB (~$70)");
    }

    console.log("\n💡 Ready to deploy with:");
    console.log("npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bsc");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
