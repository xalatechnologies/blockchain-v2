/**
 * Add NOR/BUSD Liquidity on PancakeSwap to Establish Price
 *
 * This will create a liquidity pool and set an initial price for NOR_BSC
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // BUSD on BSC
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 Router
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function main() {
  console.log('\n💧 Adding NOR/BUSD Liquidity on PancakeSwap\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  // Contract instances
  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const busdToken = new ethers.Contract(BUSD, ERC20_ABI, wallet);
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  // Check balances
  console.log('📊 Checking balances...');
  const norBalance = await norToken.balanceOf(wallet.address);
  const busdBalance = await busdToken.balanceOf(wallet.address);

  console.log(`  NOR_BSC: ${ethers.formatEther(norBalance)}`);
  console.log(`  BUSD: ${ethers.formatEther(busdBalance)}\n`);

  if (busdBalance === 0n) {
    console.log('❌ You need BUSD to create liquidity pool!');
    console.log('\nOptions:');
    console.log('1. Swap some BNB for BUSD on PancakeSwap');
    console.log('2. Use a different stable token (USDT)');
    console.log('3. Or I can create NOR/BNB pair instead\n');

    console.log('💡 Recommended: Use at least $100-$500 worth for meaningful liquidity\n');
    process.exit(1);
  }

  // Suggested liquidity amounts
  console.log('💡 Suggested Liquidity Scenarios:\n');

  // Scenario 1: Minimal ($100)
  console.log('Option 1 - Minimal ($100 total):');
  console.log('  10,000 NOR + $50 BUSD');
  console.log('  Initial price: $0.005 per NOR');
  console.log('  Market cap at this price: ~$50k (for 10M supply)\n');

  // Scenario 2: Small ($500)
  console.log('Option 2 - Small ($500 total):');
  console.log('  50,000 NOR + $250 BUSD');
  console.log('  Initial price: $0.005 per NOR');
  console.log('  Market cap at this price: ~$50k (for 10M supply)\n');

  // Scenario 3: Medium ($1000)
  console.log('Option 3 - Medium ($1000 total):');
  console.log('  100,000 NOR + $500 BUSD');
  console.log('  Initial price: $0.005 per NOR');
  console.log('  Market cap at this price: ~$50k (for 10M supply)\n');

  console.log('Which option would you like to use? (1/2/3)\n');
  console.log('⚠️  Running this script will execute Option 2 by default');
  console.log('    Edit the amounts below before running!\n');

  // DEFAULT: Option 2 - Small liquidity
  const norAmount = ethers.parseEther("50000");  // 50,000 NOR
  const busdAmount = ethers.parseEther("250");   // $250 BUSD

  console.log('Selected Amounts:');
  console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
  console.log(`  BUSD: ${ethers.formatEther(busdAmount)}`);
  console.log(`  Initial Price: $${(parseFloat(ethers.formatEther(busdAmount)) / parseFloat(ethers.formatEther(norAmount))).toFixed(6)} per NOR\n`);

  // Verify sufficient balances
  if (norBalance < norAmount) {
    console.log('❌ Insufficient NOR balance!');
    console.log(`   Need: ${ethers.formatEther(norAmount)}`);
    console.log(`   Have: ${ethers.formatEther(norBalance)}\n`);
    process.exit(1);
  }

  if (busdBalance < busdAmount) {
    console.log('❌ Insufficient BUSD balance!');
    console.log(`   Need: ${ethers.formatEther(busdAmount)}`);
    console.log(`   Have: ${ethers.formatEther(busdBalance)}\n`);
    process.exit(1);
  }

  // Approve tokens
  console.log('[1/4] Approving NOR...');
  const norAllowance = await norToken.allowance(wallet.address, PANCAKE_ROUTER);
  if (norAllowance < norAmount) {
    const approveTx1 = await norToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
    await approveTx1.wait();
    console.log('✅ NOR approved\n');
  } else {
    console.log('✅ NOR already approved\n');
  }

  console.log('[2/4] Approving BUSD...');
  const busdAllowance = await busdToken.allowance(wallet.address, PANCAKE_ROUTER);
  if (busdAllowance < busdAmount) {
    const approveTx2 = await busdToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
    await approveTx2.wait();
    console.log('✅ BUSD approved\n');
  } else {
    console.log('✅ BUSD already approved\n');
  }

  // Add liquidity
  console.log('[3/4] Adding liquidity to PancakeSwap...');
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const slippage = 5; // 5% slippage tolerance

  const amountAMin = (norAmount * BigInt(100 - slippage)) / 100n;
  const amountBMin = (busdAmount * BigInt(100 - slippage)) / 100n;

  console.log('Adding liquidity with params:');
  console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
  console.log(`  BUSD: ${ethers.formatEther(busdAmount)}`);
  console.log(`  Slippage: ${slippage}%`);
  console.log(`  Deadline: ${new Date(deadline * 1000).toLocaleString()}\n`);

  const liquidityTx = await router.addLiquidity(
    NOR_BSC,
    BUSD,
    norAmount,
    busdAmount,
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
  const finalBusdBalance = await busdToken.balanceOf(wallet.address);

  const norAdded = norBalance - finalNorBalance;
  const busdAdded = busdBalance - finalBusdBalance;

  console.log('📊 Liquidity Pool Created:');
  console.log(`  NOR deposited: ${ethers.formatEther(norAdded)}`);
  console.log(`  BUSD deposited: ${ethers.formatEther(busdAdded)}`);
  console.log(`  Initial price: $${(parseFloat(ethers.formatEther(busdAdded)) / parseFloat(ethers.formatEther(norAdded))).toFixed(6)} per NOR\n`);

  console.log('🎉 Success!\n');
  console.log('Your NOR_BSC token now has:');
  console.log('  ✅ Liquidity on PancakeSwap');
  console.log('  ✅ Discoverable price');
  console.log('  ✅ Tradeable on BSC DEXs\n');

  console.log('📍 PancakeSwap Pool:');
  console.log(`  https://pancakeswap.finance/info/v2/pairs/${NOR_BSC.toLowerCase()}-${BUSD.toLowerCase()}\n`);

  console.log('📈 Next Steps:');
  console.log('  1. Wait 5-10 minutes for DEX aggregators to detect');
  console.log('  2. Check DexScreener: https://dexscreener.com/bsc');
  console.log('  3. Submit to CoinGecko & CoinMarketCap');
  console.log('  4. Add more liquidity as needed\n');

  console.log('⚠️  Remember: This creates the INITIAL price');
  console.log('    Market will discover actual value through trading\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  });
