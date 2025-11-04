import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💎 DEPLOYING TEST BNB & ETH TOKENS");
  console.log("=".repeat(70));

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "NOR");

  // Deploy WBNB (Test BNB)
  console.log("\n📝 DEPLOYING WBNB (Wrapped BNB)...");

  const TestBNB = await ethers.getContractFactory(
    "contracts/test/TestERC20.sol:TestERC20",
    wallet
  );
  const initialSupply = ethers.parseUnits("100000", 18); // 100,000 BNB

  const wbnb = await TestBNB.deploy("Wrapped BNB", "WBNB", initialSupply);
  await wbnb.waitForDeployment();
  const wbnbAddress = await wbnb.getAddress();

  console.log("  ✅ WBNB deployed:", wbnbAddress);
  console.log(
    "  Initial supply:",
    ethers.formatUnits(initialSupply, 18),
    "WBNB"
  );

  // Deploy WETH (Test ETH)
  console.log("\n📝 DEPLOYING WETH (Wrapped ETH)...");

  const TestETH = await ethers.getContractFactory(
    "contracts/test/TestERC20.sol:TestERC20",
    wallet
  );
  const wethSupply = ethers.parseUnits("100000", 18); // 100,000 ETH

  const weth = await TestETH.deploy("Wrapped Ether", "WETH", wethSupply);
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();

  console.log("  ✅ WETH deployed:", wethAddress);
  console.log("  Initial supply:", ethers.formatUnits(wethSupply, 18), "WETH");

  console.log("\n💰 CHECKING BALANCES:");
  const wbnbBalance = await wbnb.balanceOf(wallet.address);
  const wethBalance = await weth.balanceOf(wallet.address);

  console.log("  Your WBNB:", ethers.formatUnits(wbnbBalance, 18), "WBNB");
  console.log("  Your WETH:", ethers.formatUnits(wethBalance, 18), "WETH");

  console.log("\n✅ TOKEN DEPLOYMENT COMPLETE!");

  // Save deployment info
  const deployment = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    deployer: wallet.address,
    tokens: {
      WBNB: {
        address: wbnbAddress,
        name: "Wrapped BNB",
        symbol: "WBNB",
        decimals: 18,
        initialSupply: ethers.formatUnits(initialSupply, 18) + " WBNB",
      },
      WETH: {
        address: wethAddress,
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
        initialSupply: ethers.formatUnits(wethSupply, 18) + " WETH",
      },
    },
    verification: {
      wbnb: `https://explorer.xaheen.org/address/${wbnbAddress}`,
      weth: `https://explorer.xaheen.org/address/${wethAddress}`,
    },
  };

  fs.writeFileSync(
    "docs/deployment-logs/test-bnb-eth-deployment.json",
    JSON.stringify(deployment, null, 2)
  );

  console.log(
    "\n💾 Deployment info saved to: docs/deployment-logs/test-bnb-eth-deployment.json"
  );

  console.log("\n🔗 VERIFICATION:");
  console.log("  WBNB:", `https://explorer.xaheen.org/address/${wbnbAddress}`);
  console.log("  WETH:", `https://explorer.xaheen.org/address/${wethAddress}`);

  console.log("\n" + "=".repeat(70));
  console.log("✅ WBNB & WETH DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
