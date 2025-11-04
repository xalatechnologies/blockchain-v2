import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

/**
 * Deploy Complete Nor Ecosystem to BSC Mainnet
 *
 * Deploys:
 * - BTCBR Token
 * - XHN Token
 * - DEX Infrastructure (Factory + Router)
 * - 3 Trading Pairs (BNB/BTCBR, BNB/XHN, BTCBR/XHN)
 * - Bot-friendly launch on all pairs
 *
 * Total Cost: ~2.5 BNB ($1,500)
 * Expected Result: Complete public DeFi ecosystem
 */

async function main() {
    console.log("🌍 COMPLETE ECOSYSTEM DEPLOYMENT - BSC MAINNET");
    console.log("=" .repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "BNB");

    // Check minimum balance
    const requiredBNB = ethers.parseEther("2.5");
    if (balance < requiredBNB) {
        throw new Error(`❌ Insufficient balance. Need at least 2.5 BNB, you have ${ethers.formatEther(balance)} BNB`);
    }

    const deployment = {
        network: "BSC Mainnet",
        chainId: 56,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
        pairs: {},
        launchStats: {}
    };

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 1: DEPLOY CORE INFRASTRUCTURE");
    console.log("=".repeat(70));

    // 1. Deploy WBNB
    console.log("\n[1/8] Deploying WBNB...");
    const WBNB = await ethers.getContractFactory("WBNB");
    const wbnb = await WBNB.deploy();
    await wbnb.waitForDeployment();
    const wbnbAddress = await wbnb.getAddress();
    deployment.contracts.wbnb = wbnbAddress;
    console.log("✅ WBNB deployed at:", wbnbAddress);

    // 2. Deploy NorDEXFactory
    console.log("\n[2/8] Deploying DEX Factory...");
    const Factory = await ethers.getContractFactory("NorDEXFactory");
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    deployment.contracts.factory = factoryAddress;
    console.log("✅ Factory deployed at:", factoryAddress);

    // 3. Deploy NorDEXRouter
    console.log("\n[3/8] Deploying DEX Router...");
    const Router = await ethers.getContractFactory("NorDEXRouter");
    const router = await Router.deploy(factoryAddress, wbnbAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    deployment.contracts.router = routerAddress;
    console.log("✅ Router deployed at:", routerAddress);

    // 4. Deploy BTCBR Token
    console.log("\n[4/8] Deploying BTCBR Token...");
    const BTCBR = await ethers.getContractFactory("BTCBR");
    const btcbr = await BTCBR.deploy();
    await btcbr.waitForDeployment();
    const btcbrAddress = await btcbr.getAddress();
    deployment.contracts.btcbr = btcbrAddress;
    console.log("✅ BTCBR Token deployed at:", btcbrAddress);
    console.log(`   Name: ${await btcbr.name()}`);
    console.log(`   Symbol: ${await btcbr.symbol()}`);
    console.log(`   Total Supply: ${ethers.formatEther(await btcbr.totalSupply())} BTCBR`);

    // 5. Deploy XHN Token
    console.log("\n[5/8] Deploying XHN Token...");
    const XHN = await ethers.getContractFactory("XHN");
    const xhn = await XHN.deploy();
    await xhn.waitForDeployment();
    const xhnAddress = await xhn.getAddress();
    deployment.contracts.xhn = xhnAddress;
    console.log("✅ XHN Token deployed at:", xhnAddress);
    console.log(`   Name: ${await xhn.name()}`);
    console.log(`   Symbol: ${await xhn.symbol()}`);
    console.log(`   Total Supply: ${ethers.formatEther(await xhn.totalSupply())} XHN`);

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 2: CREATE TRADING PAIRS");
    console.log("=".repeat(70));

    // 6. Create BNB/BTCBR Pair
    console.log("\n[6/8] Creating BNB/BTCBR pair...");
    let createPairTx = await factory.createPair(wbnbAddress, btcbrAddress);
    await createPairTx.wait();
    const bnbBtcbrPair = await factory.getPair(wbnbAddress, btcbrAddress);
    deployment.pairs.bnbBtcbr = bnbBtcbrPair;
    console.log("✅ BNB/BTCBR Pair:", bnbBtcbrPair);

    // 7. Create BNB/XHN Pair
    console.log("\n[7/8] Creating BNB/XHN pair...");
    createPairTx = await factory.createPair(wbnbAddress, xhnAddress);
    await createPairTx.wait();
    const bnbXhnPair = await factory.getPair(wbnbAddress, xhnAddress);
    deployment.pairs.bnbXhn = bnbXhnPair;
    console.log("✅ BNB/XHN Pair:", bnbXhnPair);

    // 8. Create BTCBR/XHN Pair
    console.log("\n[8/8] Creating BTCBR/XHN pair...");
    createPairTx = await factory.createPair(btcbrAddress, xhnAddress);
    await createPairTx.wait();
    const btcbrXhnPair = await factory.getPair(btcbrAddress, xhnAddress);
    deployment.pairs.btcbrXhn = btcbrXhnPair;
    console.log("✅ BTCBR/XHN Pair:", btcbrXhnPair);

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 3: APPROVE TOKENS FOR LIQUIDITY");
    console.log("=".repeat(70));

    console.log("\n💎 Approving tokens for router...");
    await (await btcbr.approve(routerAddress, ethers.MaxUint256)).wait();
    console.log("  ✅ BTCBR approved");
    await (await xhn.approve(routerAddress, ethers.MaxUint256)).wait();
    console.log("  ✅ XHN approved");

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 4: ADD INITIAL LIQUIDITY");
    console.log("=".repeat(70));

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    // Liquidity amounts
    const bnbForBtcbr = ethers.parseEther("0.833"); // ~$500
    const bnbForXhn = ethers.parseEther("0.833");   // ~$500
    const btcbrAmount = ethers.parseEther("100000"); // 100K BTCBR
    const xhnAmount = ethers.parseEther("100000");   // 100K XHN

    // Add BNB/BTCBR liquidity
    console.log("\n[1/3] Adding BNB/BTCBR liquidity...");
    console.log(`   BNB: ${ethers.formatEther(bnbForBtcbr)} (~$500)`);
    console.log(`   BTCBR: ${ethers.formatEther(btcbrAmount)}`);
    console.log(`   Initial price: 1 BNB = ${parseFloat(ethers.formatEther(btcbrAmount)) / parseFloat(ethers.formatEther(bnbForBtcbr))} BTCBR`);

    await (await router.addLiquidityBNB(
        btcbrAddress,
        btcbrAmount,
        btcbrAmount * 95n / 100n,
        bnbForBtcbr * 95n / 100n,
        deployer.address,
        deadline,
        { value: bnbForBtcbr }
    )).wait();
    console.log("✅ BNB/BTCBR liquidity added");

    // Add BNB/XHN liquidity
    console.log("\n[2/3] Adding BNB/XHN liquidity...");
    console.log(`   BNB: ${ethers.formatEther(bnbForXhn)} (~$500)`);
    console.log(`   XHN: ${ethers.formatEther(xhnAmount)}`);
    console.log(`   Initial price: 1 BNB = ${parseFloat(ethers.formatEther(xhnAmount)) / parseFloat(ethers.formatEther(bnbForXhn))} XHN`);

    await (await router.addLiquidityBNB(
        xhnAddress,
        xhnAmount,
        xhnAmount * 95n / 100n,
        bnbForXhn * 95n / 100n,
        deployer.address,
        deadline,
        { value: bnbForXhn }
    )).wait();
    console.log("✅ BNB/XHN liquidity added");

    // Add BTCBR/XHN liquidity
    console.log("\n[3/3] Adding BTCBR/XHN liquidity...");
    const btcbrForPair = ethers.parseEther("50000"); // 50K BTCBR
    const xhnForPair = ethers.parseEther("50000");   // 50K XHN
    console.log(`   BTCBR: ${ethers.formatEther(btcbrForPair)}`);
    console.log(`   XHN: ${ethers.formatEther(xhnForPair)}`);
    console.log(`   Initial price: 1 BTCBR = 1 XHN`);

    await (await router.addLiquidity(
        btcbrAddress,
        xhnAddress,
        btcbrForPair,
        xhnForPair,
        btcbrForPair * 95n / 100n,
        xhnForPair * 95n / 100n,
        deployer.address,
        deadline
    )).wait();
    console.log("✅ BTCBR/XHN liquidity added");

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 5: BOT-FRIENDLY LAUNCH - BTCBR");
    console.log("=".repeat(70));

    console.log("\n🤖 Executing BTCBR staircase buys...");
    const buyAmounts = [
        ethers.parseEther("0.0017"),  // ~$1
        ethers.parseEther("0.0033"),  // ~$2
        ethers.parseEther("0.0083"),  // ~$5
        ethers.parseEther("0.0167"),  // ~$10
        ethers.parseEther("0.0333")   // ~$20
    ];

    let totalBtcbrSpent = 0n;
    let totalBtcbrReceived = 0n;

    for (let i = 0; i < buyAmounts.length; i++) {
        const amount = buyAmounts[i];
        console.log(`\n[${i + 1}/5] Buying ${ethers.formatEther(amount)} BNB worth of BTCBR...`);

        const path = [wbnbAddress, btcbrAddress];
        const amounts = await router.getAmountsOut(amount, path);

        await (await router.swapExactBNBForTokens(
            0,
            path,
            deployer.address,
            deadline,
            { value: amount }
        )).wait();

        totalBtcbrSpent += amount;
        totalBtcbrReceived += amounts[1];

        console.log(`   ✅ Bought ${ethers.formatEther(amounts[1])} BTCBR`);

        if (i < buyAmounts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 6: BOT-FRIENDLY LAUNCH - XHN");
    console.log("=".repeat(70));

    console.log("\n🤖 Executing XHN staircase buys...");
    let totalXhnSpent = 0n;
    let totalXhnReceived = 0n;

    for (let i = 0; i < buyAmounts.length; i++) {
        const amount = buyAmounts[i];
        console.log(`\n[${i + 1}/5] Buying ${ethers.formatEther(amount)} BNB worth of XHN...`);

        const path = [wbnbAddress, xhnAddress];
        const amounts = await router.getAmountsOut(amount, path);

        await (await router.swapExactBNBForTokens(
            0,
            path,
            deployer.address,
            deadline,
            { value: amount }
        )).wait();

        totalXhnSpent += amount;
        totalXhnReceived += amounts[1];

        console.log(`   ✅ Bought ${ethers.formatEther(amounts[1])} XHN`);

        if (i < buyAmounts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 7: VOLUME GENERATION");
    console.log("=".repeat(70));

    console.log("\n💧 Creating volume on BTCBR/XHN pair...");
    const washAmount = ethers.parseEther("100"); // 100 BTCBR

    for (let i = 0; i < 5; i++) {
        const pathBtcbrToXhn = [btcbrAddress, xhnAddress];
        await (await router.swapExactTokensForTokens(
            washAmount,
            0,
            pathBtcbrToXhn,
            deployer.address,
            deadline
        )).wait();

        console.log(`   [${i + 1}/5] ✅ BTCBR → XHN swap executed`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate final metrics
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;

    console.log("\n" + "=".repeat(70));
    console.log("COMPLETE ECOSYSTEM DEPLOYMENT SUCCESSFUL! 🎉");
    console.log("=".repeat(70));

    console.log("\n📊 DEPLOYMENT SUMMARY:");
    console.log("\n🏭 Infrastructure:");
    console.log("  WBNB:", wbnbAddress);
    console.log("  Factory:", factoryAddress);
    console.log("  Router:", routerAddress);

    console.log("\n💎 Tokens:");
    console.log("  BTCBR:", btcbrAddress);
    console.log("  XHN:", xhnAddress);

    console.log("\n💧 Trading Pairs:");
    console.log("  BNB/BTCBR:", bnbBtcbrPair);
    console.log("  BNB/XHN:", bnbXhnPair);
    console.log("  BTCBR/XHN:", btcbrXhnPair);

    console.log("\n💰 LAUNCH STATISTICS:");
    console.log("  BTCBR Spent:", ethers.formatEther(totalBtcbrSpent), "BNB");
    console.log("  BTCBR Received:", ethers.formatEther(totalBtcbrReceived), "BTCBR");
    console.log("  XHN Spent:", ethers.formatEther(totalXhnSpent), "BNB");
    console.log("  XHN Received:", ethers.formatEther(totalXhnReceived), "XHN");
    console.log("  Total Gas Used:", ethers.formatEther(gasUsed), "BNB (~$" + (parseFloat(ethers.formatEther(gasUsed)) * 600).toFixed(2) + ")");

    console.log("\n📈 YOUR POSITION:");
    const btcbrBalance = await btcbr.balanceOf(deployer.address);
    const xhnBalance = await xhn.balanceOf(deployer.address);
    console.log("  BTCBR Holdings:", ethers.formatEther(btcbrBalance), "BTCBR");
    console.log("  XHN Holdings:", ethers.formatEther(xhnBalance), "XHN");
    console.log("  LP Ownership: ~99.99% on all 3 pairs");

    console.log("\n🌐 LIVE URLS:");
    console.log("  PancakeSwap BTCBR: https://pancakeswap.finance/swap?outputCurrency=" + btcbrAddress);
    console.log("  PancakeSwap XHN: https://pancakeswap.finance/swap?outputCurrency=" + xhnAddress);
    console.log("  DexScreener BNB/BTCBR: https://dexscreener.com/bsc/" + bnbBtcbrPair);
    console.log("  DexScreener BNB/XHN: https://dexscreener.com/bsc/" + bnbXhnPair);
    console.log("  BscScan BTCBR: https://bscscan.com/token/" + btcbrAddress);
    console.log("  BscScan XHN: https://bscscan.com/token/" + xhnAddress);

    console.log("\n📢 NEXT STEPS:");
    console.log("  1. ✅ Verify contracts on BscScan");
    console.log("  2. ✅ Wait for DexScreener auto-detection (5 min)");
    console.log("  3. ✅ Post Twitter announcement");
    console.log("  4. ✅ Share in Telegram groups");
    console.log("  5. ✅ Submit to CoinGecko after 3K holders");
    console.log("  6. ✅ MetaMask will show USD values automatically!");

    // Save deployment
    deployment.gasUsed = ethers.formatEther(gasUsed);
    deployment.launchStats = {
        btcbrSpent: ethers.formatEther(totalBtcbrSpent),
        btcbrReceived: ethers.formatEther(totalBtcbrReceived),
        xhnSpent: ethers.formatEther(totalXhnSpent),
        xhnReceived: ethers.formatEther(totalXhnReceived)
    };

    const filename = `deployment-complete-ecosystem-bsc-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
    console.log("\n💾 Deployment saved to:", filename);

    return deployment;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error(error);
        process.exit(1);
    });
