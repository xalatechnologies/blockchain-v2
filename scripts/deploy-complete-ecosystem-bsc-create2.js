import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

/**
 * Deploy Complete Xaheen Ecosystem to BSC Mainnet using CREATE2
 *
 * This script uses CREATE2 to achieve deterministic contract addresses
 * across different chains for better cross-chain consistency.
 *
 * Total Cost: ~$1,200 (2.0 BNB)
 */

async function main() {
    console.log("🌍 COMPLETE ECOSYSTEM DEPLOYMENT - BSC MAINNET (CREATE2)");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "BNB");
    console.log("💵 USD Value:", "$" + (parseFloat(ethers.formatEther(balance)) * 600).toFixed(2));

    // Check minimum balance (2.5 BNB recommended)
    const requiredBNB = ethers.parseEther("2.0");
    if (balance < requiredBNB) {
        throw new Error(`❌ Insufficient balance. Need at least 2.0 BNB, you have ${ethers.formatEther(balance)} BNB`);
    }

    const deployment = {
        network: "BSC Mainnet",
        chainId: 56,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
        pairs: {},
        create2: {
            factoryAddress: null,
            salts: {}
        }
    };

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 1: DEPLOY CREATE2 FACTORY");
    console.log("=".repeat(70));

    console.log("\n[1/1] Deploying CREATE2Factory for deterministic addresses...");
    const CREATE2Factory = await ethers.getContractFactory("CREATE2Factory");
    const create2Factory = await CREATE2Factory.deploy();
    await create2Factory.waitForDeployment();
    const create2FactoryAddress = await create2Factory.getAddress();
    deployment.create2.factoryAddress = create2FactoryAddress;
    console.log("✅ CREATE2Factory deployed at:", create2FactoryAddress);
    console.log("   💡 Use this SAME factory address on all chains for consistent addresses!");

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 2: DEPLOY CORE INFRASTRUCTURE");
    console.log("=".repeat(70));

    // 1. Deploy WBNB using CREATE2
    console.log("\n[1/8] Deploying WBNB with CREATE2...");
    const WBNB = await ethers.getContractFactory("WBNB");
    const wbnbBytecode = WBNB.bytecode;
    const wbnbSalt = ethers.id("WBNB-v1.0.0"); // Deterministic salt
    deployment.create2.salts.WBNB = wbnbSalt;

    const predictedWBNB = await create2Factory.computeAddress(wbnbBytecode, wbnbSalt);
    console.log("   📍 Predicted WBNB address:", predictedWBNB);

    const wbnbTx = await create2Factory.deploy(wbnbBytecode, wbnbSalt);
    await wbnbTx.wait();
    const wbnb = WBNB.attach(predictedWBNB);
    const wbnbAddress = await wbnb.getAddress();
    deployment.contracts.wbnb = wbnbAddress;
    console.log("✅ WBNB deployed at:", wbnbAddress);
    console.log("   Name:", await wbnb.name());
    console.log("   Symbol:", await wbnb.symbol());

    // 2. Deploy Factory using CREATE2
    console.log("\n[2/8] Deploying XaheenDEXFactory with CREATE2...");
    const Factory = await ethers.getContractFactory("XaheenDEXFactory");
    const factoryBytecode = Factory.bytecode + ethers.AbiCoder.defaultAbiCoder().encode(["address"], [deployer.address]).slice(2);
    const factorySalt = ethers.id("XaheenDEXFactory-v1.0.0");
    deployment.create2.salts.Factory = factorySalt;

    const predictedFactory = await create2Factory.computeAddress(factoryBytecode, factorySalt);
    console.log("   📍 Predicted Factory address:", predictedFactory);

    const factoryTx = await create2Factory.deploy(factoryBytecode, factorySalt);
    await factoryTx.wait();
    const factory = Factory.attach(predictedFactory);
    const factoryAddress = await factory.getAddress();
    deployment.contracts.factory = factoryAddress;
    console.log("✅ Factory deployed at:", factoryAddress);

    // 3. Deploy Router using CREATE2
    console.log("\n[3/8] Deploying XaheenDEXRouter with CREATE2...");
    const Router = await ethers.getContractFactory("XaheenDEXRouter");
    const routerBytecode = Router.bytecode + ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [factoryAddress, wbnbAddress]
    ).slice(2);
    const routerSalt = ethers.id("XaheenDEXRouter-v1.0.0");
    deployment.create2.salts.Router = routerSalt;

    const predictedRouter = await create2Factory.computeAddress(routerBytecode, routerSalt);
    console.log("   📍 Predicted Router address:", predictedRouter);

    const routerTx = await create2Factory.deploy(routerBytecode, routerSalt);
    await routerTx.wait();
    const router = Router.attach(predictedRouter);
    const routerAddress = await router.getAddress();
    deployment.contracts.router = routerAddress;
    console.log("✅ Router deployed at:", routerAddress);

    // 4. Deploy BTCBR using CREATE2 (with different salt due to BSC collision)
    console.log("\n[4/8] Deploying BTCBR Token with CREATE2...");
    const BTCBR = await ethers.getContractFactory("BTCBR");
    const btcbrBytecode = BTCBR.bytecode;
    const btcbrSalt = ethers.id("BTCBR-BSC-v1.0.0"); // Different salt for BSC
    deployment.create2.salts.BTCBR = btcbrSalt;

    const predictedBTCBR = await create2Factory.computeAddress(btcbrBytecode, btcbrSalt);
    console.log("   📍 Predicted BTCBR address:", predictedBTCBR);
    console.log("   ⚠️  Note: Different from Xaheen Chain due to BSC address collision");

    const btcbrTx = await create2Factory.deploy(btcbrBytecode, btcbrSalt);
    await btcbrTx.wait();
    const btcbr = BTCBR.attach(predictedBTCBR);
    const btcbrAddress = await btcbr.getAddress();
    deployment.contracts.btcbr = btcbrAddress;
    console.log("✅ BTCBR Token deployed at:", btcbrAddress);
    console.log("   Name:", await btcbr.name());
    console.log("   Symbol:", await btcbr.symbol());
    const totalSupply = await btcbr.totalSupply();
    console.log("   Total Supply:", ethers.formatEther(totalSupply), "BTCBR");

    // 5. Deploy XHN using CREATE2
    console.log("\n[5/8] Deploying XHN Token with CREATE2...");
    const XHN = await ethers.getContractFactory("XHN");
    const xhnBytecode = XHN.bytecode;
    const xhnSalt = ethers.id("XHN-v1.0.0");
    deployment.create2.salts.XHN = xhnSalt;

    const predictedXHN = await create2Factory.computeAddress(xhnBytecode, xhnSalt);
    console.log("   📍 Predicted XHN address:", predictedXHN);

    const xhnTx = await create2Factory.deploy(xhnBytecode, xhnSalt);
    await xhnTx.wait();
    const xhn = XHN.attach(predictedXHN);
    const xhnAddress = await xhn.getAddress();
    deployment.contracts.xhn = xhnAddress;
    console.log("✅ XHN Token deployed at:", xhnAddress);
    console.log("   Name:", await xhn.name());
    console.log("   Symbol:", await xhn.symbol());
    const xhnSupply = await xhn.totalSupply();
    console.log("   Total Supply:", ethers.formatEther(xhnSupply), "XHN");

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 3: CREATE TRADING PAIRS");
    console.log("=".repeat(70));

    // 6. Create BNB/BTCBR pair
    console.log("\n[6/8] Creating BNB/BTCBR trading pair...");
    const createPair1Tx = await factory.createPair(wbnbAddress, btcbrAddress);
    await createPair1Tx.wait();
    const bnbBtcbrPair = await factory.getPair(wbnbAddress, btcbrAddress);
    deployment.pairs.bnbBtcbr = bnbBtcbrPair;
    console.log("✅ BNB/BTCBR pair created at:", bnbBtcbrPair);

    // 7. Create BNB/XHN pair
    console.log("\n[7/8] Creating BNB/XHN trading pair...");
    const createPair2Tx = await factory.createPair(wbnbAddress, xhnAddress);
    await createPair2Tx.wait();
    const bnbXhnPair = await factory.getPair(wbnbAddress, xhnAddress);
    deployment.pairs.bnbXhn = bnbXhnPair;
    console.log("✅ BNB/XHN pair created at:", bnbXhnPair);

    // 8. Create BTCBR/XHN pair
    console.log("\n[8/8] Creating BTCBR/XHN trading pair...");
    const createPair3Tx = await factory.createPair(btcbrAddress, xhnAddress);
    await createPair3Tx.wait();
    const btcbrXhnPair = await factory.getPair(btcbrAddress, xhnAddress);
    deployment.pairs.btcbrXhn = btcbrXhnPair;
    console.log("✅ BTCBR/XHN pair created at:", btcbrXhnPair);

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 4: ADD INITIAL LIQUIDITY");
    console.log("=".repeat(70));

    const liquidityAmountBNB = ethers.parseEther("0.833"); // ~$500 per pair
    const liquidityAmountBTCBR = ethers.parseEther("50000"); // 50K BTCBR
    const liquidityAmountXHN = ethers.parseEther("50000"); // 50K XHN

    console.log("\n💧 Approving tokens for liquidity...");
    await (await btcbr.approve(routerAddress, ethers.MaxUint256)).wait();
    await (await xhn.approve(routerAddress, ethers.MaxUint256)).wait();
    console.log("   ✅ All tokens approved");

    console.log("\n💧 Adding BNB/BTCBR liquidity ($500 each side)...");
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const addLiq1Tx = await router.addLiquidityETH(
        btcbrAddress,
        liquidityAmountBTCBR,
        0,
        0,
        deployer.address,
        deadline,
        { value: liquidityAmountBNB }
    );
    await addLiq1Tx.wait();
    console.log("   ✅ BNB/BTCBR liquidity added");

    console.log("\n💧 Adding BNB/XHN liquidity ($500 each side)...");
    const addLiq2Tx = await router.addLiquidityETH(
        xhnAddress,
        liquidityAmountXHN,
        0,
        0,
        deployer.address,
        deadline,
        { value: liquidityAmountBNB }
    );
    await addLiq2Tx.wait();
    console.log("   ✅ BNB/XHN liquidity added");

    console.log("\n💧 Adding BTCBR/XHN liquidity (50K each side)...");
    const addLiq3Tx = await router.addLiquidity(
        btcbrAddress,
        xhnAddress,
        liquidityAmountBTCBR,
        liquidityAmountXHN,
        0,
        0,
        deployer.address,
        deadline
    );
    await addLiq3Tx.wait();
    console.log("   ✅ BTCBR/XHN liquidity added");

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 5: BOT-FRIENDLY LAUNCH");
    console.log("=".repeat(70));

    console.log("\n🤖 Executing staircase buys on BNB/BTCBR pair...");
    const buyAmounts = [
        ethers.parseEther("0.0016"), // ~$1
        ethers.parseEther("0.0033"), // ~$2
        ethers.parseEther("0.0083"), // ~$5
        ethers.parseEther("0.0166"), // ~$10
        ethers.parseEther("0.0333")  // ~$20
    ];

    for (let i = 0; i < buyAmounts.length; i++) {
        console.log(`   [${i + 1}/5] Buying $${[1, 2, 5, 10, 20][i]} worth of BTCBR...`);
        const swapTx = await router.swapExactETHForTokens(
            0,
            [wbnbAddress, btcbrAddress],
            deployer.address,
            deadline,
            { value: buyAmounts[i] }
        );
        await swapTx.wait();
        console.log(`   ✅ Buy ${i + 1} completed`);
    }

    console.log("\n🤖 Executing staircase buys on BNB/XHN pair...");
    for (let i = 0; i < buyAmounts.length; i++) {
        console.log(`   [${i + 1}/5] Buying $${[1, 2, 5, 10, 20][i]} worth of XHN...`);
        const swapTx = await router.swapExactETHForTokens(
            0,
            [wbnbAddress, xhnAddress],
            deployer.address,
            deadline,
            { value: buyAmounts[i] }
        );
        await swapTx.wait();
        console.log(`   ✅ Buy ${i + 1} completed`);
    }

    console.log("\n🤖 Generating volume on BTCBR/XHN pair...");
    const volumeAmount = ethers.parseEther("1000"); // 1K tokens
    for (let i = 0; i < 5; i++) {
        console.log(`   [${i + 1}/5] Volume trade ${i + 1}...`);
        const swapTx = await router.swapExactTokensForTokens(
            volumeAmount,
            0,
            i % 2 === 0 ? [btcbrAddress, xhnAddress] : [xhnAddress, btcbrAddress],
            deployer.address,
            deadline
        );
        await swapTx.wait();
        console.log(`   ✅ Volume trade ${i + 1} completed`);
    }

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;

    console.log("\n" + "=".repeat(70));
    console.log("BSC MAINNET DEPLOYMENT COMPLETE! 🎉");
    console.log("=".repeat(70));

    console.log("\n📊 DEPLOYMENT SUMMARY:");

    console.log("\n🏭 CREATE2 Factory:");
    console.log("  Factory Address:", create2FactoryAddress);
    console.log("  💡 Deploy to same address on Tron/Ethereum for consistent addresses!");

    console.log("\n💎 Core Contracts (Deterministic Addresses):");
    console.log("  WBNB:", wbnbAddress);
    console.log("  Factory:", factoryAddress);
    console.log("  Router:", routerAddress);
    console.log("  BTCBR:", btcbrAddress, "(⚠️  Different salt due to BSC collision)");
    console.log("  XHN:", xhnAddress);

    console.log("\n💧 Trading Pairs:");
    console.log("  BNB/BTCBR:", bnbBtcbrPair);
    console.log("  BNB/XHN:", bnbXhnPair);
    console.log("  BTCBR/XHN:", btcbrXhnPair);

    console.log("\n🔑 CREATE2 Salts (Use on other chains):");
    console.log("  WBNB:", deployment.create2.salts.WBNB);
    console.log("  Factory:", deployment.create2.salts.Factory);
    console.log("  Router:", deployment.create2.salts.Router);
    console.log("  BTCBR:", deployment.create2.salts.BTCBR, "(BSC-specific)");
    console.log("  XHN:", deployment.create2.salts.XHN);

    console.log("\n💰 DEPLOYMENT COST:");
    console.log("  Gas Used:", ethers.formatEther(gasUsed), "BNB");
    console.log("  USD Cost:", "$" + (parseFloat(ethers.formatEther(gasUsed)) * 600).toFixed(2));
    console.log("  Remaining Balance:", ethers.formatEther(finalBalance), "BNB");

    console.log("\n🌐 LIVE URLS:");
    console.log("  PancakeSwap BTCBR:", `https://pancakeswap.finance/swap?outputCurrency=${btcbrAddress}`);
    console.log("  PancakeSwap XHN:", `https://pancakeswap.finance/swap?outputCurrency=${xhnAddress}`);
    console.log("  BscScan BTCBR:", `https://bscscan.com/address/${btcbrAddress}`);
    console.log("  BscScan XHN:", `https://bscscan.com/address/${xhnAddress}`);
    console.log("  DexScreener (wait 5 min):", `https://dexscreener.com/bsc/${bnbBtcbrPair}`);

    console.log("\n📋 NEXT STEPS:");
    console.log("\n1. ✅ Verify contracts on BscScan:");
    console.log(`   npx hardhat verify --network bsc ${btcbrAddress}`);
    console.log(`   npx hardhat verify --network bsc ${xhnAddress}`);

    console.log("\n2. 🔄 Deploy to Tron using SAME CREATE2 factory:");
    console.log(`   Deploy CREATE2Factory to Tron at: ${create2FactoryAddress}`);
    console.log("   Use SAME salts to get consistent addresses!");

    console.log("\n3. 🔄 Deploy to Ethereum using SAME CREATE2 factory:");
    console.log("   Same process as Tron");

    console.log("\n4. 📢 Marketing:");
    console.log("   - Twitter announcement");
    console.log("   - Telegram groups");
    console.log("   - Reddit post (r/CryptoMoonShots)");

    console.log("\n💡 CROSS-CHAIN CONSISTENCY:");
    console.log("  ✅ WBNB, Factory, Router, XHN will have SAME addresses on all chains");
    console.log("  ⚠️  BTCBR uses different salt on BSC due to collision");
    console.log("  🔑 Deploy CREATE2Factory to same address on each chain first!");

    // Save deployment
    const filename = `deployment-complete-ecosystem-bsc-create2-${Date.now()}.json`;
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
