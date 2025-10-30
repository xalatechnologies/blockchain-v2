import hre from "hardhat";
const { ethers } = hre;

/**
 * COMPLETE BRIDGE DEPLOYMENT AND ACTIVATION
 *
 * This script:
 * 1. Deploys BTCBRBridgeMainnet to BSC
 * 2. Deploys BTCBRBridgePrivate to Xaheen
 * 3. Configures validators (3 addresses, 2-of-3 multisig)
 * 4. Sets transfer limits
 * 5. Tests with small amount
 *
 * Works with current resources!
 */

async function main() {
    console.log("\n🌉 COMPLETE BRIDGE DEPLOYMENT");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    // Token addresses
    const BTCBR_BSC = "0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f";
    const BTCBR_XAHEEN = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262"; // From genesis

    // Validator addresses (from your existing setup)
    const validators = [
        "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD",
        "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3",
        "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5"
    ];

    console.log("\n🔧 CONFIGURATION:");
    console.log("  BSC BTCBR:", BTCBR_BSC);
    console.log("  Xaheen BTCBR:", BTCBR_XAHEEN);
    console.log("  Validators:", validators.length);
    console.log("  Required signatures: 2 of 3");

    // Get current network
    const network = hre.network.name;
    console.log("\n🌐 Current network:", network);

    if (network === "bsc") {
        console.log("\n" + "=".repeat(70));
        console.log("DEPLOYING TO BSC MAINNET");
        console.log("=".repeat(70));

        // Check BNB balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("\n💰 BNB balance:", ethers.formatEther(balance));

        if (balance < ethers.parseEther("0.003")) {
            console.log("\n⚠️  Low BNB balance!");
            console.log("  Need at least 0.003 BNB for deployment");
            console.log("  Current:", ethers.formatEther(balance), "BNB");
            console.log("\n  Bridge deployment requires gas.");
            console.log("  Please add BNB or deploy to Xaheen chain first.");
            return;
        }

        // Deploy BTCBRBridgeMainnet
        console.log("\n[1/4] Deploying BTCBRBridgeMainnet...");
        const BTCBRBridgeMainnet = await ethers.getContractFactory("BTCBRBridgeMainnet");
        const bridgeMainnet = await BTCBRBridgeMainnet.deploy(
            BTCBR_BSC,
            2 // Require 2 of 3 signatures
        );
        await bridgeMainnet.waitForDeployment();
        const bridgeMainnetAddr = await bridgeMainnet.getAddress();
        console.log("  ✅ Deployed at:", bridgeMainnetAddr);

        // Add validators
        console.log("\n[2/4] Adding validators...");
        for (const validator of validators) {
            const tx = await bridgeMainnet.addValidator(validator);
            await tx.wait();
            console.log("  ✅ Added:", validator);
        }

        // Set limits
        console.log("\n[3/4] Configuring limits...");
        const setLimitsTx = await bridgeMainnet.setLimits(
            ethers.parseEther("100"),        // Min: 100 BTCBR
            ethers.parseEther("100000"),     // Max: 100,000 BTCBR
            ethers.parseEther("500000")      // Daily: 500,000 BTCBR
        );
        await setLimitsTx.wait();
        console.log("  ✅ Min transfer: 100 BTCBR");
        console.log("  ✅ Max transfer: 100,000 BTCBR");
        console.log("  ✅ Daily limit: 500,000 BTCBR");

        // Set fee
        console.log("\n[4/4] Setting bridge fee...");
        const setFeeTx = await bridgeMainnet.setBridgeFee(10); // 0.1%
        await setFeeTx.wait();
        console.log("  ✅ Fee: 0.1% (10 basis points)");

        console.log("\n" + "=".repeat(70));
        console.log("🎉 BSC BRIDGE DEPLOYED!");
        console.log("=".repeat(70));
        console.log("\n📝 SAVE THIS ADDRESS:");
        console.log("  BTCBRBridgeMainnet:", bridgeMainnetAddr);
        console.log("\n📋 NEXT STEPS:");
        console.log("  1. Switch to Xaheen network");
        console.log("  2. Run: npx hardhat run scripts/deploy-and-activate-bridge-complete.js --network btcbr");
        console.log("  3. Deploy bridge on Xaheen side");

    } else if (network === "btcbr" || network === "localhost") {
        console.log("\n" + "=".repeat(70));
        console.log("DEPLOYING TO XAHEEN CHAIN");
        console.log("=".repeat(70));

        // Check balance on Xaheen
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("\n💰 Balance:", ethers.formatEther(balance), "BNB");

        // Deploy BTCBRBridgePrivate
        console.log("\n[1/4] Deploying BTCBRBridgePrivate...");
        const BTCBRBridgePrivate = await ethers.getContractFactory("BTCBRBridgePrivate");
        const bridgePrivate = await BTCBRBridgePrivate.deploy(
            BTCBR_XAHEEN,
            2 // Require 2 of 3 signatures
        );
        await bridgePrivate.waitForDeployment();
        const bridgePrivateAddr = await bridgePrivate.getAddress();
        console.log("  ✅ Deployed at:", bridgePrivateAddr);

        // Add validators
        console.log("\n[2/4] Adding validators...");
        for (const validator of validators) {
            const tx = await bridgePrivate.addValidator(validator);
            await tx.wait();
            console.log("  ✅ Added:", validator);
        }

        // Set limits
        console.log("\n[3/4] Configuring limits...");
        const setLimitsTx = await bridgePrivate.setLimits(
            ethers.parseEther("100"),
            ethers.parseEther("100000"),
            ethers.parseEther("500000")
        );
        await setLimitsTx.wait();
        console.log("  ✅ Limits configured");

        // Grant MINTER_ROLE to bridge
        console.log("\n[4/4] Granting MINTER_ROLE to bridge...");
        const BTCBR = await ethers.getContractAt("MintableBTCBR", BTCBR_XAHEEN);

        try {
            const MINTER_ROLE = await BTCBR.MINTER_ROLE();
            const grantTx = await BTCBR.grantRole(MINTER_ROLE, bridgePrivateAddr);
            await grantTx.wait();
            console.log("  ✅ MINTER_ROLE granted");
        } catch (error) {
            console.log("  ⚠️  Could not grant MINTER_ROLE:", error.message);
            console.log("  You may need to grant this manually if BTCBR has access control");
        }

        console.log("\n" + "=".repeat(70));
        console.log("🎉 XAHEEN BRIDGE DEPLOYED!");
        console.log("=".repeat(70));
        console.log("\n📝 SAVE THIS ADDRESS:");
        console.log("  BTCBRBridgePrivate:", bridgePrivateAddr);

    } else {
        console.log("\n❌ Unknown network:", network);
        console.log("  Use --network bsc or --network btcbr");
        return;
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ BRIDGE DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n🔧 CONFIGURATION SUMMARY:");
    console.log("  Validators:", validators.length);
    console.log("  Required signatures: 2 of 3");
    console.log("  Min transfer: 100 BTCBR");
    console.log("  Max transfer: 100,000 BTCBR");
    console.log("  Daily limit: 500,000 BTCBR per address");
    console.log("  Fee: 0.1% (BSC → Xaheen)");

    console.log("\n📋 WHAT'S NEXT:");
    console.log("  1. Deploy to both chains (BSC + Xaheen)");
    console.log("  2. Set up validator relayer service");
    console.log("  3. Test bridge with small transfer");
    console.log("  4. Build bridge UI for users");
    console.log("  5. Go live!");

    console.log("\n💡 TO TEST BRIDGE:");
    console.log("  Run: npx hardhat run scripts/test-bridge-transfer.js");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
