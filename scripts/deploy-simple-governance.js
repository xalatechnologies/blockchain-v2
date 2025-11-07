/**
 * Deploy Simple NorChain Governance DAO
 * 
 * This is a simplified but functional governance system that:
 * 1. Allows NOR token holders to stake and vote
 * 2. Has three governance levels (Community, Validator, Council)
 * 3. Supports different proposal types
 * 4. Has timelock execution for security
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// Contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC"; // Existing NOR token

// Initial council members (max 5)
const INITIAL_COUNCIL = [
  "0xdD779a290C937144F80Eb75b75d814c834536B1b", // Deployer (temporary)
  // Add 4 more institutional addresses
];

async function main() {
  console.log("\n🏛️  DEPLOYING SIMPLE NORCHAIN GOVERNANCE DAO");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: ${hre.network.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Deploy Simple Governance Contract
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 1: Deploying Simple Governance...");
  console.log("─".repeat(70));

  const SimpleNorGovernance = await ethers.getContractFactory("SimpleNorGovernance");
  const governance = await SimpleNorGovernance.deploy(NOR_TOKEN);
  await governance.waitForDeployment();

  const governanceAddress = await governance.getAddress();
  console.log(`   ✅ SimpleNorGovernance deployed: ${governanceAddress}`);
  console.log(`   📊 Backing Token: ${NOR_TOKEN}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Setup Initial Council Members
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🏛️  STEP 2: Setting up Initial Council...");
  console.log("─".repeat(70));

  for (const member of INITIAL_COUNCIL) {
    if (member && member !== ethers.ZeroAddress) {
      console.log(`   👥 Adding council member: ${member}`);
      try {
        await (await governance.addCouncilMember(member)).wait();
        console.log(`   ✅ Added successfully`);
      } catch (error) {
        console.log(`   ⚠️  Failed to add ${member}: ${error.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Test Governance Setup
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🧪 STEP 3: Testing Governance Setup...");
  console.log("─".repeat(70));

  // Check constants
  const minProposalStake = await governance.MIN_PROPOSAL_STAKE();
  const votingPeriod = await governance.VOTING_PERIOD();
  const timelockPeriod = await governance.TIMELOCK_PERIOD();
  const quorumPercentage = await governance.QUORUM_PERCENTAGE();
  
  console.log(`   💰 Minimum Proposal Stake: ${ethers.formatUnits(minProposalStake, 24)} NOR`);
  console.log(`   📅 Voting Period: ${Number(votingPeriod) / (24 * 60 * 60)} days`);
  console.log(`   ⏰ Timelock Period: ${Number(timelockPeriod) / (24 * 60 * 60)} days`);
  console.log(`   📊 Quorum Requirement: ${quorumPercentage}%`);

  // Check council size
  const councilMembers = await governance.getCouncilMembers();
  console.log(`   👥 Council Size: ${councilMembers.length}/5`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Test Staking (Optional)
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🧪 STEP 4: Testing Staking (Optional)...");
  console.log("─".repeat(70));

  // Check if deployer has NOR tokens
  const norToken = await ethers.getContractAt("IERC20", NOR_TOKEN);
  const deployerBalance = await norToken.balanceOf(deployer.address);
  
  console.log(`   💰 Deployer NOR Balance: ${ethers.formatUnits(deployerBalance, 24)} NOR`);

  if (deployerBalance >= minProposalStake) {
    console.log(`   🔄 Testing stake function...`);
    
    // Approve governance contract
    const stakeAmount = ethers.parseUnits("10000", 24); // 10k NOR
    await (await norToken.approve(governanceAddress, stakeAmount)).wait();
    console.log(`   ✅ Approved ${ethers.formatUnits(stakeAmount, 24)} NOR`);
    
    // Stake tokens
    await (await governance.stake(stakeAmount)).wait();
    console.log(`   ✅ Staked ${ethers.formatUnits(stakeAmount, 24)} NOR`);
    
    // Check staked amount
    const stakedAmount = await governance.stakedAmount(deployer.address);
    console.log(`   📊 Current Stake: ${ethers.formatUnits(stakedAmount, 24)} NOR`);
  } else {
    console.log(`   ⚠️  Insufficient NOR balance for staking test`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOYMENT SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n🎉 SIMPLE GOVERNANCE DAO DEPLOYMENT COMPLETE!");
  console.log("═".repeat(70));

  console.log("\n📦 Deployed Contracts:");
  console.log(`   SimpleNorGovernance:   ${governanceAddress}`);

  console.log("\n🏛️  Governance Structure:");
  console.log(`   Community DAO:  Token holders (>10k NOR staked)`);
  console.log(`   Validator DAO:  Validators (>100k NOR stake)`);
  console.log(`   Council DAO:    ${councilMembers.length}/5 institutional signers`);

  console.log("\n⚙️  Parameters:");
  console.log(`   Minimum Proposal Stake: ${ethers.formatUnits(minProposalStake, 24)} NOR`);
  console.log(`   Voting Period:    ${Number(votingPeriod) / (24 * 60 * 60)} days`);
  console.log(`   Timelock Period:  ${Number(timelockPeriod) / (24 * 60 * 60)} days`);
  console.log(`   Quorum Threshold: ${quorumPercentage}%`);

  console.log("\n🎯 Key Features:");
  console.log("   ✅ Token-based voting (stake NOR to vote)");
  console.log("   ✅ Multi-layer governance (Community/Validator/Council)");
  console.log("   ✅ Proposal creation and voting");
  console.log("   ✅ Timelock execution for security");
  console.log("   ✅ Emergency council functions");

  console.log("\n🔄 Next Steps:");
  console.log("   1. Add remaining council members (4 more needed)");
  console.log("   2. Register initial validators");
  console.log("   3. Create first test proposal");
  console.log("   4. Test voting and execution process");
  console.log("   5. Transfer ownership to DAO");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      SimpleNorGovernance: {
        address: governanceAddress,
        norToken: NOR_TOKEN,
        minProposalStake: minProposalStake.toString(),
        votingPeriod: Number(votingPeriod),
        timelockPeriod: Number(timelockPeriod),
        quorumPercentage: Number(quorumPercentage)
      }
    },
    governance: {
      councilMembers: councilMembers,
      councilSize: councilMembers.length,
      maxCouncilSize: 5
    },
    features: [
      "Token-based voting",
      "Multi-layer governance",
      "Proposal creation",
      "Timelock execution",
      "Emergency functions"
    ]
  };

  const fs = require("fs");
  fs.writeFileSync(
    "docs/deployment-logs/simple-governance-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: docs/deployment-logs/simple-governance-deployment.json");
  console.log("\n═".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });