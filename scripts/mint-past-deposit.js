import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/**
 * Manually mint WBNB from past bridge deposit
 *
 * Use this to process deposits that validator service missed due to rate limits
 */

async function main() {
  console.log("\n🔨 MANUAL MINTING FOR PAST DEPOSIT\n");
  console.log("=".repeat(60));

  const [validator] = await ethers.getSigners();
  console.log("💼 Validator:", validator.address);

  // Your past deposit details
  const recipient = "0xdD779a290C937144F80Eb75b75d814c834536B1b";
  const amount = ethers.parseEther("0.00998"); // After 0.2% fee
  const nonce = 0; // First deposit

  console.log("\n📋 DEPOSIT DETAILS:");
  console.log("Recipient:", recipient);
  console.log("Amount:", ethers.formatEther(amount), "BNB");
  console.log("Nonce:", nonce);

  const BNBBridgeNor = await ethers.getContractFactory("BNBBridgeNor");
  const bridge = BNBBridgeNor.attach(process.env.BNB_BRIDGE_XAHEEN);

  // Check if already processed
  const processed = await bridge.processedNonces(nonce);
  if (processed) {
    console.log("\n✅ Already processed!");
    console.log("WBNB should already be in your wallet");
    console.log("\nCheck MetaMask:");
    console.log("1. Switch to Nor network");
    console.log("2. Import WBNB:", process.env.WBNB_TOKEN_XAHEEN);
    console.log("3. Should see 0.00998 WBNB");
    return;
  }

  console.log("\n🔨 MINTING WBNB...");

  // Generate signature
  const chainId = 65001;
  const message = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256", "uint256"],
    [recipient, amount, nonce, chainId]
  );
  const signature = await validator.signMessage(ethers.getBytes(message));

  console.log("✍️  Signature generated");

  const signatures = [signature];

  console.log("📡 Calling mintWBNB...");

  try {
    const tx = await bridge.mintWBNB(recipient, amount, nonce, signatures, {
      gasLimit: 500000,
    });

    console.log("Transaction sent:", tx.hash);
    console.log("⏰ Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log("\n✅ WBNB MINTED SUCCESSFULLY!");
    console.log("📝 TX:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    console.log("📬 Recipient now has", ethers.formatEther(amount), "WBNB");

    console.log("\n🎉 CHECK YOUR WALLET!");
    console.log("1. Open MetaMask");
    console.log("2. Switch to Nor Chain");
    console.log("3. Import WBNB token:", process.env.WBNB_TOKEN_XAHEEN);
    console.log("4. You should see: 0.00998 WBNB");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("Already processed")) {
      console.log("This deposit was already processed!");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
