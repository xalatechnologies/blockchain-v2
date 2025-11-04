/**
 * @title Nor Chain Ecosystem Deployment Script
 * @notice Deploys all core Nor Chain contracts in proper order
 * @dev Run with: npx hardhat run scripts/deploy-nor-ecosystem.js --network btcbr
 *
 * Deployment Order:
 * 1. NOR Token (native token)
 * 2. Governance (Timelock + Governor)
 * 3. DEX (Factory, WNOR, Router)
 * 4. Stablecoins (Dirhamat, Digital KES)
 * 5. FundUnit (example fund)
 */

import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

/**
 * NOOR CHAIN ECOSYSTEM DEPLOYMENT
 *
 * Deploys complete DeFi infrastructure:
 * 1. Wrapped NOR (WNOR) - Native token wrapper
 * 2. NorSwap Factory - DEX factory
 * 3. NorSwap Router - DEX router
 * 4. Oracle contracts
 * 5. Bridge contracts
 *
 * Network: Nor Chain (Chain ID 65001)
 * RPC: http://3.91.50.187:8545
 */

const DEPLOYMENT_CONFIG = {
  network: "nor",
  rpc: "http://3.91.50.187:8545",
  chainId: 65001,
  btcbrAddress: "0x0cF8e180350253271f4b917CcFb0aCCc4862F262",
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
};

const deploymentResults = {
  timestamp: new Date().toISOString(),
  chainId: DEPLOYMENT_CONFIG.chainId,
  contracts: {},
  pairs: [],
};

async function main() {
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("         🌙 NOOR CHAIN ECOSYSTEM DEPLOYMENT 🌙");
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "NOR");

  // Get current nonce
  const nonce = await ethers.provider.getTransactionCount(
    deployer.address,
    "latest"
  );
  console.log("🔢 Current nonce:", nonce);
  console.log("");

  // Step 1: Deploy WNOR (Wrapped NOR)
  console.log("📦 Step 1: Deploying WNOR (Wrapped NOR)...");
  const WNOR = await ethers.getContractFactory("WNOR");
  const wnor = await WNOR.deploy({
    gasPrice: ethers.parseUnits("10", "gwei"),
    gasLimit: 3000000,
    nonce: nonce,
  });
  await wnor.waitForDeployment();
  const wnorAddress = await wnor.getAddress();
  console.log("   ✅ WNOR deployed at:", wnorAddress);
  deploymentResults.contracts.WNOR = wnorAddress;
  console.log("");

  // Step 2: Deploy NorSwap Factory
  console.log("📦 Step 2: Deploying NorSwap Factory...");
  const NorSwapFactory = await ethers.getContractFactory("NorSwapFactory");
  const factory = await NorSwapFactory.deploy(deployer.address); // feeToSetter
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory deployed at:", factoryAddress);
  deploymentResults.contracts.NorSwapFactory = factoryAddress;

  const initCodeHash = await factory.INIT_CODE_PAIR_HASH();
  console.log("   📋 INIT_CODE_PAIR_HASH:", initCodeHash);
  deploymentResults.contracts.initCodeHash = initCodeHash;
  console.log("");

  // Step 3: Deploy NorSwap Router
  console.log("📦 Step 3: Deploying NorSwap Router...");
  const NorSwapRouter = await ethers.getContractFactory("NorSwapRouter");
  const router = await NorSwapRouter.deploy(factoryAddress, wnorAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("   ✅ Router deployed at:", routerAddress);
  deploymentResults.contracts.NorSwapRouter = routerAddress;
  console.log("");

  // Step 4: Create BTCBR/WNOR Pair
  console.log("📦 Step 4: Creating BTCBR/WNOR trading pair...");
  const createPairTx = await factory.createPair(
    DEPLOYMENT_CONFIG.btcbrAddress,
    wnorAddress
  );
  await createPairTx.wait();
  const btcbrWnorPair = await factory.getPair(
    DEPLOYMENT_CONFIG.btcbrAddress,
    wnorAddress
  );
  console.log("   ✅ BTCBR/WNOR Pair created at:", btcbrWnorPair);
  deploymentResults.pairs.push({
    name: "BTCBR/WNOR",
    address: btcbrWnorPair,
    token0: DEPLOYMENT_CONFIG.btcbrAddress,
    token1: wnorAddress,
  });
  console.log("");

  // Step 5: Verify BTCBR contract
  console.log("📦 Step 5: Verifying BTCBR token...");
  const btcbr = await ethers.getContractAt(
    [
      "function totalSupply() view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ],
    DEPLOYMENT_CONFIG.btcbrAddress
  );
  const totalSupply = await btcbr.totalSupply();
  const symbol = await btcbr.symbol();
  const decimals = await btcbr.decimals();
  console.log("   ✅ Symbol:", symbol);
  console.log("   ✅ Decimals:", decimals);
  console.log("   ✅ Total Supply:", ethers.formatUnits(totalSupply, decimals));
  deploymentResults.contracts.BTCBR = {
    address: DEPLOYMENT_CONFIG.btcbrAddress,
    symbol,
    decimals: Number(decimals),
    totalSupply: totalSupply.toString(),
  };
  console.log("");

  // Step 6: Save deployment info
  console.log("📦 Step 6: Saving deployment information...");
  const deploymentPath = "deployments/nor-ecosystem-deployment.json";
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentResults, null, 2));
  console.log("   ✅ Deployment info saved to:", deploymentPath);
  console.log("");

  // Summary
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("                      🎉 DEPLOYMENT COMPLETE! 🎉");
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log("📋 Deployed Contracts:");
  console.log("   BTCBR Token:      ", DEPLOYMENT_CONFIG.btcbrAddress);
  console.log("   WNOR:             ", wnorAddress);
  console.log("   NorSwap Factory: ", factoryAddress);
  console.log("   NorSwap Router:  ", routerAddress);
  console.log("   BTCBR/WNOR Pair:  ", btcbrWnorPair);
  console.log("");
  console.log(
    "🔗 Network: Nor Chain (Chain ID",
    DEPLOYMENT_CONFIG.chainId + ")"
  );
  console.log("🌐 RPC:", DEPLOYMENT_CONFIG.rpc);
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Add liquidity to BTCBR/WNOR pair");
  console.log("   2. Deploy oracle contracts");
  console.log("   3. Deploy bridge contracts");
  console.log("   4. Configure governance");
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════════════════"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

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
