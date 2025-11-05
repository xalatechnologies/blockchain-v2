import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const PRIVATE_CHAIN_RPC = process.env.PRIVATE_CHAIN_RPC || "http://3.91.50.187:8545";
const MAIN_WALLET_PRIVATE_KEY = process.env.MAIN_WALLET_PRIVATE_KEY;

// Contract addresses
const NOORSWAP_ROUTER = "0x0cf8e180350253271f4b917ccfb0accc4862f265";
const BTCBR = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
const USDT = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // BSC WBNB
const WETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"; // BSC WETH

// NoorSwap Router ABI (minimal)
const ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function main() {
  console.log("🚀 Deploying BTCBR and ETH Liquidity Pairs on NorChain\n");

  const provider = new ethers.JsonRpcProvider(PRIVATE_CHAIN_RPC);
  const wallet = new ethers.Wallet(MAIN_WALLET_PRIVATE_KEY, provider);

  console.log(`📍 Wallet: ${wallet.address}`);
  console.log(`⛓️  Chain: NorChain (65001)`);
  console.log(`🔗 Router: ${NOORSWAP_ROUTER}\n`);

  const router = new ethers.Contract(NOORSWAP_ROUTER, ROUTER_ABI, wallet);

  // Pairs to deploy with initial liquidity
  const pairs = [
    {
      name: "BTCBR/USDT",
      tokenA: BTCBR,
      tokenB: USDT,
      amountA: ethers.parseUnits("5000000", 18), // 5M BTCBR
      amountB: ethers.parseUnits("250000", 18)    // 250k USDT
    },
    {
      name: "BTCBR/WBNB",
      tokenA: BTCBR,
      tokenB: WBNB,
      amountA: ethers.parseUnits("5000000", 18), // 5M BTCBR
      amountB: ethers.parseUnits("400", 18)       // 400 WBNB (~$245k)
    },
    {
      name: "BTCBR/WETH",
      tokenA: BTCBR,
      tokenB: WETH,
      amountA: ethers.parseUnits("3000000", 18), // 3M BTCBR
      amountB: ethers.parseUnits("120", 18)       // 120 WETH (~$294k)
    },
    {
      name: "WETH/USDT",
      tokenA: WETH,
      tokenB: USDT,
      amountA: ethers.parseUnits("600", 18),      // 600 WETH
      amountB: ethers.parseUnits("1500000", 18)   // 1.5M USDT
    },
    {
      name: "WETH/WBNB",
      tokenA: WETH,
      tokenB: WBNB,
      amountA: ethers.parseUnits("500", 18),      // 500 WETH
      amountB: ethers.parseUnits("2000", 18)      // 2000 WBNB (~$1.2M)
    }
  ];

  for (const pair of pairs) {
    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(`📊 Adding Liquidity: ${pair.name}`);
    console.log(`═══════════════════════════════════════════════════════`);

    try {
      // Approve tokens
      console.log(`\n1️⃣  Approving tokens...`);

      const tokenA = new ethers.Contract(pair.tokenA, ERC20_ABI, wallet);
      const tokenB = new ethers.Contract(pair.tokenB, ERC20_ABI, wallet);

      const approveA = await tokenA.approve(NOORSWAP_ROUTER, pair.amountA);
      console.log(`   TokenA approved: ${approveA.hash}`);
      await approveA.wait();

      const approveB = await tokenB.approve(NOORSWAP_ROUTER, pair.amountB);
      console.log(`   TokenB approved: ${approveB.hash}`);
      await approveB.wait();

      // Add liquidity
      console.log(`\n2️⃣  Adding liquidity...`);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const slippage = 5; // 5% slippage tolerance

      const amountAMin = (pair.amountA * BigInt(100 - slippage)) / BigInt(100);
      const amountBMin = (pair.amountB * BigInt(100 - slippage)) / BigInt(100);

      const tx = await router.addLiquidity(
        pair.tokenA,
        pair.tokenB,
        pair.amountA,
        pair.amountB,
        amountAMin,
        amountBMin,
        wallet.address,
        deadline
      );

      console.log(`   Transaction: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);

      console.log(`\n✅ ${pair.name} liquidity deployed successfully!`);

    } catch (error) {
      console.error(`\n❌ Error deploying ${pair.name}:`);
      console.error(error.message);
      console.log(`   Continuing with next pair...\n`);
      continue;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`🎉 Liquidity Deployment Complete!`);
  console.log(`═══════════════════════════════════════════════════════\n`);
  console.log(`📈 Pairs Deployed:`);
  console.log(`   • BTCBR/USDT  (5M BTCBR / 250k USDT)`);
  console.log(`   • BTCBR/WBNB  (5M BTCBR / 400 WBNB)`);
  console.log(`   • BTCBR/WETH  (3M BTCBR / 120 WETH)`);
  console.log(`   • WETH/USDT   (600 WETH / 1.5M USDT)`);
  console.log(`   • WETH/WBNB   (500 WETH / 2000 WBNB)`);
  console.log(`\n🌐 View on NEX Exchange: https://nex.norchain.org\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
