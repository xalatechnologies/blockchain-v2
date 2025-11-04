import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";

async function main() {
  console.log("\n💰 FUNDING BUYBACK CONTRACT");
  console.log("=".repeat(70));

  // Load deployment info
  const buybackDeployment = JSON.parse(
    fs.readFileSync(
      "docs/deployment-logs/weekly-buyback-deployment.json",
      "utf8"
    )
  );
  const usdtDeployment = JSON.parse(
    fs.readFileSync("docs/deployment-logs/test-usdt-deployment.json", "utf8")
  );

  const BUYBACK_ADDRESS = buybackDeployment.contract.address;
  const USDT_ADDRESS = usdtDeployment.contract.address;

  console.log("\n📍 Addresses:");
  console.log("  Buyback Contract:", BUYBACK_ADDRESS);
  console.log("  USDT Token:", USDT_ADDRESS);

  // Connect to Nor Chain
  const provider = new ethers.JsonRpcProvider("https://rpc.xaheen.org");
  const wallet = new ethers.Wallet(
    process.env.MAIN_WALLET_PRIVATE_KEY,
    provider
  );

  console.log("\n👤 Wallet:", wallet.address);

  // USDT contract
  const usdt = new ethers.Contract(
    USDT_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address,uint256) returns (bool)",
    ],
    wallet
  );

  // Check balances
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log(
    "\n💰 Your USDT Balance:",
    ethers.formatUnits(usdtBalance, 18),
    "USDT"
  );

  const buybackBalance = await usdt.balanceOf(BUYBACK_ADDRESS);
  console.log(
    "  Buyback Contract Balance:",
    ethers.formatUnits(buybackBalance, 18),
    "USDT"
  );

  // Funding amount (start with 2000 USDT for first buyback)
  const FUNDING_AMOUNT = ethers.parseUnits("2000", 18); // 2000 USDT

  console.log("\n💵 FUNDING PLAN:");
  console.log(
    "  Amount to Transfer:",
    ethers.formatUnits(FUNDING_AMOUNT, 18),
    "USDT"
  );
  console.log("  Purpose: Fund first #BuyNorFriday buyback");

  if (usdtBalance < FUNDING_AMOUNT) {
    throw new Error(
      "❌ Insufficient USDT balance. Need: " +
        ethers.formatUnits(FUNDING_AMOUNT, 18) +
        " USDT"
    );
  }

  console.log("\n📝 TRANSFERRING USDT...");

  const tx = await usdt.transfer(BUYBACK_ADDRESS, FUNDING_AMOUNT, {
    gasLimit: 100000,
  });

  console.log("  Transaction:", tx.hash);
  console.log("  ⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("  ✅ Transfer complete!");

  // Check new balances
  const newWalletBalance = await usdt.balanceOf(wallet.address);
  const newBuybackBalance = await usdt.balanceOf(BUYBACK_ADDRESS);

  console.log("\n💰 UPDATED BALANCES:");
  console.log(
    "  Your Balance:",
    ethers.formatUnits(newWalletBalance, 18),
    "USDT"
  );
  console.log(
    "  Buyback Contract:",
    ethers.formatUnits(newBuybackBalance, 18),
    "USDT"
  );

  console.log("\n✅ BUYBACK CONTRACT FUNDED!");

  // Save funding info
  const fundingInfo = {
    timestamp: new Date().toISOString(),
    network: "Nor Chain",
    buybackContract: BUYBACK_ADDRESS,
    amount: ethers.formatUnits(FUNDING_AMOUNT, 18) + " USDT",
    transaction: receipt.hash,
    from: wallet.address,
    newContractBalance: ethers.formatUnits(newBuybackBalance, 18) + " USDT",
    verification: `https://explorer.xaheen.org/tx/${receipt.hash}`,
  };

  fs.writeFileSync(
    "docs/deployment-logs/buyback-funding.json",
    JSON.stringify(fundingInfo, null, 2)
  );

  console.log(
    "\n💾 Funding info saved to: docs/deployment-logs/buyback-funding.json"
  );

  console.log("\n🔗 VERIFICATION:");
  console.log(
    "  Transaction:",
    `https://explorer.xaheen.org/tx/${receipt.hash}`
  );
  console.log(
    "  Contract:",
    `https://explorer.xaheen.org/address/${BUYBACK_ADDRESS}`
  );

  console.log("\n💡 WHAT'S NEXT:");
  console.log("  📅 Wait 7 days (weekly interval)");
  console.log("  🔥 Execute first buyback:");
  console.log("     node scripts/execute-buyback.js");
  console.log("  📢 Announce #BuyNorFriday!");

  console.log("\n📊 BUYBACK SCHEDULE:");
  console.log("  Frequency: Every Friday (7 days)");
  console.log("  Amount: $2,000 USDT");
  console.log("  Split: 50% Burn + 30% Treasury + 20% LP");
  console.log("  Expected NOR: ~833B NOR at current price");
  console.log("  Burn: ~416B NOR per week");

  console.log("\n" + "=".repeat(70));
  console.log("💰 READY FOR FIRST BUYBACK! 💰");
  console.log("=".repeat(70));

  return fundingInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  });
