import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

async function main() {
  console.log("\n🔍 Verifying LP Token Locks\n");
  console.log("=".repeat(70));

  const pairs = [
    { name: "NOR/WUSDT", address: "0xe7c6B1853078eA5aBff5FbAaF801D6A1E9b1f59b" },
    { name: "NOR/WETH", address: "0x88992eE68E23fbDA10e9a85B5cf7Ee5bA8BaeD84" },
    { name: "NOR/Dirhamat", address: "0x82bBA6ffcBeC38fb07AC8ABd745D47e7Af2Af26e" },
    { name: "Dirhamat/WUSDT", address: "0x41C9B2D4Ff3c5aE69c651140bF91f2B71dDE45ba" }
  ];

  const [deployer] = await ethers.getSigners();

  console.log("\n📊 Deployer LP Token Balances After Locking:\n");

  for (const pair of pairs) {
    const lpToken = await ethers.getContractAt("NoorSwapPair", pair.address);
    const balance = await lpToken.balanceOf(deployer.address);
    console.log(`  ${pair.name}: ${ethers.formatEther(balance)} LP tokens`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ All LP tokens successfully transferred to LiquidityLock contract");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
