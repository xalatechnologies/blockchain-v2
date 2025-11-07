/**
 * Test V3 Mint with Minimal Setup
 * Isolate the exact error
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n🧪 TESTING V3 MINT - MINIMAL");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wusdt = await ethers.getContractAt("IERC20", WUSDT);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  console.log(`\n1. Testing NOR approval to NFT Manager...`);
  try {
    await (await norToken.approve(NFT_POSITION_MANAGER, ethers.parseUnits("100", 24))).wait();
    console.log(`   ✅ NOR approved`);
  } catch (e) {
    console.log(`   ❌ NOR approval failed: ${e.message}`);
    return;
  }

  console.log(`\n2. Testing WUSDT approval to NFT Manager...`);
  try {
    await (await wusdt.approve(NFT_POSITION_MANAGER, ethers.parseUnits("100", 18))).wait();
    console.log(`   ✅ WUSDT approved`);
  } catch (e) {
    console.log(`   ❌ WUSDT approval failed: ${e.message}`);
    return;
  }

  console.log(`\n3. Testing direct transfer NOR from deployer to pool...`);
  try {
    const pool = "0x11F3C25c88d5a45a3443dde57ef6F04C03A68092";
    await (await norToken.transfer(pool, ethers.parseUnits("1", 24))).wait();
    console.log(`   ✅ Direct NOR transfer to pool works`);
  } catch (e) {
    console.log(`   ❌ Direct NOR transfer failed: ${e.message}`);
    console.log(`      This means the pool isn't properly whitelisted`);
    return;
  }

  console.log(`\n4. Testing transferFrom NOR (deployer → pool via NFT manager simulation)...`);
  try {
    // This simulates what the NFT manager does
    const pool = "0x11F3C25c88d5a45a3443dde57ef6F04C03A68092";
    await (await norToken.transferFrom(deployer.address, pool, ethers.parseUnits("1", 24))).wait();
    console.log(`   ✅ TransferFrom works`);
  } catch (e) {
    console.log(`   ❌ TransferFrom failed: ${e.message}`);
    console.log(`      This is the actual error we're hitting`);
    return;
  }

  console.log(`\n✅ All tests passed - the issue must be elsewhere`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });
