import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";

dotenv.config();

/**
 * Create XHT/XHN pair and add initial liquidity
 */

async function main() {
    console.log("💎 Creating XHT/XHN Liquidity Pool");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "XHT");

    // Contract addresses
    const WXHT_ADDRESS = "0x4942014731522796c6E102628e41ABF5c7e5327d";
    const XHN_ADDRESS = "0x24719ba3b4AD49cC7edcbDc536fd97C8526830A0";
    const FACTORY_ADDRESS = "0x0180A21609cBca7ccf128784F802fa9a2693aaf9";
    const ROUTER_ADDRESS = "0x704cf9Fd1977365426Bd15A1aD348B17B401877B";

    // Get contracts
    const factory = await ethers.getContractAt("XaheenDEXFactory", FACTORY_ADDRESS);
    const router = await ethers.getContractAt("XaheenDEXRouter", ROUTER_ADDRESS);
    const xhn = await ethers.getContractAt("XHN", XHN_ADDRESS);

    console.log("\n" + "=".repeat(70));
    console.log("STEP 1: Create XHT/XHN Trading Pair");
    console.log("=".repeat(70));

    // Check if pair already exists
    let pairAddress = await factory.getPair(WXHT_ADDRESS, XHN_ADDRESS);

    if (pairAddress === ethers.ZeroAddress) {
        console.log("\n[1/1] Creating XHT/XHN pair...");
        const createTx = await factory.createPair(WXHT_ADDRESS, XHN_ADDRESS);
        await createTx.wait();

        pairAddress = await factory.getPair(WXHT_ADDRESS, XHN_ADDRESS);
        console.log("✅ XHT/XHN pair created at:", pairAddress);
    } else {
        console.log("✅ XHT/XHN pair already exists at:", pairAddress);
    }

    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Add Initial Liquidity");
    console.log("=".repeat(70));

    // Liquidity amounts
    const xhtAmount = ethers.parseEther("1000"); // 1000 XHT
    const xhnAmount = ethers.parseEther("100000"); // 100K XHN

    console.log("\n📊 Liquidity Amounts:");
    console.log("  XHT:", ethers.formatEther(xhtAmount));
    console.log("  XHN:", ethers.formatEther(xhnAmount));
    console.log("\n  Initial Price: 1 XHT = 100 XHN");
    console.log("  Or: 1 XHN = 0.01 XHT");

    // Check balances
    const xhnBalance = await xhn.balanceOf(deployer.address);
    const xhtBalance = await ethers.provider.getBalance(deployer.address);

    console.log("\n💼 Current Balances:");
    console.log("  XHT:", ethers.formatEther(xhtBalance));
    console.log("  XHN:", ethers.formatEther(xhnBalance));

    if (xhtBalance < xhtAmount) {
        throw new Error("❌ Insufficient XHT balance");
    }

    if (xhnBalance < xhnAmount) {
        throw new Error("❌ Insufficient XHN balance");
    }

    // Approve XHN
    console.log("\n[1/2] Approving XHN...");
    const approveTx = await xhn.approve(ROUTER_ADDRESS, xhnAmount);
    await approveTx.wait();
    console.log("✅ XHN approved");

    // Add liquidity
    console.log("\n[2/2] Adding liquidity to XHT/XHN pair...");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const slippage = 5n; // 5% slippage tolerance

    const addLiquidityTx = await router.addLiquidityXHT(
        XHN_ADDRESS,
        xhnAmount,
        xhnAmount * (100n - slippage) / 100n, // Min XHN with slippage
        xhtAmount * (100n - slippage) / 100n,   // Min XHT with slippage
        deployer.address,
        deadline,
        { value: xhtAmount }
    );

    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added!");
    console.log("   TX:", receipt.hash);

    // Get LP token balance
    const pair = await ethers.getContractAt("XaheenDEXPair", pairAddress);
    const lpBalance = await pair.balanceOf(deployer.address);
    console.log("\n💎 LP Tokens received:", ethers.formatEther(lpBalance));

    // Get pair reserves
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    console.log("\n📊 Pair Reserves:");
    if (token0.toLowerCase() === WXHT_ADDRESS.toLowerCase()) {
        console.log("  XHT (WXHT):", ethers.formatEther(reserve0));
        console.log("  XHN:", ethers.formatEther(reserve1));
    } else {
        console.log("  XHN:", ethers.formatEther(reserve0));
        console.log("  XHT (WXHT):", ethers.formatEther(reserve1));
    }

    // Calculate pool share
    const totalSupply = await pair.totalSupply();
    const poolShare = (lpBalance * 10000n) / totalSupply;
    console.log("  Your Pool Share:", Number(poolShare) / 100, "%");

    console.log("\n" + "=".repeat(70));
    console.log("XHT/XHN LIQUIDITY POOL LIVE! 🎉");
    console.log("=".repeat(70));

    console.log("\n🎯 TRADING IS NOW ENABLED:");
    console.log("  Users can swap XHT ↔ XHN");
    console.log("  Initial price: 1 XHT = 100 XHN");
    console.log("  You earn 0.3% on every trade");

    console.log("\n💰 EXPECTED RETURNS:");
    console.log("  Daily volume: $10K → $30 fees (0.3%)");
    console.log("  Your share: ~$29.70 (99%+ of pool)");
    console.log("  Monthly: ~$891");
    console.log("  Yearly: ~$10,692 (1,069% APY on $1K liquidity!)");

    console.log("\n🚀 NEXT STEPS:");
    console.log("  1. ✅ XHT/XHN pool created and liquid");
    console.log("  2. Enable XHN staking interface");
    console.log("  3. Integrate revenue distribution");
    console.log("  4. Launch XHN airdrop (10M tokens)");
    console.log("  5. Deploy to Tron (BTCBR-TRC20)");
    console.log("  6. Deploy to Ethereum (wBTCBR)");

    return {
        pairAddress,
        xhtAmount: ethers.formatEther(xhtAmount),
        xhnAmount: ethers.formatEther(xhnAmount),
        lpTokens: ethers.formatEther(lpBalance),
        poolShare: Number(poolShare) / 100,
        txHash: receipt.hash
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:");
        console.error(error);
        process.exit(1);
    });
