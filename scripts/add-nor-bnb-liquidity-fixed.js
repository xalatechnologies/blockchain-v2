/**
 * Add NOR/BNB Liquidity - FIXED VERSION with Correct Gas Limit
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
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
  console.log('\n💧 Adding NOR/BNB Liquidity (FIXED VERSION)\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  // Check balances
  console.log('📊 Checking balances...');
  const norBalance = await norToken.balanceOf(wallet.address);
  const bnbBalance = await provider.getBalance(wallet.address);

  console.log(`  NOR: ${ethers.formatEther(norBalance)}`);
  console.log(`  BNB: ${ethers.formatEther(bnbBalance)}\n`);

  // Amounts - using tiny amounts to establish price
  const bnbAmount = ethers.parseEther("0.01");  // 0.01 BNB (~$6)
  const norAmount = ethers.parseEther("1000");  // 1,000 NOR

  console.log('💰 Liquidity to Add:');
  console.log(`  BNB: ${ethers.formatEther(bnbAmount)} (~$6)`);
  console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
  console.log(`  Initial Price: ~$0.006 per NOR`);
  console.log(`  Market Cap: ~$60,000 (for 10M supply)\n`);

  if (norBalance < norAmount) {
    console.log('❌ Insufficient NOR!');
    process.exit(1);
  }

  if (bnbBalance < ethers.parseEther("0.02")) {
    console.log('❌ Need at least 0.02 BNB (0.01 for liquidity + gas)!');
    process.exit(1);
  }

  console.log('⏳ Starting in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Step 1: Approve
    console.log('[1/3] Checking NOR approval...');
    const allowance = await norToken.allowance(wallet.address, PANCAKE_ROUTER);
    if (allowance < norAmount) {
      console.log('  Approving NOR...');
      const approveTx = await norToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
      console.log(`  TX: ${approveTx.hash}`);
      await approveTx.wait();
      console.log('  ✅ Approved\n');
    } else {
      console.log('  ✅ Already approved\n');
    }

    // Step 2: Estimate gas first
    console.log('[2/3] Estimating gas...');
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippage = 5;

    const amountTokenMin = (norAmount * BigInt(100 - slippage)) / 100n;
    const amountETHMin = (bnbAmount * BigInt(100 - slippage)) / 100n;

    const gasEstimate = await router.addLiquidityETH.estimateGas(
      NOR_BSC,
      norAmount,
      amountTokenMin,
      amountETHMin,
      wallet.address,
      deadline,
      { value: bnbAmount }
    );

    console.log(`  Estimated gas: ${gasEstimate.toString()}`);

    // Add 20% buffer to gas estimate
    const gasLimit = (gasEstimate * 120n) / 100n;
    console.log(`  Using gas limit: ${gasLimit.toString()} (with 20% buffer)\n`);

    // Step 3: Add liquidity with correct gas limit
    console.log('[3/3] Adding liquidity...');
    console.log(`  NOR: ${ethers.formatEther(norAmount)}`);
    console.log(`  BNB: ${ethers.formatEther(bnbAmount)}`);
    console.log(`  Slippage: ${slippage}%\n`);

    const liquidityTx = await router.addLiquidityETH(
      NOR_BSC,
      norAmount,
      amountTokenMin,
      amountETHMin,
      wallet.address,
      deadline,
      {
        value: bnbAmount,
        gasLimit: gasLimit  // FIX: Use estimated gas, not hardcoded 500k!
      }
    );

    console.log(`  TX Hash: ${liquidityTx.hash}`);
    console.log('  Waiting for confirmation...\n');

    const receipt = await liquidityTx.wait();

    if (receipt.status === 1) {
      console.log('  ✅ SUCCESS!\n');

      // Check final balances
      const finalNorBalance = await norToken.balanceOf(wallet.address);
      const finalBnbBalance = await provider.getBalance(wallet.address);

      const norAdded = norBalance - finalNorBalance;
      const bnbUsed = bnbBalance - finalBnbBalance;

      console.log('═══════════════════════════════════════');
      console.log('🎉 LIQUIDITY POOL CREATED!');
      console.log('═══════════════════════════════════════\n');

      console.log('Pool Details:');
      console.log(`  NOR deposited: ${ethers.formatEther(norAdded)}`);
      console.log(`  BNB used (incl gas): ${ethers.formatEther(bnbUsed)}`);
      console.log(`  Initial price: ~$0.006 per NOR`);
      console.log(`  Market cap: ~$60,000\n`);

      console.log('Remaining:');
      console.log(`  NOR: ${ethers.formatEther(finalNorBalance)}`);
      console.log(`  BNB: ${ethers.formatEther(finalBnbBalance)}\n`);

      console.log('═══════════════════════════════════════\n');

      console.log('✅ Your NOR token now has:');
      console.log('  • Liquidity on PancakeSwap');
      console.log('  • Price showing (~$0.006)');
      console.log('  • Trading enabled\n');

      console.log('📍 View Pool:');
      console.log(`  https://pancakeswap.finance/liquidity\n`);

      console.log('📈 Price Discovery (wait 10 mins):');
      console.log(`  https://dexscreener.com/bsc/${NOR_BSC.toLowerCase()}\n`);

      console.log('✅ DONE! Check DexScreener in 10 minutes for price chart! 🚀\n');

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
