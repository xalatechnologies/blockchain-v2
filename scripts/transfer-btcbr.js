const { ethers } = require("ethers");

/**
 * Transfer BTCBR Tokens
 * Send 100 million BTCBR from your wallet to specified address
 */

async function main() {
  console.log("\n💸 BTCBR Token Transfer\n");

  // Configuration
  const RPC_URL = "http://3.91.50.187:8545";
  const BTCBR_ADDRESS = "0x0cF8e180350253271f4b917CcFb0aCCc4862F262";

  // Your wallet and recipient
  const FROM_ADDRESS = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
  const TO_ADDRESS = "0xcc61c12aF2B1cD3902b6a1748E5222E33215Ab66";
  const AMOUNT = ethers.utils.parseEther("100000000"); // 100 million BTCBR

  console.log("📊 Transfer Details:");
  console.log("  From:", FROM_ADDRESS);
  console.log("  To:", TO_ADDRESS);
  console.log("  Amount:", ethers.utils.formatEther(AMOUNT), "BTCBR");
  console.log("  Network: BTCBR Private BSC (Chain ID: 885824)");
  console.log("  RPC:", RPC_URL);
  console.log("");

  // Connect to network
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  // You need to provide your private key
  // IMPORTANT: Never commit private keys to git!
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    console.log("❌ Error: PRIVATE_KEY environment variable not set");
    console.log("");
    console.log("To use this script:");
    console.log('  export PRIVATE_KEY="your_private_key_here"');
    console.log("  node scripts/transfer-btcbr.js");
    console.log("");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("🔐 Connected with wallet:", wallet.address);

  // Verify it matches expected address
  if (wallet.address.toLowerCase() !== FROM_ADDRESS.toLowerCase()) {
    console.log("❌ Error: Private key does not match expected wallet");
    console.log("  Expected:", FROM_ADDRESS);
    console.log("  Got:", wallet.address);
    process.exit(1);
  }

  // BTCBR token contract
  const btcbrAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
  ];

  const btcbr = new ethers.Contract(BTCBR_ADDRESS, btcbrAbi, wallet);

  // Check balances
  console.log("\n💰 Checking balances...");
  const senderBalance = await btcbr.balanceOf(FROM_ADDRESS);
  const recipientBalanceBefore = await btcbr.balanceOf(TO_ADDRESS);
  const nativeBalance = await provider.getBalance(FROM_ADDRESS);

  console.log("  Your BTCBR:", ethers.utils.formatEther(senderBalance));
  console.log("  Your BNB:", ethers.utils.formatEther(nativeBalance));
  console.log(
    "  Recipient BTCBR (before):",
    ethers.utils.formatEther(recipientBalanceBefore)
  );
  console.log("");

  // Verify sufficient balance
  if (senderBalance.lt(AMOUNT)) {
    console.log("❌ Insufficient BTCBR balance!");
    console.log("  Need:", ethers.utils.formatEther(AMOUNT), "BTCBR");
    console.log("  Have:", ethers.utils.formatEther(senderBalance), "BTCBR");
    process.exit(1);
  }

  if (nativeBalance.lt(ethers.utils.parseEther("0.001"))) {
    console.log("⚠️  Warning: Low BNB balance for gas");
  }

  // Confirmation
  console.log("⚠️  CONFIRMATION REQUIRED");
  console.log("═".repeat(60));
  console.log("You are about to send:");
  console.log(`  ${ethers.utils.formatEther(AMOUNT)} BTCBR`);
  console.log("");
  console.log("From:");
  console.log(`  ${FROM_ADDRESS}`);
  console.log("");
  console.log("To:");
  console.log(`  ${TO_ADDRESS}`);
  console.log("═".repeat(60));
  console.log("");

  // Execute transfer
  console.log("🚀 Sending transaction...");

  try {
    const tx = await btcbr.transfer(TO_ADDRESS, AMOUNT);

    console.log("📝 Transaction submitted!");
    console.log("  Hash:", tx.hash);
    console.log("");
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log("✅ Transaction confirmed!");
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas used:", receipt.gasUsed.toString());
    console.log("");

    // Check final balances
    const senderBalanceAfter = await btcbr.balanceOf(FROM_ADDRESS);
    const recipientBalanceAfter = await btcbr.balanceOf(TO_ADDRESS);

    console.log("💰 Final Balances:");
    console.log("  Your BTCBR:", ethers.utils.formatEther(senderBalanceAfter));
    console.log(
      "  Recipient BTCBR:",
      ethers.utils.formatEther(recipientBalanceAfter)
    );
    console.log("");
    console.log("✨ Transfer complete!");
    console.log("");
  } catch (error) {
    console.log("❌ Transaction failed!");
    console.log("  Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
