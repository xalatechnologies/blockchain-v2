import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n💧 REBALANCING XHN POOL WITH MORE LIQUIDITY");
    console.log("=".repeat(70));
    
    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);
    
    const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const XHN = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const XHN_PAIR = "0x8e7185FdB03a0BE81ED3FD3F803f79E38C070D34";
    
    // Check current balances
    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    
    const xhnABI = ["function balanceOf(address) view returns(uint256)", "function approve(address,uint256) returns(bool)"];
    const xhn = new ethers.Contract(XHN, xhnABI, deployer);
    const xhnBalance = await xhn.balanceOf(deployer.address);
    
    const pairABI = ["function getReserves() view returns(uint112,uint112,uint32)", "function token0() view returns(address)"];
    const pair = new ethers.Contract(XHN_PAIR, pairABI, deployer);
    const [r0, r1] = await pair.getReserves();
    const t0 = await pair.token0();
    
    console.log("\n💰 YOUR BALANCES:");
    console.log("  BNB:", ethers.formatEther(bnbBalance));
    console.log("  XHN:", ethers.formatEther(xhnBalance));
    
    console.log("\n📊 CURRENT POOL STATE:");
    console.log("  XHN in pool:", ethers.formatEther(t0 === XHN ? r0 : r1));
    console.log("  BNB in pool:", ethers.formatEther(t0 === XHN ? r1 : r0));
    
    // Use all available BNB (minus 0.01 for gas)
    const bnbToAdd = bnbBalance - ethers.parseEther("0.01");
    
    if (bnbToAdd <= 0n) {
        console.log("\n❌ Not enough BNB for liquidity");
        console.log("   Need at least 0.02 BNB (current:", ethers.formatEther(bnbBalance), ")");
        return;
    }
    
    // Calculate proportional XHN amount based on current pool ratio
    const currentXhn = t0 === XHN ? r0 : r1;
    const currentBnb = t0 === XHN ? r1 : r0;
    
    let xhnToAdd;
    if (currentBnb > 0n) {
        // Pool has some BNB, calculate proportional XHN
        xhnToAdd = (bnbToAdd * currentXhn) / currentBnb;
    } else {
        // Pool has no BNB, we can set any ratio
        // Let's use 1 BNB = 1,000,000 XHN (arbitrary ratio)
        xhnToAdd = bnbToAdd * 1000000n;
    }
    
    // Make sure we have enough XHN
    if (xhnToAdd > xhnBalance) {
        xhnToAdd = xhnBalance;
        console.log("\n⚠️  Using all available XHN");
    }
    
    console.log("\n💧 LIQUIDITY TO ADD:");
    console.log("  BNB:", ethers.formatEther(bnbToAdd), "($" + (parseFloat(ethers.formatEther(bnbToAdd)) * 720).toFixed(2) + ")");
    console.log("  XHN:", ethers.formatEther(xhnToAdd));
    
    const routerABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];
    const router = new ethers.Contract(ROUTER, routerABI, deployer);
    
    console.log("\n[1/2] Approving XHN...");
    await (await xhn.approve(ROUTER, xhnToAdd)).wait();
    console.log("  ✅ Approved");
    
    console.log("\n[2/2] Adding liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    try {
        const tx = await router.addLiquidityETH(
            XHN,
            xhnToAdd,
            0, // Accept any amount of XHN
            0, // Accept any amount of BNB
            deployer.address,
            deadline,
            {
                value: bnbToAdd,
                gasLimit: 500000
            }
        );
        
        console.log("  📤 Transaction sent:", tx.hash);
        await tx.wait();
        console.log("  ✅ Liquidity added!");
        
    } catch (error) {
        console.log("\n❌ Error:", error.message);
        throw error;
    }
    
    // Check final state
    const [finalR0, finalR1] = await pair.getReserves();
    const finalXhn = t0 === XHN ? finalR0 : finalR1;
    const finalBnb = t0 === XHN ? finalR1 : finalR0;
    
    console.log("\n📊 FINAL POOL STATE:");
    console.log("  XHN in pool:", ethers.formatEther(finalXhn));
    console.log("  BNB in pool:", ethers.formatEther(finalBnb), "($" + (parseFloat(ethers.formatEther(finalBnb)) * 720).toFixed(2) + ")");
    
    const totalLiquidityUSD = parseFloat(ethers.formatEther(finalBnb)) * 720 * 2;
    console.log("  Total liquidity: ~$" + totalLiquidityUSD.toFixed(2));
    
    console.log("\n" + "=".repeat(70));
    console.log("🎉 POOL REBALANCED!");
    console.log("=".repeat(70));
    
    console.log("\n✅ NEXT STEPS:");
    console.log("  1. Wait 30 min - 2 hours for DexScreener indexing");
    console.log("  2. Check: https://dexscreener.com/bsc/" + XHN_PAIR);
    console.log("  3. If liquidity > $1k, USD should appear in MetaMask");
    
    if (totalLiquidityUSD < 1000) {
        console.log("\n⚠️  WARNING: Total liquidity is $" + totalLiquidityUSD.toFixed(2));
        console.log("   Recommended minimum: $1,000 for price aggregators");
        console.log("   You may need to add more BNB");
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
