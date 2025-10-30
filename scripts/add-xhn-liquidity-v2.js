import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 Adding XHT/XHN Liquidity (V2 - New Deployment)");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "XHT");

    // LATEST contract addresses from fixed deployment (Xaheen Chain)
    const FACTORY_ADDRESS = "0x492DC3847fB2D36d64898274079C1DcD8cA5B99B";
    const ROUTER_ADDRESS = "0x25918D0630bC8a6683d9882a1e2e01B8d0eC45dd";
    const WXHT_ADDRESS = "0x2AfF9B4999f587090840f4fD8F85A7EE643947Ee";
    const XHN_ADDRESS = "0xD4567cD447068aaD470431746592f261Fae92bAa"; // ✅ Deployed to Xaheen Chain

    const factory = await ethers.getContractAt("XaheenDEXFactory", FACTORY_ADDRESS);
    const router = await ethers.getContractAt("XaheenDEXRouter", ROUTER_ADDRESS);
    const xhn = await ethers.getContractAt("XHN", XHN_ADDRESS);

    console.log("\n" + "=".repeat(70));
    console.log("STEP 1: Create XHT/XHN Pair");
    console.log("=".repeat(70));

    // Check if pair exists
    let pairAddress = await factory.getPair(WXHT_ADDRESS, XHN_ADDRESS);

    if (pairAddress === ethers.ZeroAddress) {
        console.log("\n📦 Creating XHT/XHN pair...");
        const createTx = await factory.createPair(WXHT_ADDRESS, XHN_ADDRESS);
        await createTx.wait();

        pairAddress = await factory.getPair(WXHT_ADDRESS, XHN_ADDRESS);
        console.log("✅ Pair created at:", pairAddress);
    } else {
        console.log("✅ Pair already exists at:", pairAddress);
    }

    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Add Liquidity");
    console.log("=".repeat(70));

    // Liquidity amounts
    const xhtAmount = ethers.parseEther("1000"); // 1000 XHT
    const xhnAmount = ethers.parseEther("100000"); // 100,000 XHN

    console.log("\n💧 Liquidity amounts:");
    console.log("  XHT:", ethers.formatEther(xhtAmount));
    console.log("  XHN:", ethers.formatEther(xhnAmount));
    console.log("  Initial price: 1 XHT = 100 XHN (or 1 XHN = 0.01 XHT)");

    // Approve XHN tokens
    console.log("\n📝 Approving XHN tokens...");
    const approveTx = await xhn.approve(ROUTER_ADDRESS, xhnAmount);
    await approveTx.wait();
    console.log("✅ XHN approved");

    // Add liquidity
    console.log("\n💧 Adding liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const slippage = 5n; // 5% slippage tolerance

    const addLiquidityTx = await router.addLiquidityXHT(
        XHN_ADDRESS,
        xhnAmount,
        xhnAmount * (100n - slippage) / 100n, // Min XHN
        xhtAmount * (100n - slippage) / 100n, // Min XHT
        deployer.address,
        deadline,
        { value: xhtAmount }
    );

    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added!");
    console.log("  TX:", receipt.hash);

    // Get LP token balance
    const pair = await ethers.getContractAt("XaheenDEXPair", pairAddress);
    const lpBalance = await pair.balanceOf(deployer.address);
    const totalSupply = await pair.totalSupply();

    console.log("\n📊 Pool Statistics:");
    console.log("  LP Tokens received:", ethers.formatEther(lpBalance));
    console.log("  Total LP supply:", ethers.formatEther(totalSupply));
    console.log("  Your pool share:", (Number(lpBalance) * 100 / Number(totalSupply)).toFixed(2) + "%");

    // Get reserves
    const reserves = await pair.getReserves();
    console.log("\n💰 Pool Reserves:");
    console.log("  Reserve 0:", ethers.formatEther(reserves[0]));
    console.log("  Reserve 1:", ethers.formatEther(reserves[1]));

    console.log("\n" + "=".repeat(70));
    console.log("✅ LIQUIDITY ADDED SUCCESSFULLY!");
    console.log("=".repeat(70));

    console.log("\n📝 Contract Addresses:");
    console.log("  XHT/XHN Pair:", pairAddress);
    console.log("  DEX Router:", ROUTER_ADDRESS);
    console.log("  XHN Token:", XHN_ADDRESS);

    console.log("\n🚀 Ready to launch! Run:");
    console.log("  node scripts/bot-friendly-launch.js");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:");
        console.error(error);
        process.exit(1);
    });
