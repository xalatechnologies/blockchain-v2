/**
 * Debug WBNB Balance and Allowance
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const NFT_MGR = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";
const POOL = "0xB4bBeed467AC520342d86d566e73f1C218824dc7";

async function main() {
  console.log("\n🔍 DEBUGGING WBNB BALANCE & ALLOWANCE");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const wbnb = await ethers.getContractAt("IERC20", WBNB);
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  // Check deployer balance
  const balance = await wbnb.balanceOf(deployer.address);
  console.log(`\n💰 Deployer WBNB Balance:`);
  console.log(`   Raw: ${balance.toString()}`);
  console.log(`   Formatted: ${ethers.formatUnits(balance, 18)} WBNB`);

  // Check NOR balance
  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`\n💰 Deployer NOR Balance:`);
  console.log(`   Formatted: ${ethers.formatUnits(norBalance, 24)} NOR`);

  // Check pool balance
  const poolBalance = await wbnb.balanceOf(POOL);
  console.log(`\n🏊 Pool WBNB Balance:`);
  console.log(`   Formatted: ${ethers.formatUnits(poolBalance, 18)} WBNB`);

  // Check allowance
  const allowance = await wbnb.allowance(deployer.address, NFT_MGR);
  console.log(`\n✅ Current Allowance (NFT Manager):`);
  console.log(`   Raw: ${allowance.toString()}`);
  console.log(`   Formatted: ${ethers.formatUnits(allowance, 18)} WBNB`);

  // Try to transfer 24 WBNB directly to pool
  console.log(`\n🧪 Testing direct transfer of 24 WBNB to pool...`);
  try {
    const testAmount = ethers.parseUnits("24", 18);
    // Use staticCall to test without actually sending
    await wbnb.transfer.staticCall(POOL, testAmount);
    console.log(`   ✅ Direct transfer would succeed`);
  } catch (e) {
    console.log(`   ❌ Direct transfer would fail: ${e.message}`);
  }

  // Check total supply
  const totalSupply = await wbnb.totalSupply();
  console.log(`\n📊 WBNB Total Supply:`);
  console.log(`   Formatted: ${ethers.formatUnits(totalSupply, 18)} WBNB`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
