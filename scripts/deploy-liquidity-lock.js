/**
 * Deploy LiquidityLockUltra Contract
 *
 * This contract will be used to lock all LP tokens from the $100k liquidity addition.
 *
 * Features:
 * - Lock LP tokens for specified duration
 * - Multiple locks per user
 * - Batch lock creation
 * - Emergency unlock by owner
 * - Transfer lock ownership
 *
 * CRITICAL: Deploy this BEFORE adding liquidity!
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

async function main() {
  console.log("\n🔐 DEPLOYING LIQUIDITYLOCKULTRA CONTRACT");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`\n📋 Deployment Configuration:`);
  console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("❌ Deployer has zero balance. Need gas for deployment!");
  }

  console.log(`\n⏳ Deploying LiquidityLockUltra...`);

  const LiquidityLockUltra = await ethers.getContractFactory("LiquidityLockUltra");
  const lockContract = await LiquidityLockUltra.deploy();

  console.log(`   Transaction hash: ${lockContract.deploymentTransaction().hash}`);
  console.log(`   Waiting for confirmations...`);

  await lockContract.waitForDeployment();
  const lockAddress = await lockContract.getAddress();

  console.log(`\n✅ LiquidityLockUltra deployed successfully!`);
  console.log(`   Contract Address: ${lockAddress}`);

  // Verify deployment
  console.log(`\n🔍 Verifying Deployment...`);

  const owner = await lockContract.owner();
  const lockCount = await lockContract.lockId();

  console.log(`   Owner: ${owner} ${owner === deployer.address ? '✅' : '❌'}`);
  console.log(`   Current Lock ID: ${lockCount} ${lockCount === 0n ? '✅' : '❌'}`);

  // Get contract info
  console.log(`\n📋 Contract Information:`);
  console.log(`   Name: LiquidityLockUltra`);
  console.log(`   Purpose: Lock LP tokens for specified duration`);
  console.log(`   Features:`);
  console.log(`      - Multiple locks per user`);
  console.log(`      - Batch lock creation`);
  console.log(`      - Lock ownership transfer`);
  console.log(`      - Emergency unlock (owner only)`);
  console.log(`      - View all user locks`);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: lockAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: lockContract.deploymentTransaction().hash,
    blockNumber: lockContract.deploymentTransaction().blockNumber,
  };

  console.log(`\n💾 Deployment Info:`);
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Important instructions
  console.log(`\n📝 NEXT STEPS:`);
  console.log("═".repeat(70));
  console.log(`\n1. 🔧 Update lock-all-liquidity.js with contract address:`);
  console.log(`   const LIQUIDITY_LOCK_CONTRACT = "${lockAddress}";`);

  console.log(`\n2. 💧 Add $100k liquidity to all pairs:`);
  console.log(`   npx hardhat run scripts/add-100k-liquidity-all-pairs.js --network btcbr`);

  console.log(`\n3. 🔒 Lock all LP tokens (IMMEDIATELY after step 2):`);
  console.log(`   npx hardhat run scripts/lock-all-liquidity.js --network btcbr`);

  console.log(`\n4. 📢 Announce lock publicly (wait 24h before trading)`);

  console.log(`\n5. 🚀 Enable trading:`);
  console.log(`   npx hardhat run scripts/enable-trading.js --network btcbr`);

  console.log(`\n⚠️  IMPORTANT REMINDERS:`);
  console.log(`   - Liquidity MUST be locked before enabling trading`);
  console.log(`   - Lock duration: 1+ year recommended`);
  console.log(`   - Get public proof of lock before launch`);
  console.log(`   - Monitor first hour closely after enabling trading`);

  console.log(`\n═`.repeat(70));
  console.log(`✅ LiquidityLockUltra Deployment Complete!`);
  console.log(`═`.repeat(70));

  console.log(`\n🔐 Contract Address: ${lockAddress}`);
  console.log(`\nSave this address - you'll need it for locking liquidity!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
