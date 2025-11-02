/**
 * @title Noor Chain Ecosystem Deployment Script
 * @notice Deploys all core Noor Chain contracts in proper order
 * @dev Run with: npx hardhat run scripts/deploy-noor-ecosystem.js --network btcbr
 *
 * Deployment Order:
 * 1. NOR Token (native token)
 * 2. Governance (Timelock + Governor)
 * 3. DEX (Factory, WNOR, Router)
 * 4. Stablecoins (Dirhamat, Digital KES)
 * 5. FundUnit (example fund)
 */

import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("🌙 Noor Chain Ecosystem Deployment Started\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\n📝 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "NOR\n");

  const deployedContracts = {};

  try {
    // ==================== 1. NOR TOKEN ====================
    console.log("=".repeat(60));
    console.log("1️⃣  Deploying NOR Token...");
    console.log("=".repeat(60));

    const NOR = await ethers.getContractFactory("NOR");
    const norToken = await NOR.deploy();
    await norToken.waitForDeployment();
    const norAddress = await norToken.getAddress();

    deployedContracts.NOR = norAddress;

    console.log("✅ NOR Token deployed to:", norAddress);
    console.log("   Total Supply:", ethers.formatUnits(await norToken.totalSupply(), 24), "NOR");
    console.log("   Decimals:", await norToken.decimals());

    // ==================== 2. GOVERNANCE ====================
    console.log("\n" + "=".repeat(60));
    console.log("2️⃣  Deploying Governance Contracts...");
    console.log("=".repeat(60));

    // Deploy Timelock Controller
    console.log("\n📋 Deploying TimelockController...");
    const minDelay = 2 * 24 * 60 * 60; // 2 days
    const proposers = [deployer.address];
    const executors = [deployer.address];
    const admin = deployer.address;

    const Timelock = await ethers.getContractFactory("TimelockController");
    const timelock = await Timelock.deploy(minDelay, proposers, executors, admin);
    await timelock.waitForDeployment();
    const timelockAddress = await timelock.getAddress();

    deployedContracts.Timelock = timelockAddress;
    console.log("✅ Timelock deployed to:", timelockAddress);
    console.log("   Min Delay:", minDelay / 86400, "days");

    // Initial council members
    const councilMembers = [
      deployer.address, // Noor Chain Foundation
      "0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE", // UAE Institutional Partner
      "0x689CF2C189781d9bB6859A830acbF64044E4432f", // Kenya Partner
      "0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a", // Nordic Partner
      "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD"  // Additional Partner
    ];

    // Deploy Governor
    console.log("\n📋 Deploying NoorGovernance...");
    const Governor = await ethers.getContractFactory("NoorGovernance");
    const governor = await Governor.deploy(norAddress, timelockAddress, councilMembers);
    await governor.waitForDeployment();
    const governorAddress = await governor.getAddress();

    deployedContracts.Governor = governorAddress;
    console.log("✅ Governor deployed to:", governorAddress);
    console.log("   Council Members:", councilMembers.length);

    // ==================== 3. DEX CONTRACTS ====================
    console.log("\n" + "=".repeat(60));
    console.log("3️⃣  Deploying NoorSwap DEX...");
    console.log("=".repeat(60));

    // Deploy Factory
    console.log("\n📋 Deploying NoorSwapFactory...");
    const Factory = await ethers.getContractFactory("NoorSwapFactory");
    const factory = await Factory.deploy(deployer.address); // feeToSetter
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    deployedContracts.NoorSwapFactory = factoryAddress;
    console.log("✅ Factory deployed to:", factoryAddress);

    // For WNOR, we'll use the NOR token itself as a placeholder
    // In production, you'd deploy a proper WNOR wrapper contract
    const wnorAddress = norAddress; // Using NOR as WNOR for now

    // Deploy Router
    console.log("\n📋 Deploying NoorSwapRouter...");
    const Router = await ethers.getContractFactory("NoorSwapRouter");
    const router = await Router.deploy(factoryAddress, wnorAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();

    deployedContracts.NoorSwapRouter = routerAddress;
    console.log("✅ Router deployed to:", routerAddress);
    console.log("   Factory:", factoryAddress);
    console.log("   WNOR:", wnorAddress);

    // ==================== 4. STABLECOINS ====================
    console.log("\n" + "=".repeat(60));
    console.log("4️⃣  Deploying Stablecoins...");
    console.log("=".repeat(60));

    // Deploy mock oracles (in production, use Chainlink or similar)
    const MockOracle = await ethers.getContractFactory("MockOracle");

    console.log("\n📋 Deploying Mock Oracles...");
    const goldOracle = await MockOracle.deploy();
    await goldOracle.waitForDeployment();
    const goldOracleAddress = await goldOracle.getAddress();

    const aedUsdOracle = await MockOracle.deploy();
    await aedUsdOracle.waitForDeployment();
    const aedUsdOracleAddress = await aedUsdOracle.getAddress();

    const kesUsdOracle = await MockOracle.deploy();
    await kesUsdOracle.waitForDeployment();
    const kesUsdOracleAddress = await kesUsdOracle.getAddress();

    console.log("✅ Mock Oracles deployed");

    // Deploy Dirhamat
    console.log("\n📋 Deploying Dirhamat...");
    const Dirhamat = await ethers.getContractFactory("Dirhamat");
    const dirhamat = await Dirhamat.deploy(
      goldOracleAddress,
      aedUsdOracleAddress,
      deployer.address // complianceCore
    );
    await dirhamat.waitForDeployment();
    const dirhamatAddress = await dirhamat.getAddress();

    deployedContracts.Dirhamat = dirhamatAddress;
    console.log("✅ Dirhamat deployed to:", dirhamatAddress);
    console.log("   Symbol:", await dirhamat.symbol());
    console.log("   Decimals:", await dirhamat.decimals());

    // Deploy Digital KES
    console.log("\n📋 Deploying Digital KES...");
    const DigitalKES = await ethers.getContractFactory("DigitalKES");
    const digitalKES = await DigitalKES.deploy(
      kesUsdOracleAddress,
      deployer.address // complianceCore
    );
    await digitalKES.waitForDeployment();
    const digitalKESAddress = await digitalKES.getAddress();

    deployedContracts.DigitalKES = digitalKESAddress;
    console.log("✅ Digital KES deployed to:", digitalKESAddress);
    console.log("   Symbol:", await digitalKES.symbol());

    // ==================== 5. FUND UNIT (EXAMPLE) ====================
    console.log("\n" + "=".repeat(60));
    console.log("5️⃣  Deploying Example Fund Unit...");
    console.log("=".repeat(60));

    const FundUnit = await ethers.getContractFactory("FundUnit");
    const fundUnit = await FundUnit.deploy(
      "Noor Gold Savings Fund",
      "NOOR-GOLD",
      "Gold Savings",
      "Murabahah",
      deployer.address, // fundManager
      deployer.address, // navOracle
      deployer.address  // zakatRecipient
    );
    await fundUnit.waitForDeployment();
    const fundUnitAddress = await fundUnit.getAddress();

    deployedContracts.FundUnit = fundUnitAddress;
    console.log("✅ Fund Unit deployed to:", fundUnitAddress);
    console.log("   Name:", await fundUnit.name());
    console.log("   Type:", await fundUnit.fundType());
    console.log("   Shariah Structure:", await fundUnit.shariahStructure());

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Deployment Complete!");
    console.log("=".repeat(60));

    console.log("\n📋 Deployed Contracts:");
    console.log("━".repeat(60));
    for (const [name, address] of Object.entries(deployedContracts)) {
      console.log(`${name.padEnd(20)} : ${address}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📝 Next Steps:");
    console.log("=".repeat(60));
    console.log("1. Initialize liquidity pools on NoorSwap");
    console.log("2. Update reserve backing for Dirhamat and Digital KES");
    console.log("3. Configure bank licenses for Digital KES");
    console.log("4. Set up NAV oracles for FundUnit");
    console.log("5. Grant appropriate roles to validators and partners");
    console.log("6. Verify contracts on block explorer");

    // Save deployment addresses to file
    const fs = await import("fs");
    const deploymentData = {
      network: "noor-chain",
      chainId: 65001,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployedContracts
    };

    fs.writeFileSync(
      "deployment-addresses.json",
      JSON.stringify(deploymentData, null, 2)
    );

    console.log("\n✅ Deployment addresses saved to deployment-addresses.json");
    console.log("\n🌙 Noor Chain - Illuminating the Future of Finance 🌙\n");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

/**
 * @title MockOracle
 * @notice Simple mock oracle for testing (deploy proper oracles in production)
 */
const mockOracleCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockOracle {
    uint256 public price = 1 * 10**18; // Default price: 1.0

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
`;

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
