import { ethers } from 'ethers';

console.log('🔍 Checking last NOR_BSC token transactions...\n');

const NOR_BSC_ADDRESS = '0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E';
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

const provider = new ethers.JsonRpcProvider(BSC_RPC);

// ERC-20 Transfer event signature
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

async function getLastTransactions() {
  try {
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Current BSC block: ${currentBlock.toLocaleString()}`);

    // Query last 1,000 blocks for Transfer events (reduced to avoid rate limit)
    const fromBlock = currentBlock - 1000;
    console.log(`🔎 Scanning blocks ${fromBlock.toLocaleString()} to ${currentBlock.toLocaleString()}\n`);

    const filter = {
      address: NOR_BSC_ADDRESS,
      topics: [TRANSFER_TOPIC],
      fromBlock: fromBlock,
      toBlock: 'latest'
    };

    const logs = await provider.getLogs(filter);

    if (logs.length === 0) {
      console.log('❌ No transactions found in the last 1,000 blocks');
      console.log('   This could mean:');
      console.log('   1. Token has no recent activity');
      console.log('   2. Token deployment is very recent');
      console.log('   3. Only bridge/mint transactions occurred\n');

      // Check token deployment
      const code = await provider.getCode(NOR_BSC_ADDRESS);
      if (code === '0x') {
        console.log('⚠️  WARNING: No contract code at this address!');
        console.log('   Token may not be deployed yet.');
      } else {
        console.log('✅ Contract exists at this address');
        console.log(`   Code length: ${code.length} bytes\n`);
      }
      return;
    }

    console.log(`✅ Found ${logs.length} Transfer events\n`);
    console.log('━'.repeat(80));
    console.log('LAST 10 TRANSACTIONS:');
    console.log('━'.repeat(80) + '\n');

    // Get last 10 transactions with details
    const lastLogs = logs.slice(-10).reverse();

    for (let i = 0; i < lastLogs.length; i++) {
      const log = lastLogs[i];
      const block = await provider.getBlock(log.blockNumber);
      const tx = await provider.getTransaction(log.transactionHash);

      // Decode transfer event
      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      const value = ethers.toBigInt(log.data);
      const valueFormatted = ethers.formatUnits(value, 18);

      console.log(`${i + 1}. Transaction ${log.transactionHash}`);
      console.log(`   Block: ${log.blockNumber.toLocaleString()}`);
      console.log(`   Time: ${new Date(Number(block.timestamp) * 1000).toLocaleString()}`);
      console.log(`   From: ${from}`);
      console.log(`   To: ${to}`);
      console.log(`   Amount: ${parseFloat(valueFormatted).toLocaleString()} NOR`);
      console.log(`   Initiator: ${tx.from}`);
      console.log('');
    }

    // Summary statistics
    console.log('━'.repeat(80));
    console.log('SUMMARY:');
    console.log('━'.repeat(80));
    console.log(`Total transactions in last 1k blocks: ${logs.length}`);

    // Get unique addresses
    const allAddresses = new Set();
    logs.forEach(log => {
      allAddresses.add('0x' + log.topics[1].slice(26));
      allAddresses.add('0x' + log.topics[2].slice(26));
    });
    console.log(`Unique addresses involved: ${allAddresses.size}`);

    // First and last transaction times
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const firstBlock = await provider.getBlock(firstLog.blockNumber);
    const lastBlock = await provider.getBlock(lastLog.blockNumber);

    console.log(`First transaction: ${new Date(Number(firstBlock.timestamp) * 1000).toLocaleString()}`);
    console.log(`Last transaction: ${new Date(Number(lastBlock.timestamp) * 1000).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'SERVER_ERROR') {
      console.log('\n⚠️  BSC RPC returned error. This could mean:');
      console.log('   1. Too many blocks requested (try reducing range)');
      console.log('   2. Rate limit exceeded');
      console.log('   3. Token address incorrect');
    }
  }
}

getLastTransactions();
