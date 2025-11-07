import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");
const NOR_BSC = "0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E";
const USDT_POOL = "0xDA2f9b5a44655203259174b9c81229ed41Ed8f80";
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 Router

console.log("\n🔍 INVESTIGATING WHO SOLD TO POOL");
console.log("=".repeat(70));

const tokenABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const token = new ethers.Contract(NOR_BSC, tokenABI, provider);

console.log("\n⏳ Analyzing transactions...\n");

const currentBlock = await provider.getBlockNumber();
console.log(`Current Block: ${currentBlock}\n`);

// Most swaps go through the router, not directly to pool
// So let's check transfers TO the pool (these are the actual sellers)
const filter = token.filters.Transfer(null, USDT_POOL);

let events = [];
try {
  // Try to get events from last 5000 blocks
  console.log("📊 Fetching last 5000 blocks of transfers...");
  events = await token.queryFilter(filter, currentBlock - 5000, currentBlock);
  console.log(`   Found ${events.length} transfers TO the pool\n`);
} catch (error) {
  console.log(`⚠️ Rate limited. Trying smaller range...\n`);
  try {
    events = await token.queryFilter(filter, currentBlock - 1000, currentBlock);
    console.log(`   Found ${events.length} transfers TO the pool\n`);
  } catch (e) {
    console.log(`❌ Could not fetch events: ${e.message}\n`);
  }
}

if (events.length > 0) {
  console.log("=".repeat(70));
  console.log("🔍 SELLERS TO POOL (Most Recent First):");
  console.log("=".repeat(70));

  const recentSells = events.slice(-15).reverse();

  for (let i = 0; i < Math.min(recentSells.length, 10); i++) {
    const event = recentSells[i];
    const seller = event.args.from;
    const amount = ethers.formatEther(event.args.value);

    try {
      const block = await provider.getBlock(event.blockNumber);
      const timestamp = new Date(Number(block.timestamp) * 1000);

      // Check if it's a contract (bot) or EOA (person)
      const code = await provider.getCode(seller);
      const isContract = code !== "0x";
      const type = isContract ? "🤖 CONTRACT/BOT" : "👤 WALLET/PERSON";

      console.log(`\n${i + 1}. ${type}`);
      console.log(`   Address: ${seller}`);
      console.log(`   Amount: ${Number(amount).toLocaleString()} NOR`);
      console.log(`   Time: ${timestamp.toISOString()}`);
      console.log(`   Block: ${event.blockNumber}`);

      // Check if it's the PancakeSwap router
      if (seller.toLowerCase() === PANCAKE_ROUTER.toLowerCase()) {
        console.log(`   🔄 Via PancakeSwap Router (user used DEX interface)`);
      }

    } catch (e) {
      console.log(`   Error fetching details: ${e.message}`);
    }
  }
} else {
  console.log("⚠️ No transfers found in recent blocks.");
  console.log("   This could mean:");
  console.log("   1. Swaps happened earlier than our search window");
  console.log("   2. All swaps went through router (normal for PancakeSwap)");
}

console.log("\n" + "=".repeat(70));
console.log("💡 EXPLANATION:");
console.log("=".repeat(70));

console.log(`
When someone sells on PancakeSwap:

SCENARIO 1: Regular User (via PancakeSwap Website)
├─ User connects wallet to pancakeswap.finance
├─ Clicks "Swap" NOR → USDT
├─ Transaction goes through PancakeSwap Router
└─ Router transfers NOR to pool
   └─ Shows as "PancakeSwap Router" in sellers list

SCENARIO 2: Direct Bot (Automated Script)
├─ Bot monitors for new liquidity pools
├─ Bot directly calls swap function
├─ Transaction might bypass router
└─ Shows as contract address in sellers list

SCENARIO 3: MEV Bot (Flashbot/Sandwich Attack)
├─ Bot detects your liquidity add transaction
├─ Bot front-runs with instant sell
├─ Takes all liquidity before others can trade
└─ Usually shows as contract address

KEY QUESTION: Did you distribute 6.7M NOR to anyone?

If YES → Those people (or bots they sold to) sold
If NO → Something else happened (need investigation)
`);

console.log("=".repeat(70));
