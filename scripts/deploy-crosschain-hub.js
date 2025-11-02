/**
 * Deploy Cross-Chain DEX Hub Contracts (Xaheen Chain)
 *
 * Deploys:
 * 1. PriceAuthority - TWAP oracle with quote signing
 * 2. SupplyController - Treasury and inventory management
 * 3. SettlementHub - Receipt processing and settlement
 */

import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
    console.log("🚀 Deploying Cross-Chain DEX Hub Contracts on Xaheen Chain...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

    // ============ Configuration ============

    // XaheenDEXPair address (XHT/USDT pair for TWAP)
    // Replace with actual deployed pair address
    const XAHEEN_PAIR_ADDRESS = process.env.XAHEEN_PAIR_ADDRESS || "0x0000000000000000000000000000000000000000";

    // Quote signer (can be deployer initially, change later)
    const QUOTE_SIGNER = deployer.address;

    // Treasury multi-sig address (3-of-5 Gnosis Safe)
    // Replace with actual multi-sig address
    const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;

    // XHT token address on Xaheen
    const XHT_TOKEN_ADDRESS = process.env.XHT_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

    // Relayer address (will be authorized to submit receipts)
    const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS || deployer.address;

    console.log("📋 Configuration:");
    console.log("   Xaheen Pair:", XAHEEN_PAIR_ADDRESS);
    console.log("   Quote Signer:", QUOTE_SIGNER);
    console.log("   Treasury:", TREASURY_ADDRESS);
    console.log("   XHT Token:", XHT_TOKEN_ADDRESS);
    console.log("   Relayer:", RELAYER_ADDRESS);
    console.log();

    // ============ Deploy PriceAuthority ============

    console.log("📊 Deploying PriceAuthority...");
    const PriceAuthority = await ethers.getContractFactory("PriceAuthority");
    const priceAuthority = await PriceAuthority.deploy(
        XAHEEN_PAIR_ADDRESS,
        QUOTE_SIGNER
    );
    await priceAuthority.waitForDeployment();
    const priceAuthorityAddress = await priceAuthority.getAddress();
    console.log("✅ PriceAuthority deployed at:", priceAuthorityAddress);
    console.log();

    // ============ Deploy SupplyController ============

    console.log("🏦 Deploying SupplyController...");
    const SupplyController = await ethers.getContractFactory("SupplyController");
    const supplyController = await SupplyController.deploy(
        XHT_TOKEN_ADDRESS,
        TREASURY_ADDRESS
    );
    await supplyController.waitForDeployment();
    const supplyControllerAddress = await supplyController.getAddress();
    console.log("✅ SupplyController deployed at:", supplyControllerAddress);
    console.log();

    // ============ Deploy SettlementHub ============

    console.log("⚖️  Deploying SettlementHub...");
    const SettlementHub = await ethers.getContractFactory("SettlementHub");
    const settlementHub = await SettlementHub.deploy(
        supplyControllerAddress,
        priceAuthorityAddress,
        RELAYER_ADDRESS
    );
    await settlementHub.waitForDeployment();
    const settlementHubAddress = await settlementHub.getAddress();
    console.log("✅ SettlementHub deployed at:", settlementHubAddress);
    console.log();

    // ============ Configure Chains ============

    console.log("⚙️  Configuring chains in SupplyController...");

    // Add BSC (Chain ID 56)
    const bscDailyLimit = ethers.parseEther("50000"); // $50K
    const bscInventoryCap = 300; // 3% of total supply
    console.log("   Adding BSC (56) - Daily Limit: $50K, Cap: 3%");
    await supplyController.addChain(56, bscDailyLimit, bscInventoryCap);

    // Add Polygon (Chain ID 137)
    const polygonDailyLimit = ethers.parseEther("50000"); // $50K
    const polygonInventoryCap = 200; // 2% of total supply
    console.log("   Adding Polygon (137) - Daily Limit: $50K, Cap: 2%");
    await supplyController.addChain(137, polygonDailyLimit, polygonInventoryCap);

    // Add Ethereum (Chain ID 1)
    const ethDailyLimit = ethers.parseEther("50000"); // $50K
    const ethInventoryCap = 100; // 1% of total supply
    console.log("   Adding Ethereum (1) - Daily Limit: $50K, Cap: 1%");
    await supplyController.addChain(1, ethDailyLimit, ethInventoryCap);

    console.log("✅ Chains configured successfully");
    console.log();

    // ============ Summary ============

    console.log("🎉 Deployment Complete!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Hub Contracts (Xaheen Chain):");
    console.log("   PriceAuthority:    ", priceAuthorityAddress);
    console.log("   SupplyController:  ", supplyControllerAddress);
    console.log("   SettlementHub:     ", settlementHubAddress);
    console.log("═══════════════════════════════════════════════════════════");
    console.log();

    console.log("📝 Next Steps:");
    console.log("1. Deploy spoke contracts on BSC, Polygon, Ethereum");
    console.log("2. Initialize TWAP checkpoint: priceAuthority.updateCheckpoint()");
    console.log("3. Grant OPERATOR_ROLE to relayer service");
    console.log("4. Setup multi-sig treasury (3-of-5 Gnosis Safe)");
    console.log("5. Deploy arbitrage bot");
    console.log();

    console.log("💾 Save these addresses to .env:");
    console.log(`PRICE_AUTHORITY_ADDRESS=${priceAuthorityAddress}`);
    console.log(`SUPPLY_CONTROLLER_ADDRESS=${supplyControllerAddress}`);
    console.log(`SETTLEMENT_HUB_ADDRESS=${settlementHubAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
