import hre from "hardhat";
const { ethers } = hre;

/**
 * UNWRAP WBNB and ADD XHN LIQUIDITY
 * Unwrap WBNB back to BNB, then use addLiquidityETH
 */

async function main() {
    console.log("\n💧 UNWRAP WBNB & ADD XHN LIQUIDITY");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);

    const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

    // Get contracts
    const wbnbABI = [
        "function balanceOf(address) view returns (uint256)",
        "function withdraw(uint256 amount)"
    ];

    const xhnABI = [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const routerABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];

    const wbnb = new ethers.Contract(OFFICIAL_WBNB, wbnbABI, deployer);
    const xhn = new ethers.Contract(XHN_BSC, xhnABI, deployer);
    const router = new ethers.Contract(PANCAKE_ROUTER, routerABI, deployer);

    // Check balances
    let bnbBalance = await ethers.provider.getBalance(deployer.address);
    const wbnbBalance = await wbnb.balanceOf(deployer.address);
    const xhnBalance = await xhn.balanceOf(deployer.address);

    console.log("\n💰 CURRENT BALANCES:");
    console.log("  BNB:", ethers.formatEther(bnbBalance), "BNB");
    console.log("  WBNB:", ethers.formatEther(wbnbBalance), "WBNB");
    console.log("  XHN:", ethers.formatEther(xhnBalance), "XHN");

    if (wbnbBalance === 0n) {
        console.log("\n⚠️  No WBNB to unwrap!");
        return;
    }

    // Step 1: Unwrap WBNB to BNB
    console.log("\n[1/3] Unwrapping WBNB to BNB...");
    const unwrapTx = await wbnb.withdraw(wbnbBalance);
    await unwrapTx.wait();
    console.log("  ✅ Unwrapped:", ethers.formatEther(wbnbBalance), "WBNB → BNB");

    // Check new BNB balance
    bnbBalance = await ethers.provider.getBalance(deployer.address);
    console.log("  💰 New BNB balance:", ethers.formatEther(bnbBalance), "BNB");

    // Step 2: Approve XHN
    const xhnAmount = ethers.parseEther("7500");
    console.log("\n[2/3] Approving XHN for PancakeSwap...");
    const approveXhnTx = await xhn.approve(PANCAKE_ROUTER, xhnAmount);
    await approveXhnTx.wait();
    console.log("  ✅ XHN approved");

    // Step 3: Add liquidity using addLiquidityETH
    // Leave 0.002 BNB for gas
    const bnbForLiquidity = bnbBalance - ethers.parseEther("0.002");

    console.log("\n[3/3] Adding liquidity to PancakeSwap with addLiquidityETH...");
    console.log("  BNB:", ethers.formatEther(bnbForLiquidity), "BNB");
    console.log("  XHN:", ethers.formatEther(xhnAmount), "XHN");
    console.log("  Value: ~$" + (parseFloat(ethers.formatEther(bnbForLiquidity)) * 720).toFixed(2) + " USD");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    try {
        const addLiqTx = await router.addLiquidityETH(
            XHN_BSC,
            xhnAmount,
            0, // Accept any amount of XHN
            0, // Accept any amount of BNB
            deployer.address,
            deadline,
            {
                value: bnbForLiquidity,
                gasLimit: 500000
            }
        );

        console.log("  📤 Transaction sent:", addLiqTx.hash);
        console.log("  ⏳ Waiting for confirmation...");

        const receipt = await addLiqTx.wait();
        console.log("  ✅ Liquidity added!");
        console.log("  🎉 Transaction confirmed!");

    } catch (error) {
        console.log("\n❌ Error adding liquidity:", error.message);

        // Check if it's because pair doesn't exist
        if (error.message.includes("INSUFFICIENT_INPUT_AMOUNT") || error.message.includes("reverted")) {
            console.log("\n💡 This might be because the XHN/WBNB pair doesn't exist yet.");
            console.log("   PancakeSwap requires creating the pair first.");
            console.log("\n   Alternative: Use PancakeSwap UI to create the initial liquidity pool:");
            console.log("   1. Go to https://pancakeswap.finance/add/BNB/" + XHN_BSC);
            console.log("   2. Connect your wallet");
            console.log("   3. Add liquidity manually");
        }

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
    console.log("    Liquidity: ~$" + (parseFloat(ethers.formatEther(bnbForLiquidity)) * 720).toFixed(2) + " USD");

    console.log("\n✅ LIQUIDITY PHASE COMPLETE!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ FINAL ERROR:", error);
        process.exit(1);
    });
