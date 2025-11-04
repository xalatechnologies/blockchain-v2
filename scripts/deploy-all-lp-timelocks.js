import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n🔐 DEPLOYING LP TIMELOCK CONTRACTS FOR ALL PAIRS");
  console.log("=".repeat(70));

  // Load liquidity info
  const usdtLiquidity = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/xaheen-liquidity-deployed.json",
      "utf8"
    )
  );
  const bnbEthLiquidity = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/bnb-eth-liquidity-deployed.json",
      "utf8"
    )
  );

  const pairs = [
    { name: "NOR/USDT", address: usdtLiquidity.pair },
    { name: "NOR/BNB", address: bnbEthLiquidity.pools["NOR/BNB"].pairAddress },
    { name: "NOR/ETH", address: bnbEthLiquidity.pools["NOR/ETH"].pairAddress },
  ];

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("  Balance:", ethers.formatEther(balance), "NOR");

  // Get contract factory
  const LPTokenTimelock = await ethers.getContractFactory(
    "LPTokenTimelock",
    wallet
  );

  const deployments = {};

  for (const pair of pairs) {
    console.log("\n" + "=".repeat(70));
    console.log(`📝 DEPLOYING TIMELOCK FOR ${pair.name}`);
    console.log("=".repeat(70));
    console.log("\n📍 LP Token:", pair.address);
    console.log("📍 Beneficiary:", wallet.address);

    // Deploy
    console.log("\n⏳ Deploying...");
    const timelock = await LPTokenTimelock.deploy(pair.address, wallet.address);
    await timelock.waitForDeployment();
    const timelockAddr = await timelock.getAddress();

    console.log("✅ Deployed:", timelockAddr);

    // Verify
    const lpToken = await timelock.lpToken();
    const beneficiary = await timelock.beneficiary();
    console.log("\n🔍 Verification:");
    console.log("  LP Token:", lpToken);
    console.log("  Beneficiary:", beneficiary);
    console.log(
      "  Match:",
      lpToken.toLowerCase() === pair.address.toLowerCase()
    );

    deployments[pair.name] = {
      lpToken: pair.address,
      timelockContract: timelockAddr,
      beneficiary: wallet.address,
    };
  }

  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    deployer: wallet.address,
    timelocks: deployments,
  };

  fs.writeFileSync(
    "docs/deployment-logs/all-lp-timelocks.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log(
    "💾 Deployment info saved to: docs/deployment-logs/all-lp-timelocks.json"
  );

  console.log("\n📊 DEPLOYMENT SUMMARY:");
  for (const [name, info] of Object.entries(deployments)) {
    console.log(`\n${name}:`);
    console.log(`  LP Token: ${info.lpToken}`);
    console.log(`  Timelock: ${info.timelockContract}`);
    console.log(
      `  Explorer: https://explorer.xaheen.org/address/${info.timelockContract}`
    );
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 ALL TIMELOCK CONTRACTS DEPLOYED!");
  console.log("=".repeat(70));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
