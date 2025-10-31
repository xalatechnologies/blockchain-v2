import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
    console.log("\n💰 WITHDRAW OPERATIONAL LIQUIDITY");
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
    const PAIR_ADDRESS = liquidityInfo.pair;
    const WXHT_ADDRESS = liquidityInfo.tokens.XHT;

    console.log("\n📍 Contract Addresses:");
    console.log("  Router:", ROUTER_ADDRESS);
    console.log("  Pair:", PAIR_ADDRESS);

    // Connect to Xaheen Chain
    const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
    const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

    console.log("\n👤 Wallet:", wallet.address);

    // Get LP token balance
    const lpToken = new ethers.Contract(
        PAIR_ADDRESS,
        [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address,uint256) returns (bool)",
            "function totalSupply() view returns (uint256)"
        ],
        wallet
    );

    const lpBalance = await lpToken.balanceOf(wallet.address);
    const totalSupply = await lpToken.totalSupply();

    console.log("\n💰 Your LP Token Balance:");
    console.log("  Balance:", ethers.formatEther(lpBalance), "LP tokens");
    console.log("  Total Supply:", ethers.formatEther(totalSupply), "LP tokens");
    console.log("  Your Share:", ((Number(lpBalance) / Number(totalSupply)) * 100).toFixed(2) + "%");

    if (lpBalance === 0n) {
        console.log("\n⚠️  No operational LP tokens to withdraw!");
        console.log("  All your LP tokens are locked in the timelock contract.");
        console.log("  They will be available on October 30, 2026.");
        return;
    }

    // Get current reserves
    const pair = new ethers.Contract(
        PAIR_ADDRESS,
        [
            "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() view returns (address)"
        ],
        provider
    );

    const reserves = await pair.getReserves();
    const token0 = await pair.token0();

    let xhtReserve, usdtReserve;
    if (token0.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
        usdtReserve = reserves[0];
        xhtReserve = reserves[1];
    } else {
        xhtReserve = reserves[0];
        usdtReserve = reserves[1];
    }

    // Calculate what you'll receive
    const sharePercentage = Number(lpBalance) / Number(totalSupply);
    const xhtToReceive = (BigInt(xhtReserve) * BigInt(lpBalance)) / BigInt(totalSupply);
    const usdtToReceive = (BigInt(usdtReserve) * BigInt(lpBalance)) / BigInt(totalSupply);

    const currentPrice = Number(usdtReserve) / Number(xhtReserve);
    const valueUSD = (Number(ethers.formatEther(xhtToReceive)) * currentPrice) + Number(ethers.formatUnits(usdtToReceive, 18));

    console.log("\n💎 You Will Receive:");
    console.log("  XHT:", ethers.formatEther(xhtToReceive), "WXHT");
    console.log("  USDT:", ethers.formatUnits(usdtToReceive, 18), "USDT");
    console.log("  Estimated Value: $" + valueUSD.toFixed(2));

    console.log("\n⚠️  IMPORTANT:");
    console.log("  This will remove your operational liquidity from the pool.");
    console.log("  You will stop earning trading fees on this amount.");
    console.log("  The locked liquidity ($10k) remains locked until Oct 2026.");

    console.log("\n🤔 Do you want to proceed?");
    console.log("  Type 'yes' to continue, or press Ctrl+C to cancel.");
    console.log("\n  (This script requires manual confirmation)");
    console.log("  To proceed, uncomment the withdrawal code below.");

    // Uncomment the code below to actually execute the withdrawal
    /*
    console.log("\n📝 PROCEEDING WITH WITHDRAWAL...");

    // Load router
    const router = new ethers.Contract(
        ROUTER_ADDRESS,
        [
            "function removeLiquidityXHT(address token, uint liquidity, uint amountTokenMin, uint amountXHTMin, address to, uint deadline) returns (uint amountToken, uint amountXHT)"
        ],
        wallet
    );

    // Step 1: Approve LP tokens
    console.log("\n📝 STEP 1/2: Approving LP tokens...");
    const approveTx = await lpToken.approve(ROUTER_ADDRESS, lpBalance, {
        gasLimit: 100000
    });
    console.log("  Transaction:", approveTx.hash);
    await approveTx.wait();
    console.log("  ✅ LP tokens approved!");

    // Step 2: Remove liquidity
    console.log("\n📝 STEP 2/2: Removing liquidity...");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const slippage = 5; // 5% slippage

    const amountTokenMin = (usdtToReceive * BigInt(100 - slippage)) / 100n;
    const amountXHTMin = (xhtToReceive * BigInt(100 - slippage)) / 100n;

    const tx = await router.removeLiquidityXHT(
        USDT_ADDRESS,
        lpBalance,
        amountTokenMin,
        amountXHTMin,
        wallet.address,
        deadline,
        { gasLimit: 500000 }
    );

    console.log("  Transaction:", tx.hash);
    console.log("  ⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("  ✅ Liquidity withdrawn!");

    // Check new balances
    const xhtBalanceAfter = await provider.getBalance(wallet.address);
    const usdt = new ethers.Contract(
        USDT_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        provider
    );
    const usdtBalanceAfter = await usdt.balanceOf(wallet.address);

    console.log("\n💰 Updated Balances:");
    console.log("  XHT:", ethers.formatEther(xhtBalanceAfter), "XHT");
    console.log("  USDT:", ethers.formatUnits(usdtBalanceAfter, 18), "USDT");

    console.log("\n✅ WITHDRAWAL COMPLETE!");
    console.log("\n💡 What to do now:");
    console.log("  1. Keep XHT for price appreciation");
    console.log("  2. Swap USDT to XHT (or vice versa) on XaheenSwap");
    console.log("  3. Bridge USDT to BSC/Ethereum for cash out");
    console.log("  4. Re-add liquidity when ready to earn more fees");

    // Save withdrawal info
    const withdrawalInfo = {
        timestamp: new Date().toISOString(),
        network: "Xaheen Chain",
        pair: PAIR_ADDRESS,
        withdrawn: {
            lpTokens: ethers.formatEther(lpBalance) + " LP tokens",
            xhtReceived: ethers.formatEther(xhtToReceive) + " XHT",
            usdtReceived: ethers.formatUnits(usdtToReceive, 18) + " USDT",
            valueUSD: "$" + valueUSD.toFixed(2)
        },
        transaction: receipt.hash,
        verification: `https://explorer.xaheen.org/tx/${receipt.hash}`
    };

    fs.writeFileSync(
        "docs/deployment-logs/withdrawal-" + Date.now() + ".json",
        JSON.stringify(withdrawalInfo, null, 2)
    );

    console.log("\n💾 Withdrawal info saved to: docs/deployment-logs/");
    */

    console.log("\n" + "=".repeat(70));
    console.log("ℹ️  WITHDRAWAL PREVIEW COMPLETE");
    console.log("=".repeat(70));
    console.log("\nTo execute withdrawal, edit this script and uncomment the code.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    });
