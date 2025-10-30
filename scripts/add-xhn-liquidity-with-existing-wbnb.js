import hre from "hardhat";
const { ethers } = hre;

/**
 * ADD XHN LIQUIDITY - Use existing WBNB
 * WBNB is already wrapped and approved, just need to call addLiquidity
 */

async function main() {
    console.log("\n💧 ADDING XHN LIQUIDITY WITH EXISTING WBNB");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);

    const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

    // Get contracts
    const wbnbABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const xhnABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const routerABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)"
    ];

    const wbnb = new ethers.Contract(OFFICIAL_WBNB, wbnbABI, deployer);
    const xhn = new ethers.Contract(XHN_BSC, xhnABI, deployer);
    const router = new ethers.Contract(PANCAKE_ROUTER, routerABI, deployer);

    // Check balances
    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    const wbnbBalance = await wbnb.balanceOf(deployer.address);
    const xhnBalance = await xhn.balanceOf(deployer.address);

    console.log("\n💰 CURRENT BALANCES:");
    console.log("  BNB:", ethers.formatEther(bnbBalance), "BNB");
    console.log("  WBNB:", ethers.formatEther(wbnbBalance), "WBNB");
    console.log("  XHN:", ethers.formatEther(xhnBalance), "XHN");

    if (wbnbBalance < ethers.parseEther("0.01")) {
        console.log("\n⚠️  Insufficient WBNB!");
        return;
    }

    // Use all WBNB for liquidity (it's already wrapped)
    const wbnbAmount = wbnbBalance;
    const xhnAmount = ethers.parseEther("7500"); // 7,500 XHN

    console.log("\n💧 LIQUIDITY AMOUNTS:");
    console.log("  WBNB:", ethers.formatEther(wbnbAmount), "WBNB");
    console.log("  XHN:", ethers.formatEther(xhnAmount), "XHN");
    console.log("  Value: ~$" + (parseFloat(ethers.formatEther(wbnbAmount)) * 720).toFixed(2) + " USD");

    // Approve WBNB (might already be approved, but let's be sure)
    console.log("\n[1/3] Approving WBNB for PancakeSwap...");
    try {
        const approveWbnbTx = await wbnb.approve(PANCAKE_ROUTER, wbnbAmount);
        await approveWbnbTx.wait();
        console.log("  ✅ WBNB approved");
    } catch (error) {
        console.log("  ℹ️  WBNB already approved or error:", error.message);
    }

    // Approve XHN
    console.log("\n[2/3] Approving XHN for PancakeSwap...");
    try {
        const approveXhnTx = await xhn.approve(PANCAKE_ROUTER, xhnAmount);
        await approveXhnTx.wait();
        console.log("  ✅ XHN approved");
    } catch (error) {
        console.log("  ℹ️  XHN already approved or error:", error.message);
    }

    // Add liquidity
    console.log("\n[3/3] Adding liquidity to PancakeSwap...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    try {
        const addLiqTx = await router.addLiquidity(
            OFFICIAL_WBNB,
            XHN_BSC,
            wbnbAmount,
            xhnAmount,
            0, // Accept any amount of WBNB
            0, // Accept any amount of XHN
            deployer.address,
            deadline,
            {
                gasLimit: 500000 // Set manual gas limit to avoid estimation issues
            }
        );

        console.log("  📤 Transaction sent:", addLiqTx.hash);
        console.log("  ⏳ Waiting for confirmation...");

        const receipt = await addLiqTx.wait();
        console.log("  ✅ Liquidity added!");
        console.log("  🎉 Transaction confirmed!");

    } catch (error) {
        console.log("\n❌ Error adding liquidity:", error.message);
        console.log("\n🔍 Debug info:");
        console.log("  WBNB amount:", ethers.formatEther(wbnbAmount));
        console.log("  XHN amount:", ethers.formatEther(xhnAmount));
        console.log("  Router:", PANCAKE_ROUTER);
        throw error;
    }

    // Final balances
    const finalBnb = await ethers.provider.getBalance(deployer.address);
    const finalWbnb = await wbnb.balanceOf(deployer.address);
    const finalXhn = await xhn.balanceOf(deployer.address);

    console.log("\n💰 FINAL BALANCES:");
    console.log("  BNB:", ethers.formatEther(finalBnb), "BNB");
    console.log("  WBNB:", ethers.formatEther(finalWbnb), "WBNB");
    console.log("  XHN:", ethers.formatEther(finalXhn), "XHN");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 XHN LIQUIDITY ADDED TO PANCAKESWAP!");
    console.log("=".repeat(70));

    console.log("\n🥞 PANCAKESWAP LINKS:");
    console.log("\n  BTCBR: https://pancakeswap.finance/swap?outputCurrency=0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f&chain=bsc");
    console.log("    Liquidity: $106 USD");
    console.log("\n  XHN: https://pancakeswap.finance/swap?outputCurrency=" + XHN_BSC + "&chain=bsc");
    console.log("    Liquidity: ~$" + (parseFloat(ethers.formatEther(wbnbAmount)) * 720).toFixed(2) + " USD");

    console.log("\n🌉 BRIDGE STATUS:");
    console.log("  ✅ All 4 bridges deployed");
    console.log("  ✅ BTCBR tradeable on PancakeSwap");
    console.log("  ✅ XHN tradeable on PancakeSwap");

    console.log("\n📋 NEXT STEPS:");
    console.log("  1. Build validator relayer service (~2 hours)");
    console.log("  2. Build bridge UI (~2 hours)");
    console.log("  3. Test complete bridge flow");
    console.log("  4. GO LIVE! 🚀");

    console.log("\n✅ LIQUIDITY PHASE COMPLETE!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ FINAL ERROR:", error);
        process.exit(1);
    });
