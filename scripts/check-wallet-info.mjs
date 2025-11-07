import { ethers } from 'ethers';

const ADDRESS = '0x4E100f73A329277bC6203C83055677DEF6aa3a48';

console.log(`🔍 Investigating wallet: ${ADDRESS}\n`);

// Check BSC
const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

async function checkBSC() {
  try {
    console.log('📊 BSC MAINNET:');
    console.log('━'.repeat(60));

    const balance = await bscProvider.getBalance(ADDRESS);
    console.log(`Balance: ${ethers.formatEther(balance)} BNB`);

    const txCount = await bscProvider.getTransactionCount(ADDRESS);
    console.log(`Transaction Count: ${txCount}`);

    const code = await bscProvider.getCode(ADDRESS);
    if (code !== '0x') {
      console.log(`⚠️  This is a contract address!`);
      console.log(`Code length: ${code.length} bytes`);
    }

    console.log('');
  } catch (error) {
    console.error('❌ BSC Error:', error.message);
  }
}

// Check NorChain
const norProvider = new ethers.JsonRpcProvider('http://3.91.50.187:8545');

async function checkNorChain() {
  try {
    console.log('📊 NORCHAIN:');
    console.log('━'.repeat(60));

    const balance = await norProvider.getBalance(ADDRESS);
    console.log(`Balance: ${ethers.formatEther(balance)} NOR`);

    const txCount = await norProvider.getTransactionCount(ADDRESS);
    console.log(`Transaction Count: ${txCount}`);

    const code = await norProvider.getCode(ADDRESS);
    if (code !== '0x') {
      console.log(`⚠️  This is a contract address!`);
      console.log(`Code length: ${code.length} bytes`);
    }

    console.log('');
  } catch (error) {
    console.error('❌ NorChain Error:', error.message);
  }
}

async function main() {
  await checkBSC();
  await checkNorChain();

  console.log('━'.repeat(60));
  console.log('📝 SUMMARY:');
  console.log('━'.repeat(60));
  console.log('This address is not found in the codebase.');
  console.log('You can check it manually on:');
  console.log(`- BSCScan: https://bscscan.com/address/${ADDRESS}`);
  console.log(`- Or it might be an external wallet address`);
}

main();
