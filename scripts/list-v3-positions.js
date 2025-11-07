/**
 * List All V3 NFT Positions
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n📋 LISTING ALL V3 NFT POSITIONS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Owner: ${deployer.address}`);

  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  try {
    const balance = await nftManager.balanceOf(deployer.address);
    console.log(`   NFT Balance: ${balance}`);

    if (balance === 0n) {
      console.log(`\n   No V3 positions found`);
      return;
    }

    console.log(`\n✅ V3 Positions:`);

    for (let i = 0; i < Number(balance); i++) {
      try {
        const tokenId = await nftManager.tokenOfOwnerByIndex(deployer.address, i);
        console.log(`\n   NFT #${tokenId}:`);

        const position = await nftManager.positions(tokenId);
        console.log(`      Token0: ${position.token0}`);
        console.log(`      Token1: ${position.token1}`);
        console.log(`      Fee: ${position.fee / 10000}%`);
        console.log(`      Liquidity: ${position.liquidity}`);
        console.log(`      Tick Range: [${position.tickLower}, ${position.tickUpper}]`);
      } catch (e) {
        console.log(`\n   Error reading NFT #${i}: ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`\n   ❌ Failed to read positions: ${e.message}`);
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
