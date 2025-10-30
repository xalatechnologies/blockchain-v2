import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔍 INVESTIGATING XHN LIQUIDITY LOSS");
    console.log("=".repeat(70));
    
    const XHN_PAIR = "0x8e7185FdB03a0BE81ED3FD3F803f79E38C070D34";
    const DEPLOYER = process.env.MAINNET_PRIVATE_KEY ? 
        new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY).address : 
        "0xdD779a290C937144F80Eb75b75d814c834536B1b";
    
    const pairABI = [
        "function getReserves() view returns(uint112,uint112,uint32)",
        "function token0() view returns(address)",
        "function token1() view returns(address)",
        "function balanceOf(address) view returns(uint256)",
        "function totalSupply() view returns(uint256)"
    ];
    
    const pair = new ethers.Contract(XHN_PAIR, pairABI, ethers.provider);
    
    const [r0, r1] = await pair.getReserves();
    const t0 = await pair.token0();
    const t1 = await pair.token1();
    const lpBalance = await pair.balanceOf(DEPLOYER);
    const totalSupply = await pair.totalSupply();
    
    console.log("\n📊 CURRENT STATE:");
    console.log("  Token0:", t0);
    console.log("  Token1:", t1);
    console.log("  Reserve0:", ethers.formatEther(r0));
    console.log("  Reserve1:", ethers.formatEther(r1));
    console.log("\n💰 LP TOKENS:");
    console.log("  Your LP balance:", ethers.formatEther(lpBalance));
    console.log("  Total LP supply:", ethers.formatEther(totalSupply));
    
    console.log("\n🤔 WHAT HAPPENED:");
    console.log("  We added ~$47 worth of XHN liquidity");
    console.log("  But now only $0.02 worth of BNB remains");
    console.log("\n  LIKELY CAUSES:");
    console.log("  1. Trading bot sold XHN for BNB (depleted BNB side)");
    console.log("  2. Someone traded and drained the BNB");
    console.log("  3. Price impact with low liquidity");
    
    console.log("\n💡 SOLUTION:");
    console.log("  Need to add MORE balanced liquidity");
    console.log("  Recommended: $1k-$5k in BOTH tokens");
    
    // Check transaction history
    console.log("\n📜 Check recent transactions:");
    console.log("  https://bscscan.com/address/" + XHN_PAIR);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
