/**
 * Check Balances for V3 Minting
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

async function main() {
  console.log("\n💰 CHECKING BALANCES FOR V3 MINTING");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);

  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);
  const wbnb = await ethers.getContractAt("IERC20", WBNB);
  const wbtcb = await ethers.getContractAt("IERC20", WBTCB);
  const weth = await ethers.getContractAt("IERC20", WETH);
  const wbusd = await ethers.getContractAt("IERC20", WBUSD);

  console.log(`\n📊 Token Balances:`);

  const norBalance = await norToken.balanceOf(deployer.address);
  console.log(`   NOR:  ${(Number(norBalance) / 1e24).toLocaleString()} (${norBalance.toString()})`);

  const wbnbBalance = await wbnb.balanceOf(deployer.address);
  console.log(`   WBNB: ${(Number(wbnbBalance) / 1e18).toLocaleString()} (${wbnbBalance.toString()})`);

  const wbtcbBalance = await wbtcb.balanceOf(deployer.address);
  console.log(`   BTCB: ${(Number(wbtcbBalance) / 1e18).toLocaleString()} (${wbtcbBalance.toString()})`);

  const wethBalance = await weth.balanceOf(deployer.address);
  console.log(`   WETH: ${(Number(wethBalance) / 1e18).toLocaleString()} (${wethBalance.toString()})`);

  const wbusdBalance = await wbusd.balanceOf(deployer.address);
  console.log(`   BUSD: ${(Number(wbusdBalance) / 1e18).toLocaleString()} (${wbusdBalance.toString()})`);

  console.log(`\n✅ REQUIRED FOR REMAINING V3 POSITIONS:`);
  console.log(`   NOR:  30,000,000 (15M + 7.5M + 5M + 2.5M)`);
  console.log(`   WBNB: 25`);
  console.log(`   BTCB: 0.125`);
  console.log(`   WETH: 2`);
  console.log(`   BUSD: 2,500`);

  console.log(`\n═`.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:");
    console.error(error);
    process.exit(1);
  });
