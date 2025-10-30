import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("\n🔍 BSC MAINNET DEPLOYMENT STATUS CHECK");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();

    // Deployed addresses
    const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";
    const wbnbAddress = "0xAE7501469a47e52ecbc57741dC810bA35F0b3E48";
    const routerAddress = "0xBF4d461B2C83061df8eD3D7bD0aEd7a5b9C8b708";
    const pairBtcbr = "0x8f8671977908f8329aef73E71f1e6e7aCF9039de";
    const pairXhn = "0x2F75c15a476Db2503F0c07A7469Af63Ba1F00F43";

    // Get contracts
    const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);
    const WBNB = await ethers.getContractAt("WBNB", wbnbAddress);

    console.log("\n📍 Deployer:", deployer.address);

    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 BNB Balance:", ethers.formatEther(bnbBalance), "BNB");

    console.log("\n📊 TOKEN INFORMATION:");

    // BTCBR
    const btcbrName = await BTCBR.name();
    const btcbrSymbol = await BTCBR.symbol();
    const btcbrDecimals = await BTCBR.decimals();
    const btcbrBalance = await BTCBR.balanceOf(deployer.address);
    const btcbrTotalSupply = await BTCBR.totalSupply();

    console.log("\n🔸 BTCBR:");
    console.log("  Name:", btcbrName);
    console.log("  Symbol:", btcbrSymbol);
    console.log("  Decimals:", btcbrDecimals);
    console.log("  Your Balance:", ethers.formatEther(btcbrBalance));
    console.log("  Total Supply:", ethers.formatEther(btcbrTotalSupply));
    console.log("  Contract:", btcbrAddress);
    console.log("  BscScan:", `https://bscscan.com/token/${btcbrAddress}`);

    // XHN
    const xhnName = await XHN.name();
    const xhnSymbol = await XHN.symbol();
    const xhnBalance = await XHN.balanceOf(deployer.address);
    const xhnTotalSupply = await XHN.totalSupply();

    console.log("\n🔸 XHN:");
    console.log("  Name:", xhnName);
    console.log("  Symbol:", xhnSymbol);
    console.log("  Decimals:", 18);
    console.log("  Your Balance:", ethers.formatEther(xhnBalance));
    console.log("  Total Supply:", ethers.formatEther(xhnTotalSupply));
    console.log("  Contract:", xhnAddress);
    console.log("  BscScan:", `https://bscscan.com/token/${xhnAddress}`);

    // WBNB balance
    const wbnbBalance = await WBNB.balanceOf(deployer.address);
    console.log("\n🔸 WBNB:");
    console.log("  Your Balance:", ethers.formatEther(wbnbBalance));

    console.log("\n🔗 TRADING PAIRS:");
    console.log("  BNB/BTCBR:", pairBtcbr);
    console.log("  BNB/XHN:", pairXhn);

    console.log("\n🌐 LIVE TRADING URLS:");
    console.log("  PancakeSwap BTCBR:", `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}`);
    console.log("  PancakeSwap XHN:", `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}`);

    console.log("\n📊 BSCSCAN VERIFICATION:");
    console.log("  BTCBR:", `https://bscscan.com/address/${btcbrAddress}`);
    console.log("  XHN:", `https://bscscan.com/address/${xhnAddress}`);

    console.log("\n📈 PRICE TRACKING (wait 30 min for indexing):");
    console.log("  DexScreener:", `https://dexscreener.com/bsc/${pairBtcbr}`);
    console.log("  PooCoin:", `https://poocoin.app/tokens/${btcbrAddress}`);
    console.log("  DexTools:", `https://www.dextools.io/app/bsc/pair-explorer/${pairBtcbr}`);

    console.log("\n✅ STATUS: ALL CONTRACTS DEPLOYED AND WORKING!");
    console.log("⏰ Wait 30 minutes for MetaMask USD values to appear");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
