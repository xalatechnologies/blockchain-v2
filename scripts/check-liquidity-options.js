/**
 * Check What You Have Available for Liquidity
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const WETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"; // Binance-Peg Ethereum Token
const BSC_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org";

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function main() {
  console.log('\n💰 Checking Your Balances for Liquidity...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`Wallet: ${wallet.address}\n`);

  // Check BNB
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log(`BNB: ${ethers.formatEther(bnbBalance)} BNB`);
  const bnbPrice = 600; // Approximate BNB price
  const bnbValue = parseFloat(ethers.formatEther(bnbBalance)) * bnbPrice;
  console.log(`  ~$${bnbValue.toFixed(2)} USD\n`);

  // Check NOR_BSC
  const norToken = new ethers.Contract(NOR_BSC, ERC20_ABI, provider);
  const norBalance = await norToken.balanceOf(wallet.address);
  console.log(`NOR_BSC: ${ethers.formatEther(norBalance)} NOR\n`);

  // Check BUSD
  const busdToken = new ethers.Contract(BUSD, ERC20_ABI, provider);
  const busdBalance = await busdToken.balanceOf(wallet.address);
  console.log(`BUSD: ${ethers.formatEther(busdBalance)} BUSD\n`);

  // Check USDT
  const usdtToken = new ethers.Contract(USDT, ERC20_ABI, provider);
  const usdtBalance = await usdtToken.balanceOf(wallet.address);
  console.log(`USDT: ${ethers.formatEther(usdtBalance)} USDT\n`);

  // Check WETH (Binance-Peg ETH)
  const wethToken = new ethers.Contract(WETH, ERC20_ABI, provider);
  const wethBalance = await wethToken.balanceOf(wallet.address);
  const ethPrice = 3500; // Approximate ETH price
  const wethValue = parseFloat(ethers.formatEther(wethBalance)) * ethPrice;
  console.log(`ETH (Binance-Peg): ${ethers.formatEther(wethBalance)} ETH`);
  console.log(`  ~$${wethValue.toFixed(2)} USD\n`);

  console.log('═══════════════════════════════════════\n');

  // Recommendations
  console.log('💡 Liquidity Options:\n');

  if (busdBalance > 0) {
    console.log('✅ Option 1: NOR/BUSD Pool (RECOMMENDED)');
    console.log(`   You have ${ethers.formatEther(busdBalance)} BUSD`);
    console.log('   Run: node scripts/add-nor-busd-liquidity.js\n');
  }

  if (usdtBalance > 0) {
    console.log('✅ Option 2: NOR/USDT Pool');
    console.log(`   You have ${ethers.formatEther(usdtBalance)} USDT`);
    console.log('   Run: node scripts/add-nor-usdt-liquidity.js\n');
  }

  if (bnbBalance > ethers.parseEther("0.1")) {
    console.log('✅ Option 3: NOR/BNB Pool (EASIEST)');
    console.log(`   You have ${ethers.formatEther(bnbBalance)} BNB (~$${bnbValue.toFixed(2)})`);
    console.log('   Run: node scripts/add-nor-bnb-liquidity.js\n');
  }

  console.log('═══════════════════════════════════════\n');

  // Suggest amounts based on what they have
  console.log('📊 Suggested Liquidity Amounts:\n');

  if (bnbBalance > ethers.parseEther("0.1")) {
    const suggestedBnb = 0.1; // 0.1 BNB (~$60)
    const suggestedBnbValue = suggestedBnb * bnbPrice;
    const suggestedNor = 10000; // 10k NOR
    const initialPrice = suggestedBnbValue / suggestedNor;

    console.log('NOR/BNB Option (Minimal):');
    console.log(`  ${suggestedNor.toLocaleString()} NOR + ${suggestedBnb} BNB (~$${suggestedBnbValue.toFixed(0)})`);
    console.log(`  Initial price: ~$${initialPrice.toFixed(4)} per NOR`);
    console.log(`  This is EASY and requires no token swaps!\n`);
  }

  if (busdBalance === 0n && usdtBalance === 0n && bnbBalance > ethers.parseEther("0.2")) {
    console.log('⚠️  You don\'t have BUSD or USDT');
    console.log('   I recommend using BNB directly (easiest option)');
    console.log('   OR swap some BNB for BUSD on PancakeSwap first\n');
  }

  console.log('═══════════════════════════════════════\n');
  console.log('Would you like me to create the NOR/BNB liquidity script?');
  console.log('This is the easiest option since you already have BNB!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
