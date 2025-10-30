import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("\n🔍 TESTNET BALANCE CHECK");
    console.log("=".repeat(50));
    console.log("Address:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "tBNB");

    if (parseFloat(ethers.formatEther(balance)) >= 0.1) {
        console.log("✅ Sufficient balance for deployment!");
        console.log("\n📋 Ready to deploy with:");
        console.log("npx hardhat run scripts/deploy-minimum-ecosystem-bsc.js --network bscTestnet");
    } else {
        console.log("⚠️  Need testnet BNB from faucet");
        console.log("\n📝 Get FREE testnet BNB:");
        console.log("1. Visit: https://testnet.binance.org/faucet-smart");
        console.log("2. Enter address: " + deployer.address);
        console.log("3. Complete captcha and click 'Give me BNB'");
        console.log("4. Receive 0.5 tBNB instantly!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
