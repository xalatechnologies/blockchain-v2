const { ethers } = require('hardhat');

/**
 * Deploy BTCBR Bridge - Private Chain Side
 * 
 * This script deploys the mint/burn contract on your private BSC chain
 */

async function main() {
    console.log('\n🚀 Deploying BTCBR Bridge to PRIVATE CHAIN...\n');
    
    // Configuration
    const BTCBR_PRIVATE = '0x0cF8e180350253271f4b917CcFb0aCCc4862F262';
    const REQUIRED_SIGNATURES = 2; // Need 2 out of 3 validators
    
    const [deployer] = await ethers.getSigners();
    
    console.log('📍 Deploying with account:', deployer.address);
    console.log('💰 Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'BNB\n');
    
    // Deploy bridge contract
    console.log('📝 Deploying BTCBRBridgePrivate contract...');
    const BTCBRBridgePrivate = await ethers.getContractFactory('BTCBRBridgePrivate');
    const bridge = await BTCBRBridgePrivate.deploy(
        BTCBR_PRIVATE,
        REQUIRED_SIGNATURES
    );
    
    await bridge.deployed();
    
    console.log('✅ Bridge deployed to:', bridge.address);
    console.log('   BTCBR Token:', BTCBR_PRIVATE);
    console.log('   Required Signatures:', REQUIRED_SIGNATURES);
    
    // Add validators (same as mainnet)
    console.log('\n🔐 Adding validators...');
    const validators = [
        '0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD', // Validator 1
        '0xfd634d55ce9b99058dc06cdda1f866b39579a9f3', // Validator 2
        '0xb753b892551d1c374fda6fd7f6e9b787688c4ea5'  // Validator 3
    ];
    
    for (let i = 0; i < validators.length; i++) {
        const tx = await bridge.addValidator(validators[i]);
        await tx.wait();
        console.log(`   ✅ Added validator ${i + 1}:`, validators[i]);
    }
    
    // Configure limits (same as mainnet)
    console.log('\n⚙️  Configuring transfer limits...');
    const MIN_TRANSFER = ethers.utils.parseEther('100');      // 100 BTCBR
    const MAX_TRANSFER = ethers.utils.parseEther('100000');   // 100,000 BTCBR
    const DAILY_LIMIT = ethers.utils.parseEther('500000');    // 500,000 BTCBR
    
    const limitsTx = await bridge.setLimits(MIN_TRANSFER, MAX_TRANSFER, DAILY_LIMIT);
    await limitsTx.wait();
    
    console.log('   ✅ Min Transfer:', ethers.utils.formatEther(MIN_TRANSFER), 'BTCBR');
    console.log('   ✅ Max Transfer:', ethers.utils.formatEther(MAX_TRANSFER), 'BTCBR');
    console.log('   ✅ Daily Limit:', ethers.utils.formatEther(DAILY_LIMIT), 'BTCBR');
    
    // Grant minter role to bridge
    console.log('\n🔑 Granting minter role to bridge...');
    console.log('   ⚠️  You need to manually grant minter role to:', bridge.address);
    console.log('   Run: btcbrToken.grantRole(MINTER_ROLE, bridgeAddress)');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log('Contract Address:', bridge.address);
    console.log('Network: Private BSC (Chain ID: 885824)');
    console.log('RPC: http://3.91.50.187:8545');
    console.log('Validators:', validators.length);
    console.log('Required Signatures:', REQUIRED_SIGNATURES);
    console.log('Status: ACTIVE ✅');
    console.log('='.repeat(60));
    
    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        network: 'bsc-private',
        chainId: 885824,
        rpcUrl: 'http://3.91.50.187:8545',
        bridgeAddress: bridge.address,
        btcbrAddress: BTCBR_PRIVATE,
        validators: validators,
        requiredSignatures: REQUIRED_SIGNATURES,
        limits: {
            min: ethers.utils.formatEther(MIN_TRANSFER),
            max: ethers.utils.formatEther(MAX_TRANSFER),
            daily: ethers.utils.formatEther(DAILY_LIMIT)
        },
        deployedAt: new Date().toISOString(),
        deployer: deployer.address
    };
    
    fs.writeFileSync(
        'deployments/private-bridge.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n💾 Deployment info saved to: deployments/private-bridge.json');
    
    // Next steps
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Grant MINTER_ROLE to bridge contract');
    console.log('2. Start validator relayer services');
    console.log('3. Test with small transfer (100 BTCBR)');
    console.log('4. Monitor validator logs');
    
    console.log('\n✨ Private chain bridge deployment complete!\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
