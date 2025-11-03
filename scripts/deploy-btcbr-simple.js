import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
dotenvConfig();

async function main() {
  console.log("🪙 Deploying BTCBR Token\n");
  console.log("=".repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "NOR\n");

  // Deploy BTCBR
  console.log("Deploying MintableBTCBR...");
  const BTCBRFactory = await ethers.getContractFactory("MintableBTCBR");
  const btcbr = await BTCBRFactory.deploy();
  await btcbr.waitForDeployment();
  const btcbrAddress = await btcbr.getAddress();
  console.log("✅ BTCBR deployed to:", btcbrAddress);

  // Mint initial supply: 21 billion BTCBR
  console.log("\nMinting initial supply...");
  const initialSupply = ethers.parseEther("21000000000"); // 21 billion
  await (await btcbr.mint(deployer.address, initialSupply)).wait();
  console.log("✅ Minted 21 billion BTCBR to", deployer.address);

  // Verify balance
  const deployerBalance = await btcbr.balanceOf(deployer.address);
  console.log("\n📊 Deployer BTCBR Balance:", ethers.formatEther(deployerBalance), "BTCBR");

  // Save deployment
  let deployment = {};
  try {
    deployment = JSON.parse(fs.readFileSync("./deployments/dex-infrastructure.json", "utf8"));
  } catch (e) {
    // File doesn't exist
  }

  deployment.contracts = deployment.contracts || {};
  deployment.contracts.BTCBR = btcbrAddress;

  fs.writeFileSync("./deployments/dex-infrastructure.json", JSON.stringify(deployment, null, 2));

  console.log("\n" + "=".repeat(70));
  console.log("✅ BTCBR DEPLOYMENT COMPLETE");
  console.log("=".repeat(70));
  console.log("\n📋 BTCBR Address:", btcbrAddress);
  console.log("💰 Total Supply: 21 billion BTCBR");
  console.log("📁 Saved to: deployments/dex-infrastructure.json\n");

  return { btcbr: btcbrAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
