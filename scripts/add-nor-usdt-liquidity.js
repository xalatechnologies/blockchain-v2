/**
 * Add NOR/USDT Liquidity on PancakeSwap
 *
 * Creates liquidity pool with your available USDT
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const USDT = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 Router
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function main() {
  console.log('\n💧 Adding NOR/USDT Liquidity on PancakeSwap\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  // Contract instances
  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const usdtToken = new ethers.Contract(USDT, ERC20_ABI, wallet);
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  // Check balances
  console.log('📊 Checking balances...');
  const norBalance = await norToken.balanceOf(wallet.address);
  const usdtBalance = await usdtToken.balanceOf(wallet.address);

  console.log(`  NOR_BSC: ${ethers.formatEther(norBalance)}`);
  console.log(`  USDT: ${ethers.formatEther(usdtBalance)}\n`);

  // Suggested amounts - Using most of your USDT for meaningful liquidity
  console.log('💡 Recommended Liquidity (using your available USDT):\n');

  // Use $15 USDT (keep $7.55 for gas/future needs)
  const usdtAmount = ethers.parseEther("15");  // $15 USDT
  const norAmount = ethers.parseEther("3000"); // 3,000 NOR

  const initialPrice = 15 / 3000; // $0.005 per NOR
  const marketCap = initialPrice * 10000000; // For 10M supply

  console.log('Selected Amounts:');
  console.log(`  USDT: ${ethers.formatEther(usdtAmount)} USDT ($15)`);
  console.log(`  NOR: ${ethers.formatEther(norAmount)} NOR`);
  console.log(`  Initial Price: $${initialPrice.toFixed(6)} per NOR`);
  console.log(`  Market Cap at this price: ~$${marketCap.toLocaleString()}\n`);

  console.log('This will:');
  console.log('  ✅ Create a liquidity pool on PancakeSwap');
  console.log('  ✅ Establish an initial price for NOR_BSC');
  console.log('  ✅ Make NOR tradeable on BSC');
  console.log('  ✅ Enable price discovery on DEX aggregators\n');

  // Verify sufficient balances
  if (norBalance < norAmount) {
    console.log('❌ Insufficient NOR balance!');
    console.log(`   Need: ${ethers.formatEther(norAmount)}`);
    console.log(`   Have: ${ethers.formatEther(norBalance)}\n`);
    process.exit(1);
  }

  if (usdtBalance < usdtAmount) {
    console.log('❌ Insufficient USDT balance!');
    console.log(`   Need: ${ethers.formatEther(usdtAmount)}`);
    console.log(`   Have: ${ethers.formatEther(usdtBalance)}`);
    console.log('\n💡 Adjust amounts in script if needed\n');
    process.exit(1);
  }

  console.log('⚠️  IMPORTANT:');
  console.log('   This will use $15 of your $22.55 USDT');
  console.log('   Keeping $7.55 for future gas/needs');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Approve tokens
  console.log('[1/4] Approving NOR...');
  const norAllowance = await norToken.allowance(wallet.address, PANCAKE_ROUTER);
  if (norAllowance < norAmount) {
    const approveTx1 = await norToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
    console.log(`  TX: ${approveTx1.hash}`);
    await approveTx1.wait();
    console.log('✅ NOR approved\n');
  } else {
    console.log('✅ NOR already approved\n');
  }

  console.log('[2/4] Approving USDT...');
  const usdtAllowance = await usdtToken.allowance(wallet.address, PANCAKE_ROUTER);
  if (usdtAllowance < usdtAmount) {
    const approveTx2 = await usdtToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
    console.log(`  TX: ${approveTx2.hash}`);
    await approveTx2.wait();
    console.log('✅ USDT approved\n');
  } else {
    console.log('✅ USDT already approved\n');
  }

  // Add liquidity
  console.log('[3/4] Adding liquidity to PancakeSwap...');
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const slippage = 5; // 5% slippage tolerance

  const amountAMin = (norAmount * BigInt(100 - slippage)) / 100n;
  const amountBMin = (usdtAmount * BigInt(100 - slippage)) / 100n;

  console.log('Transaction details:');
  console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
  console.log(`  USDT: ${ethers.formatEther(usdtAmount)}`);
  console.log(`  Slippage: ${slippage}%`);
  console.log(`  Deadline: ${new Date(deadline * 1000).toLocaleString()}\n`);

  try {
    const liquidityTx = await router.addLiquidity(
      NOR_BSC,
      USDT,
      norAmount,
      usdtAmount,
      amountAMin,
      amountBMin,
      wallet.address,
      deadline,
      {
        gasLimit: 500000
      }
    );

    console.log(`TX Hash: ${liquidityTx.hash}`);
    console.log('Waiting for confirmation...\n');

    const receipt = await liquidityTx.wait();
    console.log('✅ Liquidity added successfully!\n');

    // Calculate results
    console.log('[4/4] Verifying liquidity pool...\n');

    const finalNorBalance = await norToken.balanceOf(wallet.address);
    const finalUsdtBalance = await usdtToken.balanceOf(wallet.address);

    const norAdded = norBalance - finalNorBalance;
    const usdtAdded = usdtBalance - finalUsdtBalance;

    console.log('═══════════════════════════════════════');
    console.log('📊 LIQUIDITY POOL CREATED!');
    console.log('═══════════════════════════════════════\n');

    console.log('Pool Details:');
    console.log(`  NOR deposited: ${ethers.formatEther(norAdded)}`);
    console.log(`  USDT deposited: ${ethers.formatEther(usdtAdded)}`);
    const actualPrice = parseFloat(ethers.formatEther(usdtAdded)) / parseFloat(ethers.formatEther(norAdded));
    console.log(`  Initial price: $${actualPrice.toFixed(6)} per NOR`);
    console.log(`  Market cap: ~$${(actualPrice * 10000000).toLocaleString()}\n`);

    console.log('Remaining Balances:');
    console.log(`  NOR: ${ethers.formatEther(finalNorBalance)}`);
    console.log(`  USDT: ${ethers.formatEther(finalUsdtBalance)}\n`);

    console.log('═══════════════════════════════════════');
    console.log('🎉 SUCCESS!');
    console.log('═══════════════════════════════════════\n');

    console.log('Your NOR_BSC token now has:');
    console.log('  ✅ Liquidity on PancakeSwap');
    console.log('  ✅ Discoverable price ($' + actualPrice.toFixed(6) + ')');
    console.log('  ✅ Tradeable on BSC DEXs\n');

    console.log('📍 View Your Pool:');
    console.log(`  PancakeSwap: https://pancakeswap.finance/liquidity\n`);

    console.log('📈 Price Discovery (wait 5-10 minutes):');
    console.log('  DexScreener: https://dexscreener.com/bsc/' + NOR_BSC.toLowerCase());
    console.log('  DexTools: https://www.dextools.io/app/en/bnb/pair-explorer/' + NOR_BSC.toLowerCase() + '\n');

    console.log('📝 Next Steps:');
    console.log('  1. Wait 5-10 minutes for indexing');
    console.log('  2. Check DexScreener/DexTools for price');
    console.log('  3. Submit to CoinGecko: https://www.coingecko.com/en/coins/new');
    console.log('  4. Submit to CoinMarketCap: https://coinmarketcap.com/request/');
    console.log('  5. Add more liquidity as needed\n');

    console.log('💡 TIP: The market will discover the actual value through trading.');
    console.log('    This initial price is just a starting point!\n');

  } catch (error) {
    console.error('\n❌ Transaction failed:', error.message);

    if (error.message.includes('INSUFFICIENT_A_AMOUNT') || error.message.includes('INSUFFICIENT_B_AMOUNT')) {
      console.log('\n💡 This might mean:');
      console.log('   - Pool already exists with different ratio');
      console.log('   - Try adjusting amounts to match existing pool');
      console.log('   - Or increase slippage tolerance\n');
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
