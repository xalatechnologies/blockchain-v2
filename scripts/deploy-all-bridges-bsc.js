import hre from "hardhat";
const { ethers } = hre;

/**
 * DEPLOY ALL BRIDGES TO BSC MAINNET
 *
 * Deploys:
 * 1. BTCBRBridgeMainnet (for BTCBR bridging)
 * 2. XHNBridgeMainnet (for XHN bridging)
 *
 * Configures validators, limits, fees, and permissions
 * Requires ~0.02 BNB for gas
 */

async function main() {
    console.log("\n🌉 DEPLOYING ALL BRIDGES TO BSC MAINNET");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer:", deployer.address);

    // Token addresses on BSC
    const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const XHN_BSC = "0x1777C32Da09d4FD65a74B6C9AFca17862423Fd1C";

    // Validators (same as Xaheen)
    const validators = [
        "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
        "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
        "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5"
    ];

    console.log("\n🔧 CONFIGURATION:");
    console.log("  BTCBR on BSC:", BTCBR_BSC);
    console.log("  XHN on BSC:", XHN_BSC);
    console.log("  Validators:", validators.length);
    console.log("  Required signatures: 2 of 3");

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Balance:", ethers.formatEther(balance), "BNB");

    if (balance < ethers.parseEther("0.02")) {
        console.log("\n⚠️  WARNING: Low BNB balance!");
        console.log("  Current:", ethers.formatEther(balance), "BNB");
        console.log("  Recommended: 0.02 BNB minimum");
        console.log("\n  Bridge deployment requires gas.");
        console.log("  Please add BNB to:", deployer.address);
        console.log("\n  Continuing with deployment anyway...");
    }

    console.log("\n" + "=".repeat(70));
    console.log("PART 1: BTCBR BRIDGE");
    console.log("=".repeat(70));

    // Deploy BTCBR Bridge
    console.log("\n[1/6] Deploying BTCBRBridgeMainnet...");
    const BTCBRBridgeMainnet = await ethers.getContractFactory("BTCBRBridgeMainnet");
    const btcbrBridge = await BTCBRBridgeMainnet.deploy(BTCBR_BSC, 2);
    await btcbrBridge.waitForDeployment();
    const btcbrBridgeAddr = await btcbrBridge.getAddress();
    console.log("  ✅ Deployed at:", btcbrBridgeAddr);

    // Add validators
    console.log("\n[2/6] Adding validators to BTCBR bridge...");
    for (const validator of validators) {
        const tx = await btcbrBridge.addValidator(validator);
        await tx.wait();
        console.log("  ✅ Added:", validator);
    }

    // Set limits
    console.log("\n[3/6] Setting BTCBR bridge limits...");
    await (await btcbrBridge.setLimits(
        ethers.parseEther("100"),
        ethers.parseEther("100000"),
        ethers.parseEther("500000")
    )).wait();
    console.log("  ✅ Limits configured");

    // Set fee
    console.log("\nSetting BTCBR bridge fee...");
    await (await btcbrBridge.setBridgeFee(10)).wait(); // 0.1%
    console.log("  ✅ Fee: 0.1% (10 basis points)");

    console.log("\n" + "=".repeat(70));
    console.log("PART 2: XHN BRIDGE");
    console.log("=".repeat(70));

    // Deploy XHN Bridge
    console.log("\n[4/6] Deploying XHNBridgeMainnet...");
    const XHNBridgeMainnet = await ethers.getContractFactory("XHNBridgeMainnet");
    const xhnBridge = await XHNBridgeMainnet.deploy(XHN_BSC, 2);
    await xhnBridge.waitForDeployment();
    const xhnBridgeAddr = await xhnBridge.getAddress();
    console.log("  ✅ Deployed at:", xhnBridgeAddr);

    // Add validators
    console.log("\n[5/6] Adding validators to XHN bridge...");
    for (const validator of validators) {
        const tx = await xhnBridge.addValidator(validator);
        await tx.wait();
        console.log("  ✅ Added:", validator);
    }

    // Set limits
    console.log("\n[6/6] Setting XHN bridge limits...");
    await (await xhnBridge.setLimits(
        ethers.parseEther("100"),
        ethers.parseEther("100000"),
        ethers.parseEther("500000")
    )).wait();
    console.log("  ✅ Limits configured");

    // Set fee
    console.log("\nSetting XHN bridge fee...");
    await (await xhnBridge.setBridgeFee(10)).wait(); // 0.1%
    console.log("  ✅ Fee: 0.1% (10 basis points)");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 ALL BRIDGES DEPLOYED TO BSC MAINNET!");
    console.log("=".repeat(70));

    console.log("\n📝 SAVE THESE ADDRESSES:");
    console.log("\n  BTCBRBridgeMainnet:", btcbrBridgeAddr);
    console.log("  XHNBridgeMainnet:", xhnBridgeAddr);

    console.log("\n🔧 CONFIGURATION SUMMARY:");
    console.log("  Both bridges configured with:");
    console.log("  - 3 validators (2-of-3 multisig)");
    console.log("  - Min: 100 tokens");
    console.log("  - Max: 100,000 tokens");
    console.log("  - Daily limit: 500,000 tokens per address");
    console.log("  - Fee: 0.1% (10 basis points)");

    console.log("\n📋 BRIDGE ADDRESSES (Complete System):");
    console.log("\n  BSC MAINNET:");
    console.log("    BTCBRBridgeMainnet:", btcbrBridgeAddr);
    console.log("    XHNBridgeMainnet:", xhnBridgeAddr);
    console.log("\n  XAHEEN CHAIN:");
    console.log("    BTCBRBridgePrivate: 0xe9Aa0276196928fb1dD42afda89F47CF821e987C");
    console.log("    XHNBridgePrivate: 0x5514EBfC66645B5Fe0BAf9FF00Eb52cc9A33Ec68");

    console.log("\n📋 NEXT STEPS:");
    console.log("  1. Build validator relayer service (Node.js)");
    console.log("  2. Test bridge transfer (Xaheen → BSC)");
    console.log("  3. Test bridge transfer (BSC → Xaheen)");
    console.log("  4. Build bridge UI (React app)");
    console.log("  5. Add XHN liquidity to PancakeSwap");
    console.log("  6. Go live!");

    console.log("\n💡 TO TEST BRIDGE:");
    console.log("  Wait for relayer service, then test with small amounts");

    console.log("\n✅ BSC SIDE COMPLETE!");
    console.log("  Both BTCBR and XHN bridges ready on BSC");
    console.log("  Bridge infrastructure fully deployed on both chains");
    console.log("  Ready for relayer service implementation");

    // Final balance
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\n💰 Final Balance:", ethers.formatEther(finalBalance), "BNB");
    console.log("  Gas used:", ethers.formatEther(balance - finalBalance), "BNB");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
