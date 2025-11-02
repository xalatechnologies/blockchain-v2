import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("💰 Checking Token Balances\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Address:", deployer.address);

  // Load deployment
  const deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));

  // Check all token balances
  console.log("\n📊 Token Balances:");

  // NOR Token
  const norToken = await ethers.getContractAt("NOR", deployment.contracts.NOR_TOKEN);
  const norBalance = await norToken.balanceOf(deployer.address);
  console.log("  NOR:", ethers.formatUnits(norBalance, 24));

  // WUSDT
  const wusdt = await ethers.getContractAt("WUSDTToken", deployment.contracts.WUSDT);
  const wusdtBalance = await wusdt.balanceOf(deployer.address);
  console.log("  WUSDT:", ethers.formatEther(wusdtBalance));

  // Dirhamat
  const dirhamat = await ethers.getContractAt("Dirhamat", deployment.contracts.DIRHAMAT);
  const dirhamatBalance = await dirhamat.balanceOf(deployer.address);
  console.log("  Dirhamat:", ethers.formatEther(dirhamatBalance));

  // WBNB
  const wbnb = await ethers.getContractAt("WBNBToken", deployment.contracts.WBNB);
  const wbnbBalance = await wbnb.balanceOf(deployer.address);
  console.log("  WBNB:", ethers.formatEther(wbnbBalance));

  // WETH
  const weth = await ethers.getContractAt("WETHToken", deployment.contracts.WETH);
  const wethBalance = await weth.balanceOf(deployer.address);
  console.log("  WETH:", ethers.formatEther(wethBalance));

  // Native balance
  const nativeBalance = await ethers.provider.getBalance(deployer.address);
  console.log("  Native (gas):", ethers.formatEther(nativeBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
