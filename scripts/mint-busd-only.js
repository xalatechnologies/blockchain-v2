/**
 * Mint NOR/BUSD Position Only (Test)
 * This should work since it has valid ticks (fee 500, spacing 10)
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n💎 MINTING NOR/BUSD POSITION (TEST)");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wbusd = await ethers.getContractAt("IERC20", WBUSD);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  const norAmount = "2500000000000000000000000"; // 2.5k NOR
  const busdAmount = "2500000000000000000000"; // 2.5k BUSD

  // Token order
  const token0 = NOR_TOKEN < WBUSD ? NOR_TOKEN : WBUSD;
  const token1 = NOR_TOKEN < WBUSD ? WBUSD : NOR_TOKEN;
  const amount0Desired = token0 === NOR_TOKEN ? norAmount : busdAmount;
  const amount1Desired = token1 === NOR_TOKEN ? norAmount : busdAmount;

  console.log(`\n✅ Approving tokens...`);
  await (await norToken.approve(NFT_POSITION_MANAGER, norAmount)).wait();
  await (await wbusd.approve(NFT_POSITION_MANAGER, busdAmount)).wait();
  console.log(`   Approved`);

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const mintParams = {
    token0,
    token1,
    fee: 500,
    tickLower: -10000,
    tickUpper: 10000,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline
  };

  console.log(`\n💎 Minting NOR/BUSD position...`);
  const gasEstimate = await nftManager.mint.estimateGas(mintParams);
  const tx = await nftManager.mint(mintParams, {
    gasLimit: (gasEstimate * 120n) / 100n
  });

  const receipt = await tx.wait();
  console.log(`   ✅ Minted! TX: ${receipt.hash}`);

  // Extract tokenId
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

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
