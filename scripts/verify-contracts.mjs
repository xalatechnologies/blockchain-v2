import { ethers } from 'ethers';

console.log('🔍 Verifying preserved contracts on NorChain...\n');

const provider = new ethers.JsonRpcProvider('https://rpc.xaheen.org');

const contracts = {
  'NOR Token': '0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80',
  'NOR Bridge': '0xe447647577cc340B0D853F9A8F052E9BF5D673c1',
  'BTCBR': '0x0cF8e180350253271f4b917CcFb0aCCc4862F262'
};

async function verifyContracts() {
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Chain is live! Current block: ${blockNumber}\n`);
    console.log('━'.repeat(80));
    console.log('VERIFYING PRESERVED CONTRACTS:');
    console.log('━'.repeat(80) + '\n');

    for (const [name, address] of Object.entries(contracts)) {
      console.log(`📋 ${name}: ${address}`);

      const code = await provider.getCode(address);

      if (code === '0x') {
        console.log('   ❌ NO CODE FOUND - Contract not deployed!\n');
        continue;
      }

      console.log(`   ✅ Contract exists (${code.length} bytes)`);

      // Try to read balance for this address
      const balance = await provider.getBalance(address);
      console.log(`   💰 Balance: ${ethers.formatEther(balance)} NOR`);

      // Try to read storage
      const storage0 = await provider.getStorage(address, 0);
      console.log(`   📦 Storage slot 0: ${storage0}`);
      console.log('');
    }

    console.log('━'.repeat(80));
    console.log('CHECKING PRE-FUNDED ACCOUNTS:');
    console.log('━'.repeat(80) + '\n');

    const accounts = [
      { name: 'Treasury', address: '0xdD779a290C937144F80Eb75b75d814c834536B1b' },
      { name: 'Validator 1 (new)', address: '0x2844Ae34e062BAA32c46702EaAEe70E3B3E4Ae50' },
      { name: 'Validator 2 (new)', address: '0x109E44D07f2dA6eDbB989fc735d790F3D5668f33' },
      { name: 'Validator 3 (new)', address: '0x89DCadbA1C8128b653C63EA3519Cc158ADc67b4f' }
    ];

    for (const { name, address } of accounts) {
      const balance = await provider.getBalance(address);
      console.log(`${name}: ${ethers.formatEther(balance)} NOR`);
    }

    console.log('\n✅ All verifications complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyContracts();
