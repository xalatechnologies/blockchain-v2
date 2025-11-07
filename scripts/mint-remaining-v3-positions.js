/**
 * Mint Remaining V3 Positions (WBNB, BTCB, WETH, BUSD)
 * Skips NOR/USDT which was already minted
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

// Wrapped tokens
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

// Remaining positions to mint (skipping NOR/USDT #1, NOR/BUSD #2, test WBNB #3)
// CRITICAL: Ticks must be divisible by tick spacing!
// Fee 500 (0.05%) → spacing 10, Fee 3000 (0.3%) → spacing 60
// FIXED: Using 1:1 ratios to match initialized pool price
const POSITIONS = [
  {
    name: "NOR/WBNB",
    token: WBNB,
    fee: 3000,
    norAmount: "24000000000000000000", // 24 NOR (1:1 ratio, leaving 1 for test)
    tokenAmount: "24000000000000000000", // 24 WBNB
    tickLower: -50040,  // FIXED: Must be divisible by 60
    tickUpper: 50040,   // FIXED: Must be divisible by 60
    usdValue: 14400     // ~$14.4k at $600/WBNB
  },
  {
    name: "NOR/BTCB",
    token: WBTCB,
    fee: 3000,
    norAmount: "124000000000000000", // 0.124 NOR (1:1 ratio, leaving 0.001 buffer)
    tokenAmount: "124000000000000000", // 0.124 BTCB
    tickLower: -100020, // FIXED: Must be divisible by 60
    tickUpper: 100020,  // FIXED: Must be divisible by 60
    usdValue: 7440      // ~$7.44k at $60k/BTC
  },
  {
    name: "NOR/WETH",
    token: WETH,
    fee: 3000,
    norAmount: "1999000000000000000", // 1.999 NOR (1:1 ratio, leaving buffer)
    tokenAmount: "1999000000000000000", // 1.999 WETH
    tickLower: -100020, // FIXED: Must be divisible by 60
    tickUpper: 100020,  // FIXED: Must be divisible by 60
    usdValue: 4997      // ~$5k at $2500/ETH
  }
];

async function main() {
  console.log("\n💎 MINTING REMAINING V3 POSITIONS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const results = [];

  for (const config of POSITIONS) {
    console.log(`\n💎 ${config.name} ($${config.usdValue.toLocaleString()})...`);

    try {
      const token = await ethers.getContractAt("IERC20", config.token);

      // Determine token order
      const token0 = NOR_TOKEN < config.token ? NOR_TOKEN : config.token;
      const token1 = NOR_TOKEN < config.token ? config.token : NOR_TOKEN;
      const amount0Desired = token0 === NOR_TOKEN ? config.norAmount : config.tokenAmount;
      const amount1Desired = token1 === NOR_TOKEN ? config.norAmount : config.tokenAmount;

      console.log(`   Approving tokens...`);
      // Approve max amounts to ensure sufficient allowance
      const maxApproval = ethers.parseUnits("1000000000", 24); // 1 billion NOR
      await (await norToken.approve(NFT_POSITION_MANAGER, maxApproval)).wait();
      await (await token.approve(NFT_POSITION_MANAGER, config.tokenAmount)).wait();

      console.log(`   Minting NFT position...`);

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
      console.log(`   ✅ Minted successfully`);

      // Extract tokenId
      const increaseLiquidityEvent = receipt.logs.find(log => {
        try {
          const parsed = nftManager.interface.parseLog(log);
          return parsed && parsed.name === "IncreaseLiquidity";
        } catch (e) {
          return false;
        }
      });

      let tokenId = "Unknown";
      if (increaseLiquidityEvent) {
        const parsed = nftManager.interface.parseLog(increaseLiquidityEvent);
        tokenId = parsed.args.tokenId.toString();
      }

      results.push({
        pair: config.name,
        tokenId,
        usdValue: config.usdValue,
        txHash: receipt.hash
      });

      console.log(`   🎫 NFT Token ID: ${tokenId}`);

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  console.log(`\n\n🎉 ALL V3 POSITIONS MINTED!`);
  console.log("═".repeat(70));

  console.log(`\n✅ COMPLETE V3 LIQUIDITY SUMMARY:`);
  console.log(`   NOR/USDT (NFT #1): $20,000`);
  for (const result of results) {
    console.log(`   ${result.pair} (NFT #${result.tokenId}): $${result.usdValue.toLocaleString()}`);
  }

  const totalV3 = 20000 + results.reduce((sum, r) => sum + r.usdValue, 0);
  console.log(`\n   💰 Total V3: $${totalV3.toLocaleString()}`);
  console.log(`   💰 Total V2: $50,000`);
  console.log(`   💰 GRAND TOTAL: $${(totalV3 + 50000).toLocaleString()}`);

  console.log(`\n📝 FINAL STEP: Lock all liquidity for 3 years`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
