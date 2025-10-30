import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔍 CHECKING BSC PANCAKESWAP PAIRS");
    console.log("=".repeat(70));
    
    const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
    const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    
    const factoryABI = ["function getPair(address,address) view returns(address)"];
    const pairABI = [
        "function getReserves() view returns(uint112,uint112,uint32)",
        "function token0() view returns(address)",
        "function token1() view returns(address)"
    ];
    
    const factory = new ethers.Contract(PANCAKE_FACTORY, factoryABI, ethers.provider);
    
    console.log("\n📊 BTCBR/WBNB PAIR:");
    const btcbrPair = await factory.getPair(BTCBR_BSC, WBNB);
    console.log("  Address:", btcbrPair);
    
    if (btcbrPair !== ethers.ZeroAddress) {
        const pair1 = new ethers.Contract(btcbrPair, pairABI, ethers.provider);
        const [r0, r1] = await pair1.getReserves();
        const t0 = await pair1.token0();
        console.log("  Reserve0:", ethers.formatEther(r0), t0 === WBNB ? "WBNB" : "BTCBR");
        console.log("  Reserve1:", ethers.formatEther(r1), t0 === WBNB ? "BTCBR" : "WBNB");
        console.log("  📍 DexScreener:", `https://dexscreener.com/bsc/${btcbrPair}`);
        console.log("  📍 PancakeSwap:", `https://pancakeswap.finance/info/v2/pairs/${btcbrPair}`);
    } else {
        console.log("  ❌ No pair found");
    }
    
    console.log("\n📊 XHN/WBNB PAIR:");
    const xhnPair = await factory.getPair(XHN_BSC, WBNB);
    console.log("  Address:", xhnPair);
    
    if (xhnPair !== ethers.ZeroAddress) {
        const pair2 = new ethers.Contract(xhnPair, pairABI, ethers.provider);
        const [r0, r1] = await pair2.getReserves();
        const t0 = await pair2.token0();
        console.log("  Reserve0:", ethers.formatEther(r0), t0 === WBNB ? "WBNB" : "XHN");
        console.log("  Reserve1:", ethers.formatEther(r1), t0 === WBNB ? "XHN" : "WBNB");
        console.log("  📍 DexScreener:", `https://dexscreener.com/bsc/${xhnPair}`);
        console.log("  📍 PancakeSwap:", `https://pancakeswap.finance/info/v2/pairs/${xhnPair}`);
    } else {
        console.log("  ❌ No pair found");
    }
    
    console.log("\n💡 TO SEE USD IN METAMASK:");
    console.log("  1. Make sure you're on BSC Mainnet network");
    console.log("  2. Add tokens using Import Token:");
    console.log("     - BTCBR: " + BTCBR_BSC);
    console.log("     - XHN: " + XHN_BSC);
    console.log("  3. Wait 1-2 hours for price aggregators to index");
    console.log("  4. If still no USD, the liquidity may be too low ($153)");
    console.log("\n💰 TO SEE USD FASTER:");
    console.log("  - Add more liquidity ($1k-$5k recommended)");
    console.log("  - More trading volume helps indexing");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
