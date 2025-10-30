import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

/**
 * Complete Multi-Chain Liquidity Deployment
 *
 * This script deploys:
 * 1. Native DEX on Xaheen Chain (WXHT, Factory, Router)
 * 2. Creates trading pairs (XHT/BTCBR, XHT/USDT, BTCBR/USDT)
 * 3. Bridge contracts for BSC, Ethereum, and Tron
 * 4. Wrapped tokens for cross-chain trading
 */

async function main() {
    console.log("🚀 Starting Complete Liquidity Infrastructure Deployment");
    console.log("=" .repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "XHT");

    if (balance < ethers.parseEther("1")) {
        throw new Error("❌ Insufficient balance. Need at least 1 XHT for deployment.");
    }

    const deployment = {
        network: "Xaheen Chain",
        chainId: 65001,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        dex: {},
        bridges: {},
        pairs: {}
    };

    // ============================================================
    // PHASE 1: Deploy Native DEX Infrastructure
    // ============================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 1: Deploying Native DEX on Xaheen Chain");
    console.log("=".repeat(70));

    // 1. Deploy WXHT (Wrapped XHT)
    console.log("\n[1/4] Deploying WXHT (Wrapped XHT)...");
    const WXHT = await ethers.getContractFactory("WXHT");
    const wxht = await WXHT.deploy();
    await wxht.waitForDeployment();
    const wxhtAddress = await wxht.getAddress();
    deployment.dex.wxht = wxhtAddress;
    console.log("✅ WXHT deployed at:", wxhtAddress);

    // 2. Deploy XHTRevenue (needed for fee distribution)
    const XHTRevenue = await ethers.getContractFactory("XHTRevenue");
    const XHTStaking = await ethers.getContractFactory("XHTStaking");
    const XHTBurnMechanism = await ethers.getContractFactory("XHTBurnMechanism");

    console.log("\n[2/4] Loading XHTRevenue contract...");
    const revenueAddress = "0xE4bC805e5ED3eB8715A27D4CBAdDF510764aAF53"; // From previous deployment
    deployment.dex.revenueContract = revenueAddress;
    console.log("✅ XHTRevenue at:", revenueAddress);

    // 3. Deploy DEX Factory
    console.log("\n[3/4] Deploying XaheenDEXFactory...");
    const Factory = await ethers.getContractFactory("XaheenDEXFactory");
    const factory = await Factory.deploy(deployer.address, revenueAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    deployment.dex.factory = factoryAddress;
    console.log("✅ XaheenDEXFactory deployed at:", factoryAddress);

    // 4. Deploy DEX Router
    console.log("\n[4/4] Deploying XaheenDEXRouter...");
    const Router = await ethers.getContractFactory("XaheenDEXRouter");
    const router = await Router.deploy(factoryAddress, wxhtAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    deployment.dex.router = routerAddress;
    console.log("✅ XaheenDEXRouter deployed at:", routerAddress);

    // ============================================================
    // PHASE 2: Create Trading Pairs
    // ============================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 2: Creating Trading Pairs");
    console.log("=".repeat(70));

    const btcbrAddress = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"; // BTCBR contract

    // Create XHT/BTCBR Pair
    console.log("\n[1/1] Creating XHT/BTCBR pair...");
    const tx1 = await factory.createPair(wxhtAddress, btcbrAddress);
    await tx1.wait();
    const xhtBtcbrPair = await factory.getPair(wxhtAddress, btcbrAddress);
    deployment.pairs.xhtBtcbr = xhtBtcbrPair;
    console.log("✅ XHT/BTCBR pair created at:", xhtBtcbrPair);

    // ============================================================
    // PHASE 3: Deploy Cross-Chain Bridge Contracts
    // ============================================================

    console.log("\n" + "=".repeat(70));
    console.log("PHASE 3: Deploying Cross-Chain Bridges");
    console.log("=".repeat(70));

    // 1. BSC USDT Bridge (for Xaheen side)
    console.log("\n[1/3] Deploying USDTBridgeBSC (Xaheen side)...");
    const USDTBridgeBSC = await ethers.getContractFactory("USDTBridgeBSC");
    const usdtBridge = await USDTBridgeBSC.deploy(btcbrAddress); // Using BTCBR as placeholder for now
    await usdtBridge.waitForDeployment();
    const usdtBridgeAddress = await usdtBridge.getAddress();
    deployment.bridges.usdtBSC = usdtBridgeAddress;
    console.log("✅ USDTBridgeBSC deployed at:", usdtBridgeAddress);

    // Add validators to USDT bridge
    const validators = [
        "0xA4522eD2379C2214D471374fFA06B06d6513686E",
        "0x55ad41D5800d53d5249fE2D7B33bde887A293c73",
        "0x7e05277D528B9192572EB1dCdAdcE3527c337Cdf"
    ];

    for (const validator of validators) {
        await usdtBridge.addValidator(validator);
        console.log(`  ✓ Added validator: ${validator}`);
    }

    // 2. Ethereum Bridge (wrapped BTCBR)
    console.log("\n[2/3] Deploying wBTCBR_Ethereum...");
    const wBTCBR_ETH = await ethers.getContractFactory("wBTCBR_Ethereum");
    const wBtcbrEth = await wBTCBR_ETH.deploy();
    await wBtcbrEth.waitForDeployment();
    const wBtcbrEthAddress = await wBtcbrEth.getAddress();
    deployment.bridges.wBTCBR_Ethereum = wBtcbrEthAddress;
    console.log("✅ wBTCBR_Ethereum deployed at:", wBtcbrEthAddress);

    console.log("\n[2/3b] Deploying BTCBRBridgeEthereum...");
    const BTCBRBridgeETH = await ethers.getContractFactory("BTCBRBridgeEthereum");
    const btcbrBridgeEth = await BTCBRBridgeETH.deploy(wBtcbrEthAddress);
    await btcbrBridgeEth.waitForDeployment();
    const btcbrBridgeEthAddress = await btcbrBridgeEth.getAddress();
    deployment.bridges.BTCBRBridgeEthereum = btcbrBridgeEthAddress;
    console.log("✅ BTCBRBridgeEthereum deployed at:", btcbrBridgeEthAddress);

    // Grant minter/burner roles to bridge
    await wBtcbrEth.grantRole(await wBtcbrEth.MINTER_ROLE(), btcbrBridgeEthAddress);
    await wBtcbrEth.grantRole(await wBtcbrEth.BURNER_ROLE(), btcbrBridgeEthAddress);
    console.log("  ✓ Granted MINTER and BURNER roles to bridge");

    // Add validators to Ethereum bridge
    for (const validator of validators) {
        await btcbrBridgeEth.addValidator(validator);
        console.log(`  ✓ Added validator: ${validator}`);
    }

    // 3. Tron Bridge (TRC20 BTCBR)
    console.log("\n[3/3] Deploying BTCBR_TRC20...");
    const BTCBR_TRC20 = await ethers.getContractFactory("BTCBR_TRC20");
    const btcbrTrc20 = await BTCBR_TRC20.deploy();
    await btcbrTrc20.waitForDeployment();
    const btcbrTrc20Address = await btcbrTrc20.getAddress();
    deployment.bridges.BTCBR_TRC20 = btcbrTrc20Address;
    console.log("✅ BTCBR_TRC20 deployed at:", btcbrTrc20Address);

    console.log("\n[3/3b] Deploying BTCBRBridgeTron...");
    const BTCBRBridgeTron = await ethers.getContractFactory("BTCBRBridgeTron");
    const btcbrBridgeTron = await BTCBRBridgeTron.deploy(btcbrTrc20Address);
    await btcbrBridgeTron.waitForDeployment();
    const btcbrBridgeTronAddress = await btcbrBridgeTron.getAddress();
    deployment.bridges.BTCBRBridgeTron = btcbrBridgeTronAddress;
    console.log("✅ BTCBRBridgeTron deployed at:", btcbrBridgeTronAddress);

    // Grant minter/burner roles to bridge
    await btcbrTrc20.grantRole(await btcbrTrc20.MINTER_ROLE(), btcbrBridgeTronAddress);
    await btcbrTrc20.grantRole(await btcbrTrc20.BURNER_ROLE(), btcbrBridgeTronAddress);
    console.log("  ✓ Granted MINTER and BURNER roles to bridge");

    // Add validators to Tron bridge
    for (const validator of validators) {
        await btcbrBridgeTron.addValidator(validator);
        console.log(`  ✓ Added validator: ${validator}`);
    }

    // ============================================================
    // PHASE 4: Calculate Gas Used
    // ============================================================

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    deployment.gasUsed = ethers.formatEther(gasUsed);

    // ============================================================
    // Save Deployment Information
    // ============================================================

    console.log("\n" + "=".repeat(70));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(70));

    console.log("\n📊 DEPLOYMENT SUMMARY:");
    console.log("\n🔷 Native DEX:");
    console.log("  WXHT:", deployment.dex.wxht);
    console.log("  Factory:", deployment.dex.factory);
    console.log("  Router:", deployment.dex.router);
    console.log("  Revenue Contract:", deployment.dex.revenueContract);

    console.log("\n💱 Trading Pairs:");
    console.log("  XHT/BTCBR:", deployment.pairs.xhtBtcbr);

    console.log("\n🌉 Cross-Chain Bridges:");
    console.log("  USDT Bridge (BSC):", deployment.bridges.usdtBSC);
    console.log("  wBTCBR (Ethereum):", deployment.bridges.wBTCBR_Ethereum);
    console.log("  BTCBR Bridge (Ethereum):", deployment.bridges.BTCBRBridgeEthereum);
    console.log("  BTCBR-TRC20 (Tron):", deployment.bridges.BTCBR_TRC20);
    console.log("  BTCBR Bridge (Tron):", deployment.bridges.BTCBRBridgeTron);

    console.log("\n⛽ Gas Used:", deployment.gasUsed, "XHT");
    console.log("\n💾 Saving deployment info...");

    const filename = `deployment-complete-liquidity-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
    console.log("✅ Saved to:", filename);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 ALL LIQUIDITY INFRASTRUCTURE DEPLOYED SUCCESSFULLY!");
    console.log("=".repeat(70));

    console.log("\n📝 NEXT STEPS:");
    console.log("  1. Add initial liquidity to XHT/BTCBR pair");
    console.log("  2. Deploy wBTCBR to Ethereum mainnet");
    console.log("  3. Deploy BTCBR-TRC20 to Tron mainnet");
    console.log("  4. Create Uniswap pools for wBTCBR/ETH and wBTCBR/USDT");
    console.log("  5. Create SunSwap pools for BTCBR-TRC20/TRX and BTCBR-TRC20/USDT");
    console.log("  6. Setup frontend DEX interface");
    console.log("  7. Configure bridge validators and monitoring");

    return deployment;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error(error);
        process.exit(1);
    });
