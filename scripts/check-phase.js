const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const nor = await ethers.getContractAt("NorTokenUltra", "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC");
  const phase = await nor.currentPhase();
  const phases = ["DISABLED", "PHASE1", "PHASE2", "PHASE3", "OPEN"];
  console.log(`Current phase: ${phases[phase]} (${phase})`);
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
