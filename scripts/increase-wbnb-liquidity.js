/**
 * Increase Liquidity on Existing NOR/WBNB Position (NFT #3)
 * Add the remaining 24 WBNB to the existing position
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";
const NFT_TOKEN_ID = 3; // The test position

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n💎 INCREASING LIQUIDITY ON NOR/WBNB NFT #3");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wbnb = await ethers.getContractAt("IERC20", WBNB);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  // Check current position
  console.log(`\n📊 Current Position (NFT #${NFT_TOKEN_ID}):`);
  const position = await nftManager.positions(NFT_TOKEN_ID);
  console.log(`   Token0: ${position.token0}`);
  console.log(`   Token1: ${position.token1}`);
  console.log(`   Fee: ${Number(position.fee) / 10000}%`);
  console.log(`   Current Liquidity: ${position.liquidity.toString()}`);
  console.log(`   Tick Range: [${position.tickLower}, ${position.tickUpper}]`);

  // Check actual available balance
  const wbnbBalance = await wbnb.balanceOf(deployer.address);
  console.log(`\n💰 Available WBNB: ${ethers.formatUnits(wbnbBalance, 18)}`);

  // Use actual balance (all remaining WBNB)
  const wbnbAmount = wbnbBalance;
  const norAmount = wbnbAmount * 1000000n; // 1:1 ratio (adjust for decimals: 24-18=6 zeros = 1M)

  console.log(`\n💰 Adding: ${ethers.formatUnits(norAmount, 24)} NOR + ${ethers.formatUnits(wbnbAmount, 18)} WBNB`);

  // Determine token order
  const token0 = NOR_TOKEN < WBNB ? NOR_TOKEN : WBNB;
  const token1 = NOR_TOKEN < WBNB ? WBNB : NOR_TOKEN;
  const amount0Desired = token0 === NOR_TOKEN ? norAmount : wbnbAmount;
  const amount1Desired = token1 === NOR_TOKEN ? norAmount : wbnbAmount;

  console.log(`\n✅ Approving tokens...`);
  await (await norToken.approve(NFT_POSITION_MANAGER, norAmount)).wait();
  await (await wbnb.approve(NFT_POSITION_MANAGER, wbnbAmount)).wait();
  console.log(`   Approved`);

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const increaseParams = {
    tokenId: NFT_TOKEN_ID,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    deadline
  };

  console.log(`\n💎 Increasing liquidity...`);
  try {
    const gasEstimate = await nftManager.increaseLiquidity.estimateGas(increaseParams);
    const tx = await nftManager.increaseLiquidity(increaseParams, {
      gasLimit: (gasEstimate * 120n) / 100n
    });

    const receipt = await tx.wait();
    console.log(`   ✅ SUCCESS! TX: ${receipt.hash}`);

    // Check new position
    const newPosition = await nftManager.positions(NFT_TOKEN_ID);
    console.log(`\n📊 Updated Position:`);
    console.log(`   New Liquidity: ${newPosition.liquidity}`);
    console.log(`   Increase: ${newPosition.liquidity - position.liquidity}`);

  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    throw e;
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
