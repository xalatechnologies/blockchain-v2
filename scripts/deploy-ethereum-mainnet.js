import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

/**
 * Deploy wBTCBR and Bridge to Ethereum Mainnet
 *
 * Prerequisites:
 * 1. Ethereum mainnet RPC URL in .env (ETHEREUM_RPC)
 * 2. Private key with ETH for gas (ETHEREUM_DEPLOYER_KEY)
 * 3. At least 0.5 ETH for deployment (~$1000 at current prices)
 */

async function main() {
    console.log("🚀 Deploying to Ethereum Mainnet");
    console.log("=" .repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("\n📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.1")) {
        throw new Error("❌ Insufficient balance. Need at least 0.1 ETH for deployment.");
    }

    const deployment = {
        network: "Ethereum Mainnet",
        chainId: 1,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {}
    };

    // 1. Deploy wBTCBR Token
    console.log("\n[1/2] Deploying wBTCBR (Wrapped BTCBR)...");
    const wBTCBR = await ethers.getContractFactory("wBTCBR_Ethereum");
    const wbtcbr = await wBTCBR.deploy();
    await wbtcbr.waitForDeployment();
    const wbtcbrAddress = await wbtcbr.getAddress();
    deployment.contracts.wBTCBR = wbtcbrAddress;
    console.log("✅ wBTCBR deployed at:", wbtcbrAddress);

    // 2. Deploy Bridge
    console.log("\n[2/2] Deploying BTCBRBridgeEthereum...");
    const Bridge = await ethers.getContractFactory("BTCBRBridgeEthereum");
    const bridge = await Bridge.deploy(wbtcbrAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    deployment.contracts.bridge = bridgeAddress;
    console.log("✅ BTCBRBridgeEthereum deployed at:", bridgeAddress);

    // 3. Grant roles
    console.log("\n[3/3] Granting MINTER and BURNER roles to bridge...");
    await wbtcbr.grantRole(await wbtcbr.MINTER_ROLE(), bridgeAddress);
    await wbtcbr.grantRole(await wbtcbr.BURNER_ROLE(), bridgeAddress);
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
    console.log("ETHEREUM DEPLOYMENT COMPLETE");
    console.log("=".repeat(70));

    console.log("\n📊 SUMMARY:");
    console.log("  wBTCBR:", deployment.contracts.wBTCBR);
    console.log("  Bridge:", deployment.contracts.bridge);
    console.log("  Gas Used:", deployment.gasUsed, "ETH");

    // Save deployment
    const filename = `deployment-ethereum-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
    console.log("\n💾 Saved to:", filename);

    console.log("\n📝 NEXT STEPS:");
    console.log("  1. Verify contracts on Etherscan");
    console.log("  2. Create Uniswap V3 pools:");
    console.log("     - wBTCBR/ETH (0.3% fee tier)");
    console.log("     - wBTCBR/USDT (0.05% fee tier)");
    console.log("  3. Add initial liquidity ($10K-50K recommended)");
    console.log("  4. Update frontend with Ethereum bridge integration");
    console.log("  5. Announce wBTCBR launch on Ethereum");

    return deployment;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error(error);
        process.exit(1);
    });
