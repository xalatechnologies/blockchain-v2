/**
 * Deploy Escrow Contract to NorChain
 *
 * Usage:
 *   node scripts/deploy-escrow.js --network btcbr
 *   node scripts/deploy-escrow.js --network bsc
 *   node scripts/deploy-escrow.js --network localhost
 */

import { ethers } from 'hardhat';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

async function main() {
  console.log('\n🔐 Deploying Escrow Contract\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ${network.name === 'btcbr' ? 'NOR' : 'BNB'}\n`);

  // Configuration based on network
  let feeCollector = deployer.address; // Default to deployer, change to multisig in production
  let feeBps = 50;                      // 0.5% fee
  let globalDailyLimit = ethers.parseEther("1000000");  // 1M tokens/NOR per day
  let perDealLimit = ethers.parseEther("100000");       // 100k tokens/NOR per deal

  if (network.chainId === 65001n) {
    // NorChain (btcbr) - production config
    console.log('📍 Deploying to NorChain (Production)\n');

    // TODO: Replace with Safe multisig address after deployment
    // feeCollector = "0x..."; // Gnosis Safe multisig

    feeBps = 25;  // 0.25% for production
    globalDailyLimit = ethers.parseEther("5000000");   // 5M NOR per day
    perDealLimit = ethers.parseEther("500000");        // 500k NOR per deal
  } else if (network.chainId === 56n) {
    // BSC Mainnet
    console.log('📍 Deploying to BSC Mainnet\n');

    feeBps = 25;
    globalDailyLimit = ethers.parseEther("1000000");
    perDealLimit = ethers.parseEther("100000");
  } else {
    // Testnet or localhost
    console.log('📍 Deploying to Test Network\n');
  }

  console.log('Configuration:');
  console.log(`  Fee Collector: ${feeCollector}`);
  console.log(`  Fee: ${feeBps / 100}% (${feeBps} basis points)`);
  console.log(`  Daily Limit: ${ethers.formatEther(globalDailyLimit)}`);
  console.log(`  Per-Deal Limit: ${ethers.formatEther(perDealLimit)}\n`);

  console.log('⏳ Deploying Escrow contract...\n');

  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy(
    feeCollector,
    feeBps,
    globalDailyLimit,
    perDealLimit
  );

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log('═══════════════════════════════════════');
  console.log('✅ ESCROW CONTRACT DEPLOYED!');
  console.log('═══════════════════════════════════════\n');

  console.log('📍 Deployment Details:');
  console.log(`  Address: ${escrowAddress}`);
  console.log(`  Network: ${network.name} (${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Fee Collector: ${feeCollector}`);
  console.log(`  Fee: ${feeBps / 100}%\n`);

  console.log('🔧 Configuration:');
  console.log(`  Daily Limit: ${ethers.formatEther(globalDailyLimit)}`);
  console.log(`  Per-Deal Limit: ${ethers.formatEther(perDealLimit)}`);
  console.log(`  Owner: ${deployer.address} (transfer to multisig!)\n`);

  // Verify contract details
  console.log('🔍 Verifying deployment...');
  const owner = await escrow.owner();
  const collector = await escrow.feeCollector();
  const fee = await escrow.feeBps();

  console.log(`  ✓ Owner: ${owner}`);
  console.log(`  ✓ Fee Collector: ${collector}`);
  console.log(`  ✓ Fee: ${fee} bps\n`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    escrowAddress: escrowAddress,
    deployer: deployer.address,
    owner: owner,
    feeCollector: collector,
    feeBps: fee.toString(),
    globalDailyLimit: globalDailyLimit.toString(),
    perDealLimit: perDealLimit.toString(),
    deployedAt: new Date().toISOString()
  };

  console.log('═══════════════════════════════════════');
  console.log('📝 NEXT STEPS:');
  console.log('═══════════════════════════════════════\n');

  console.log('1. Transfer ownership to Safe multisig:');
  console.log(`   const escrow = await ethers.getContractAt("Escrow", "${escrowAddress}");`);
  console.log(`   await escrow.transferOwnership("0x...SAFE_ADDRESS...");`);
  console.log('');

  console.log('2. Configure fee collector (if different from deployer):');
  console.log(`   await escrow.configureFee(${feeBps}, "0x...MULTISIG...");`);
  console.log('');

  console.log('3. Create a test deal:');
  console.log(`   const dealId = ethers.id("test-deal-001");`);
  console.log(`   await escrow.createDeal(`);
  console.log(`     dealId,`);
  console.log(`     "0x...PAYEE...",`);
  console.log(`     "0x...ARBITER...",`);
  console.log(`     Math.floor(Date.now() / 1000) + 86400, // 24h deadline`);
  console.log(`     0, // Asset.Native`);
  console.log(`     ethers.ZeroAddress, // no token for native`);
  console.log(`     ethers.parseEther("1.0")`);
  console.log(`   );`);
  console.log('');

  console.log('4. Fund the deal:');
  console.log(`   await escrow.fund(dealId, { value: ethers.parseEther("1.0") });`);
  console.log('');

  console.log('5. Release or refund:');
  console.log(`   await escrow.release(dealId); // or refund(dealId)`);
  console.log('');

  if (network.chainId === 56n || network.chainId === 97n) {
    console.log('6. Verify on BSCScan:');
    console.log(`   npx hardhat verify --network ${network.name === 'bscTestnet' ? 'bscTestnet' : 'bsc'} ${escrowAddress} "${feeCollector}" ${feeBps} "${globalDailyLimit}" "${perDealLimit}"`);
    console.log('');
  }

  console.log('═══════════════════════════════════════\n');

  console.log('📚 Documentation:');
  console.log('  • NORCHAIN_ESCROW_GUIDE.md - Full usage guide');
  console.log('  • NORCHAIN_COMPLIANCE.md - Regulatory compliance');
  console.log('  • NORCHAIN_RESILIENCE.md - Infrastructure guide\n');

  console.log('✅ Deployment complete!\n');

  // Return deployment info for programmatic use
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
