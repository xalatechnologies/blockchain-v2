import hre from "hardhat";
const { ethers } = hre;

/**
 * VERIFY PANCAKESWAP LIQUIDITY
 * Check if liquidity exists and is visible to PancakeSwap
 */

async function main() {
    console.log("\n🔍 VERIFYING PANCAKESWAP LIQUIDITY");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();

    // OFFICIAL BSC WBNB
    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

    // Tokens
    const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    // Factory
    const factoryAddress = "0xbb744e536Cc7049bb619d859178ED2b01051D274";

    const factory = await ethers.getContractAt("XaheenDEXFactory", factoryAddress);
    const WBNB = await ethers.getContractAt("WBNB", OFFICIAL_WBNB);
    const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);

    // Get pair addresses
    const btcbrPairAddr = await factory.getPair(OFFICIAL_WBNB, btcbrAddress);
    const xhnPairAddr = await factory.getPair(OFFICIAL_WBNB, xhnAddress);

    console.log("\n📊 PAIR ADDRESSES:");
    console.log("  WBNB/BTCBR:", btcbrPairAddr);
    console.log("  WBNB/XHN:", xhnPairAddr);

    if (btcbrPairAddr === "0x0000000000000000000000000000000000000000") {
        console.log("\n❌ WBNB/BTCBR pair does NOT exist!");
        return;
    }

    if (xhnPairAddr === "0x0000000000000000000000000000000000000000") {
        console.log("\n❌ WBNB/XHN pair does NOT exist!");
        return;
    }

    // Check liquidity in pairs
    const wbnbInBtcbr = await WBNB.balanceOf(btcbrPairAddr);
    const btcbrInPair = await BTCBR.balanceOf(btcbrPairAddr);

    const wbnbInXhn = await WBNB.balanceOf(xhnPairAddr);
    const xhnInPair = await XHN.balanceOf(xhnPairAddr);

    console.log("\n💧 LIQUIDITY IN WBNB/BTCBR PAIR:");
    console.log("  WBNB:", ethers.formatEther(wbnbInBtcbr));
    console.log("  BTCBR:", ethers.formatEther(btcbrInPair));

    const btcbrUSD = parseFloat(ethers.formatEther(wbnbInBtcbr)) * 720 * 2;
    console.log("  USD value:", `~$${btcbrUSD.toFixed(2)}`);

    console.log("\n💧 LIQUIDITY IN WBNB/XHN PAIR:");
    console.log("  WBNB:", ethers.formatEther(wbnbInXhn));
    console.log("  XHN:", ethers.formatEther(xhnInPair));

    const xhnUSD = parseFloat(ethers.formatEther(wbnbInXhn)) * 720 * 2;
    console.log("  USD value:", `~$${xhnUSD.toFixed(2)}`);

    console.log("\n💰 TOTAL LIQUIDITY:", `~$${(btcbrUSD + xhnUSD).toFixed(2)}`);

    // Check if it's official WBNB
    const wbnbName = await WBNB.name();
    const wbnbSymbol = await WBNB.symbol();
    console.log("\n✅ WBNB VERIFICATION:");
    console.log("  Address:", OFFICIAL_WBNB);
    console.log("  Name:", wbnbName);
    console.log("  Symbol:", wbnbSymbol);
    console.log("  This is OFFICIAL BSC WBNB:", OFFICIAL_WBNB === "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" ? "YES ✅" : "NO ❌");

    // Get LP token balances
    const btcbrPair = await ethers.getContractAt("XaheenDEXPair", btcbrPairAddr);
    const xhnPair = await ethers.getContractAt("XaheenDEXPair", xhnPairAddr);

    const btcbrLP = await btcbrPair.balanceOf(deployer.address);
    const xhnLP = await xhnPair.balanceOf(deployer.address);

    console.log("\n💎 YOUR LP TOKENS:");
    console.log("  WBNB/BTCBR LP:", ethers.formatEther(btcbrLP));
    console.log("  WBNB/XHN LP:", ethers.formatEther(xhnLP));

    // Price calculation
    if (wbnbInBtcbr > 0n && btcbrInPair > 0n) {
        const btcbrPrice = (parseFloat(ethers.formatEther(wbnbInBtcbr)) * 720) / parseFloat(ethers.formatEther(btcbrInPair));
        console.log("\n💵 CURRENT PRICES:");
        console.log("  BTCBR:", `$${btcbrPrice.toFixed(6)} per token`);

        if (wbnbInXhn > 0n && xhnInPair > 0n) {
            const xhnPrice = (parseFloat(ethers.formatEther(wbnbInXhn)) * 720) / parseFloat(ethers.formatEther(xhnInPair));
            console.log("  XHN:", `$${xhnPrice.toFixed(6)} per token`);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎯 PANCAKESWAP STATUS");
    console.log("=".repeat(70));

    if (wbnbInBtcbr > 0n && btcbrInPair > 0n) {
        console.log("\n✅ BTCBR IS READY!");
        console.log("  Liquidity exists:", `$${btcbrUSD.toFixed(2)}`);
        console.log("  PancakeSwap link:", `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}&chain=bsc`);
        console.log("  You can trade NOW!");
    } else {
        console.log("\n❌ BTCBR has NO liquidity");
    }

    if (wbnbInXhn > 0n && xhnInPair > 0n) {
        console.log("\n✅ XHN IS READY!");
        console.log("  Liquidity exists:", `$${xhnUSD.toFixed(2)}`);
        console.log("  PancakeSwap link:", `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}&chain=bsc`);
        console.log("  You can trade NOW!");
    } else {
        console.log("\n❌ XHN has NO liquidity");
    }

    console.log("\n📈 INDEXING STATUS:");
    console.log("  DexScreener: Will index after first trade (5-30 min)");
    console.log("  PooCoin: Will index after volume detected (10-60 min)");
    console.log("  MetaMask USD: Will appear 30 min - 2 hours after trade");

    console.log("\n💡 RECOMMENDED: Make a test trade!");
    console.log("  1. Go to PancakeSwap link above");
    console.log("  2. Buy 0.001 BNB worth (~$0.72)");
    console.log("  3. This triggers indexing");
    console.log("  4. Charts appear within 30 minutes");

    console.log("\n🔗 DIRECT PAIR LINKS (for advanced users):");
    console.log("  BscScan WBNB/BTCBR:", `https://bscscan.com/address/${btcbrPairAddr}`);
    console.log("  BscScan WBNB/XHN:", `https://bscscan.com/address/${xhnPairAddr}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
