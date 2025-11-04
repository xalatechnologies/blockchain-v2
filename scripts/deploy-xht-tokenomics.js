import hre from "hardhat";
import fs from "fs";

/**
 * Deploy complete NOR tokenomics suite to Nor Chain
 *
 * Contracts to deploy:
 * 1. NORStaking - Intelligent staking with dynamic APY
 * 2. NORBurnMechanism - Triple burn mechanism
 * 3. NORGovernance - DAO governance
 * 4. NORRevenue - Revenue collection and distribution
 * 5. NORCrowdfunding - Decentralized crowdfunding
 * 6. NORCharity - Transparent charity platform
 */

async function main() {
  console.log("\n🚀 Starting NOR Tokenomics Deployment\n");
  console.log("═".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n📍 Deploying from: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} NOR\n`);

  const deployedContracts = {};

  try {
    // ============ 1. Deploy NORStaking ============
    console.log("═".repeat(60));
    console.log("📦 1/6 Deploying NORStaking...");
    console.log("═".repeat(60));

    const NORStaking = await hre.ethers.getContractFactory("NORStaking");
    const staking = await NORStaking.deploy();
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    deployedContracts.staking = stakingAddress;

    console.log(`✅ NORStaking deployed at: ${stakingAddress}`);
    console.log(`   - Dynamic APY: 8-20%`);
    console.log(`   - Lock periods: 0, 90, 180, 365, 1095 days`);
    console.log(`   - Min stake: 1,000 NOR`);
    console.log(`   - Validator stake: 10,000 NOR`);

    // ============ 2. Deploy NORBurnMechanism ============
    console.log("\n" + "═".repeat(60));
    console.log("🔥 2/6 Deploying NORBurnMechanism...");
    console.log("═".repeat(60));

    const NORBurnMechanism = await hre.ethers.getContractFactory(
      "NORBurnMechanism"
    );
    const burn = await NORBurnMechanism.deploy();
    await burn.waitForDeployment();
    const burnAddress = await burn.getAddress();
    deployedContracts.burn = burnAddress;

    console.log(`✅ NORBurnMechanism deployed at: ${burnAddress}`);
    console.log(`   - Gas fees burn: 50% (dynamic 50-80%)`);
    console.log(`   - Validator rewards burn: 10%`);
    console.log(`   - Bridge fees burn: 5%`);
    console.log(`   - Minimum supply floor: 100M NOR`);

    // ============ 3. Deploy NORGovernance ============
    console.log("\n" + "═".repeat(60));
    console.log("🏛️  3/6 Deploying NORGovernance...");
    console.log("═".repeat(60));

    const NORGovernance = await hre.ethers.getContractFactory("NORGovernance");
    const governance = await NORGovernance.deploy(stakingAddress);
    await governance.waitForDeployment();
    const governanceAddress = await governance.getAddress();
    deployedContracts.governance = governanceAddress;

    console.log(`✅ NORGovernance deployed at: ${governanceAddress}`);
    console.log(`   - Voting period: 7 days`);
    console.log(`   - Timelock: 2 days`);
    console.log(`   - Min voting power: 10,000 NOR`);
    console.log(`   - Quorum: 10% of staked supply`);

    // ============ 4. Deploy NORRevenue ============
    console.log("\n" + "═".repeat(60));
    console.log("💵 4/6 Deploying NORRevenue...");
    console.log("═".repeat(60));

    const NORRevenue = await hre.ethers.getContractFactory("NORRevenue");
    const revenue = await NORRevenue.deploy(
      stakingAddress,
      burnAddress,
      governanceAddress // Use governance contract as treasury
    );
    await revenue.waitForDeployment();
    const revenueAddress = await revenue.getAddress();
    deployedContracts.revenue = revenueAddress;

    console.log(`✅ NORRevenue deployed at: ${revenueAddress}`);
    console.log(`   - Stakers: 50%`);
    console.log(`   - Validators: 30%`);
    console.log(`   - Burn: 10%`);
    console.log(`   - Treasury: 10%`);

    // ============ 5. Deploy NORCrowdfunding ============
    console.log("\n" + "═".repeat(60));
    console.log("🎯 5/6 Deploying NORCrowdfunding...");
    console.log("═".repeat(60));

    const NORCrowdfunding = await hre.ethers.getContractFactory(
      "NORCrowdfunding"
    );
    const crowdfunding = await NORCrowdfunding.deploy(revenueAddress);
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();
    deployedContracts.crowdfunding = crowdfundingAddress;

    console.log(`✅ NORCrowdfunding deployed at: ${crowdfundingAddress}`);
    console.log(`   - Platform fee: 2% (goes to revenue contract)`);
    console.log(`   - Min goal: 100 NOR`);
    console.log(`   - Max goal: 1M NOR`);
    console.log(`   - Duration: 7-90 days`);

    // ============ 6. Deploy NORCharity ============
    console.log("\n" + "═".repeat(60));
    console.log("❤️  6/6 Deploying NORCharity...");
    console.log("═".repeat(60));

    const NORCharity = await hre.ethers.getContractFactory("NORCharity");
    const charity = await NORCharity.deploy();
    await charity.waitForDeployment();
    const charityAddress = await charity.getAddress();
    deployedContracts.charity = charityAddress;

    console.log(`✅ NORCharity deployed at: ${charityAddress}`);
    console.log(`   - Zero fees for verified charities`);
    console.log(`   - Recurring donations supported`);
    console.log(`   - Donation matching enabled`);
    console.log(`   - Transparent impact reporting`);

    // ============ Configuration ============
    console.log("\n" + "═".repeat(60));
    console.log("⚙️  Configuring contracts...");
    console.log("═".repeat(60));

    // Add validators to revenue contract
    const validator1 = "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD";
    const validator2 = "0xfd634d55ce9b99058dc06cdda1f866b39579a9f3";
    const validator3 = "0xb753b892551d1c374fda6fd7f6e9b787688c4ea5";

    console.log("\n📝 Adding validators to revenue distribution...");
    await revenue.addValidator(validator1);
    await revenue.addValidator(validator2);
    await revenue.addValidator(validator3);
    console.log("✅ Validators configured");

    // ============ Summary ============
    console.log("\n" + "═".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("═".repeat(60));
    console.log("\n📋 Contract Addresses:\n");

    console.log("1️⃣  NORStaking:      ", deployedContracts.staking);
    console.log("2️⃣  NORBurn:         ", deployedContracts.burn);
    console.log("3️⃣  NORGovernance:   ", deployedContracts.governance);
    console.log("4️⃣  NORRevenue:      ", deployedContracts.revenue);
    console.log("5️⃣  NORCrowdfunding: ", deployedContracts.crowdfunding);
    console.log("6️⃣  NORCharity:      ", deployedContracts.charity);

    console.log("\n" + "═".repeat(60));
    console.log("📝 Deployment Information");
    console.log("═".repeat(60));
    console.log(`\n✅ All contracts deployed successfully!`);
    console.log(`📅 Deployment date: ${new Date().toISOString()}`);
    console.log(`🌐 Network: Nor Chain (Chain ID: 65001)`);
    console.log(`📍 Deployer: ${deployer.address}`);

    const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`⛽ Total gas used: ${hre.ethers.formatEther(gasUsed)} NOR`);

    // ============ Next Steps ============
    console.log("\n" + "═".repeat(60));
    console.log("📋 Next Steps:");
    console.log("═".repeat(60));
    console.log("\n1️⃣  Integration:");
    console.log("   - Integrate staking with validator rewards");
    console.log("   - Connect burn mechanism to gas fee collection");
    console.log("   - Link revenue to bridges, DEX, NFT marketplace");

    console.log("\n2️⃣  Testing:");
    console.log("   - Test staking with various lock periods");
    console.log("   - Verify burn mechanism reduces supply");
    console.log("   - Create and vote on governance proposals");
    console.log("   - Test revenue distribution");
    console.log("   - Launch test crowdfunding campaign");
    console.log("   - Register and verify test charity");

    console.log("\n3️⃣  Frontend:");
    console.log("   - Build staking dashboard");
    console.log("   - Create governance voting interface");
    console.log("   - Design crowdfunding platform UI");
    console.log("   - Develop charity portal");

    console.log("\n4️⃣  Marketing:");
    console.log("   - Announce NOR tokenomics launch");
    console.log("   - Highlight unique features:");
    console.log("     • Dynamic APY staking (8-20%)");
    console.log("     • Triple burn mechanism (deflationary)");
    console.log("     • Community DAO governance");
    console.log("     • Revenue sharing (50% to stakers)");
    console.log("     • Crowdfunding platform (2% fee)");
    console.log("     • Zero-fee charity donations");

    // Save deployment info to file
    const deploymentInfo = {
      network: "Nor Chain",
      chainId: 65001,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      gasUsed: ethers.formatEther(gasUsed),
    };

    console.log("\n" + "═".repeat(60));
    console.log("💾 Saving deployment info to deployment-xht-tokenomics.json");
    console.log("═".repeat(60));

    fs.writeFileSync(
      "deployment-xht-tokenomics.json",
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ Deployment info saved!");
    console.log("\n🚀 NOR Tokenomics is now LIVE on Nor Chain!");
    console.log("\n" + "═".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
