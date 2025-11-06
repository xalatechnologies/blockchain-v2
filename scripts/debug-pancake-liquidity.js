/**
 * Debug PancakeSwap Liquidity Issues
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // Wrapped BNB
const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)'
];

const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)'
];

async function main() {
  console.log('\n🔍 Debugging PancakeSwap Liquidity Issues\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  // Check token info
  console.log('📊 Token Information:');
  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, provider);

  try {
    const balance = await norToken.balanceOf(wallet.address);
    const decimals = await norToken.decimals();
    const totalSupply = await norToken.totalSupply();
    const allowance = await norToken.allowance(wallet.address, PANCAKE_ROUTER);

    console.log(`  Balance: ${ethers.formatEther(balance)} NOR`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Total Supply: ${ethers.formatEther(totalSupply)}`);
    console.log(`  Router Allowance: ${ethers.formatEther(allowance)}\n`);
  } catch (error) {
    console.log(`  ❌ Error reading token: ${error.message}\n`);
  }

  // Check if pair exists
  console.log('🔗 Checking for Existing Pairs:');
  const factory = new ethers.Contract(PANCAKE_FACTORY, FACTORY_ABI, provider);

  try {
    // Check NOR/WBNB pair
    const pairAddress = await factory.getPair(NOR_BSC, WBNB);
    console.log(`  NOR/WBNB Pair: ${pairAddress}`);

    if (pairAddress !== ethers.ZeroAddress) {
      console.log(`  ✅ Pair exists!\n`);

      // Check pair reserves
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      const reserves = await pair.getReserves();
      const token0 = await pair.token0();
      const token1 = await pair.token1();

      console.log('  Pair Details:');
      console.log(`    Token0: ${token0}`);
      console.log(`    Token1: ${token1}`);
      console.log(`    Reserve0: ${ethers.formatEther(reserves[0])}`);
      console.log(`    Reserve1: ${ethers.formatEther(reserves[1])}\n`);

      console.log('  💡 Pool already exists! You should:');
      console.log('     - Check the existing ratio');
      console.log('     - Add liquidity matching current ratio');
      console.log('     - Or just view the pool on PancakeSwap\n');
    } else {
      console.log(`  ❌ No pair exists yet\n`);
      console.log('  💡 Need to create pair first. This happens automatically when adding liquidity\n');
    }
  } catch (error) {
    console.log(`  ❌ Error checking pair: ${error.message}\n`);
  }

  // Check BNB balance
  console.log('💰 Wallet Balances:');
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log(`  BNB: ${ethers.formatEther(bnbBalance)}\n`);

  // Try to estimate gas for addLiquidityETH
  console.log('⛽ Testing Gas Estimation:');

  const ROUTER_ABI = [
    'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)'
  ];

  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);

  const testNorAmount = ethers.parseEther("1000");
  const testBnbAmount = ethers.parseEther("0.01");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  try {
    console.log('  Testing addLiquidityETH estimation...');
    const gasEstimate = await router.addLiquidityETH.estimateGas(
      NOR_BSC,
      testNorAmount,
      0, // amountTokenMin
      0, // amountETHMin
      wallet.address,
      deadline,
      { value: testBnbAmount }
    );

    console.log(`  ✅ Gas estimate: ${gasEstimate.toString()}`);
    console.log(`  💡 Transaction should work!\n`);
  } catch (error) {
    console.log(`  ❌ Gas estimation failed: ${error.message}`);

    if (error.message.includes('PancakeLibrary')) {
      console.log(`\n  💡 This error suggests:`);
      console.log(`     - Need to use PancakeSwap V2 router`);
      console.log(`     - Or pair creation is needed first\n`);
    }

    if (error.message.includes('INSUFFICIENT')) {
      console.log(`\n  💡 Insufficient amount error:`);
      console.log(`     - Try larger amounts`);
      console.log(`     - Or check token allowance\n`);
    }

    console.log(`\n  📝 Full error details:`);
    console.log(`  ${error}\n`);
  }

  console.log('═══════════════════════════════════════\n');
  console.log('💡 Recommendations:\n');
  console.log('1. Use PancakeSwap UI (most reliable)');
  console.log('2. Make sure you have enough for gas (~0.005 BNB)');
  console.log('3. Try different amounts if one fails');
  console.log('4. Check that pair doesn\'t exist already\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
