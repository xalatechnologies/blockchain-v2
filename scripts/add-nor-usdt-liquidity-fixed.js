/**
 * Add NOR/USDT Liquidity - FIXED VERSION with Dynamic Gas Estimation
 *
 * Using ~20 USDT + 3,000 NOR to establish USDT pair
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const USDT = "0x55d398326f99059fF775485246999027B3197955"; // Binance-Peg USDT
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
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
  console.log('\n💧 Adding NOR/USDT Liquidity (FIXED VERSION)\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const usdtToken = new ethers.Contract(USDT, ERC20_ABI, wallet);
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  // Check balances
  console.log('📊 Checking balances...');
  const norBalance = await norToken.balanceOf(wallet.address);
  const usdtBalance = await usdtToken.balanceOf(wallet.address);
  const bnbBalance = await provider.getBalance(wallet.address);

  console.log(`  NOR: ${ethers.formatEther(norBalance)}`);
  console.log(`  USDT: ${ethers.formatUnits(usdtBalance, 18)}`);
  console.log(`  BNB (for gas): ${ethers.formatEther(bnbBalance)}\n`);

  // Amounts - using available USDT (~20) + 3,000 NOR
  const usdtAmount = ethers.parseUnits("20", 18);  // 20 USDT
  const norAmount = ethers.parseEther("3000");     // 3,000 NOR at ~$0.0067 = ~$20

  console.log('💰 Liquidity to Add:');
  console.log(`  USDT: ${ethers.formatUnits(usdtAmount, 18)}`);
  console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
  console.log(`  Expected Price: ~$0.0067 per NOR`);
  console.log(`  Pool Value: ~$40 total\n`);

  if (norBalance < norAmount) {
    console.log('❌ Insufficient NOR!');
    console.log(`  Need: ${ethers.formatEther(norAmount)}`);
    console.log(`  Have: ${ethers.formatEther(norBalance)}`);
    process.exit(1);
  }

  if (usdtBalance < usdtAmount) {
    console.log('❌ Insufficient USDT!');
    console.log(`  Need: ${ethers.formatUnits(usdtAmount, 18)}`);
    console.log(`  Have: ${ethers.formatUnits(usdtBalance, 18)}`);
    process.exit(1);
  }

  if (bnbBalance < ethers.parseEther("0.01")) {
    console.log('❌ Need at least 0.01 BNB for gas fees!');
    process.exit(1);
  }

  console.log('⏳ Starting in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Step 1: Approve NOR
    console.log('[1/4] Checking NOR approval...');
    const norAllowance = await norToken.allowance(wallet.address, PANCAKE_ROUTER);
    if (norAllowance < norAmount) {
      console.log('  Approving NOR...');
      const norApproveTx = await norToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
      console.log(`  TX: ${norApproveTx.hash}`);
      await norApproveTx.wait();
      console.log('  ✅ NOR Approved\n');
    } else {
      console.log('  ✅ NOR Already approved\n');
    }

    // Step 2: Approve USDT
    console.log('[2/4] Checking USDT approval...');
    const usdtAllowance = await usdtToken.allowance(wallet.address, PANCAKE_ROUTER);
    if (usdtAllowance < usdtAmount) {
      console.log('  Approving USDT...');
      const usdtApproveTx = await usdtToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
      console.log(`  TX: ${usdtApproveTx.hash}`);
      await usdtApproveTx.wait();
      console.log('  ✅ USDT Approved\n');
    } else {
      console.log('  ✅ USDT Already approved\n');
    }

    // Step 3: Estimate gas first
    console.log('[3/4] Estimating gas...');
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippage = 5;

    const amountNorMin = (norAmount * BigInt(100 - slippage)) / 100n;
    const amountUsdtMin = (usdtAmount * BigInt(100 - slippage)) / 100n;

    const gasEstimate = await router.addLiquidity.estimateGas(
      NOR_BSC,
      USDT,
      norAmount,
      usdtAmount,
      amountNorMin,
      amountUsdtMin,
      wallet.address,
      deadline
    );

    console.log(`  Estimated gas: ${gasEstimate.toString()}`);

    // Add 20% buffer to gas estimate
    const gasLimit = (gasEstimate * 120n) / 100n;
    console.log(`  Using gas limit: ${gasLimit.toString()} (with 20% buffer)\n`);

    // Step 4: Add liquidity with correct gas limit
    console.log('[4/4] Adding liquidity...');
    console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
    console.log(`  USDT: ${ethers.formatUnits(usdtAmount, 18)}`);
    console.log(`  Slippage: ${slippage}%\n`);

    const liquidityTx = await router.addLiquidity(
      NOR_BSC,
      USDT,
      norAmount,
      usdtAmount,
      amountNorMin,
      amountUsdtMin,
      wallet.address,
      deadline,
      {
        gasLimit: gasLimit  // FIX: Use estimated gas, not hardcoded!
      }
    );

    console.log(`  TX Hash: ${liquidityTx.hash}`);
    console.log('  Waiting for confirmation...\n');

    const receipt = await liquidityTx.wait();

    if (receipt.status === 1) {
      console.log('  ✅ SUCCESS!\n');

      // Check final balances
      const finalNorBalance = await norToken.balanceOf(wallet.address);
      const finalUsdtBalance = await usdtToken.balanceOf(wallet.address);

      const norAdded = norBalance - finalNorBalance;
      const usdtAdded = usdtBalance - finalUsdtBalance;

      console.log('═══════════════════════════════════════');
      console.log('🎉 NOR/USDT LIQUIDITY POOL CREATED!');
      console.log('═══════════════════════════════════════\n');

      console.log('Pool Details:');
      console.log(`  NOR deposited: ${ethers.formatEther(norAdded)}`);
      console.log(`  USDT deposited: ${ethers.formatUnits(usdtAdded, 18)}`);
      console.log(`  Price: ~$0.0067 per NOR`);
      console.log(`  Pool Value: ~$40 USD\n`);

      console.log('Remaining:');
      console.log(`  NOR: ${ethers.formatEther(finalNorBalance)}`);
      console.log(`  USDT: ${ethers.formatUnits(finalUsdtBalance, 18)}\n`);

      console.log('═══════════════════════════════════════\n');

      console.log('✅ NOR now has USDT trading pair!');
      console.log('  • Liquidity on PancakeSwap');
      console.log('  • Stable price in USDT');
      console.log('  • More trading options\n');

      console.log('📍 View Pool:');
      console.log(`  https://pancakeswap.finance/liquidity\n`);

      console.log('📈 Price Discovery (wait 10 mins):');
      console.log(`  https://dexscreener.com/bsc/${NOR_BSC.toLowerCase()}\n`);

      console.log('✅ DONE! NOR/USDT pair active! 🚀\n');

    } else {
      console.log('  ❌ Transaction failed\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 You need more BNB for gas fees');
    } else if (error.message.includes('INSUFFICIENT')) {
      console.log('\n💡 Try increasing slippage or adjusting amounts');
    } else if (error.message.includes('EXPIRED')) {
      console.log('\n💡 Transaction deadline expired, try again');
    }

    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nFull error:', error);
    process.exit(1);
  });
