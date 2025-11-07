import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");

const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const USDT_POOL = "0xDA2f9b5a44655203259174b9c81229ed41Ed8f80";

console.log("\n💧 NOR/USDT POOL DEEP DIVE");
console.log("=".repeat(70));

const pairABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)"
];

const tokenABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const pair = new ethers.Contract(USDT_POOL, pairABI, provider);
const norToken = new ethers.Contract(NOR_BSC, tokenABI, provider);
const usdtToken = new ethers.Contract(USDT, tokenABI, provider);

// Get pool details
const [r0, r1, timestamp] = await pair.getReserves();
const token0 = await pair.token0();
const token1 = await pair.token1();
const lpSupply = await pair.totalSupply();

console.log(`\n📊 Pool Contract: ${USDT_POOL}`);
console.log(`   Token0: ${token0}`);
console.log(`   Token1: ${token1}`);
console.log(`   LP Total Supply: ${ethers.formatEther(lpSupply)}`);
console.log(`   Last Update: ${new Date(Number(timestamp) * 1000).toISOString()}`);

// Determine which is NOR and which is USDT
const norIsToken0 = token0.toLowerCase() === NOR_BSC.toLowerCase();
const norReserve = norIsToken0 ? r0 : r1;
const usdtReserve = norIsToken0 ? r1 : r0;

const norDecimals = await norToken.decimals();
const usdtDecimals = await usdtToken.decimals();

const norAmount = Number(ethers.formatUnits(norReserve, norDecimals));
const usdtAmount = Number(ethers.formatUnits(usdtReserve, usdtDecimals));

console.log(`\n💰 Reserves:`);
console.log(`   NOR:  ${norAmount.toLocaleString()} NOR`);
console.log(`   USDT: ${usdtAmount.toLocaleString()} USDT`);

if (norAmount > 0 && usdtAmount > 0) {
  const priceInUSDT = usdtAmount / norAmount;
  console.log(`\n💵 Current Price:`);
  console.log(`   1 NOR = $${priceInUSDT.toFixed(6)} USDT`);
  console.log(`   Total Liquidity: $${(usdtAmount * 2).toLocaleString()} USD`);
  console.log(`   Market Cap (20M supply): $${(priceInUSDT * 20000000).toLocaleString()} USD`);
} else if (norAmount > 0) {
  console.log(`\n⚠️  Pool has NOR but NO USDT!`);
  console.log(`   Someone removed ALL USDT from the pool`);
} else if (usdtAmount > 0) {
  console.log(`\n⚠️  Pool has USDT but NO NOR!`);
  console.log(`   Someone removed ALL NOR from the pool (sold or removed liquidity)`);
} else {
  console.log(`\n❌ Pool is EMPTY!`);
}

// Check who holds the LP tokens
console.log(`\n🔍 LP Token Holders:`);
const yourWallet = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
const yourLPBalance = await pair.balanceOf(yourWallet);
console.log(`   Your Wallet: ${ethers.formatEther(yourLPBalance)} LP tokens`);

const poolLPBalance = await pair.balanceOf(USDT_POOL);
console.log(`   Pool Contract: ${ethers.formatEther(poolLPBalance)} LP tokens`);

// Calculate what liquidity remains
if (Number(lpSupply) > 0) {
  const yourShare = (Number(yourLPBalance) / Number(lpSupply)) * 100;
  console.log(`\n   Your share: ${yourShare.toFixed(2)}%`);

  if (yourShare > 0) {
    console.log(`   Your NOR: ${(norAmount * yourShare / 100).toLocaleString()} NOR`);
    console.log(`   Your USDT: ${(usdtAmount * yourShare / 100).toLocaleString()} USDT`);
  }
}

console.log("\n=".repeat(70));
console.log("\n🔍 ANALYSIS:");

if (norAmount > 0 && usdtAmount === 0) {
  console.log("   ❌ ALL USDT WAS REMOVED FROM POOL");
  console.log("   💡 This happened through either:");
  console.log("      1. Someone swapped ALL USDT for NOR (massive buy)");
  console.log("      2. Liquidity was removed removing only USDT side");
  console.log("      3. An exploit or error occurred");
} else if (norAmount === 0 && usdtAmount > 0) {
  console.log("   ❌ ALL NOR WAS REMOVED FROM POOL");
  console.log("   💡 This happened through either:");
  console.log("      1. Someone swapped ALL NOR for USDT (massive sell) ⚠️");
  console.log("      2. Liquidity was removed taking only NOR side");
  console.log("      3. An exploit or error occurred");
} else if (norAmount > 0 && usdtAmount > 0) {
  const ratio = norAmount / usdtAmount;
  if (ratio > 1000000) {
    console.log("   ⚠️ EXTREME IMBALANCE - Pool has almost NO USDT");
    console.log("   💡 Heavy selling occurred, draining USDT");
  } else if (ratio < 0.000001) {
    console.log("   ⚠️ EXTREME IMBALANCE - Pool has almost NO NOR");
    console.log("   💡 Heavy buying occurred, draining NOR");
  } else {
    console.log("   ✅ Pool appears balanced");
  }
}

console.log("\n=".repeat(70));
