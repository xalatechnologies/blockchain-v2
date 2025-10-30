import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔧 FIXING XHN LIQUIDITY");
    console.log("=".repeat(70));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const XHN_PAIR = "0x8e7185FdB03a0BE81ED3FD3F803f79E38C070D34";
    const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const XHN = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    
    const pairABI = ["function balanceOf(address) view returns(uint256)", "function approve(address,uint256) returns(bool)"];
    const routerABI = ["function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)"];
    
    const pair = new ethers.Contract(XHN_PAIR, pairABI, deployer);
    const router = new ethers.Contract(ROUTER, routerABI, deployer);
    
    const lpBalance = await pair.balanceOf(deployer.address);
    console.log("\nYour LP tokens:", ethers.formatEther(lpBalance));
    
    if (lpBalance === 0n) {
        console.log("❌ No LP tokens to remove");
        return;
    }
    
    console.log("\n[1/2] Approving LP tokens...");
    await (await pair.approve(ROUTER, lpBalance)).wait();
    console.log("✅ Approved");
    
    console.log("\n[2/2] Removing liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    const tx = await router.removeLiquidityETH(
        XHN,
        lpBalance,
        0,
        0,
        deployer.address,
        deadline,
        { gasLimit: 500000 }
    );
    
    await tx.wait();
    console.log("✅ Liquidity removed!");
    
    console.log("\n💡 NOW:");
    console.log("  1. You got back your XHN + tiny bit of BNB");
    console.log("  2. Ready to add fresh balanced liquidity");
    console.log("  3. Recommend: $1k-$5k worth each side");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
