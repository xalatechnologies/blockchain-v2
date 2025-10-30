import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";

dotenv.config();

/**
 * Add Initial Liquidity to XHT/BTCBR Pair
 *
 * Budget: $10,000 total
 * Distribution:
 * - Native DEX (Xaheen): $5,000 (50%)
 * - Tron (SunSwap): $3,000 (30%) - Priority for volume
 * - Ethereum (Uniswap): $2,000 (20%) - For prestige
 */

async function main() {
    console.log("💰 Adding Initial Liquidity - $10K Budget");
    console.log("=" .repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "XHT");

    // Contract addresses (from latest deployment)
    const WXHT_ADDRESS = "0x4942014731522796c6E102628e41ABF5c7e5327d";
    const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
    const ROUTER_ADDRESS = "0x704cf9Fd1977365426Bd15A1aD348B17B401877B";
    const PAIR_ADDRESS = "0x07ff8522f5f3D4F989b064204D5f1Ef2da967AAD";

    // Get contracts
    const router = await ethers.getContractAt("XaheenDEXRouter", ROUTER_ADDRESS);
    const btcbr = await ethers.getContractAt("IERC20", BTCBR_ADDRESS);
    const wxht = await ethers.getContractAt("WXHT", WXHT_ADDRESS);

    // Budget allocation for Xaheen Chain: Initial test with small amounts
    console.log("\n" + "=".repeat(70));
    console.log("XAHEEN CHAIN NATIVE DEX - INITIAL TEST LIQUIDITY");
    console.log("=".repeat(70));

    // Start with small test amounts - Ratio: 1 XHT = 1000 BTCBR
    const xhtAmount = ethers.parseEther("100"); // 100 XHT
    const btcbrAmount = ethers.parseEther("100000"); // 100K BTCBR

    console.log("\n📊 Liquidity Amounts:");
    console.log("  XHT:", ethers.formatEther(xhtAmount), "XHT");
    console.log("  BTCBR:", ethers.formatEther(btcbrAmount), "BTCBR");

    // Check balances
    const btcbrBalance = await btcbr.balanceOf(deployer.address);
    const xhtBalance = await ethers.provider.getBalance(deployer.address);

    console.log("\n💼 Current Balances:");
    console.log("  XHT:", ethers.formatEther(xhtBalance));
    console.log("  BTCBR:", ethers.formatEther(btcbrBalance));

    if (xhtBalance < xhtAmount) {
        throw new Error("❌ Insufficient XHT balance");
    }

    if (btcbrBalance < btcbrAmount) {
        throw new Error("❌ Insufficient BTCBR balance");
    }

    // Approve BTCBR
    console.log("\n[1/3] Approving BTCBR...");
    const approveTx = await btcbr.approve(ROUTER_ADDRESS, btcbrAmount);
    await approveTx.wait();
    console.log("✅ BTCBR approved");

    // Add liquidity
    console.log("\n[2/3] Adding liquidity to XHT/BTCBR pair...");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const slippage = 5n; // 5% slippage tolerance

    const addLiquidityTx = await router.addLiquidityXHT(
        BTCBR_ADDRESS,
        btcbrAmount,
        btcbrAmount * (100n - slippage) / 100n, // Min BTCBR with slippage
        xhtAmount * (100n - slippage) / 100n,   // Min XHT with slippage
        deployer.address,
        deadline,
        { value: xhtAmount }
    );

    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added!");
    console.log("   TX:", receipt.hash);

    // Get LP token balance
    const pair = await ethers.getContractAt("XaheenDEXPair", PAIR_ADDRESS);
    const lpBalance = await pair.balanceOf(deployer.address);
    console.log("\n💎 LP Tokens received:", ethers.formatEther(lpBalance));

    // Get pair reserves
    const [reserve0, reserve1] = await pair.getReserves();
    console.log("\n📊 Pair Reserves:");
    console.log("  Reserve 0:", ethers.formatEther(reserve0));
    console.log("  Reserve 1:", ethers.formatEther(reserve1));

    // Calculate pool share
    const totalSupply = await pair.totalSupply();
    const poolShare = (lpBalance * 10000n) / totalSupply;
    console.log("  Your Pool Share:", Number(poolShare) / 100, "%");

    console.log("\n" + "=".repeat(70));
    console.log("LIQUIDITY DISTRIBUTION PLAN");
    console.log("=".repeat(70));

    console.log("\n💰 Total Budget: $10,000");
    console.log("\n📊 Allocation:");
    console.log("  ✅ Xaheen Native DEX: Initial test liquidity added");
    console.log("  ⏳ Additional Xaheen DEX: $5,000 (50%) - Add after testing");
    console.log("  ⏳ Tron/SunSwap: $3,000 (30%) - Deploy BTCBR-TRC20 first");
    console.log("  ⏳ Ethereum/Uniswap: $2,000 (20%) - Deploy wBTCBR first");

    console.log("\n🎯 Distribution Strategy:");
    console.log("\n1. Friends & Early Supporters ($2,000):");
    console.log("   - 10-20 people @ $100-200 each");
    console.log("   - Provide LP tokens as bonus (lock for 30 days)");
    console.log("   - Early access to staking rewards");
    console.log("   - Exclusive community role");

    console.log("\n2. Network Partners ($3,000):");
    console.log("   - DeFi protocols: $1,000");
    console.log("   - Influencers/KOLs: $1,000");
    console.log("   - Market makers: $1,000");
    console.log("   - Provide liquidity incentives");
    console.log("   - Trading fee rebates");

    console.log("\n3. Strategic Investors ($5,000):");
    console.log("   - Seed investors: $2,000");
    console.log("   - Angel investors: $2,000");
    console.log("   - VC/Funds: $1,000");
    console.log("   - Vesting: 6-12 months");
    console.log("   - Governance rights");

    console.log("\n📈 Expected Returns:");
    console.log("  Conservative (30% APY):");
    console.log("    - Year 1: $3,000 profit");
    console.log("    - Total: $13,000");
    console.log("\n  Moderate (100% APY):");
    console.log("    - Year 1: $10,000 profit");
    console.log("    - Total: $20,000");
    console.log("\n  Optimistic (300% APY):");
    console.log("    - Year 1: $30,000 profit");
    console.log("    - Total: $40,000");

    console.log("\n🚀 NEXT STEPS:");
    console.log("  1. ✅ Native DEX liquidity added");
    console.log("  2. Deploy BTCBR-TRC20 to Tron (run: npm run deploy:tron)");
    console.log("  3. Add $3,000 liquidity on SunSwap (BTCBR/USDT-TRC20)");
    console.log("  4. Deploy wBTCBR to Ethereum (run: npm run deploy:ethereum)");
    console.log("  5. Add $2,000 liquidity on Uniswap V3 (wBTCBR/ETH)");
    console.log("  6. Begin friend & investor distribution");
    console.log("  7. Launch marketing campaign");
    console.log("  8. Enable staking rewards");

    return {
        xhtAmount: ethers.formatEther(xhtAmount),
        btcbrAmount: ethers.formatEther(btcbrAmount),
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
