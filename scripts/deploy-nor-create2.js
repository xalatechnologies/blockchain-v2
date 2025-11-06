/**
 * Deploy NOR Token with CREATE2 to Same Address on All Chains
 *
 * This script:
 * 1. Deploys CREATE2 factory to NorChain and BSC
 * 2. Calculates deterministic NOR token address
 * 3. Deploys NOR token to SAME address on both chains
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';
import fs from 'fs';
import { execSync } from 'child_process';

dotenvConfig();

const NORCHAIN_RPC = process.env.PRIVATE_CHAIN_RPC || "https://rpc.xaheen.org";
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

// Salt for deterministic deployment (can be any bytes32)
const SALT = ethers.id("NOR_TOKEN_V1"); // Creates unique salt from string

async function main() {
  console.log('\n<¯ Deploying NOR Token to Same Address on All Chains\n');
  console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n');

  // Step 1: Compile contracts
  console.log('[1/6] Compiling contracts...\n');
  execSync('npx hardhat compile', { stdio: 'inherit' });

  // Step 2: Get NOR Token bytecode
  console.log('\n[2/6] Loading NOR Token bytecode...\n');

  const NORToken = JSON.parse(
    fs.readFileSync('artifacts/contracts/NORToken.sol/NORToken.json', 'utf8')
  );

  const norBytecode = NORToken.bytecode;
  const norBytecodeHash = ethers.keccak256(norBytecode);

  console.log(`  Bytecode length: ${norBytecode.length / 2} bytes`);
  console.log(`  Bytecode hash: ${norBytecodeHash}\n`);

  // Step 3: Deploy CREATE2 Factory to NorChain
  console.log('[3/6] Deploying CREATE2 Factory to NorChain...\n');

  const norchainProvider = new ethers.JsonRpcProvider(NORCHAIN_RPC);
  const norchainWallet = new ethers.Wallet(process.env.PRIVATE_CHAIN_KEY, norchainProvider);

  const CREATE2Factory = JSON.parse(
    fs.readFileSync('artifacts/contracts/factories/CREATE2Factory.sol/CREATE2Factory.json', 'utf8')
  );

  const factoryNorChain = await new ethers.ContractFactory(
    CREATE2Factory.abi,
    CREATE2Factory.bytecode,
    norchainWallet
  ).deploy();

  await factoryNorChain.waitForDeployment();
  const factoryNorChainAddress = await factoryNorChain.getAddress();

  console.log(`   NorChain Factory: ${factoryNorChainAddress}\n`);

  // Step 4: Deploy CREATE2 Factory to BSC
  console.log('[4/6] Deploying CREATE2 Factory to BSC...\n');

  const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);
  const bscWallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, bscProvider);

  const factoryBSC = await new ethers.ContractFactory(
    CREATE2Factory.abi,
    CREATE2Factory.bytecode,
    bscWallet
  ).deploy();

  await factoryBSC.waitForDeployment();
  const factoryBSCAddress = await factoryBSC.getAddress();

  console.log(`   BSC Factory: ${factoryBSCAddress}\n`);

  // Step 5: Calculate deterministic NOR token address
  console.log('[5/6] Calculating deterministic NOR address...\n');

  // Both factories must be at same address!
  if (factoryNorChainAddress !== factoryBSCAddress) {
    console.log('   WARNING: Factory addresses differ!');
    console.log(`   NorChain: ${factoryNorChainAddress}`);
    console.log(`   BSC: ${factoryBSCAddress}`);
    console.log('\n   This will result in DIFFERENT NOR addresses!');
    console.log('   Deploy factory to same address first.\n');
    process.exit(1);
  }

  const predictedAddress = await factoryNorChain.computeAddressWithHash(
    factoryNorChainAddress,
    SALT,
    norBytecodeHash
  );

  console.log(`  <¯ Predicted NOR Address: ${predictedAddress}`);
  console.log(`  Salt: ${SALT}\n`);
  console.log(`  This address will be SAME on:`);
  console.log(`      NorChain (65001)`);
  console.log(`      BSC Mainnet (56)`);
  console.log(`      Ethereum (1)`);
  console.log(`      Polygon (137)`);
  console.log(`      Any EVM chain!\n`);

  // Step 6: Deploy NOR Token via CREATE2
  console.log('[6/6] Deploying NOR Token...\n');

  console.log('  Deploying to NorChain...');
  const deployTxNorChain = await factoryNorChain.deploy(norBytecode, SALT);
  const receiptNorChain = await deployTxNorChain.wait();
  console.log(`   NorChain TX: ${receiptNorChain.hash}\n`);

  console.log('  Deploying to BSC...');
  const deployTxBSC = await factoryBSC.deploy(norBytecode, SALT);
  const receiptBSC = await deployTxBSC.wait();
  console.log(`   BSC TX: ${receiptBSC.hash}\n`);

  // Verify deployment
  const norNorChain = new ethers.Contract(predictedAddress, NORToken.abi, norchainProvider);
  const norBSC = new ethers.Contract(predictedAddress, NORToken.abi, bscProvider);

  const nameNorChain = await norNorChain.name();
  const nameBSC = await norBSC.name();

  console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n');
  console.log('<‰ SUCCESS! NOR Token Deployed to Same Address!\n');
  console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n');

  console.log('=Í Contract Address (SAME on all chains):');
  console.log(`   ${predictedAddress}\n`);

  console.log(' Verified on NorChain:');
  console.log(`   Name: ${nameNorChain}`);
  console.log(`   Network: NorChain (65001)`);
  console.log(`   TX: ${receiptNorChain.hash}\n`);

  console.log(' Verified on BSC:');
  console.log(`   Name: ${nameBSC}`);
  console.log(`   Network: BSC Mainnet (56)`);
  console.log(`   TX: ${receiptBSC.hash}\n`);

  console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n');
  console.log('=Ý Next Steps:\n');
  console.log('1. Update bridge contracts with new NOR address');
  console.log('2. Migrate liquidity from old to new address');
  console.log('3. Announce new address to community');
  console.log('4. Deploy to Ethereum, Polygon, etc. (same address!)\n');

  // Save deployment info
  const deploymentInfo = {
    factoryAddress: factoryNorChainAddress,
    norTokenAddress: predictedAddress,
    salt: SALT,
    deployments: {
      norchain: {
        chainId: 65001,
        tx: receiptNorChain.hash,
        factory: factoryNorChainAddress
      },
      bsc: {
        chainId: 56,
        tx: receiptBSC.hash,
        factory: factoryBSCAddress
      }
    },
    timestamp: new Date().toISOString()
  };

  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(
    'deployments/nor-create2-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('=¾ Deployment info saved to: deployments/nor-create2-deployment.json\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nL Error:', error.message);
    console.error(error);
    process.exit(1);
  });
