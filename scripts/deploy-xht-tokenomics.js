import hre from "hardhat";
import fs from "fs";

/**
 * Deploy complete XHT tokenomics suite to Xaheen Chain
 *
 * Contracts to deploy:
 * 1. XHTStaking - Intelligent staking with dynamic APY
 * 2. XHTBurnMechanism - Triple burn mechanism
 * 3. XHTGovernance - DAO governance
 * 4. XHTRevenue - Revenue collection and distribution
 * 5. XHTCrowdfunding - Decentralized crowdfunding
 * 6. XHTCharity - Transparent charity platform
 */

async function main() {
  console.log("\n🚀 Starting XHT Tokenomics Deployment\n");
  console.log("═".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n📍 Deploying from: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} XHT\n`);

  const deployedContracts = {};

  try {
    // ============ 1. Deploy XHTStaking ============
    console.log("═".repeat(60));
    console.log("📦 1/6 Deploying XHTStaking...");
    console.log("═".repeat(60));

    const XHTStaking = await hre.ethers.getContractFactory("XHTStaking");
    const staking = await XHTStaking.deploy();
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    deployedContracts.staking = stakingAddress;

    console.log(`✅ XHTStaking deployed at: ${stakingAddress}`);
    console.log(`   - Dynamic APY: 8-20%`);
    console.log(`   - Lock periods: 0, 90, 180, 365, 1095 days`);
    console.log(`   - Min stake: 1,000 XHT`);
    console.log(`   - Validator stake: 10,000 XHT`);

    // ============ 2. Deploy XHTBurnMechanism ============
    console.log("\n" + "═".repeat(60));
    console.log("🔥 2/6 Deploying XHTBurnMechanism...");
    console.log("═".repeat(60));

    const XHTBurnMechanism = await hre.ethers.getContractFactory("XHTBurnMechanism");
    const burn = await XHTBurnMechanism.deploy();
    await burn.waitForDeployment();
    const burnAddress = await burn.getAddress();
    deployedContracts.burn = burnAddress;

    console.log(`✅ XHTBurnMechanism deployed at: ${burnAddress}`);
    console.log(`   - Gas fees burn: 50% (dynamic 50-80%)`);
    console.log(`   - Validator rewards burn: 10%`);
    console.log(`   - Bridge fees burn: 5%`);
    console.log(`   - Minimum supply floor: 100M XHT`);

    // ============ 3. Deploy XHTGovernance ============
    console.log("\n" + "═".repeat(60));
    console.log("🏛️  3/6 Deploying XHTGovernance...");
    console.log("═".repeat(60));

    const XHTGovernance = await hre.ethers.getContractFactory("XHTGovernance");
    const governance = await XHTGovernance.deploy(stakingAddress);
    await governance.waitForDeployment();
    const governanceAddress = await governance.getAddress();
    deployedContracts.governance = governanceAddress;

    console.log(`✅ XHTGovernance deployed at: ${governanceAddress}`);
    console.log(`   - Voting period: 7 days`);
    console.log(`   - Timelock: 2 days`);
    console.log(`   - Min voting power: 10,000 XHT`);
    console.log(`   - Quorum: 10% of staked supply`);

    // ============ 4. Deploy XHTRevenue ============
    console.log("\n" + "═".repeat(60));
    console.log("💵 4/6 Deploying XHTRevenue...");
    console.log("═".repeat(60));

    const XHTRevenue = await hre.ethers.getContractFactory("XHTRevenue");
    const revenue = await XHTRevenue.deploy(
      stakingAddress,
      burnAddress,
      governanceAddress // Use governance contract as treasury
    );
    await revenue.waitForDeployment();
    const revenueAddress = await revenue.getAddress();
    deployedContracts.revenue = revenueAddress;

    console.log(`✅ XHTRevenue deployed at: ${revenueAddress}`);
    console.log(`   - Stakers: 50%`);
    console.log(`   - Validators: 30%`);
    console.log(`   - Burn: 10%`);
    console.log(`   - Treasury: 10%`);

    // ============ 5. Deploy XHTCrowdfunding ============
    console.log("\n" + "═".repeat(60));
    console.log("🎯 5/6 Deploying XHTCrowdfunding...");
    console.log("═".repeat(60));

    const XHTCrowdfunding = await hre.ethers.getContractFactory("XHTCrowdfunding");
    const crowdfunding = await XHTCrowdfunding.deploy(revenueAddress);
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();
    deployedContracts.crowdfunding = crowdfundingAddress;

    console.log(`✅ XHTCrowdfunding deployed at: ${crowdfundingAddress}`);
    console.log(`   - Platform fee: 2% (goes to revenue contract)`);
    console.log(`   - Min goal: 100 XHT`);
    console.log(`   - Max goal: 1M XHT`);
    console.log(`   - Duration: 7-90 days`);

    // ============ 6. Deploy XHTCharity ============
    console.log("\n" + "═".repeat(60));
    console.log("❤️  6/6 Deploying XHTCharity...");
    console.log("═".repeat(60));

    const XHTCharity = await hre.ethers.getContractFactory("XHTCharity");
    const charity = await XHTCharity.deploy();
    await charity.waitForDeployment();
    const charityAddress = await charity.getAddress();
    deployedContracts.charity = charityAddress;

    console.log(`✅ XHTCharity deployed at: ${charityAddress}`);
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

    console.log("1️⃣  XHTStaking:      ", deployedContracts.staking);
    console.log("2️⃣  XHTBurn:         ", deployedContracts.burn);
    console.log("3️⃣  XHTGovernance:   ", deployedContracts.governance);
    console.log("4️⃣  XHTRevenue:      ", deployedContracts.revenue);
    console.log("5️⃣  XHTCrowdfunding: ", deployedContracts.crowdfunding);
    console.log("6️⃣  XHTCharity:      ", deployedContracts.charity);

    console.log("\n" + "═".repeat(60));
    console.log("📝 Deployment Information");
    console.log("═".repeat(60));
    console.log(`\n✅ All contracts deployed successfully!`);
    console.log(`📅 Deployment date: ${new Date().toISOString()}`);
    console.log(`🌐 Network: Xaheen Chain (Chain ID: 65001)`);
    console.log(`📍 Deployer: ${deployer.address}`);

    const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`⛽ Total gas used: ${hre.ethers.formatEther(gasUsed)} XHT`);

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
    console.log("   - Announce XHT tokenomics launch");
    console.log("   - Highlight unique features:");
    console.log("     • Dynamic APY staking (8-20%)");
    console.log("     • Triple burn mechanism (deflationary)");
    console.log("     • Community DAO governance");
    console.log("     • Revenue sharing (50% to stakers)");
    console.log("     • Crowdfunding platform (2% fee)");
    console.log("     • Zero-fee charity donations");

    // Save deployment info to file
    const deploymentInfo = {
      network: "Xaheen Chain",
      chainId: 65001,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      gasUsed: ethers.formatEther(gasUsed)
    };

    console.log("\n" + "═".repeat(60));
    console.log("💾 Saving deployment info to deployment-xht-tokenomics.json");
    console.log("═".repeat(60));

    fs.writeFileSync(
      'deployment-xht-tokenomics.json',
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ Deployment info saved!");
    console.log("\n🚀 XHT Tokenomics is now LIVE on Xaheen Chain!");
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
