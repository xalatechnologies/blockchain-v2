/**
 * Test Small V3 Mint (1:1 Ratio)
 * Try minting a tiny balanced position to verify pools work
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n🧪 TESTING SMALL V3 MINT (1:1 RATIO)");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wbnb = await ethers.getContractAt("IERC20", WBNB);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  // Try 1:1 ratio: 1 NOR + 1 WBNB (matching initialized price)
  const norAmount = ethers.parseUnits("1", 24); // 1 NOR
  const wbnbAmount = ethers.parseUnits("1", 18); // 1 WBNB

  console.log(`\n📊 Test Position:`);
  console.log(`   1 NOR + 1 WBNB (1:1 ratio matching pool price)`);

  // Token order
  const token0 = NOR_TOKEN < WBNB ? NOR_TOKEN : WBNB;
  const token1 = NOR_TOKEN < WBNB ? WBNB : NOR_TOKEN;
  const amount0Desired = token0 === NOR_TOKEN ? norAmount : wbnbAmount;
  const amount1Desired = token1 === NOR_TOKEN ? norAmount : wbnbAmount;

  console.log(`\n   token0: ${token0}`);
  console.log(`   token1: ${token1}`);
  console.log(`   amount0: ${amount0Desired}`);
  console.log(`   amount1: ${amount1Desired}`);

  // Approve
  console.log(`\n✅ Approving...`);
  await (await norToken.approve(NFT_POSITION_MANAGER, norAmount)).wait();
  await (await wbnb.approve(NFT_POSITION_MANAGER, wbnbAmount)).wait();
  console.log(`   Approved`);

  // Mint with small tick range around current price
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const mintParams = {
    token0,
    token1,
    fee: 3000,
    tickLower: -1000, // Small range around 1:1 price
    tickUpper: 1000,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline
  };

  console.log(`\n🧪 Testing mint with callStatic...`);
  try {
    const result = await nftManager.mint.staticCall(mintParams);
    console.log(`   ✅ SUCCESS!`);
    console.log(`   Token ID: ${result.tokenId}`);
    console.log(`   Liquidity: ${result.liquidity}`);
    console.log(`   Amount0: ${result.amount0}`);
    console.log(`   Amount1: ${result.amount1}`);

    console.log(`\n💎 Executing actual mint...`);
    const tx = await nftManager.mint(mintParams);
    const receipt = await tx.wait();
    console.log(`   ✅ Minted! TX: ${receipt.hash}`);

  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    if (e.data) console.log(`   Error data: ${e.data}`);
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
