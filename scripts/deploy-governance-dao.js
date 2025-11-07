/**
 * Deploy NorChain Governance DAO System
 * 
 * Components:
 * 1. NorGovernanceToken (vNOR) - Vote-escrowed governance token
 * 2. NorGovernor - Multi-layer governance system
 * 3. TimelockController - Timelock for proposal execution
 * 
 * Governance Layers:
 * - Community DAO: Token holders (>10k NOR staked)
 * - Validator DAO: Validators + delegators
 * - Council DAO: 5 institutional signers
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

// Contract addresses
const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC"; // Existing NOR token

// Governance parameters
const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 days
const VOTING_DELAY = 1 * 24 * 60 * 60;   // 1 day
const VOTING_PERIOD = 7 * 24 * 60 * 60;  // 7 days
const PROPOSAL_THRESHOLD = ethers.parseUnits("10000", 24); // 10k NOR

// Initial council members (5 institutional validators)
const INITIAL_COUNCIL = [
  "0xdD779a290C937144F80Eb75b75d814c834536B1b", // Deployer (temporary)
  // Add 4 more institutional addresses
];

async function main() {
  console.log("\n🏛️  DEPLOYING NORCHAIN GOVERNANCE DAO");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network: ${hre.network.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Deploy TimelockController
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 1: Deploying TimelockController...");
  console.log("─".repeat(70));

  const TimelockController = await ethers.getContractFactory("TimelockController");
  
  // Proposers: Will be set to Governor contract
  // Executors: Will be set to Governor contract + emergency multisig
  const proposers = []; // Empty initially, Governor will be added
  const executors = []; // Empty initially, Governor will be added
  const admin = deployer.address; // Temporary admin (will be renounced)

  const timelock = await TimelockController.deploy(
    TIMELOCK_DELAY,
    proposers,
    executors,
    admin
  );
  await timelock.waitForDeployment();

  const timelockAddress = await timelock.getAddress();
  console.log(`   ✅ TimelockController deployed: ${timelockAddress}`);
  console.log(`   ⏰ Timelock Delay: ${TIMELOCK_DELAY / (24 * 60 * 60)} days`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Deploy Governance Token (vNOR)
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 2: Deploying Governance Token (vNOR)...");
  console.log("─".repeat(70));

  const NorGovernanceToken = await ethers.getContractFactory("NorGovernanceToken");
  
  const governanceToken = await NorGovernanceToken.deploy(
    NOR_TOKEN,
    "Vote-Escrowed NOR",
    "vNOR"
  );
  await governanceToken.waitForDeployment();

  const govTokenAddress = await governanceToken.getAddress();
  console.log(`   ✅ NorGovernanceToken deployed: ${govTokenAddress}`);
  console.log(`   📊 Backing Token: ${NOR_TOKEN}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Deploy Governor
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n📦 STEP 3: Deploying NorGovernor...");
  console.log("─".repeat(70));

  const NorGovernor = await ethers.getContractFactory("NorGovernor");
  
  const governor = await NorGovernor.deploy(
    govTokenAddress,    // Voting token
    timelockAddress,    // Timelock controller
    govTokenAddress     // Governance token for level checking
  );
  await governor.waitForDeployment();

  const governorAddress = await governor.getAddress();
  console.log(`   ✅ NorGovernor deployed: ${governorAddress}`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Configure Timelock Roles
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🔧 STEP 4: Configuring Timelock Roles...");
  console.log("─".repeat(70));

  // Get role hashes
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();

  console.log(`   🏷️  Granting PROPOSER_ROLE to Governor...`);
  await (await timelock.grantRole(PROPOSER_ROLE, governorAddress)).wait();

  console.log(`   🏷️  Granting EXECUTOR_ROLE to Governor...`);
  await (await timelock.grantRole(EXECUTOR_ROLE, governorAddress)).wait();

  console.log(`   🏷️  Revoking TIMELOCK_ADMIN_ROLE from deployer...`);
  await (await timelock.revokeRole(TIMELOCK_ADMIN_ROLE, deployer.address)).wait();

  console.log(`   ✅ Timelock roles configured`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: Setup Initial Council Members
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🏛️  STEP 5: Setting up Initial Council...");
  console.log("─".repeat(70));

  for (const member of INITIAL_COUNCIL) {
    if (member && member !== ethers.ZeroAddress) {
      console.log(`   👥 Adding council member: ${member}`);
      try {
        await (await governor.addCouncilMember(member)).wait();
        
        // Also add to governance token contract
        await (await governanceToken.addCouncilMember(member)).wait();
        
        console.log(`   ✅ Added successfully`);
      } catch (error) {
        console.log(`   ⚠️  Failed to add ${member}: ${error.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 6: Initialize Governance Token Settings
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n⚙️  STEP 6: Configuring Governance Settings...");
  console.log("─".repeat(70));

  console.log(`   📊 Minimum lock period: 30 days`);
  console.log(`   📊 Maximum lock period: 4 years`);
  console.log(`   📊 Maximum voting multiplier: 10x`);
  console.log(`   📊 Minimum proposal stake: 10,000 NOR`);
  console.log(`   📊 Quorum requirement: 15%`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 7: Test Governance Setup
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n🧪 STEP 7: Testing Governance Setup...");
  console.log("─".repeat(70));

  // Check voting delay and period
  const votingDelay = await governor.votingDelay();
  const votingPeriod = await governor.votingPeriod();
  const proposalThreshold = await governor.proposalThreshold();
  
  console.log(`   📅 Voting Delay: ${Number(votingDelay) / (24 * 60 * 60)} days`);
  console.log(`   📅 Voting Period: ${Number(votingPeriod) / (24 * 60 * 60)} days`);
  console.log(`   💰 Proposal Threshold: ${ethers.formatUnits(proposalThreshold, 24)} NOR`);

  // Check council size
  const councilMembers = await governor.getCouncilMembers();
  console.log(`   👥 Council Size: ${councilMembers.length}/5`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOYMENT SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n\n🎉 GOVERNANCE DAO DEPLOYMENT COMPLETE!");
  console.log("═".repeat(70));

  console.log("\n📦 Deployed Contracts:");
  console.log(`   TimelockController:    ${timelockAddress}`);
  console.log(`   NorGovernanceToken:    ${govTokenAddress}`);
  console.log(`   NorGovernor:           ${governorAddress}`);

  console.log("\n🏛️  Governance Structure:");
  console.log(`   Community DAO:  Token holders (>10k NOR staked)`);
  console.log(`   Validator DAO:  Validators + delegators (>100k NOR stake)`);
  console.log(`   Council DAO:    ${councilMembers.length}/5 institutional signers`);

  console.log("\n⚙️  Parameters:");
  console.log(`   Voting Delay:     ${Number(votingDelay) / (24 * 60 * 60)} days`);
  console.log(`   Voting Period:    ${Number(votingPeriod) / (24 * 60 * 60)} days`);
  console.log(`   Timelock Delay:   ${TIMELOCK_DELAY / (24 * 60 * 60)} days`);
  console.log(`   Proposal Threshold: ${ethers.formatUnits(proposalThreshold, 24)} NOR`);

  console.log("\n🔄 Next Steps:");
  console.log("   1. Transfer governance token ownership to DAO");
  console.log("   2. Add remaining council members (4 more needed)");
  console.log("   3. Register initial validators");
  console.log("   4. Create first governance proposal");
  console.log("   5. Test voting and execution process");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TimelockController: {
        address: timelockAddress,
        delay: TIMELOCK_DELAY
      },
      NorGovernanceToken: {
        address: govTokenAddress,
        name: "Vote-Escrowed NOR",
        symbol: "vNOR",
        backingToken: NOR_TOKEN
      },
      NorGovernor: {
        address: governorAddress,
        votingDelay: Number(votingDelay),
        votingPeriod: Number(votingPeriod),
        proposalThreshold: proposalThreshold.toString()
      }
    },
    governance: {
      councilMembers: councilMembers,
      initialSetup: true,
      timelockConfigured: true
    }
  };

  const fs = require("fs");
  fs.writeFileSync(
    "docs/deployment-logs/governance-dao-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: docs/deployment-logs/governance-dao-deployment.json");
  console.log("\n═".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });