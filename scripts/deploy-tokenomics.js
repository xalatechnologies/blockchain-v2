import pkg from "hardhat";
const { ethers } = pkg;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

// Existing contract addresses from previous deployment
const WXHT_ADDRESS = "0x26c0eaF731885b14c031cc50dB79b36458E0b355";
const ROUTER_ADDRESS = "0x50BbB1c9b6fe957AEc1145cb1a9D8EB51A2BE916";
const USDT_ADDRESS = "0xB8fa87a1dAC07e077a51999F5cE79BD236f06acf";
const TREASURY_ADDRESS = "0xdD779a290C937144F80Eb75b75d814c834536B1b";

async function main() {
  console.log("\n🏦 Deploying Xaheen Chain Tokenomics");
  console.log("=" .repeat(70));

  const privateKey = process.env.MAIN_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("MAIN_WALLET_PRIVATE_KEY not found in .env");
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("\n📍 Deployer:", deployer.address);
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 XHT Balance:", ethers.formatEther(balance), "XHT");

  const blockNumber = await provider.getBlockNumber();
  console.log("📦 Block:", blockNumber);

  // STEP 1: Deploy XHTStaking
  console.log("\n📊 Step 1: Deploying XHT Staking Contract...");
  const Staking = await ethers.getContractFactory("XHTStaking", deployer);
  const staking = await Staking.deploy();
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ XHTStaking deployed:", stakingAddress);
  console.log("   Features: 5 lock tiers (0-36 months), voting power, bonus rewards");

  // STEP 2: Deploy WeeklyBuyback
  console.log("\n💸 Step 2: Deploying Weekly Buyback Contract...");
  const Buyback = await ethers.getContractFactory("WeeklyBuyback", deployer);
  const buyback = await Buyback.deploy(
    WXHT_ADDRESS,    // XHT token (using WXHT)
    USDT_ADDRESS,    // USDT token
    ROUTER_ADDRESS,  // DEX router
    TREASURY_ADDRESS, // Treasury
    TREASURY_ADDRESS  // LP Manager (using treasury for now)
  );
  await buyback.waitForDeployment();
  const buybackAddress = await buyback.getAddress();
  console.log("✅ WeeklyBuyback deployed:", buybackAddress);
  console.log("   Features: Weekly XHT buybacks, burns 50%, liquidity 25%, staking 25%");

  // STEP 3: Deploy XHTBurnMechanism
  console.log("\n🔥 Step 3: Deploying XHT Burn Mechanism...");
  const BurnMech = await ethers.getContractFactory("XHTBurnMechanism", deployer);
  const burnMech = await BurnMech.deploy();
  await burnMech.waitForDeployment();
  const burnMechAddress = await burnMech.getAddress();
  console.log("✅ XHTBurnMechanism deployed:", burnMechAddress);
  console.log("   Features: Triple burn (50% gas, 10% rewards, 5% bridge), velocity sink");

  // STEP 4: Check if there are additional tokenomics contracts to deploy
  console.log("\n🏛️ Step 4: Checking for additional tokenomics contracts...");

  let revenueAddress = null;
  let governanceAddress = null;

  try {
    console.log("   Deploying XHTRevenue...");
    const Revenue = await ethers.getContractFactory("XHTRevenue", deployer);
    const revenue = await Revenue.deploy();
    await revenue.waitForDeployment();
    revenueAddress = await revenue.getAddress();
    console.log("   ✅ XHTRevenue deployed:", revenueAddress);
  } catch (error) {
    console.log("   ⚠️  XHTRevenue: Contract not found or compilation error");
  }

  try {
    console.log("   Deploying XHTGovernance...");
    const Governance = await ethers.getContractFactory("XHTGovernance", deployer);
    const governance = await Governance.deploy();
    await governance.waitForDeployment();
    governanceAddress = await governance.getAddress();
    console.log("   ✅ XHTGovernance deployed:", governanceAddress);
  } catch (error) {
    console.log("   ⚠️  XHTGovernance: Contract not found or compilation error");
  }

  // STEP 5: Configure contracts (optional integrations)
  console.log("\n⚙️  Step 5: Contract Configuration...");
  console.log("   Note: Manual configuration may be needed for:");
  console.log("   - Setting staking contract in buyback");
  console.log("   - Configuring burn mechanism with validators");
  console.log("   - Setting up governance voting");

  // Save deployment info
  console.log("\n📝 Tokenomics Deployment Summary:");
  console.log("=" .repeat(70));
  console.log("XHTStaking:        ", stakingAddress);
  console.log("WeeklyBuyback:     ", buybackAddress);
  console.log("XHTBurnMechanism:  ", burnMechAddress);
  if (revenueAddress) console.log("XHTRevenue:        ", revenueAddress);
  if (governanceAddress) console.log("XHTGovernance:     ", governanceAddress);

  console.log("\n✅ TOKENOMICS DEPLOYMENT COMPLETE!");
  console.log("\n📊 Key Features:");
  console.log("   • Flexible staking with 5 lock periods (0-36 months)");
  console.log("   • Voting power multipliers (1x to 5x)");
  console.log("   • Bonus rewards up to 200% for long-term stakers");
  console.log("   • Weekly buyback mechanism (50% burn, 25% LP, 25% staking)");
  console.log("   • Triple burn mechanism for deflationary pressure");
  console.log("   • Velocity sink: higher burn for heavy users");
  console.log("   • Minimum supply floor: 100M XHT (10% of 1B)");

  console.log("\n💡 Next Steps:");
  console.log("   1. Fund buyback contract with USDT");
  console.log("   2. Enable staking rewards");
  console.log("   3. Configure validator burn mechanism");
  console.log("   4. Set up governance proposals");
  console.log("   5. Launch community staking incentives");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
