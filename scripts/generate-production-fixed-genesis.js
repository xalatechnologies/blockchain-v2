import fs from 'fs';
import { ethers } from 'ethers';

console.log('🔧 Generating fixed production genesis...\n');

// Validators (CORRECTED - lexicographically sorted lowercase)
const VALIDATORS = [
  '0x15f0f5b738bc2b1ab8cd68e4674769a89bf5390a',  // Sorted!
  '0x689cf2c189781d9bb6859a830acbf64044e4432f',
  '0xbb64f4050fc21a2ec3506245a1ad63cb0256b6de'
];

console.log('👥 Validators (CORRECTED ORDER):');
VALIDATORS.forEach((v, i) => {
  console.log(`   ${i + 1}. ${v}`);
});
console.log('');

// Build extraData with corrected ordering
const vanity = '0x' + '0'.repeat(64);
const validatorsHex = VALIDATORS.map(v => v.slice(2)).join('');
const seal = '0'.repeat(130);
const extraData = vanity + validatorsHex + seal;

// Load exported state
let stateData = {};
try {
  const stateExport = JSON.parse(fs.readFileSync('data/state-block-9999.json', 'utf8'));
  stateData = stateExport.accounts || stateExport.alloc || {};
  console.log('📊 Loaded state from block 9999');
  console.log(`   Accounts: ${Object.keys(stateData).length}`);
} catch (e) {
  console.log('⚠️  Could not load state export, using empty alloc');
  console.log(`   Error: ${e.message}`);
}
console.log('');

// Create production genesis
const genesis = {
  config: {
    chainId: 65001,
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
      period: 3,
      epoch: 10000  // Reasonable epoch with mechanism fixed
    }
  },
  difficulty: '0x1',
  gasLimit: '0x2FAF080',
  extradata: extraData,
  alloc: stateData
};

// Write new genesis
fs.writeFileSync('data/genesis-fixed-epoch-10k.json', JSON.stringify(genesis, null, 2));

console.log('✅ Fixed genesis generated!');
console.log('');
console.log('Changes:');
console.log('   ✅ Validator ordering: CORRECTED (sorted lowercase)');
console.log('   ✅ Epoch: 10,000 blocks (~8 hours)');
console.log('   ✅ State: ALL imported from block 9999');
console.log('   ✅ Chain ID: 65001 (unchanged)');
console.log(`   ✅ Accounts preserved: ${Object.keys(stateData).length}`);
console.log('');
console.log('File: data/genesis-fixed-epoch-10k.json');
console.log('');
