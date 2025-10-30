import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

/**
 * Deploy BTCBR-TRC20 and Bridge to Tron Mainnet
 *
 * Prerequisites:
 * 1. Tron mainnet RPC URL in .env (TRON_RPC)
 * 2. Private key with TRX for energy/bandwidth (TRON_DEPLOYER_KEY)
 * 3. At least 5000 TRX for deployment (~$1 at current prices)
 *
 * Note: Tron uses TVM (Tron Virtual Machine) which is EVM-compatible
 * The same Solidity contracts work on Tron!
 */

async function main() {
    console.log("🚀 Deploying to Tron Mainnet");
    console.log("=" .repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "TRX");

    if (balance < ethers.parseEther("1000")) {
        throw new Error("❌ Insufficient balance. Need at least 1000 TRX for deployment.");
    }

    const deployment = {
        network: "Tron Mainnet",
        chainId: "0x2b6653dc", // Tron mainnet
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {}
    };

    // 1. Deploy BTCBR-TRC20 Token
    console.log("\n[1/2] Deploying BTCBR-TRC20...");
    const BTCBR_TRC20 = await ethers.getContractFactory("BTCBR_TRC20");
    const btcbr = await BTCBR_TRC20.deploy();
    await btcbr.waitForDeployment();
    const btcbrAddress = await btcbr.getAddress();
    deployment.contracts.btcbrTRC20 = btcbrAddress;
    console.log("✅ BTCBR-TRC20 deployed at:", btcbrAddress);

    // 2. Deploy Bridge
    console.log("\n[2/2] Deploying BTCBRBridgeTron...");
    const Bridge = await ethers.getContractFactory("BTCBRBridgeTron");
    const bridge = await Bridge.deploy(btcbrAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    deployment.contracts.bridge = bridgeAddress;
    console.log("✅ BTCBRBridgeTron deployed at:", bridgeAddress);

    // 3. Grant roles
    console.log("\n[3/3] Granting MINTER and BURNER roles to bridge...");
    await btcbr.grantRole(await btcbr.MINTER_ROLE(), bridgeAddress);
    await btcbr.grantRole(await btcbr.BURNER_ROLE(), bridgeAddress);
    console.log("✅ Roles granted");

    // 4. Add validators
    const validators = [
        "0xA4522eD2379C2214D471374fFA06B06d6513686E",
        "0x55ad41D5800d53d5249fE2D7B33bde887A293c73",
        "0x7e05277D528B9192572EB1dCdAdcE3527c337Cdf"
    ];

    console.log("\n[4/4] Adding validators...");
    for (const validator of validators) {
        await bridge.addValidator(validator);
        console.log(`  ✓ Added validator: ${validator}`);
    }

    // Calculate gas used
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    deployment.gasUsed = ethers.formatEther(gasUsed);

    console.log("\n" + "=".repeat(70));
    console.log("TRON DEPLOYMENT COMPLETE");
    console.log("=".repeat(70));

    console.log("\n📊 SUMMARY:");
    console.log("  BTCBR-TRC20:", deployment.contracts.btcbrTRC20);
    console.log("  Bridge:", deployment.contracts.bridge);
    console.log("  Gas Used:", deployment.gasUsed, "TRX (~$" + (parseFloat(deployment.gasUsed) * 0.0002).toFixed(4) + ")");

    // Save deployment
    const filename = `deployment-tron-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
    console.log("\n💾 Saved to:", filename);

    console.log("\n📝 NEXT STEPS:");
    console.log("  1. Verify contracts on Tronscan");
    console.log("  2. Create SunSwap pools:");
    console.log("     - BTCBR-TRC20/TRX");
    console.log("     - BTCBR-TRC20/USDT-TRC20 ⭐ PRIORITY");
    console.log("  3. Add initial liquidity ($5K-20K recommended)");
    console.log("  4. Update frontend with Tron bridge integration");
    console.log("  5. Announce BTCBR launch on Tron");

    console.log("\n💡 WHY TRON IS CRITICAL:");
    console.log("  ✅ $0.01 transaction fees (cheapest)");
    console.log("  ✅ 50%+ of global USDT is TRC20");
    console.log("  ✅ 3-second finality");
    console.log("  ✅ Dominant in Asia (largest crypto market)");
    console.log("  ✅ Perfect for retail users");

    return deployment;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error(error);
        process.exit(1);
    });
