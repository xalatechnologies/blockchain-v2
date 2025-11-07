import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");
const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";

console.log("\n🔍 INVESTIGATING NOR_BSC TOKEN");
console.log("=".repeat(70));

const tokenABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const token = new ethers.Contract(NOR_BSC, tokenABI, provider);

const totalSupply = await token.totalSupply();
const decimals = await token.decimals();

console.log(`\n📊 Token Info:`);
console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} NOR`);
console.log(`   Decimals: ${decimals}`);

// Check key addresses
const addresses = {
  "Your Wallet": "0xdD779a290C937144F80Eb75b75d814c834536B1b",
  "NOR Bridge (BSC)": "0x75dc5817e128a60920964Ff12Bcc17480c8e57B1",
  "NOR Bridge (NorChain)": "0xe447647577cc340B0D853F9A8F052E9BF5D673c1"
};

console.log(`\n💰 Token Balances:`);
for (const [name, addr] of Object.entries(addresses)) {
  try {
    const balance = await token.balanceOf(addr);
    console.log(`   ${name}: ${ethers.formatUnits(balance, decimals)} NOR`);
  } catch (e) {
    console.log(`   ${name}: Error - ${e.message}`);
  }
}

// Check PancakeSwap Factory for pairs
console.log(`\n🔍 Checking PancakeSwap Factory for pairs...`);
const FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const factoryABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const factory = new ethers.Contract(FACTORY, factoryABI, provider);

const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

const bnbPair = await factory.getPair(NOR_BSC, WBNB);
const busdPair = await factory.getPair(NOR_BSC, BUSD);
const usdtPair = await factory.getPair(NOR_BSC, USDT);

console.log(`   NOR/BNB Pair: ${bnbPair}`);
console.log(`   NOR/BUSD Pair: ${busdPair}`);
console.log(`   NOR/USDT Pair: ${usdtPair}`);

// Check BNB pair if it exists
if (bnbPair !== ethers.ZeroAddress) {
  console.log(`\n💧 NOR/BNB Pool Status:`);
  const pairBalance = await token.balanceOf(bnbPair);
  console.log(`   NOR in pool: ${ethers.formatUnits(pairBalance, decimals)} NOR`);

  const bnbBalance = await provider.getBalance(bnbPair);
  console.log(`   BNB in pool: ${ethers.formatEther(bnbBalance)} BNB`);
  console.log(`   Pool address: ${bnbPair}`);

  if (pairBalance > 0n) {
    // Get pool reserves
    const pairABI = [
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function token0() external view returns (address)",
      "function totalSupply() external view returns (uint256)"
    ];
    const pair = new ethers.Contract(bnbPair, pairABI, provider);
    const [r0, r1] = await pair.getReserves();
    const token0 = await pair.token0();
    const lpSupply = await pair.totalSupply();

    console.log(`\n   📊 Pool Details:`);
    console.log(`   Reserve0: ${ethers.formatEther(r0)}`);
    console.log(`   Reserve1: ${ethers.formatEther(r1)}`);
    console.log(`   Token0: ${token0}`);
    console.log(`   LP Total Supply: ${ethers.formatEther(lpSupply)}`);

    // Calculate price
    const norReserve = token0.toLowerCase() === NOR_BSC.toLowerCase() ? r0 : r1;
    const bnbReserve = token0.toLowerCase() === NOR_BSC.toLowerCase() ? r1 : r0;
    const norAmount = Number(ethers.formatUnits(norReserve, decimals));
    const bnbAmount = Number(ethers.formatEther(bnbReserve));
    const priceInBNB = bnbAmount / norAmount;

    console.log(`\n   💵 Price: ${priceInBNB.toFixed(8)} BNB per NOR`);
    console.log(`   💵 Price: ~$${(priceInBNB * 600).toFixed(6)} USD per NOR (assuming BNB=$600)`);
    console.log(`   💰 Total Liquidity: ~$${(bnbAmount * 600 * 2).toFixed(2)} USD`);
  } else {
    console.log(`   ⚠️ Pool exists but has NO NOR tokens!`);
  }
}

// Check USDT pair if it exists
if (usdtPair !== ethers.ZeroAddress) {
  console.log(`\n💧 NOR/USDT Pool Status:`);
  const pairBalance = await token.balanceOf(usdtPair);
  console.log(`   NOR in pool: ${ethers.formatUnits(pairBalance, decimals)} NOR`);
  console.log(`   Pool address: ${usdtPair}`);
}

console.log("\n=".repeat(70));
