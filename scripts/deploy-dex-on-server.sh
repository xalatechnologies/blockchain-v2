#!/bin/bash

################################################################################
# NOOR CHAIN - DEPLOY DEX CONTRACTS ON SERVER
#
# Deploys NorSwap DEX infrastructure directly on the blockchain server
# using the validator account for deployment
################################################################################

set -e

SERVER="3.91.50.187"
RPC="http://localhost:8545"
BTCBR_ADDRESS="0x0cF8e180350253271f4b917CcFb0aCCc4862F262"
DEPLOYER="0xa3aaC90d6505c2a57141EaFDA973222DF91BBe1C"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "         🌙 NOOR CHAIN DEX DEPLOYMENT 🌙"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📍 Server: $SERVER"
echo "🔗 RPC: $RPC"
echo "👤 Deployer: $DEPLOYER"
echo "🪙 BTCBR Token: $BTCBR_ADDRESS"
echo ""

# Upload deployment script to server
echo "📤 Step 1: Uploading deployment script to server..."
cat << 'DEPLOY_SCRIPT' > /tmp/deploy-dex.js
const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
    console.log('🚀 Starting DEX deployment...\n');
    
    const [deployer] = await ethers.getSigners();
    console.log('Deployer:', deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Balance:', ethers.formatEther(balance), 'NOR\n');
    
    // Deploy WNOR
    console.log('📦 Deploying WNOR...');
    const WNOR = await ethers.getContractFactory('WNOR');
    const wnor = await WNOR.deploy();
    await wnor.waitForDeployment();
    const wnorAddress = await wnor.getAddress();
    console.log('✅ WNOR:', wnorAddress, '\n');
    
    // Deploy Factory
    console.log('📦 Deploying NorSwapFactory...');
    const Factory = await ethers.getContractFactory('NorSwapFactory');
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log('✅ Factory:', factoryAddress);
    
    const initCodeHash = await factory.INIT_CODE_PAIR_HASH();
    console.log('   INIT_CODE_HASH:', initCodeHash, '\n');
    
    // Deploy Router
    console.log('📦 Deploying NorSwapRouter...');
    const Router = await ethers.getContractFactory('NorSwapRouter');
    const router = await Router.deploy(factoryAddress, wnorAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log('✅ Router:', routerAddress, '\n');
    
    // Create BTCBR/WNOR Pair
    console.log('📦 Creating BTCBR/WNOR pair...');
    const btcbrAddress = '0x0cF8e180350253271f4b917CcFb0aCCc4862F262';
    const tx = await factory.createPair(btcbrAddress, wnorAddress);
    await tx.wait();
    const pairAddress = await factory.getPair(btcbrAddress, wnorAddress);
    console.log('✅ BTCBR/WNOR Pair:', pairAddress, '\n');
    
    // Save deployment
    const deployment = {
        timestamp: new Date().toISOString(),
        chainId: 65001,
        contracts: {
            BTCBR: btcbrAddress,
            WNOR: wnorAddress,
            NorSwapFactory: factoryAddress,
            NorSwapRouter: routerAddress,
            initCodeHash: initCodeHash,
        },
        pairs: [
            {
                name: 'BTCBR/WNOR',
                address: pairAddress,
                token0: btcbrAddress,
                token1: wnorAddress,
            }
        ],
    };
    
    fs.writeFileSync('nor-dex-deployment.json', JSON.stringify(deployment, null, 2));
    console.log('✅ Deployment saved to nor-dex-deployment.json\n');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('                   🎉 DEPLOYMENT COMPLETE! 🎉');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\nDeployed Contracts:');
    console.log('  BTCBR:            ', btcbrAddress);
    console.log('  WNOR:             ', wnorAddress);
    console.log('  NorSwap Factory: ', factoryAddress);
    console.log('  NorSwap Router:  ', routerAddress);
    console.log('  BTCBR/WNOR Pair:  ', pairAddress);
    console.log('');
}

main().catch(console.error);
DEPLOY_SCRIPT

scp -i ~/.ssh/bsc-validator-key.pem /tmp/deploy-dex.js ec2-user@$SERVER:~/

echo "✅ Upload complete"
echo ""

# Check if contracts directory exists on server
echo "📤 Step 2: Uploading smart contracts..."
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER 'mkdir -p ~/nor-contracts/contracts/dex'

# Upload DEX contracts
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/WNOR.sol ec2-user@$SERVER:~/nor-contracts/contracts/dex/
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/NorSwapFactory.sol ec2-user@$SERVER:~/nor-contracts/contracts/dex/
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/NorSwapRouter.sol ec2-user@$SERVER:~/nor-contracts/contracts/dex/
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/NorSwapPair.sol ec2-user@$SERVER:~/nor-contracts/contracts/dex/

echo "✅ Contracts uploaded"
echo ""

# Upload hardhat config
echo "📤 Step 3: Uploading Hardhat configuration..."
cat << 'HARDHAT_CONFIG' > /tmp/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    nor: {
      url: "http://localhost:8545",
      chainId: 65001,
      accounts: ["0x3d5679f1148d19b440646957f146176c063a645dd44fc1b8f759fe613eae8edd"], // Validator 1 private key
      gas: 8000000,
      gasPrice: 3000000000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
HARDHAT_CONFIG

scp -i ~/.ssh/bsc-validator-key.pem /tmp/hardhat.config.js ec2-user@$SERVER:~/nor-contracts/

# Upload package.json
cat << 'PACKAGE_JSON' > /tmp/package.json
{
  "name": "nor-contracts",
  "version": "1.0.0",
  "type": "commonjs",
  "dependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.19.0"
  }
}
PACKAGE_JSON

scp -i ~/.ssh/bsc-validator-key.pem /tmp/package.json ec2-user@$SERVER:~/nor-contracts/

echo "✅ Configuration uploaded"
echo ""

# Deploy on server
echo "🚀 Step 4: Deploying contracts on server..."
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER << 'REMOTE'
cd ~/nor-contracts

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run deployment
echo ""
echo "🚀 Running deployment script..."
npx hardhat run ~/deploy-dex.js --network nor

# Show results
if [ -f "nor-dex-deployment.json" ]; then
    echo ""
    echo "📋 Deployment Results:"
    cat nor-dex-deployment.json
    
    # Copy to home directory for easy access
    cp nor-dex-deployment.json ~/
fi
REMOTE

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📥 Downloading deployment results..."
scp -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER:~/nor-dex-deployment.json deployments/ 2>/dev/null || echo "⚠️  No deployment file found"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "                         DEPLOYMENT SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Check deployment results:"
echo "  Local:  deployments/nor-dex-deployment.json"
echo "  Server: ~/nor-dex-deployment.json"
echo ""
echo "Next steps:"
echo "  1. Add liquidity to BTCBR/WNOR pair"
echo "  2. Deploy oracle contracts"
echo "  3. Deploy bridge contracts"
echo ""
