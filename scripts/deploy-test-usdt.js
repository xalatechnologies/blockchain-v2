import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n🪙 DEPLOYING TEST USDT ON XAHEEN CHAIN");
  console.log("=".repeat(70));

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 NOR Balance:", ethers.formatEther(balance), "NOR");

  console.log("\n📝 Deploying Test USDT Contract...");

  // Simple ERC20 contract for testing
  const TestUSDT = await ethers.getContractFactory(
    "contracts/test/TestERC20.sol:TestERC20",
    wallet
  );

  // Deploy with 1 Million USDT initial supply
  const initialSupply = ethers.parseUnits("1000000", 18); // 1M USDT with 18 decimals
  const usdt = await TestUSDT.deploy("Test USDT", "USDT", initialSupply);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();

  console.log("✅ Test USDT deployed:", usdtAddress);

  // Verify deployment
  const name = await usdt.name();
  const symbol = await usdt.symbol();
  const decimals = await usdt.decimals();
  const totalSupply = await usdt.totalSupply();
  const deployerBalance = await usdt.balanceOf(wallet.address);

  console.log("\n📊 TOKEN INFO:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  console.log(
    "  Total Supply:",
    ethers.formatUnits(totalSupply, decimals),
    symbol
  );
  console.log(
    "  Your Balance:",
    ethers.formatUnits(deployerBalance, decimals),
    symbol
  );

  // Save deployment info
  const deployment = {
    network: "Nor Chain",
    chainId: 65001,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contract: {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
      address: usdtAddress,
    },
  };

  const deploymentPath = "docs/deployment-logs/test-usdt-deployment.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("\n💾 Deployment saved to:", deploymentPath);

  console.log("\n🔍 VERIFY ON EXPLORER:");
  console.log("  ", `https://explorer.xaheen.org/address/${usdtAddress}`);

  console.log("\n⚠️  NOTE: This is TEST USDT for development only!");
  console.log("   For production, bridge real USDT from BSC mainnet.");

  console.log("\n💡 NEXT STEP:");
  console.log("   Add liquidity with this USDT:");
  console.log("   node scripts/add-initial-liquidity-xaheen.js");

  console.log("\n" + "=".repeat(70));

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
