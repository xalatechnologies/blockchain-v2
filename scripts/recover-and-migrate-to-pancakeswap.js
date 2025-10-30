import hre from "hardhat";
const { ethers } = hre;

/**
 * RECOVER LIQUIDITY FROM OUR ROUTER AND MIGRATE TO PANCAKESWAP
 *
 * Step 1: Remove liquidity from our router
 * Step 2: Unwrap WBNB back to BNB
 * Step 3: Add liquidity through PancakeSwap router
 *
 * This makes tokens tradeable on PancakeSwap!
 */

async function main() {
    console.log("\n🔄 MIGRATING LIQUIDITY TO PANCAKESWAP");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Your address:", deployer.address);

    // Our contracts
    const factoryAddress = "0xbb744e536Cc7049bb619d859178ED2b01051D274";
    const routerAddress = "0xBF4d461B2C83061df8eD3D7bD0aEd7a5b9C8b708";

    // Official addresses
    const OFFICIAL_WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

    // Tokens
    const btcbrAddress = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const xhnAddress = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    // Get contracts
    const factory = await ethers.getContractAt("XaheenDEXFactory", factoryAddress);
    const router = await ethers.getContractAt("XaheenDEXRouter", routerAddress);
    const WBNB = await ethers.getContractAt("WBNB", OFFICIAL_WBNB);
    const BTCBR = await ethers.getContractAt("MintableBTCBR", btcbrAddress);
    const XHN = await ethers.getContractAt("XHN", xhnAddress);

    // PancakeSwap router ABI
    const pancakeRouterABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];
    const pancakeRouter = new ethers.Contract(PANCAKE_ROUTER, pancakeRouterABI, deployer);

    // Get pair addresses
    const btcbrPairAddr = await factory.getPair(OFFICIAL_WBNB, btcbrAddress);
    const xhnPairAddr = await factory.getPair(OFFICIAL_WBNB, xhnAddress);

    console.log("\n📊 OUR ROUTER PAIRS:");
    console.log("  WBNB/BTCBR:", btcbrPairAddr);
    console.log("  WBNB/XHN:", xhnPairAddr);

    const btcbrPair = await ethers.getContractAt("XaheenDEXPair", btcbrPairAddr);
    const xhnPair = await ethers.getContractAt("XaheenDEXPair", xhnPairAddr);

    // Check LP balances
    const btcbrLP = await btcbrPair.balanceOf(deployer.address);
    const xhnLP = await xhnPair.balanceOf(deployer.address);

    console.log("\n💎 YOUR LP TOKENS:");
    console.log("  WBNB/BTCBR LP:", ethers.formatEther(btcbrLP));
    console.log("  WBNB/XHN LP:", ethers.formatEther(xhnLP));

    if (btcbrLP === 0n && xhnLP === 0n) {
        console.log("\n❌ No LP tokens found! Nothing to recover.");
        return;
    }

    // Check balances before
    const bnbBefore = await ethers.provider.getBalance(deployer.address);
    const wbnbBefore = await WBNB.balanceOf(deployer.address);
    const btcbrBefore = await BTCBR.balanceOf(deployer.address);
    const xhnBefore = await XHN.balanceOf(deployer.address);

    console.log("\n💰 BALANCES BEFORE:");
    console.log("  BNB:", ethers.formatEther(bnbBefore));
    console.log("  WBNB:", ethers.formatEther(wbnbBefore));
    console.log("  BTCBR:", ethers.formatEther(btcbrBefore));
    console.log("  XHN:", ethers.formatEther(xhnBefore));

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    console.log("\n" + "=".repeat(70));
    console.log("STEP 1: REMOVE LIQUIDITY FROM OUR ROUTER");
    console.log("=".repeat(70));

    // Remove WBNB/BTCBR liquidity
    if (btcbrLP > 0n) {
        console.log("\n[1/2] Removing WBNB/BTCBR liquidity...");
        await (await btcbrPair.approve(routerAddress, btcbrLP)).wait();
        console.log("  LP tokens approved");

        const removeTx1 = await router.removeLiquidity(
            OFFICIAL_WBNB,
            btcbrAddress,
            btcbrLP,
            0,
            0,
            deployer.address,
            deadline
        );
        await removeTx1.wait();
        console.log("  ✅ WBNB/BTCBR liquidity removed!");
    }

    // Remove WBNB/XHN liquidity
    if (xhnLP > 0n) {
        console.log("\n[2/2] Removing WBNB/XHN liquidity...");
        await (await xhnPair.approve(routerAddress, xhnLP)).wait();
        console.log("  LP tokens approved");

        const removeTx2 = await router.removeLiquidity(
            OFFICIAL_WBNB,
            xhnAddress,
            xhnLP,
            0,
            0,
            deployer.address,
            deadline
        );
        await removeTx2.wait();
        console.log("  ✅ WBNB/XHN liquidity removed!");
    }

    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: UNWRAP WBNB TO BNB");
    console.log("=".repeat(70));

    const wbnbAfterRemoval = await WBNB.balanceOf(deployer.address);
    console.log("\n  WBNB balance:", ethers.formatEther(wbnbAfterRemoval));

    if (wbnbAfterRemoval > 0n) {
        console.log("  Unwrapping to BNB...");
        const unwrapTx = await WBNB.withdraw(wbnbAfterRemoval);
        await unwrapTx.wait();
        console.log("  ✅ Unwrapped", ethers.formatEther(wbnbAfterRemoval), "WBNB to BNB");
    }

    console.log("\n" + "=".repeat(70));
    console.log("STEP 3: ADD LIQUIDITY TO PANCAKESWAP");
    console.log("=".repeat(70));

    const bnbAfterUnwrap = await ethers.provider.getBalance(deployer.address);
    const btcbrAfterRemoval = await BTCBR.balanceOf(deployer.address);
    const xhnAfterRemoval = await XHN.balanceOf(deployer.address);

    console.log("\n💰 AVAILABLE FOR PANCAKESWAP:");
    console.log("  BNB:", ethers.formatEther(bnbAfterUnwrap));
    console.log("  BTCBR:", ethers.formatEther(btcbrAfterRemoval));
    console.log("  XHN:", ethers.formatEther(xhnAfterRemoval));

    // Calculate amounts (leave gas buffer)
    const bnbForLiquidity = bnbAfterUnwrap - ethers.parseEther("0.01"); // Leave 0.01 for gas
    const halfBnb = bnbForLiquidity / 2n;

    // Use all recovered tokens
    const btcbrAmount = btcbrAfterRemoval - btcbrBefore; // Amount we just recovered
    const xhnAmount = xhnAfterRemoval - xhnBefore; // Amount we just recovered

    console.log("\n📊 ADDING TO PANCAKESWAP:");
    console.log("  BTCBR:", ethers.formatEther(halfBnb), "BNB +", ethers.formatEther(btcbrAmount), "BTCBR");
    console.log("  XHN:", ethers.formatEther(halfBnb), "BNB +", ethers.formatEther(xhnAmount), "XHN");

    const totalUSD = parseFloat(ethers.formatEther(bnbForLiquidity)) * 720;
    console.log("  Total value:", `~$${totalUSD.toFixed(2)}`);

    // Approve tokens for PancakeSwap
    console.log("\n[1/4] Approving BTCBR for PancakeSwap...");
    await (await BTCBR.approve(PANCAKE_ROUTER, btcbrAmount)).wait();
    console.log("  ✅ BTCBR approved");

    console.log("\n[2/4] Adding BTCBR liquidity to PancakeSwap...");
    try {
        const tx1 = await pancakeRouter.addLiquidityETH(
            btcbrAddress,
            btcbrAmount,
            0,
            0,
            deployer.address,
            deadline,
            { value: halfBnb }
        );
        console.log("  Transaction:", tx1.hash);
        await tx1.wait();
        console.log("  ✅ BTCBR liquidity added to PancakeSwap!");
    } catch (error) {
        console.log("  ❌ Error:", error.shortMessage || error.message);
    }

    console.log("\n[3/4] Approving XHN for PancakeSwap...");
    await (await XHN.approve(PANCAKE_ROUTER, xhnAmount)).wait();
    console.log("  ✅ XHN approved");

    console.log("\n[4/4] Adding XHN liquidity to PancakeSwap...");
    try {
        const tx2 = await pancakeRouter.addLiquidityETH(
            xhnAddress,
            xhnAmount,
            0,
            0,
            deployer.address,
            deadline,
            { value: halfBnb }
        );
        console.log("  Transaction:", tx2.hash);
        await tx2.wait();
        console.log("  ✅ XHN liquidity added to PancakeSwap!");
    } catch (error) {
        console.log("  ❌ Error:", error.shortMessage || error.message);
    }

    // Final balances
    const bnbFinal = await ethers.provider.getBalance(deployer.address);
    const wbnbFinal = await WBNB.balanceOf(deployer.address);
    const btcbrFinal = await BTCBR.balanceOf(deployer.address);
    const xhnFinal = await XHN.balanceOf(deployer.address);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 MIGRATION COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n💰 FINAL BALANCES:");
    console.log("  BNB:", ethers.formatEther(bnbFinal));
    console.log("  WBNB:", ethers.formatEther(wbnbFinal));
    console.log("  BTCBR:", ethers.formatEther(btcbrFinal));
    console.log("  XHN:", ethers.formatEther(xhnFinal));

    console.log("\n✅ YOUR TOKENS ARE NOW ON PANCAKESWAP!");
    console.log("  Liquidity migrated from our router to PancakeSwap");
    console.log("  PancakeSwap will recognize your tokens");
    console.log("  Users can trade on PancakeSwap now!");

    console.log("\n🥞 TEST PANCAKESWAP:");
    console.log("  BTCBR:", `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}&chain=bsc`);
    console.log("  XHN:", `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}&chain=bsc`);

    console.log("\n📈 NEXT STEPS:");
    console.log("  1. Test a trade on PancakeSwap");
    console.log("  2. DexScreener will index after first trade");
    console.log("  3. MetaMask will show USD values (30 min - 2 hours)");
    console.log("  4. Set up bridge between Xaheen chain and BSC");
    console.log("  5. Create bridge UI for users");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
