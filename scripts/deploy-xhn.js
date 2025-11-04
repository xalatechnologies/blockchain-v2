import hre from "hardhat";
const { ethers } = hre;
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

/**
 * Deploy XHN (Nor Network Token)
 *
 * Governance and value capture token with:
 * - Revenue sharing for stakers
 * - Buyback and burn mechanism
 * - Governance rights
 * - Multi-tier staking (30/90/180/365 days)
 */

async function main() {
  console.log("🚀 Deploying XHN (Nor Network Token)");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("\n📍 Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "NOR");

  const deployment = {
    network: "Nor Chain",
    chainId: 65001,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // Treasury and DEX Router addresses (from previous deployments)
  const TREASURY_ADDRESS = deployer.address; // Use deployer as treasury for now
  const DEX_ROUTER_ADDRESS = "0x704cf9Fd1977365426Bd15A1aD348B17B401877B"; // From liquidity deployment

  console.log("\n[1/1] Deploying XHN token...");
  const XHN = await ethers.getContractFactory("XHN");
  const xhn = await XHN.deploy(TREASURY_ADDRESS, DEX_ROUTER_ADDRESS);
  await xhn.waitForDeployment();

  const xhnAddress = await xhn.getAddress();
  deployment.contracts.xhn = xhnAddress;
  console.log("✅ XHN deployed at:", xhnAddress);

  // Get token info
  const name = await xhn.name();
  const symbol = await xhn.symbol();
  const totalSupply = await xhn.totalSupply();
  const maxSupply = await xhn.MAX_SUPPLY();

  console.log("\n📊 Token Information:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Initial Supply:", ethers.formatEther(totalSupply), symbol);
  console.log("  Max Supply:", ethers.formatEther(maxSupply), symbol);
  console.log("  Deployer Balance:", ethers.formatEther(totalSupply), symbol);

  // Calculate gas used
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - finalBalance;
  deployment.gasUsed = ethers.formatEther(gasUsed);

  console.log("\n" + "=".repeat(70));
  console.log("XHN DEPLOYMENT COMPLETE");
  console.log("=".repeat(70));

  console.log("\n💎 XHN TOKENOMICS:");
  console.log("  Total Supply: 1,000,000,000 XHN (max)");
  console.log("  Initial Circulation: 100,000,000 XHN (10%)");
  console.log("\n  Allocation:");
  console.log(
    "    ✅ Initial Supply: 100M (10%) - Deployed to",
    deployer.address
  );
  console.log("    📦 Team Allocation: 200M (20%) - Vested");
  console.log("    🌱 Ecosystem Fund: 300M (30%) - Development");
  console.log("    💰 Staking Rewards: 300M (30%) - Distributed over time");
  console.log("    🎫 Public Sale: 100M (10%) - Future");

  console.log("\n🎯 REVENUE DISTRIBUTION:");
  console.log("  60% to Stakers (proportional to stake)");
  console.log("  30% for Buyback & Burn (deflationary)");
  console.log("  10% to Treasury (operations)");

  console.log("\n📈 STAKING TIERS:");
  console.log("  30 days lock:  30% base APY × 1.0x = 30% APY");
  console.log("  90 days lock:  30% base APY × 1.5x = 45% APY");
  console.log("  180 days lock: 30% base APY × 2.0x = 60% APY");
  console.log("  365 days lock: 30% base APY × 3.0x = 90% APY");
  console.log("\n  Plus revenue share from protocol fees!");

  console.log("\n💰 REVENUE SOURCES:");
  console.log("  ✅ DEX trading fees (0.3%)");
  console.log("  ✅ Bridge transfer fees (0.1-0.3%)");
  console.log("  ⏳ NFT marketplace fees (future)");
  console.log("  ⏳ Launchpad fees (future)");
  console.log("  ⏳ Lending protocol fees (future)");

  // Save deployment
  const filename = `deployment-xhn-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
  console.log("\n💾 Saved to:", filename);

  console.log("\n📝 NEXT STEPS:");
  console.log("  1. Create NOR/XHN liquidity pair");
  console.log("  2. Add initial liquidity (e.g., 1000 NOR + 100,000 XHN)");
  console.log("  3. Integrate revenue distribution from DEX and bridges");
  console.log("  4. Enable staking interface in frontend");
  console.log("  5. Launch XHN public sale/airdrop");
  console.log("  6. Set up governance voting mechanism");
  console.log("  7. Create XHN/BTCBR pair for more trading options");

  console.log("\n🎁 INITIAL DISTRIBUTION IDEAS:");
  console.log("  Airdrop to early supporters: 10M XHN");
  console.log("  Liquidity mining rewards: 20M XHN");
  console.log("  Community treasury: 30M XHN");
  console.log("  Strategic partners: 20M XHN");
  console.log("  Hold for future: 20M XHN");

  console.log("\n🚀 XHN MONETIZATION STRATEGIES:");
  console.log("\n  1. STAKING (Passive Income):");
  console.log("     - Stake XHN, earn 30-90% APY + revenue share");
  console.log("     - Example: 100K XHN staked for 1 year");
  console.log("       Base APY: 90K XHN (90% APY for 365-day lock)");
  console.log("       Revenue share: Variable based on protocol volume");
  console.log("       Total: 90K+ XHN per year");
  console.log("\n  2. GOVERNANCE (Decision Power):");
  console.log("     - Vote on protocol parameters");
  console.log("     - Control treasury allocation");
  console.log("     - Influence ecosystem direction");
  console.log("\n  3. REVENUE SHARING (Direct Monetization):");
  console.log("     - Receive 60% of all protocol revenues");
  console.log("     - Example: $100K monthly protocol revenue");
  console.log("       Stakers receive: $60K");
  console.log("       Your share (if 10% staked): $6K/month");
  console.log("\n  4. DEFLATIONARY (Price Appreciation):");
  console.log("     - 30% of revenue used for buyback & burn");
  console.log("     - Reduces circulating supply");
  console.log("     - Increases value per token");
  console.log("\n  5. EXCLUSIVE ACCESS (Premium Features):");
  console.log("     - Early token launches");
  console.log("     - Discounted bridge fees");
  console.log("     - NFT whitelist access");
  console.log("     - Premium DEX features");

  console.log("\n💡 WHY XHN IS VALUABLE:");
  console.log("  ✅ Revenue share from entire ecosystem");
  console.log("  ✅ Governance control over $10K+ liquidity");
  console.log("  ✅ Deflationary through buyback & burn");
  console.log("  ✅ High APY staking rewards");
  console.log("  ✅ Exclusive benefits and access");
  console.log("  ✅ Independent value proposition from NOR/BTCBR");

  console.log("\n⚡ Gas Used:", deployment.gasUsed, "NOR");

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });
