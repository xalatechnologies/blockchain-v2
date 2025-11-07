/**
 * Mint NOR/BTCB and NOR/WETH (Skip WBNB which has test position)
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

const POSITIONS = [
  {
    name: "NOR/BTCB",
    token: WBTCB,
    fee: 3000,
    norAmount: "124000000000000000", // 0.124 NOR (1:1 ratio)
    tokenAmount: "124000000000000000", // 0.124 BTCB
    tickLower: -100020,
    tickUpper: 100020
  },
  {
    name: "NOR/WETH",
    token: WETH,
    fee: 3000,
    norAmount: "1999000000000000000", // 1.999 NOR (1:1 ratio)
    tokenAmount: "1999000000000000000", // 1.999 WETH
    tickLower: -100020,
    tickUpper: 100020
  }
];

async function main() {
  console.log("\n💎 MINTING NOR/BTCB & NOR/WETH");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  for (const config of POSITIONS) {
    console.log(`\n💎 ${config.name}...`);

    const token = await ethers.getContractAt("IERC20", config.token);
    const token0 = NOR_TOKEN < config.token ? NOR_TOKEN : config.token;
    const token1 = NOR_TOKEN < config.token ? config.token : NOR_TOKEN;
    const amount0Desired = token0 === NOR_TOKEN ? config.norAmount : config.tokenAmount;
    const amount1Desired = token1 === NOR_TOKEN ? config.norAmount : config.tokenAmount;

    console.log(`   Approving...`);
    await (await norToken.approve(NFT_POSITION_MANAGER, config.norAmount)).wait();
    await (await token.approve(NFT_POSITION_MANAGER, config.tokenAmount)).wait();

    console.log(`   Minting...`);
    const mintParams = {
      token0,
      token1,
      fee: config.fee,
      tickLower: config.tickLower,
      tickUpper: config.tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline
    };

    const gasEstimate = await nftManager.mint.estimateGas(mintParams);
    const tx = await nftManager.mint(mintParams, {
      gasLimit: (gasEstimate * 120n) / 100n
    });

    const receipt = await tx.wait();
    console.log(`   ✅ Minted! TX: ${receipt.hash}`);

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
  }

  console.log(`\n\n✅ COMPLETE!`);
  console.log("═".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
