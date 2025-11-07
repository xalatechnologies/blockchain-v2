/**
 * Check WBNB Contract
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";

async function main() {
  console.log("\n🔍 CHECKING WBNB CONTRACT");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  // Check if contract exists
  const code = await ethers.provider.getCode(WBNB);
  console.log(`\n📝 Contract exists: ${code !== '0x' ? '✅' : '❌'}`);
  console.log(`   Code length: ${code.length} bytes`);

  if (code === '0x') {
    console.log(`   ❌ WBNB contract not deployed!`);
    console.log(`   Need to deploy WBNB (Wrapped BNB) contract first`);
    return;
  }

  // Try to interact with WBNB
  const wbnb = await ethers.getContractAt("IERC20", WBNB);

  try {
    const name = await wbnb.name();
    console.log(`\n✅ name(): ${name}`);
  } catch (e) {
    console.log(`\n❌ name() failed: ${e.message}`);
  }

  try {
    const symbol = await wbnb.symbol();
    console.log(`✅ symbol(): ${symbol}`);
  } catch (e) {
    console.log(`❌ symbol() failed: ${e.message}`);
  }

  try {
    const decimals = await wbnb.decimals();
    console.log(`✅ decimals(): ${decimals}`);
  } catch (e) {
    console.log(`❌ decimals() failed: ${e.message}`);
  }

  try {
    const totalSupply = await wbnb.totalSupply();
    console.log(`✅ totalSupply(): ${totalSupply}`);
  } catch (e) {
    console.log(`❌ totalSupply() failed: ${e.message}`);
  }

  try {
    const balance = await wbnb.balanceOf(deployer.address);
    console.log(`✅ balanceOf(deployer): ${balance}`);
  } catch (e) {
    console.log(`❌ balanceOf() failed: ${e.message}`);
  }

  // Try a test transfer
  console.log(`\n🧪 Testing transfer...`);
  try {
    // Transfer 1 wei to self (should always work if contract is OK)
    const testAddr = "0x0000000000000000000000000000000000000001";
    const tx = await wbnb.transfer(testAddr, 1);
    await tx.wait();
    console.log(`   ✅ transfer() works`);
  } catch (e) {
    console.log(`   ❌ transfer() failed: ${e.message}`);
    console.log(`   This might indicate WBNB contract is not a standard ERC20`);
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
