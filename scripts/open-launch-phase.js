/**
 * Open Launch Phase for NorToken
 *
 * Advances NorToken from restricted phases to OPEN phase
 * This allows contracts (DEXes, routers) to interact with the token
 *
 * Phase progression:
 * DISABLED → (enableTrading) → PHASE1 → PHASE2 → PHASE3 → OPEN
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";

async function main() {
  console.log("\n🔓 OPENING LAUNCH PHASE FOR NORTOKEN");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  // Check current phase
  const currentPhase = await norToken.currentPhase();
  const phases = ["DISABLED", "PHASE1", "PHASE2", "PHASE3", "OPEN"];

  console.log(`\n📊 Current Phase: ${phases[currentPhase]}`);

  if (currentPhase === 4) {
    console.log(`   ✅ Already in OPEN phase - contracts can interact`);
    return;
  }

  // Enable trading if not enabled
  if (currentPhase === 0) {
    console.log(`\n🚀 Enabling trading (DISABLED → PHASE1)...`);
    await (await norToken.enableTrading()).wait();
    console.log(`   ✅ Trading enabled - now in PHASE1`);
  }

  // Advance through phases to OPEN
  let phase = await norToken.currentPhase();
  while (phase < 4) {
    console.log(`\n⏩ Advancing phase (${phases[phase]} → ${phases[Number(phase) + 1]})...`);
    await (await norToken.advancePhase()).wait();
    phase = await norToken.currentPhase();
    console.log(`   ✅ Advanced to ${phases[phase]}`);
  }

  console.log(`\n\n🎉 LAUNCH PHASE OPENED!`);
  console.log("═".repeat(70));
  console.log(`   ✅ NorToken is now in OPEN phase`);
  console.log(`   ✅ Contracts (DEXes, routers, NFT managers) can now interact`);
  console.log(`   ✅ Flash loan protection disabled`);
  console.log(`   ✅ Ready for V3 liquidity addition`);

  console.log(`\n📝 NEXT STEP: Add V3 liquidity:`);
  console.log(`   npx hardhat run scripts/add-50k-liquidity-official-v3.js --network btcbr`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to open launch phase:");
    console.error(error);
    process.exit(1);
  });
