/**
 * Check All Wrapped Token Contracts
 */

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

const NOR_TOKEN = "0x69a418D2FDc1e3361072e41Fb85fB259b3cdBbFC";
const WUSDT = "0xBA68e109E78f03C07711D1d1DA921DcE703dE517";
const WBNB = "0xE8c3be5316f9A8154F558F2d4E05E53c0De08B09";
const WBTCB = "0xCA4147e11E9797a4E6730CAdB17FC4560B9cC91b";
const WETH = "0xcE08e5dbC8E1e6b4D4D2274E873f7BE965C75b5B";
const WBUSD = "0x5769A13488d6Cf3581775A38Ed70b4EE52e5202c";

const tokens = [
  { name: "WUSDT", address: WUSDT },
  { name: "WBNB", address: WBNB },
  { name: "WBTCB", address: WBTCB },
  { name: "WETH", address: WETH },
  { name: "WBUSD", address: WBUSD }
];

async function main() {
  console.log("\n🔍 CHECKING ALL WRAPPED TOKEN CONTRACTS");
  console.log("═".repeat(70));

  const [deployer] = await ethers.getSigners();
  const norToken = await ethers.getContractAt("NorTokenUltra", NOR_TOKEN);

  for (const token of tokens) {
    console.log(`\n📦 ${token.name} (${token.address})`);

    // Check if contract exists
    const code = await ethers.provider.getCode(token.address);
    if (code === "0x") {
      console.log(`   ❌ Contract not deployed!`);
      continue;
    }

    console.log(`   ✅ Contract exists (${code.length} bytes)`);

    // Try standard ERC20 methods
    const tokenContract = await ethers.getContractAt("IERC20", token.address);

    try {
      const balance = await tokenContract.balanceOf(deployer.address);
      console.log(`   ✅ balanceOf(): ${balance}`);
    } catch (e) {
      console.log(`   ❌ balanceOf() failed: ${e.message}`);
    }

    try {
      const totalSupply = await tokenContract.totalSupply();
      console.log(`   ✅ totalSupply(): ${totalSupply}`);
    } catch (e) {
      console.log(`   ❌ totalSupply() failed: ${e.message}`);
    }

    // Check if whitelisted in NorToken
    try {
      const isWhitelisted = await norToken.isWhitelisted(token.address);
      console.log(`   ${isWhitelisted ? '✅' : '❌'} Whitelisted in NorToken: ${isWhitelisted}`);
    } catch (e) {
      console.log(`   ❌ isWhitelisted() failed: ${e.message}`);
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
