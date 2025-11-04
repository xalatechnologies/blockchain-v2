import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💰 DEPLOYING NOR STAKING AND BURN MECHANISM");
  console.log("=".repeat(70));

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("  Balance:", ethers.formatEther(balance), "NOR");

  const deployments = {};

  // 1. Deploy NORStaking
  console.log("\n" + "=".repeat(70));
  console.log("📝 DEPLOYING NOR STAKING CONTRACT");
  console.log("=".repeat(70));

  const NORStaking = await ethers.getContractFactory("NORStaking", wallet);
  console.log("\n⏳ Deploying NORStaking...");

  const stakingContract = await NORStaking.deploy();
  await stakingContract.waitForDeployment();
  const stakingAddr = await stakingContract.getAddress();

  console.log("✅ NORStaking deployed:", stakingAddr);

  // Verify
  const totalStaked = await stakingContract.totalStaked();
  const totalSupply = await stakingContract.totalSupply();
  const currentAPY = await stakingContract.calculateDynamicAPY();

  console.log("\n🔍 Verification:");
  console.log("  Total Staked:", ethers.formatEther(totalStaked), "NOR");
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "NOR");
  console.log("  Current APY:", currentAPY.toString(), "%");

  deployments.staking = {
    address: stakingAddr,
    totalStaked: ethers.formatEther(totalStaked),
    totalSupply: ethers.formatEther(totalSupply),
    currentAPY: currentAPY.toString(),
  };

  // 2. Deploy NORBurnMechanism
  console.log("\n" + "=".repeat(70));
  console.log("📝 DEPLOYING NOR BURN MECHANISM");
  console.log("=".repeat(70));

  const NORBurnMechanism = await ethers.getContractFactory(
    "NORBurnMechanism",
    wallet
  );
  console.log("\n⏳ Deploying NORBurnMechanism...");

  const burnContract = await NORBurnMechanism.deploy();
  await burnContract.waitForDeployment();
  const burnAddr = await burnContract.getAddress();

  console.log("✅ NORBurnMechanism deployed:", burnAddr);

  // Verify
  const totalBurned = await burnContract.totalBurned();
  const currentSupply = await burnContract.getCurrentSupply();
  const gasBurnPercentage = await burnContract.gasBurnPercentage();
  const validatorBurnPercentage = await burnContract.validatorBurnPercentage();
  const bridgeBurnPercentage = await burnContract.bridgeBurnPercentage();

  console.log("\n🔍 Verification:");
  console.log("  Total Burned:", ethers.formatEther(totalBurned), "NOR");
  console.log("  Current Supply:", ethers.formatEther(currentSupply), "NOR");
  console.log("  Gas Burn %:", gasBurnPercentage.toString(), "%");
  console.log("  Validator Burn %:", validatorBurnPercentage.toString(), "%");
  console.log("  Bridge Burn %:", bridgeBurnPercentage.toString(), "%");

  deployments.burn = {
    address: burnAddr,
    totalBurned: ethers.formatEther(totalBurned),
    currentSupply: ethers.formatEther(currentSupply),
    gasBurnPercentage: gasBurnPercentage.toString(),
    validatorBurnPercentage: validatorBurnPercentage.toString(),
    bridgeBurnPercentage: bridgeBurnPercentage.toString(),
  };

  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    chainId: 65001,
    deployer: wallet.address,
    contracts: deployments,
  };

  fs.writeFileSync(
    "docs/deployment-logs/staking-burn-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log(
    "💾 Deployment info saved to: docs/deployment-logs/staking-burn-deployment.json"
  );

  console.log("\n📊 DEPLOYMENT SUMMARY:");
  console.log("\n💎 Staking Contract:");
  console.log("  Address:", stakingAddr);
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "NOR");
  console.log("  Current APY:", currentAPY.toString(), "%");
  console.log("  Min Stake: 1,000 NOR");
  console.log("  Validator Stake: 10,000 NOR");
  console.log(
    "  Explorer:",
    `https://explorer.xaheen.org/address/${stakingAddr}`
  );

  console.log("\n🔥 Burn Mechanism:");
  console.log("  Address:", burnAddr);
  console.log("  Initial Supply:", ethers.formatEther(currentSupply), "NOR");
  console.log("  Minimum Floor: 100,000,000 NOR");
  console.log("  Gas Burn:", gasBurnPercentage.toString(), "%");
  console.log("  Validator Burn:", validatorBurnPercentage.toString(), "%");
  console.log("  Bridge Burn:", bridgeBurnPercentage.toString(), "%");
  console.log("  Explorer:", `https://explorer.xaheen.org/address/${burnAddr}`);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 STAKING AND BURN CONTRACTS DEPLOYED!");
  console.log("=".repeat(70));

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Deploy NORRevenue contract with these addresses");
  console.log("2. Configure revenue distribution to staking contract");
  console.log("3. Setup automatic burn integration with validators");
  console.log("4. Enable staking on frontend");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
