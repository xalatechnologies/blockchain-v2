import hre from "hardhat";
const { ethers } = hre;

/**
 * ADD XHN TO PANCAKESWAP
 * Using remaining BNB
 */

async function main() {
    console.log("\n🥞 ADDING XHN TO PANCAKESWAP");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();

    const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    const pancakeRouterABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];

    const pancakeRouter = new ethers.Contract(PANCAKE_ROUTER, pancakeRouterABI, deployer);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);

    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    const xhnBalance = await XHN.balanceOf(deployer.address);

    console.log("\n💰 BALANCES:");
    console.log("  BNB:", ethers.formatEther(bnbBalance));
    console.log("  XHN:", ethers.formatEther(xhnBalance));

    // Use all remaining BNB except gas
    const bnbAmount = bnbBalance - ethers.parseEther("0.005"); // Leave for gas
    const xhnAmount = ethers.parseEther("7500");

    console.log("\n📊 ADDING:");
    console.log("  ", ethers.formatEther(bnbAmount), "BNB +", ethers.formatEther(xhnAmount), "XHN");

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    console.log("\nApproving XHN...");
    await (await XHN.approve(PANCAKE_ROUTER, xhnAmount)).wait();

    console.log("Adding liquidity...");
    const tx = await pancakeRouter.addLiquidityETH(
        xhnAddress,
        xhnAmount,
        0,
        0,
        deployer.address,
        deadline,
        { value: bnbAmount }
    );
    console.log("Transaction:", tx.hash);
    await tx.wait();

    console.log("\n✅ XHN IS NOW ON PANCAKESWAP!");
    console.log("  https://pancakeswap.finance/swap?outputCurrency=" + xhnAddress + "&chain=bsc");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
