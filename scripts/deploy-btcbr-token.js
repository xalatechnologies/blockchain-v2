import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💰 DEPLOYING BTCBR TOKEN");
  console.log("=".repeat(70));

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("  Balance:", ethers.formatEther(balance), "NOR");

  // Get contract factory
  const MintableBTCBR = await ethers.getContractFactory(
    "MintableBTCBR",
    wallet
  );

  // Deploy
  console.log("\n⏳ Deploying MintableBTCBR...");
  const btcbr = await MintableBTCBR.deploy();
  await btcbr.waitForDeployment();
  const btcbrAddr = await btcbr.getAddress();

  console.log("✅ BTCBR deployed:", btcbrAddr);

  // Mint initial supply (21 septillion split: 10.5 to deployer, 10.5 to validator)
  const halfSupply = ethers.parseEther("10500000000000000000000000"); // 10.5 septillion

  console.log("\n💎 MINTING INITIAL SUPPLY");
  console.log("=".repeat(70));

  // Mint to deployer
  console.log("\n⏳ Minting 10.5 septillion BTCBR to deployer...");
  const mint1Tx = await btcbr.mint(wallet.address, halfSupply);
  await mint1Tx.wait();
  console.log("✅ Minted to deployer");

  // Mint to validator (0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD)
  const validatorAddr = "0xFAA5AA97651c2e2b6860219bb8f9902d416dB5DD";
  console.log("\n⏳ Minting 10.5 septillion BTCBR to validator...");
  const mint2Tx = await btcbr.mint(validatorAddr, halfSupply);
  await mint2Tx.wait();
  console.log("✅ Minted to validator");

  // Verify
  const deployerBalance = await btcbr.balanceOf(wallet.address);
  const validatorBalance = await btcbr.balanceOf(validatorAddr);
  const totalSupply = await btcbr.totalSupply();

  console.log("\n🔍 Verification:");
  console.log(
    "  Deployer Balance:",
    ethers.formatEther(deployerBalance),
    "BTCBR"
  );
  console.log(
    "  Validator Balance:",
    ethers.formatEther(validatorBalance),
    "BTCBR"
  );
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "BTCBR");

  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    chainId: 65001,
    deployer: wallet.address,
    contract: {
      name: "BTCBR",
      address: btcbrAddr,
      totalSupply: ethers.formatEther(totalSupply),
      deployerBalance: ethers.formatEther(deployerBalance),
      validatorBalance: ethers.formatEther(validatorBalance),
      validatorAddress: validatorAddr,
    },
  };

  fs.writeFileSync(
    "docs/deployment-logs/btcbr-token-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n" + "=".repeat(70));
  console.log(
    "💾 Deployment info saved to: docs/deployment-logs/btcbr-token-deployment.json"
  );

  console.log("\n📊 DEPLOYMENT SUMMARY:");
  console.log("\n💰 BTCBR Token:");
  console.log("  Address:", btcbrAddr);
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "BTCBR");
  console.log(
    "  Deployer Balance:",
    ethers.formatEther(deployerBalance),
    "BTCBR"
  );
  console.log(
    "  Validator Balance:",
    ethers.formatEther(validatorBalance),
    "BTCBR"
  );
  console.log(
    "  Explorer:",
    `https://explorer.xaheen.org/address/${btcbrAddr}`
  );

  console.log("\n📋 ADD TO METAMASK:");
  console.log("  Contract Address:", btcbrAddr);
  console.log("  Symbol: BTCBR");
  console.log("  Decimals: 18");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 BTCBR TOKEN DEPLOYED!");
  console.log("=".repeat(70));

  console.log("\n💡 NOTE:");
  console.log("  Deployed address:", btcbrAddr);
  console.log("  Target address: 0x0cF8e180350253271f4b917CcFb0aCCc4862F262");
  console.log(
    "  To deploy at specific address, need to embed in genesis file."
  );

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
