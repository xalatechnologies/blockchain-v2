/**
 * Whitelist Uniswap V3 Contracts in NorToken
 *
 * Whitelists the NFT Position Manager and other V3 contracts
 * so they can interact with NorToken without restrictions
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";
const SWAP_ROUTER = "0x66677e0Cf830a022bbcBdbE125F80B1FEdAFbC36";
const UNISWAP_V3_FACTORY = "0x150BD1B91AFCdeBA70313Cd6dB5BbC3EF06C8926";

// V3 pools to whitelist
const V3_POOLS = [
  { name: "NOR/USDT", address: "0x11F3C25c88d5a45a3443dde57ef6F04C03A68092" },
  { name: "NOR/WBNB", address: "0xB4bBeed467AC520342d86d566e73f1C218824dc7" }
];

async function main() {
  console.log("\n🔓 WHITELISTING UNISWAP V3 CONTRACTS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  // Whitelist NFT Position Manager
  console.log(`\n📝 Whitelisting NFT Position Manager...`);
  await (await norToken.whitelist(NFT_POSITION_MANAGER)).wait();
  console.log(`   ✅ NFT Position Manager whitelisted: ${NFT_POSITION_MANAGER}`);

  // Whitelist Swap Router
  console.log(`\n📝 Whitelisting Swap Router...`);
  await (await norToken.whitelist(SWAP_ROUTER)).wait();
  console.log(`   ✅ Swap Router whitelisted: ${SWAP_ROUTER}`);

  // Whitelist Factory
  console.log(`\n📝 Whitelisting Uniswap V3 Factory...`);
  await (await norToken.whitelist(UNISWAP_V3_FACTORY)).wait();
  console.log(`   ✅ Factory whitelisted: ${UNISWAP_V3_FACTORY}`);

  // Whitelist V3 pools
  console.log(`\n📝 Whitelisting V3 pools...`);
  for (const pool of V3_POOLS) {
    await (await norToken.whitelist(pool.address)).wait();
    console.log(`   ✅ ${pool.name} pool whitelisted: ${pool.address}`);
  }

  console.log(`\n\n🎉 V3 CONTRACTS WHITELISTED!`);
  console.log("═".repeat(70));
  console.log(`   ✅ NFT Position Manager can now interact with NorToken`);
  console.log(`   ✅ Swap Router can now facilitate swaps`);
  console.log(`   ✅ V3 pools can now hold NorToken`);
  console.log(`   ✅ Ready for V3 liquidity addition`);

  console.log(`\n📝 NEXT STEP: Add V3 liquidity:`);
  console.log(`   npx hardhat run scripts/add-50k-liquidity-official-v3.js --network btcbr`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to whitelist V3 contracts:");
    console.error(error);
    process.exit(1);
  });
