#!/bin/bash

################################################################################
# NOOR CHAIN - DEPLOY DEX CONTRACTS ON SERVER
#
# Deploys NoorSwap DEX infrastructure directly on the blockchain server
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
    console.log('📦 Deploying NoorSwapFactory...');
    const Factory = await ethers.getContractFactory('NoorSwapFactory');
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log('✅ Factory:', factoryAddress);
    
    const initCodeHash = await factory.INIT_CODE_PAIR_HASH();
    console.log('   INIT_CODE_HASH:', initCodeHash, '\n');
    
    // Deploy Router
    console.log('📦 Deploying NoorSwapRouter...');
    const Router = await ethers.getContractFactory('NoorSwapRouter');
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
            NoorSwapFactory: factoryAddress,
            NoorSwapRouter: routerAddress,
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
    
    fs.writeFileSync('noor-dex-deployment.json', JSON.stringify(deployment, null, 2));
    console.log('✅ Deployment saved to noor-dex-deployment.json\n');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('                   🎉 DEPLOYMENT COMPLETE! 🎉');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\nDeployed Contracts:');
    console.log('  BTCBR:            ', btcbrAddress);
    console.log('  WNOR:             ', wnorAddress);
    console.log('  NoorSwap Factory: ', factoryAddress);
    console.log('  NoorSwap Router:  ', routerAddress);
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
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER 'mkdir -p ~/noor-contracts/contracts/dex'

# Upload DEX contracts
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/WNOR.sol ec2-user@$SERVER:~/noor-contracts/contracts/dex/
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/NoorSwapFactory.sol ec2-user@$SERVER:~/noor-contracts/contracts/dex/
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/NoorSwapRouter.sol ec2-user@$SERVER:~/noor-contracts/contracts/dex/
scp -i ~/.ssh/bsc-validator-key.pem contracts/dex/NoorSwapPair.sol ec2-user@$SERVER:~/noor-contracts/contracts/dex/

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
    noor: {
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

scp -i ~/.ssh/bsc-validator-key.pem /tmp/hardhat.config.js ec2-user@$SERVER:~/noor-contracts/

# Upload package.json
cat << 'PACKAGE_JSON' > /tmp/package.json
{
  "name": "noor-contracts",
  "version": "1.0.0",
  "type": "commonjs",
  "dependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.19.0"
  }
}
PACKAGE_JSON

scp -i ~/.ssh/bsc-validator-key.pem /tmp/package.json ec2-user@$SERVER:~/noor-contracts/

echo "✅ Configuration uploaded"
echo ""

# Deploy on server
echo "🚀 Step 4: Deploying contracts on server..."
ssh -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER << 'REMOTE'
cd ~/noor-contracts

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run deployment
echo ""
echo "🚀 Running deployment script..."
npx hardhat run ~/deploy-dex.js --network noor

# Show results
if [ -f "noor-dex-deployment.json" ]; then
    echo ""
    echo "📋 Deployment Results:"
    cat noor-dex-deployment.json
    
    # Copy to home directory for easy access
    cp noor-dex-deployment.json ~/
fi
REMOTE

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📥 Downloading deployment results..."
scp -i ~/.ssh/bsc-validator-key.pem ec2-user@$SERVER:~/noor-dex-deployment.json deployments/ 2>/dev/null || echo "⚠️  No deployment file found"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "                         DEPLOYMENT SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Check deployment results:"
echo "  Local:  deployments/noor-dex-deployment.json"
echo "  Server: ~/noor-dex-deployment.json"
echo ""
echo "Next steps:"
echo "  1. Add liquidity to BTCBR/WNOR pair"
echo "  2. Deploy oracle contracts"
echo "  3. Deploy bridge contracts"
echo ""
