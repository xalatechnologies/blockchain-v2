/**
 * Diagnose V3 Mint Error
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const NFT_POSITION_MANAGER = "0x616a3c3f668Eb5a9Eb6A078d62eac5e9137E761e";

const nftManagerArtifact = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function main() {
  console.log("\n🔬 DIAGNOSING V3 MINT ERROR");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wbnb = await ethers.getContractAt("IERC20", WBNB);
  const nftManager = new ethers.Contract(NFT_POSITION_MANAGER, nftManagerArtifact.abi, deployer);

  const norAmount = "15000000000000000000000000"; // 15M NOR
  const wbnbAmount = "25000000000000000000"; // 25 WBNB

  // Token order
  const token0 = NOR_TOKEN < WBNB ? NOR_TOKEN : WBNB;
  const token1 = NOR_TOKEN < WBNB ? WBNB : NOR_TOKEN;
  const amount0Desired = token0 === NOR_TOKEN ? norAmount : wbnbAmount;
  const amount1Desired = token1 === NOR_TOKEN ? norAmount : wbnbAmount;

  console.log(`\n📊 Setup:`);
  console.log(`   token0: ${token0} (${token0 === NOR_TOKEN ? 'NOR' : 'WBNB'})`);
  console.log(`   token1: ${token1} (${token1 === NOR_TOKEN ? 'NOR' : 'WBNB'})`);
  console.log(`   amount0: ${amount0Desired}`);
  console.log(`   amount1: ${amount1Desired}`);

  // Check balances
  console.log(`\n💰 Balances:`);
  const norBalance = await norToken.balanceOf(deployer.address);
  const wbnbBalance = await wbnb.balanceOf(deployer.address);
  console.log(`   NOR: ${norBalance}`);
  console.log(`   WBNB: ${wbnbBalance}`);

  // Approve max
  console.log(`\n✅ Approving...`);
  try {
    const maxApproval = ethers.parseUnits("1000000000", 24);
    await (await norToken.approve(NFT_POSITION_MANAGER, maxApproval)).wait();
    console.log(`   NOR approved`);

    await (await wbnb.approve(NFT_POSITION_MANAGER, wbnbAmount)).wait();
    console.log(`   WBNB approved`);
  } catch (e) {
    console.log(`   ❌ Approval failed: ${e.message}`);
    return;
  }

  // Check allowances
  console.log(`\n📝 Allowances:`);
  const norAllowance = await norToken.allowance(deployer.address, NFT_POSITION_MANAGER);
  const wbnbAllowance = await wbnb.allowance(deployer.address, NFT_POSITION_MANAGER);
  console.log(`   NOR: ${norAllowance}`);
  console.log(`   WBNB: ${wbnbAllowance}`);

  // Try mint with call static first
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const mintParams = {
    token0,
    token1,
    fee: 3000,
    tickLower: -50000,
    tickUpper: 50000,
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
    console.log(`   ✅ callStatic succeeded!`);
    console.log(`   Token ID: ${result.tokenId}`);
    console.log(`   Liquidity: ${result.liquidity}`);
    console.log(`   Amount0: ${result.amount0}`);
    console.log(`   Amount1: ${result.amount1}`);
  } catch (e) {
    console.log(`   ❌ callStatic failed:`);
    console.log(`   Error: ${e.message}`);

    // Try to decode error
    if (e.data) {
      console.log(`   Error data: ${e.data}`);
    }

    // Try with different gas settings
    console.log(`\n🔧 Trying with explicit gas...`);
    try {
      const result = await nftManager.mint.staticCall(mintParams, { gasLimit: 5000000 });
      console.log(`   ✅ With explicit gas succeeded!`);
    } catch (e2) {
      console.log(`   ❌ Still failed: ${e2.message}`);
    }
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
