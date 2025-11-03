import fs from 'fs';
import { ethers } from 'ethers';

/**
 * Generate Testnet Genesis with Pre-Deployed Contracts
 *
 * This creates a genesis file with all core Noor Chain contracts pre-deployed at
 * unique sequential addresses matching the pattern 0x0cF8e180350253271f4b917CcFb0aCCc4862F26X
 */

console.log('🔧 Generating Testnet Genesis with Pre-Deployed Contracts...\n');

// Base address pattern (user requested)
const BASE_ADDRESS = '0x0cF8e180350253271f4b917CcFb0aCCc4862F262';

// Generate sequential addresses
function getSequentialAddress(baseAddress, offset) {
  const base = BigInt(baseAddress);
  const newAddress = (base + BigInt(offset)).toString(16);
  return '0x' + newAddress.padStart(40, '0');
}

// Contract addresses (sequential)
const CONTRACTS = {
  BTCBR: getSequentialAddress(BASE_ADDRESS, 0),        // 0x...F262
  NOR_TOKEN: getSequentialAddress(BASE_ADDRESS, 1),    // 0x...F263
  NOORSWAP_FACTORY: getSequentialAddress(BASE_ADDRESS, 2), // 0x...F264
  NOORSWAP_ROUTER: getSequentialAddress(BASE_ADDRESS, 3),  // 0x...F265
  DIRHAMAT: getSequentialAddress(BASE_ADDRESS, 4),     // 0x...F266
  DIGITAL_KES: getSequentialAddress(BASE_ADDRESS, 5),  // 0x...F267
  NORDCOIN: getSequentialAddress(BASE_ADDRESS, 6),     // 0x...F268
  WNOR: getSequentialAddress(BASE_ADDRESS, 7),         // 0x...F269
  WUSDT: getSequentialAddress(BASE_ADDRESS, 8),        // 0x...F26A
  WBNB: getSequentialAddress(BASE_ADDRESS, 9),         // 0x...F26B
  WETH: getSequentialAddress(BASE_ADDRESS, 10),        // 0x...F26C
  LIQUIDITY_LOCK: getSequentialAddress(BASE_ADDRESS, 11), // 0x...F26D
  ORACLE_AGGREGATOR_GOLD: getSequentialAddress(BASE_ADDRESS, 12), // 0x...F26E
  ORACLE_AGGREGATOR_AED: getSequentialAddress(BASE_ADDRESS, 13),  // 0x...F26F
  ORACLE_AGGREGATOR_KES: getSequentialAddress(BASE_ADDRESS, 14),  // 0x...F270
  ORACLE_AGGREGATOR_NOK: getSequentialAddress(BASE_ADDRESS, 15),  // 0x...F271
  ORACLE_AGGREGATOR_SEK: getSequentialAddress(BASE_ADDRESS, 16),  // 0x...F272
  ORACLE_AGGREGATOR_DKK: getSequentialAddress(BASE_ADDRESS, 17),  // 0x...F273
};

console.log('📍 Contract Addresses (Sequential):');
Object.entries(CONTRACTS).forEach(([name, address]) => {
  console.log(`   ${name.padEnd(30)} ${address}`);
});
console.log('');

// Validator addresses (same as production)
const VALIDATORS = [
  '0xbb64F4050fC21A2eC3506245A1Ad63cB0256b6dE', // Validator 1
  '0x689CF2C189781d9bB6859A830acbF64044E4432f', // Validator 2
  '0x15f0f5B738BC2b1ab8cD68E4674769a89bF5390a', // Validator 3
  '0xdD779a290C937144F80Eb75b75d814c834536B1b', // Treasury/Deployer
];

// ExtraData for Parlia (validators must be sorted lowercase)
const sortedValidators = VALIDATORS.slice(0, 3)
  .map(v => v.toLowerCase())
  .sort();

// Build extraData: 32-byte vanity + validators + 65-byte seal
const vanity = '0x' + '0'.repeat(64); // 32 bytes
const validatorsHex = sortedValidators.map(v => v.slice(2)).join('');
const seal = '0'.repeat(130); // 65 bytes
const extraData = vanity + validatorsHex + seal;

console.log('👥 Validators (sorted):');
sortedValidators.forEach((v, i) => {
  console.log(`   ${i + 1}. ${v}`);
});
console.log('');

// Simplified contract bytecode (placeholder - will be replaced with actual bytecode)
// In production, these would be full compiled bytecode from Hardhat
const SIMPLE_ERC20_BYTECODE = '0x' + '60806040'.padEnd(1000, '0'); // Placeholder

// Genesis configuration
const genesis = {
  config: {
    chainId: 65002,  // Testnet Chain ID (different from production 65001)
    homesteadBlock: 0,
    eip150Block: 0,
    eip155Block: 0,
    eip158Block: 0,
    byzantiumBlock: 0,
    constantinopleBlock: 0,
    petersburgBlock: 0,
    istanbulBlock: 0,
    muirGlacierBlock: 0,
    ramanujanBlock: 0,
    nielsBlock: 0,
    mirrorSyncBlock: 0,
    brunoBlock: 0,
    eulerBlock: 0,
    parlia: {
      period: 3,      // 3-second blocks
      epoch: 1000     // Epoch every 1000 blocks (~50 minutes)
    }
  },
  difficulty: '0x1',
  gasLimit: '0x2FAF080',
  extradata: extraData,
  alloc: {}
};

// Add validator balances (1M NOR each for gas)
VALIDATORS.forEach(validator => {
  genesis.alloc[validator] = {
    balance: '0xd3c21bcecceda1000000' // 1,000,000 NOR with 24 decimals
  };
});

