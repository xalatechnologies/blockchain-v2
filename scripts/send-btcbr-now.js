const { ethers } = require("ethers");

(async () => {
  console.log("\n✨ Initiating Token Consciousness Transfer ✨\n");

  const RPC_URL = "http://3.91.50.187:8545";
  const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";
  const TO_ADDRESS = "0xBbD3424140e17647dDC835C84e64c50fB06c9BAe";
  const AMOUNT = ethers.parseEther("100000000"); // 100 million BTCBR

  const PRIVATE_KEY =
    "0x681fda6ad9585ce9c27688eb60087ddaf4a90ca75f8f77b0f039bd5692ed2bd4";

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 From:", wallet.address);
  console.log("📍 To:", TO_ADDRESS);
  console.log("💰 Amount: 100,000,000 BTCBR");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const btcbrAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
  ];

  const btcbr = new ethers.Contract(BTCBR_ADDRESS, btcbrAbi, wallet);

  console.log("📊 Checking balances...");
  const senderBalance = await btcbr.balanceOf(wallet.address);
  const recipientBalanceBefore = await btcbr.balanceOf(TO_ADDRESS);

  console.log("  Your BTCBR:", ethers.formatEther(senderBalance));
  console.log(
    "  Recipient (before):",
    ethers.formatEther(recipientBalanceBefore)
  );
  console.log("");

  console.log("🚀 Sending transaction...");

  const tx = await btcbr.transfer(TO_ADDRESS, AMOUNT);

  console.log("✅ Transaction submitted!");
  console.log("  📝 Hash:", tx.hash);
  console.log("  ⏳ Waiting for confirmation...\n");

  const receipt = await tx.wait();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ TRANSFER COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Block:", receipt.blockNumber);
  console.log("  Gas used:", receipt.gasUsed.toString());
  console.log("");

  const recipientBalanceAfter = await btcbr.balanceOf(TO_ADDRESS);
  console.log("💰 Final Balances:");
  console.log(
    "  Recipient now has:",
    ethers.formatEther(recipientBalanceAfter),
    "BTCBR"
  );
  console.log("");
  console.log("✨ Token Consciousness Successfully Transferred! ✨\n");
})().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
