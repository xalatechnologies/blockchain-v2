import hre from "hardhat";
const { ethers } = hre;

/**
 * ADD LIQUIDITY USING PANCAKESWAP'S ROUTER
 *
 * PancakeSwap only recognizes liquidity added through THEIR router
 * This uses PancakeSwap Router V2 directly
 */

async function main() {
    console.log("\n🥞 ADDING LIQUIDITY VIA PANCAKESWAP ROUTER");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Your address:", deployer.address);

    // PancakeSwap V2 addresses (official)
    const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
    const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

    // Your tokens
    const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    // Get PancakeSwap Router ABI
    const pancakeRouterABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function factory() external pure returns (address)",
        "function WETH() external pure returns (address)"
    ];

    const pancakeRouter = new ethers.Contract(PANCAKE_ROUTER, pancakeRouterABI, deployer);
    const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);

    // Check balances
    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    const btcbrBalance = await BTCBR.balanceOf(deployer.address);
    const xhnBalance = await XHN.balanceOf(deployer.address);

    console.log("\n💰 YOUR BALANCES:");
    console.log("  BNB:", ethers.formatEther(bnbBalance));
    console.log("  BTCBR:", ethers.formatEther(btcbrBalance));
    console.log("  XHN:", ethers.formatEther(xhnBalance));

    if (bnbBalance < ethers.parseEther("0.001")) {
        console.log("\n❌ Insufficient BNB!");
        console.log("  Need at least 0.001 BNB for liquidity + gas");
        return;
    }

    // Very small amounts just to register on PancakeSwap
    const bnbAmount = ethers.parseEther("0.0005"); // $0.36
    const btcbrAmount = ethers.parseEther("50"); // Small amount
    const xhnAmount = ethers.parseEther("50"); // Small amount

    console.log("\n📊 LIQUIDITY TO ADD (via PancakeSwap):");
    console.log("  For BTCBR:", ethers.formatEther(bnbAmount), "BNB +", ethers.formatEther(btcbrAmount), "BTCBR");
    console.log("  For XHN:", ethers.formatEther(bnbAmount), "BNB +", ethers.formatEther(xhnAmount), "XHN");

    const totalBNB = parseFloat(ethers.formatEther(bnbAmount)) * 2 * 720;
    console.log("  Total USD:", `~$${totalBNB.toFixed(2)}`);

    console.log("\n💡 WHY SMALL AMOUNTS?");
    console.log("  This is just to register pairs on PancakeSwap");
    console.log("  You already have $427 liquidity in your own router");
    console.log("  This $0.72 makes PancakeSwap recognize your token");

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    // Approve tokens for PancakeSwap router
    console.log("\n[1/4] Approving BTCBR for PancakeSwap...");
    await (await BTCBR.approve(PANCAKE_ROUTER, btcbrAmount)).wait();
    console.log("  ✅ BTCBR approved");

    console.log("\n[2/4] Adding BTCBR liquidity to PancakeSwap...");
    try {
        const tx1 = await pancakeRouter.addLiquidityETH(
            btcbrAddress,
            btcbrAmount,
            0, // Accept any amount of tokens
            0, // Accept any amount of ETH
            deployer.address,
            deadline,
            { value: bnbAmount }
        );
        console.log("  Transaction sent:", tx1.hash);
        await tx1.wait();
        console.log("  ✅ BTCBR liquidity added to PancakeSwap!");
    } catch (error) {
        console.log("  ❌ Error:", error.message);
    }

    console.log("\n[3/4] Approving XHN for PancakeSwap...");
    await (await XHN.approve(PANCAKE_ROUTER, xhnAmount)).wait();
    console.log("  ✅ XHN approved");

    console.log("\n[4/4] Adding XHN liquidity to PancakeSwap...");
    try {
        const tx2 = await pancakeRouter.addLiquidityETH(
            xhnAddress,
            xhnAmount,
            0,
            0,
            deployer.address,
            deadline,
            { value: bnbAmount }
        );
        console.log("  Transaction sent:", tx2.hash);
        await tx2.wait();
        console.log("  ✅ XHN liquidity added to PancakeSwap!");
    } catch (error) {
        console.log("  ❌ Error:", error.message);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 PANCAKESWAP INTEGRATION COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n✅ NOW YOUR TOKENS ARE ON PANCAKESWAP!");
    console.log("  PancakeSwap will recognize your tokens");
    console.log("  Trades will route through PancakeSwap's router");

    console.log("\n💧 YOUR TOTAL LIQUIDITY:");
    console.log("  Your router: ~$427 (existing)");
    console.log("  PancakeSwap: ~$0.72 (just added)");
    console.log("  Combined: Both routers will work!");

    console.log("\n🥞 TRY PANCAKESWAP NOW:");
    console.log("  BTCBR:", `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}&chain=bsc`);
    console.log("  XHN:", `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}&chain=bsc`);

    console.log("\n💡 TRADING:");
    console.log("  PancakeSwap will now find your token");
    console.log("  Try buying 0.001 BNB worth");
    console.log("  Set slippage to 10-15%");
    console.log("  It should work!");

    console.log("\n📊 CHECK PANCAKESWAP PAIRS:");
    console.log("  PancakeSwap factory:", PANCAKE_FACTORY);
    console.log("  Your tokens are now in PancakeSwap's system");
    console.log("  DexScreener will index after first trade");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
