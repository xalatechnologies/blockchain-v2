import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import https from "https";

// Fix SSL self-signed certificate issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  console.log("\n🚀 DEPLOYING NORSWAP DEX ON NORCHAIN");
  console.log("=".repeat(70));

  // Connect to NorChain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n📍 Deployer:", wallet.address);

  // Check balance
  console.log("⏳ Checking NOR balance...");
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 NOR Balance:", ethers.formatEther(balance), "NOR");

  const minRequired = ethers.parseEther("1000");
  if (balance < minRequired) {
    console.log("\n❌ INSUFFICIENT NOR BALANCE");
    console.log("   Need: 1,000 NOR minimum");
    console.log("   Have:", ethers.formatEther(balance), "NOR");
    console.log("\n💡 TIP: Bridge NOR from BSC to NorChain first");
    process.exit(1);
  }

  console.log("✅ Sufficient balance for deployment");

  // Check if already deployed
  if (fs.existsSync("docs/deployment-logs/norchain-dex-deployment.json")) {
    console.log("\n⚠️  DEX ALREADY DEPLOYED!");
    const existing = JSON.parse(
      fs.readFileSync("docs/deployment-logs/norchain-dex-deployment.json")
    );
    console.log("\n📋 EXISTING DEPLOYMENT:");
    console.log("  WNOR:", existing.contracts.WNOR);
    console.log("  Factory:", existing.contracts.Factory);
    console.log("  Router:", existing.contracts.Router);
    console.log("\n💡 To redeploy, delete the file above and run again");
    process.exit(0);
  }

  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYING 3 CONTRACTS");
  console.log("=".repeat(70));

  // Step 1: Deploy WNOR
  console.log("\n📝 [1/3] Deploying WNOR (Wrapped NOR)...");
  console.log("   Purpose: Wrap native NOR for liquidity pairs");

  const WNOR = await ethers.getContractFactory(
    "contracts/dex/WNOR.sol:WNOR",
    wallet
  );

  console.log("   ⏳ Sending transaction...");
  const wnor = await WNOR.deploy();

  console.log("   ⏳ Waiting for deployment...");
  await wnor.waitForDeployment();
  const wnorAddress = await wnor.getAddress();

  console.log("   ✅ WNOR deployed:", wnorAddress);

  // Step 2: Deploy Factory
  console.log("\n📝 [2/3] Deploying NorDEXFactory...");
  console.log("   Purpose: Creates trading pairs (NOR/BTCBR, etc.)");

  const revenueContract = "0x0000000000000000000000000000000000000000";

  const Factory = await ethers.getContractFactory(
    "contracts/dex/NorDEXFactory.sol:NorDEXFactory",
    wallet
  );

  console.log("   ⏳ Sending transaction...");
  const factory = await Factory.deploy(wallet.address, revenueContract);

  console.log("   ⏳ Waiting for deployment...");
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("   ✅ Factory deployed:", factoryAddress);

  // Step 3: Deploy Router
  console.log("\n📝 [3/3] Deploying NorDEXRouter...");
  console.log("   Purpose: Handles swaps and liquidity operations");

  const Router = await ethers.getContractFactory(
    "contracts/dex/NorDEXRouter.sol:NorDEXRouter",
    wallet
  );

  console.log("   ⏳ Sending transaction...");
  const router = await Router.deploy(factoryAddress, wnorAddress);

  console.log("   ⏳ Waiting for deployment...");
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();

  console.log("   ✅ Router deployed:", routerAddress);

  // Verification
  console.log("\n📝 Verifying deployment...");
  const factoryFromRouter = await router.factory();
  const wnorFromRouter = await router.WETH(); // WETH in Uniswap = WNOR for us

  console.log("\n✅ VERIFICATION:");
  console.log("  Factory matches:", factoryFromRouter === factoryAddress ? "✓" : "✗");
  console.log("  WNOR matches:", wnorFromRouter === wnorAddress ? "✓" : "✗");

  // Save deployment
  const deployment = {
    network: "NorChain",
    chainId: 65001,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {
      WNOR: wnorAddress,
      Factory: factoryAddress,
      Router: routerAddress,
    },
    rpc: "https://rpc.xaheen.org",
    explorer: "https://explorer.xaheen.org",
  };

  // Create directory if doesn't exist
  if (!fs.existsSync("docs/deployment-logs")) {
    fs.mkdirSync("docs/deployment-logs", { recursive: true });
  }

  const deploymentPath = "docs/deployment-logs/norchain-dex-deployment.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("\n💾 Deployment saved to:", deploymentPath);

  // Final balance
  const finalBalance = await provider.getBalance(wallet.address);
  const gasUsed = balance - finalBalance;

  console.log("\n" + "=".repeat(70));
  console.log("🎉 NORSWAP DEX DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(70));

  console.log("\n📊 CONTRACT ADDRESSES:");
  console.log("  WNOR:", wnorAddress);
  console.log("  Factory:", factoryAddress);
  console.log("  Router:", routerAddress);

  console.log("\n💰 GAS USED:");
  console.log("  Before:", ethers.formatEther(balance), "NOR");
  console.log("  After:", ethers.formatEther(finalBalance), "NOR");
  console.log("  Gas:", ethers.formatEther(gasUsed), "NOR (~$" + (parseFloat(ethers.formatEther(gasUsed)) * 0.006).toFixed(2) + ")");

  console.log("\n🔍 VERIFY ON EXPLORER:");
  console.log("  WNOR:", `https://explorer.xaheen.org/address/${wnorAddress}`);
  console.log("  Factory:", `https://explorer.xaheen.org/address/${factoryAddress}`);
  console.log("  Router:", `https://explorer.xaheen.org/address/${routerAddress}`);

  console.log("\n📋 NEXT STEPS:");
  console.log("\n1. Add liquidity (REQUIRED to enable trading):");
  console.log("   node scripts/add-norchain-liquidity-now.js");
  console.log("\n2. After liquidity added:");
  console.log("   - Test swap on DEX");
  console.log("   - Create swap UI (or use CLI scripts)");
  console.log("   - Announce on social media");

  console.log("\n💡 WHAT YOU JUST DEPLOYED:");
  console.log("  ✅ Uniswap V2-compatible DEX");
  console.log("  ✅ Ready for liquidity");
  console.log("  ✅ Ultra-low gas fees (~$0.0001/swap)");
  console.log("  ✅ 3-second finality");

  console.log("\n" + "=".repeat(70));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("\nError:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 TIP: You need more NOR for gas fees");
      console.log("   Bridge NOR from BSC to NorChain");
    }

    if (error.message.includes("nonce")) {
      console.log("\n💡 TIP: Nonce issue - wait 30 seconds and try again");
    }

    process.exit(1);
  });
