import hre from "hardhat";
const { ethers } = hre;

/**
 * Add liquidity using OFFICIAL BSC WBNB
 * PancakeSwap expects: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
 * We deployed our own WBNB which PancakeSwap doesn't recognize!
 */

async function main() {
    console.log("\n🔧 FIXING LIQUIDITY WITH OFFICIAL WBNB");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);

    // OFFICIAL BSC WBNB (the one PancakeSwap uses)
    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

    // Our deployed contracts
    const factoryAddress = "0xbb744e536Cc7049bb619d859178ED2b01051D274";
    const routerAddress = "0xBF4d461B2C83061df8eD3D7bD0aEd7a5b9C8b708";
    const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    // Get contracts
    const factory = await ethers.getContractAt("XaheenDEXFactory", factoryAddress);
    const router = await ethers.getContractAt("XaheenDEXRouter", routerAddress);
    const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);

    // Official WBNB uses standard WETH9 ABI
    const WBNB = await ethers.getContractAt("WBNB", OFFICIAL_WBNB);

    console.log("\n💡 THE PROBLEM:");
    console.log("  We deployed our own WBNB:", "0xAE7501469a47e52ecbc57741dC810bA35F0b3E48");
    console.log("  PancakeSwap uses official WBNB:", OFFICIAL_WBNB);
    console.log("  Our pairs have liquidity in OUR WBNB, not official WBNB");
    console.log("  That's why PancakeSwap can't find it!");

    console.log("\n✅ THE FIX:");
    console.log("  1. Create pairs with OFFICIAL WBNB");
    console.log("  2. Wrap our BNB to official WBNB");
    console.log("  3. Add liquidity to official WBNB pairs");
    console.log("  4. Now PancakeSwap will work!");

    const bnbBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Your BNB balance:", ethers.formatEther(bnbBalance), "BNB");

    if (bnbBalance < ethers.parseEther("0.01")) {
        console.log("\n❌ Not enough BNB for liquidity + gas");
        console.log("  You need at least 0.01 BNB");
        return;
    }

    // Amount to use (leave some for gas)
    const wrapAmount = ethers.parseEther("0.018"); // Leave 0.004 for gas
    const tokenAmount = ethers.parseEther("7500");

    console.log("\n[1/6] Creating pair with OFFICIAL WBNB/BTCBR...");

    // Check if pair exists
    let btcbrPair = await factory.getPair(OFFICIAL_WBNB, btcbrAddress);

    if (btcbrPair === "0x0000000000000000000000000000000000000000") {
        console.log("  Pair doesn't exist, creating...");
        const createTx = await factory.createPair(OFFICIAL_WBNB, btcbrAddress);
        await createTx.wait();
        btcbrPair = await factory.getPair(OFFICIAL_WBNB, btcbrAddress);
        console.log("  ✅ Pair created:", btcbrPair);
    } else {
        console.log("  ✅ Pair already exists:", btcbrPair);
    }

    console.log("\n[2/6] Creating pair with OFFICIAL WBNB/XHN...");

    let xhnPair = await factory.getPair(OFFICIAL_WBNB, xhnAddress);

    if (xhnPair === "0x0000000000000000000000000000000000000000") {
        console.log("  Pair doesn't exist, creating...");
        const createTx = await factory.createPair(OFFICIAL_WBNB, xhnAddress);
        await createTx.wait();
        xhnPair = await factory.getPair(OFFICIAL_WBNB, xhnAddress);
        console.log("  ✅ Pair created:", xhnPair);
    } else {
        console.log("  ✅ Pair already exists:", xhnPair);
    }

    console.log("\n[3/6] Wrapping BNB to OFFICIAL WBNB...");
    const wrapTx = await WBNB.deposit({ value: wrapAmount });
    await wrapTx.wait();
    console.log("  ✅ Wrapped", ethers.formatEther(wrapAmount), "BNB to WBNB");

    console.log("\n[4/6] Approving tokens...");
    await (await WBNB.approve(routerAddress, ethers.MaxUint256)).wait();
    await (await BTCBR.approve(routerAddress, ethers.MaxUint256)).wait();
    await (await XHN.approve(routerAddress, ethers.MaxUint256)).wait();
    console.log("  ✅ All tokens approved");

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const halfWbnb = wrapAmount / 2n;

    console.log("\n[5/6] Adding WBNB/BTCBR liquidity...");
    const addLiq1Tx = await router.addLiquidity(
        OFFICIAL_WBNB,
        btcbrAddress,
        halfWbnb,
        tokenAmount,
        0,
        0,
        deployer.address,
        deadline
    );
    await addLiq1Tx.wait();
    console.log("  ✅ WBNB/BTCBR liquidity added");

    console.log("\n[6/6] Adding WBNB/XHN liquidity...");
    const addLiq2Tx = await router.addLiquidity(
        OFFICIAL_WBNB,
        xhnAddress,
        halfWbnb,
        tokenAmount,
        0,
        0,
        deployer.address,
        deadline
    );
    await addLiq2Tx.wait();
    console.log("  ✅ WBNB/XHN liquidity added");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 LIQUIDITY FIXED!");
    console.log("=".repeat(70));

    console.log("\n📊 NEW PAIRS (with OFFICIAL WBNB):");
    console.log("  BNB/BTCBR:", btcbrPair);
    console.log("  BNB/XHN:", xhnPair);

    console.log("\n💧 LIQUIDITY ADDED:");
    console.log("  WBNB/BTCBR:", ethers.formatEther(halfWbnb), "WBNB + 7,500 BTCBR");
    console.log("  WBNB/XHN:", ethers.formatEther(halfWbnb), "WBNB + 7,500 XHN");

    console.log("\n🌐 NOW TRY PANCAKESWAP AGAIN:");
    console.log("  BTCBR:", `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}&chain=bsc`);
    console.log("  XHN:", `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}&chain=bsc`);

    console.log("\n✅ This time it should work because we're using OFFICIAL WBNB!");
    console.log("  PancakeSwap will recognize the liquidity now!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
