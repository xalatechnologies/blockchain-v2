import dotenv from 'dotenv';
dotenv.config();

const NOR_BSC_ADDRESS = '0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

console.log('🔍 Checking NOR_BSC token transactions via BSCScan API...\n');

if (!BSCSCAN_API_KEY) {
  console.log('⚠️  No BSCSCAN_API_KEY found in .env');
  console.log('   Using rate-limited public API...\n');
}

async function checkTransactions() {
  try {
    // Get token transfers
    const apiUrl = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${NOR_BSC_ADDRESS}&page=1&offset=20&sort=desc&apikey=${BSCSCAN_API_KEY || ''}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status !== '1') {
      if (data.message === 'No transactions found') {
        console.log('❌ No transactions found for this token');
        console.log('   Token address: ' + NOR_BSC_ADDRESS);
        console.log('   This could mean:');
        console.log('   1. Token is newly deployed');
        console.log('   2. No transfers have occurred yet');
        console.log('   3. Only mint/deployment transaction exists\n');

        // Check contract
        console.log('📊 Checking contract existence...');
        const contractUrl = `https://api.bscscan.com/api?module=contract&action=getabi&address=${NOR_BSC_ADDRESS}&apikey=${BSCSCAN_API_KEY || ''}`;
        const contractResponse = await fetch(contractUrl);
        const contractData = await contractResponse.json();

        if (contractData.status === '1') {
          console.log('✅ Contract verified and exists on BSCScan');
        } else {
          console.log('⚠️  Contract not verified or does not exist');
        }

        return;
      }

      console.error('❌ BSCScan API Error:', data.message || data.result);
      console.log('   Full response:', JSON.stringify(data, null, 2));
      return;
    }

    const transactions = data.result;
    console.log(`✅ Found ${transactions.length} recent transactions\n`);
    console.log('━'.repeat(100));
    console.log('LAST 10 TRANSACTIONS:');
    console.log('━'.repeat(100) + '\n');

    const displayCount = Math.min(10, transactions.length);

    for (let i = 0; i < displayCount; i++) {
      const tx = transactions[i];
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      const amount = (parseInt(tx.value) / 1e18).toLocaleString();

      console.log(`${i + 1}. Transaction ${tx.hash}`);
      console.log(`   Block: ${parseInt(tx.blockNumber).toLocaleString()}`);
      console.log(`   Time: ${date.toLocaleString()}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to}`);
      console.log(`   Amount: ${amount} NOR`);
      console.log(`   Token Name: ${tx.tokenName} (${tx.tokenSymbol})`);
      console.log(`   Gas Used: ${parseInt(tx.gasUsed).toLocaleString()}`);
      console.log('');
    }

    // Statistics
    console.log('━'.repeat(100));
    console.log('SUMMARY:');
    console.log('━'.repeat(100));

    const uniqueAddresses = new Set();
    transactions.forEach(tx => {
      uniqueAddresses.add(tx.from.toLowerCase());
      uniqueAddresses.add(tx.to.toLowerCase());
    });

    console.log(`Total recent transactions: ${transactions.length}`);
    console.log(`Unique addresses: ${uniqueAddresses.size}`);

    if (transactions.length > 0) {
      const oldestTx = transactions[transactions.length - 1];
      const newestTx = transactions[0];
      const oldestDate = new Date(parseInt(oldestTx.timeStamp) * 1000);
      const newestDate = new Date(parseInt(newestTx.timeStamp) * 1000);

      console.log(`Oldest transaction in set: ${oldestDate.toLocaleString()}`);
      console.log(`Newest transaction: ${newestDate.toLocaleString()}`);

      // Top participants
      const fromCounts = {};
      const toCounts = {};
      transactions.forEach(tx => {
        fromCounts[tx.from] = (fromCounts[tx.from] || 0) + 1;
        toCounts[tx.to] = (toCounts[tx.to] || 0) + 1;
      });

      const topSenders = Object.entries(fromCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const topReceivers = Object.entries(toCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

      console.log('\n📤 Top Senders:');
      topSenders.forEach(([addr, count], idx) => {
        console.log(`   ${idx + 1}. ${addr} (${count} transactions)`);
      });

      console.log('\n📥 Top Receivers:');
      topReceivers.forEach(([addr, count], idx) => {
        console.log(`   ${idx + 1}. ${addr} (${count} transactions)`);
      });
    }

    console.log('\n🔗 View on BSCScan:');
    console.log(`   https://bscscan.com/token/${NOR_BSC_ADDRESS}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTransactions();
