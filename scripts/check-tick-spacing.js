/**
 * Check Tick Spacing Requirements
 * V3 pools require ticks to be divisible by tick spacing
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const POSITIONS = [
  { name: "NOR/USDT", fee: 500, tickLower: -10000, tickUpper: 10000 },
  { name: "NOR/WBNB", fee: 3000, tickLower: -50000, tickUpper: 50000 },
  { name: "NOR/BTCB", fee: 3000, tickLower: -100000, tickUpper: 100000 },
  { name: "NOR/WETH", fee: 3000, tickLower: -100000, tickUpper: 100000 },
  { name: "NOR/BUSD", fee: 500, tickLower: -10000, tickUpper: 10000 }
];

// Uniswap V3 tick spacing by fee tier
const TICK_SPACINGS = {
  500: 10,    // 0.05%
  3000: 60,   // 0.3%
  10000: 200  // 1%
};

function checkTicks(name, fee, tickLower, tickUpper) {
  const spacing = TICK_SPACINGS[fee];
  const lowerValid = tickLower % spacing === 0;
  const upperValid = tickUpper % spacing === 0;

  console.log(`\n📊 ${name}:`);
  console.log(`   Fee: ${fee / 10000}% → Tick Spacing: ${spacing}`);
  console.log(`   Tick Range: [${tickLower}, ${tickUpper}]`);
  console.log(`   tickLower % ${spacing} = ${tickLower % spacing} ${lowerValid ? '✅' : '❌'}`);
  console.log(`   tickUpper % ${spacing} = ${tickUpper % spacing} ${upperValid ? '✅' : '❌'}`);

  if (!lowerValid || !upperValid) {
    // Calculate correct ticks
    const correctLower = Math.floor(tickLower / spacing) * spacing;
    const correctUpper = Math.ceil(tickUpper / spacing) * spacing;
    console.log(`   ⚠️  INVALID TICKS!`);
    console.log(`   Suggested Fix: [${correctLower}, ${correctUpper}]`);
    return { valid: false, correctLower, correctUpper };
  } else {
    console.log(`   ✅ Valid ticks`);
    return { valid: true };
  }
}

async function main() {
  console.log("\n🔍 CHECKING TICK SPACING REQUIREMENTS");
  console.log("═".repeat(70));
  console.log("\nUniswap V3 Tick Spacing Rules:");
  console.log("  0.05% (500)   → Tick spacing: 10");
  console.log("  0.3%  (3000)  → Tick spacing: 60");
  console.log("  1%    (10000) → Tick spacing: 200");
  console.log("\n⚠️  CRITICAL: Ticks MUST be divisible by tick spacing!");

  const invalid = [];

  for (const pos of POSITIONS) {
    const result = checkTicks(pos.name, pos.fee, pos.tickLower, pos.tickUpper);
    if (!result.valid) {
      invalid.push({ ...pos, ...result });
    }
  }

  if (invalid.length > 0) {
    console.log(`\n\n❌ FOUND THE ROOT CAUSE!`);
    console.log("═".repeat(70));
    console.log(`\n${invalid.length} positions have invalid tick ranges!`);
    console.log(`\nThis is why minting fails with "execution reverted"`);
    console.log(`Uniswap V3 requires ticks to be exact multiples of tick spacing.`);

    console.log(`\n📝 CORRECTED TICK RANGES:`);
    for (const pos of invalid) {
      console.log(`\n   ${pos.name}:`);
      console.log(`      OLD: tickLower: ${pos.tickLower}, tickUpper: ${pos.tickUpper}`);
      console.log(`      NEW: tickLower: ${pos.correctLower}, tickUpper: ${pos.correctUpper}`);
    }
  } else {
    console.log(`\n\n✅ All tick ranges are valid!`);
  }

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
