/**
 * @fileoverview Deploy NEXRouter contract for NEX Exchange
 * @description Deploys the advanced cross-chain DEX router with NOR gas payment support
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NEXRouter Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get contract addresses from config
  const network = hre.network.name;
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  
  console.log(`Network: ${network} (Chain ID: ${chainId})\n`);

  // Contract addresses (adjust based on network)
  let norTokenAddress, norChainRouterAddress, gasPriceOracleAddress, feeCollectorAddress;

  if (chainId === 65001n) {
    // NorChain addresses
    norTokenAddress = process.env.NOR_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
    norChainRouterAddress = process.env.NORSWAP_ROUTER_ADDRESS || "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80";
    gasPriceOracleAddress = process.env.GAS_PRICE_ORACLE_ADDRESS || deployer.address; // Placeholder
    feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;
  } else {
    // BSC/Ethereum addresses (would need to be set)
    console.log("⚠️  Cross-chain deployment - ensure addresses are configured");
    norTokenAddress = process.env.NOR_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
    norChainRouterAddress = process.env.NORSWAP_ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000";
    gasPriceOracleAddress = process.env.GAS_PRICE_ORACLE_ADDRESS || deployer.address;
    feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;
  }

  console.log("Configuration:");
  console.log("  NOR Token:", norTokenAddress);
  console.log("  NorChain Router:", norChainRouterAddress);
  console.log("  Gas Price Oracle:", gasPriceOracleAddress);
  console.log("  Fee Collector:", feeCollectorAddress);
  console.log();

  // Deploy NEXRouter
  console.log("📝 Deploying NEXRouter...");
  const NEXRouter = await ethers.getContractFactory("NEXRouter");
  const nexRouter = await NEXRouter.deploy(
    norTokenAddress,
    norChainRouterAddress,
    gasPriceOracleAddress,
    feeCollectorAddress
  );

  await nexRouter.waitForDeployment();
  const nexRouterAddress = await nexRouter.getAddress();

  console.log("✅ NEXRouter deployed to:", nexRouterAddress);
  console.log("   Transaction hash:", nexRouter.deploymentTransaction()?.hash);
  console.log();

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const norToken = await nexRouter.norToken();
  const router = await nexRouter.norChainRouter();
  const tradingFee = await nexRouter.tradingFeeBps();

  console.log("Deployment verified:");
  console.log("  NOR Token:", norToken);
  console.log("  Router:", router);
  console.log("  Trading Fee:", tradingFee.toString(), "bps (0." + (tradingFee / 100).toFixed(2) + "%)");
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: network,
    chainId: chainId.toString(),
    contract: "NEXRouter",
    address: nexRouterAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs: {
      norToken: norTokenAddress,
      norChainRouter: norChainRouterAddress,
      gasPriceOracle: gasPriceOracleAddress,
      feeCollector: feeCollectorAddress
    },
    verification: {
      norToken,
      router,
      tradingFee: tradingFee.toString()
    }
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log();

  // Save to file
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${deploymentsDir}/nex-router-${network}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", filename);
  console.log();

  console.log("🎉 NEXRouter deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Configure chain routers: nexRouter.setChainRouter(chainId, routerAddress)");
  console.log("2. Add supported tokens: nexRouter.setTokenSupport(chainId, tokenAddress, true)");
  console.log("3. Update fee collector if needed: nexRouter.setFeeCollector(address)");
  console.log("4. Verify contract on block explorer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