// Add contract deployments with simplified bytecode
// Note: In actual deployment, use full compiled bytecode from artifacts

// BTCBR Token
genesis.alloc[CONTRACTS.BTCBR] = {
  balance: '0x0',
  code: SIMPLE_ERC20_BYTECODE,
  storage: {
    // Total supply: 10.5 septillion (same as production)
    '0x0000000000000000000000000000000000000000000000000000000000000002': '0x0000000000000000000000000000000000000084595161401484a000000',
    // Balance of treasury
    [`0x${ethers.solidityPackedKeccak256(['uint256', 'address'], [1, VALIDATORS[3]]).slice(2)}`]: '0x0000000000000000000000000000000000000084595161401484a000000'
  }
};

// NOR Token (21B supply, 24 decimals)
genesis.alloc[CONTRACTS.NOR_TOKEN] = {
  balance: '0x0',
  code: SIMPLE_ERC20_BYTECODE,
  storage: {
    // Total supply: 21,000,000,000 * 10^24
    '0x0000000000000000000000000000000000000000000000000000000000000002': '0x00000000000000000000000000000000000011c37937e080000000000000',
    // Balance of treasury
    [`0x${ethers.solidityPackedKeccak256(['uint256', 'address'], [1, VALIDATORS[3]]).slice(2)}`]: '0x00000000000000000000000000000000000011c37937e080000000000000'
  }
};

// NoorSwap Factory
genesis.alloc[CONTRACTS.NOORSWAP_FACTORY] = {
  balance: '0x0',
  code: SIMPLE_ERC20_BYTECODE,
  storage: {}
};

// NoorSwap Router
genesis.alloc[CONTRACTS.NOORSWAP_ROUTER] = {
  balance: '0x0',
  code: SIMPLE_ERC20_BYTECODE,
  storage: {
    // Factory address
    '0x0000000000000000000000000000000000000000000000000000000000000000': ethers.zeroPadValue(CONTRACTS.NOORSWAP_FACTORY, 32)
  }
};

// Stablecoins
['DIRHAMAT', 'DIGITAL_KES', 'NORDCOIN'].forEach(coin => {
  genesis.alloc[CONTRACTS[coin]] = {
    balance: '0x0',
    code: SIMPLE_ERC20_BYTECODE,
    storage: {
      // Initial supply: 10M with 18 decimals
      '0x0000000000000000000000000000000000000000000000000000000000000002': '0x00000000000000000000000000000000000000000000021e19e0c9bab2400000',
      // Balance of treasury
      [`0x${ethers.solidityPackedKeccak256(['uint256', 'address'], [1, VALIDATORS[3]]).slice(2)}`]: '0x00000000000000000000000000000000000000000000021e19e0c9bab2400000'
    }
  };
});

// Wrapped tokens
['WNOR', 'WUSDT', 'WBNB', 'WETH'].forEach(token => {
  genesis.alloc[CONTRACTS[token]] = {
    balance: '0x0',
    code: SIMPLE_ERC20_BYTECODE,
    storage: {}
  };
});

// Liquidity Lock contract
genesis.alloc[CONTRACTS.LIQUIDITY_LOCK] = {
  balance: '0x0',
  code: SIMPLE_ERC20_BYTECODE,
  storage: {}
};

// Oracle Aggregators (6 price feeds)
[
  'ORACLE_AGGREGATOR_GOLD',
  'ORACLE_AGGREGATOR_AED',
  'ORACLE_AGGREGATOR_KES',
  'ORACLE_AGGREGATOR_NOK',
  'ORACLE_AGGREGATOR_SEK',
  'ORACLE_AGGREGATOR_DKK'
].forEach(oracle => {
  genesis.alloc[CONTRACTS[oracle]] = {
    balance: '0x0',
    code: SIMPLE_ERC20_BYTECODE,
    storage: {}
  };
});

// Write genesis file
const outputPath = 'data/genesis-testnet-with-contracts.json';
fs.writeFileSync(outputPath, JSON.stringify(genesis, null, 2));

console.log(`✅ Testnet genesis generated: ${outputPath}\n`);
console.log('📊 Genesis Summary:');
console.log(`   Chain ID: ${genesis.config.chainId}`);
console.log(`   Epoch: ${genesis.config.parlia.epoch} blocks`);
console.log(`   Validators: ${sortedValidators.length}`);
console.log(`   Pre-deployed contracts: ${Object.keys(CONTRACTS).length}`);
console.log(`   Pre-funded accounts: ${VALIDATORS.length}`);
console.log('');

// Write contract addresses to separate file for reference
const addressesPath = 'data/testnet-contract-addresses.json';
fs.writeFileSync(addressesPath, JSON.stringify({
  network: 'Noor Chain Testnet',
  chainId: 65002,
  epoch: 1000,
  timestamp: new Date().toISOString(),
  contracts: CONTRACTS,
  validators: VALIDATORS
}, null, 2));

console.log(`✅ Contract addresses saved: ${addressesPath}\n`);

// Print deployment instructions
console.log('🚀 Next Steps:');
console.log('   1. Deploy testnet validators with this genesis');
console.log('   2. Deploy auto-sealer for epoch 1000');
console.log('   3. Test auto-sealer for 3-5 epochs (~2-4 hours)');
console.log('   4. Once validated, apply to production');
console.log('');
console.log('📝 Note: This genesis uses simplified bytecode placeholders.');
console.log('   For production, replace with actual compiled contract bytecode.');
console.log('');
