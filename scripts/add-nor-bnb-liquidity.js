/**
 * Add NOR/BNB Liquidity on PancakeSwap
 *
 * Uses native BNB - easier and more straightforward than using USDT
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 Router
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const ROUTER_ABI = [
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

async function main() {
  console.log('\n💧 Adding NOR/BNB Liquidity on PancakeSwap\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  // Contract instances
  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  // Check balances
  console.log('📊 Checking balances...');
  const norBalance = await norToken.balanceOf(wallet.address);
  const bnbBalance = await provider.getBalance(wallet.address);

  console.log(`  NOR_BSC: ${ethers.formatEther(norBalance)}`);
  console.log(`  BNB: ${ethers.formatEther(bnbBalance)}\n`);

  // Use small amount of BNB for liquidity
  const bnbAmount = ethers.parseEther("0.01");  // 0.01 BNB (~$6)
  const norAmount = ethers.parseEther("1000");  // 1,000 NOR

  const bnbPrice = 600; // Approximate BNB price
  const usdValue = 0.01 * bnbPrice; // ~$6
  const initialPrice = usdValue / 1000; // $0.006 per NOR
  const marketCap = initialPrice * 10000000; // For 10M supply

  console.log('💡 Liquidity Details:\n');
  console.log('Selected Amounts:');
  console.log(`  BNB: ${ethers.formatEther(bnbAmount)} BNB (~$${usdValue})`);
  console.log(`  NOR: ${ethers.formatEther(norAmount)} NOR`);
  console.log(`  Initial Price: ~$${initialPrice.toFixed(6)} per NOR`);
  console.log(`  Market Cap: ~$${marketCap.toLocaleString()}\n`);

  console.log('This will:');
  console.log('  ✅ Create NOR/BNB liquidity pool');
  console.log('  ✅ Establish initial price');
  console.log('  ✅ Make NOR tradeable');
  console.log('  ✅ Enable price discovery\n');

  // Verify sufficient balances
  if (norBalance < norAmount) {
    console.log('❌ Insufficient NOR balance!');
    process.exit(1);
  }

  if (bnbBalance < ethers.parseEther("0.015")) { // Need 0.01 + gas
    console.log('❌ Insufficient BNB balance (need at least 0.015 BNB for liquidity + gas)!');
    process.exit(1);
  }

  console.log('⏳ Starting in 3 seconds... (Ctrl+C to cancel)\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Approve NOR
    console.log('[1/3] Approving NOR...');
    const norAllowance = await norToken.allowance(wallet.address, PANCAKE_ROUTER);
    if (norAllowance < norAmount) {
      const approveTx = await norToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
      console.log(`  TX: ${approveTx.hash}`);
      await approveTx.wait();
      console.log('✅ NOR approved\n');
    } else {
      console.log('✅ NOR already approved\n');
    }

    // Add liquidity
    console.log('[2/3] Adding liquidity...');
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const slippage = 5; // 5% slippage

    const amountTokenMin = (norAmount * BigInt(100 - slippage)) / 100n;
    const amountETHMin = (bnbAmount * BigInt(100 - slippage)) / 100n;

    console.log('Transaction params:');
    console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
    console.log(`  BNB: ${ethers.formatEther(bnbAmount)}`);
    console.log(`  Slippage: ${slippage}%`);
    console.log(`  Deadline: ${new Date(deadline * 1000).toLocaleString()}\n`);

    const liquidityTx = await router.addLiquidityETH(
      NOR_BSC,
      norAmount,
      amountTokenMin,
      amountETHMin,
      wallet.address,
      deadline,
      {
        value: bnbAmount,
        gasLimit: 500000
      }
    );

    console.log(`TX Hash: ${liquidityTx.hash}`);
    console.log('Waiting for confirmation...\n');

    const receipt = await liquidityTx.wait();

    if (receipt.status === 0) {
      throw new Error('Transaction failed');
    }

    console.log('✅ Liquidity added successfully!\n');

    // Verify
    console.log('[3/3] Checking final balances...\n');

    const finalNorBalance = await norToken.balanceOf(wallet.address);
    const finalBnbBalance = await provider.getBalance(wallet.address);

    const norAdded = norBalance - finalNorBalance;
    const bnbUsed = bnbBalance - finalBnbBalance; // Includes gas

    console.log('═══════════════════════════════════════');
    console.log('🎉 LIQUIDITY POOL CREATED!');
    console.log('═══════════════════════════════════════\n');

    console.log('Pool Details:');
    console.log(`  NOR deposited: ${ethers.formatEther(norAdded)}`);
    console.log(`  BNB used (incl gas): ${ethers.formatEther(bnbUsed)}`);
    const actualPrice = (parseFloat(ethers.formatEther(bnbAmount)) * bnbPrice) / parseFloat(ethers.formatEther(norAdded));
    console.log(`  Initial price: ~$${actualPrice.toFixed(6)} per NOR`);
    console.log(`  Market cap: ~$${(actualPrice * 10000000).toLocaleString()}\n`);

    console.log('Remaining Balances:');
    console.log(`  NOR: ${ethers.formatEther(finalNorBalance)}`);
    console.log(`  BNB: ${ethers.formatEther(finalBnbBalance)}\n`);

    console.log('═══════════════════════════════════════\n');

    console.log('✅ Your NOR_BSC token now has:');
    console.log('  • Liquidity on PancakeSwap');
    console.log('  • Discoverable price');
    console.log('  • Trading enabled\n');

    console.log('📍 View Your Pool:');
    console.log(`  PancakeSwap: https://pancakeswap.finance/liquidity\n`);

    console.log('📈 Price Discovery (wait 5-10 minutes):');
    console.log(`  DexScreener: https://dexscreener.com/bsc/${NOR_BSC.toLowerCase()}`);
    console.log(`  DexTools: https://www.dextools.io/app/en/bnb/pair-explorer/${NOR_BSC.toLowerCase()}\n`);

    console.log('📝 Next Steps:');
    console.log('  1. Wait 5-10 min for DEX aggregators');
    console.log('  2. Check price on DexScreener');
    console.log('  3. Add token logo (guide provided)');
    console.log('  4. Submit to CoinGecko/CMC');
    console.log('  5. Add more liquidity if needed\n');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);

    if (error.message.includes('INSUFFICIENT')) {
      console.log('\n💡 Try:');
      console.log('   - Increasing slippage');
      console.log('   - Adjusting amounts');
      console.log('   - Checking if pool exists\n');
    }

    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
