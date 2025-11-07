/**
 * Test Fee 3000 Pool with Small Balanced Amount
 * Try 1 NOR + 1 WBNB with proper tick spacing
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n🧪 TESTING FEE 3000 POOL (SMALL AMOUNT)");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wbnb = await ethers.getContractAt("IERC20", WBNB);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  // Try 1 NOR + 1 WBNB (1:1 ratio matching pool price)
  const norAmount = ethers.parseUnits("1", 24); // 1 NOR
  const wbnbAmount = ethers.parseUnits("1", 18); // 1 WBNB

  console.log(`\n📊 Test: 1 NOR + 1 WBNB`);
  console.log(`   Fee: 3000 (0.3%) → Tick spacing: 60`);
  console.log(`   Ticks: [-60, 60] (minimal range, divisible by 60)`);

  // Token order
  const token0 = NOR_TOKEN < WBNB ? NOR_TOKEN : WBNB;
  const token1 = NOR_TOKEN < WBNB ? WBNB : NOR_TOKEN;
  const amount0Desired = token0 === NOR_TOKEN ? norAmount : wbnbAmount;
  const amount1Desired = token1 === NOR_TOKEN ? norAmount : wbnbAmount;

  console.log(`\n✅ Approving...`);
  await (await norToken.approve(NFT_POSITION_MANAGER, norAmount)).wait();
  await (await wbnb.approve(NFT_POSITION_MANAGER, wbnbAmount)).wait();

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const mintParams = {
    token0,
    token1,
    fee: 3000,
    tickLower: -60,  // Minimal range, divisible by 60
    tickUpper: 60,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline
  };

  console.log(`\n💎 Minting...`);
  try {
    const gasEstimate = await nftManager.mint.estimateGas(mintParams);
    const tx = await nftManager.mint(mintParams, {
      gasLimit: (gasEstimate * 120n) / 100n
    });

    const receipt = await tx.wait();
    console.log(`   ✅ SUCCESS! TX: ${receipt.hash}`);

    const increaseLiquidityEvent = receipt.logs.find(log => {
      try {
        const parsed = nftManager.interface.parseLog(log);
        return parsed && parsed.name === "IncreaseLiquidity";
      } catch (e) {
        return false;
      }
    });

    if (increaseLiquidityEvent) {
      const parsed = nftManager.interface.parseLog(increaseLiquidityEvent);
      console.log(`   🎫 NFT Token ID: ${parsed.args.tokenId}`);
    }
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
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
