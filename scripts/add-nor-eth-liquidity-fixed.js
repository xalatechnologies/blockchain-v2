/**
 * Add NOR/ETH Liquidity - FIXED VERSION with Dynamic Gas Estimation
 *
 * Using ~0.003 ETH + proportional NOR to establish ETH pair
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const WETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"; // Binance-Peg Ethereum Token
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
  console.log('\n💧 Adding NOR/ETH Liquidity (FIXED VERSION)\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const wethToken = new ethers.Contract(WETH, ERC20_ABI, wallet);
  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  // Check balances
  console.log('📊 Checking balances...');
  const norBalance = await norToken.balanceOf(wallet.address);
  const wethBalance = await wethToken.balanceOf(wallet.address);
  const bnbBalance = await provider.getBalance(wallet.address);

  console.log(`  NOR: ${ethers.formatEther(norBalance)}`);
  console.log(`  ETH (Binance-Peg): ${ethers.formatEther(wethBalance)}`);
  console.log(`  BNB (for gas): ${ethers.formatEther(bnbBalance)}\n`);

  // Amounts - using 0.003 ETH (~$10.50) + 1,600 NOR at ~$0.0065 = ~$10.40
  const ethAmount = ethers.parseEther("0.003");   // 0.003 ETH (~$10.50)
  const norAmount = ethers.parseEther("1600");    // 1,600 NOR at ~$0.0065 = ~$10.40

  const ethPrice = 3500; // Approximate ETH price in USD
  const ethValue = parseFloat(ethers.formatEther(ethAmount)) * ethPrice;
  const norPrice = 0.0065; // Approximate NOR price
  const norValue = parseFloat(ethers.formatEther(norAmount)) * norPrice;

  console.log('💰 Liquidity to Add:');
  console.log(`  ETH: ${ethers.formatEther(ethAmount)} (~$${ethValue.toFixed(2)})`);
  console.log(`  NOR: ${ethers.formatEther(norAmount)} (~$${norValue.toFixed(2)})`);
  console.log(`  Expected Price: ~$0.0065 per NOR`);
  console.log(`  Pool Value: ~$${(ethValue + norValue).toFixed(2)} total\n`);

  if (norBalance < norAmount) {
    console.log('❌ Insufficient NOR!');
    console.log(`  Need: ${ethers.formatEther(norAmount)}`);
    console.log(`  Have: ${ethers.formatEther(norBalance)}`);
    process.exit(1);
  }

  if (wethBalance < ethAmount) {
    console.log('❌ Insufficient ETH!');
    console.log(`  Need: ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`  Have: ${ethers.formatEther(wethBalance)} ETH`);
    console.log('\n💡 Get more Binance-Peg ETH from PancakeSwap or bridge from Ethereum');
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

    // Step 2: Approve WETH
    console.log('[2/4] Checking ETH approval...');
    const wethAllowance = await wethToken.allowance(wallet.address, PANCAKE_ROUTER);
    if (wethAllowance < ethAmount) {
      console.log('  Approving ETH...');
      const wethApproveTx = await wethToken.approve(PANCAKE_ROUTER, ethers.MaxUint256);
      console.log(`  TX: ${wethApproveTx.hash}`);
      await wethApproveTx.wait();
      console.log('  ✅ ETH Approved\n');
    } else {
      console.log('  ✅ ETH Already approved\n');
    }

    // Step 3: Estimate gas first
    console.log('[3/4] Estimating gas...');
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippage = 5;

    const amountNorMin = (norAmount * BigInt(100 - slippage)) / 100n;
    const amountEthMin = (ethAmount * BigInt(100 - slippage)) / 100n;

    const gasEstimate = await router.addLiquidity.estimateGas(
      NOR_BSC,
      WETH,
      norAmount,
      ethAmount,
      amountNorMin,
      amountEthMin,
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
    console.log(`  ETH: ${ethers.formatEther(ethAmount)}`);
    console.log(`  Slippage: ${slippage}%\n`);

    const liquidityTx = await router.addLiquidity(
      NOR_BSC,
      WETH,
      norAmount,
      ethAmount,
      amountNorMin,
      amountEthMin,
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
      const finalWethBalance = await wethToken.balanceOf(wallet.address);

      const norAdded = norBalance - finalNorBalance;
      const ethAdded = wethBalance - finalWethBalance;

      console.log('═══════════════════════════════════════');
      console.log('🎉 NOR/ETH LIQUIDITY POOL CREATED!');
      console.log('═══════════════════════════════════════\n');

      console.log('Pool Details:');
      console.log(`  NOR deposited: ${ethers.formatEther(norAdded)}`);
      console.log(`  ETH deposited: ${ethers.formatEther(ethAdded)}`);
      console.log(`  Price: ~$0.0065 per NOR`);
      console.log(`  Pool Value: ~$${(ethValue + norValue).toFixed(2)} USD\n`);

      console.log('Remaining:');
      console.log(`  NOR: ${ethers.formatEther(finalNorBalance)}`);
      console.log(`  ETH: ${ethers.formatEther(finalWethBalance)}\n`);

      console.log('═══════════════════════════════════════\n');

      console.log('✅ NOR now has ETH trading pair!');
      console.log('  • Liquidity on PancakeSwap');
      console.log('  • ETH pair for advanced traders');
      console.log('  • More trading routes\n');

      console.log('📍 View Pool:');
      console.log(`  https://pancakeswap.finance/liquidity\n`);

      console.log('📈 Price Discovery (wait 10 mins):');
      console.log(`  https://dexscreener.com/bsc/${NOR_BSC.toLowerCase()}\n`);

      console.log('✅ DONE! NOR/ETH pair active! 🚀\n');

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
