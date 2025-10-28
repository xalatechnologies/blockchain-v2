const { ethers } = require("ethers");
const crypto = require("crypto");

/**
 * Atomic Swap Helper Library
 * Utilities for managing trustless P2P token swaps
 */

class AtomicSwapHelper {
  /**
   * Generate secret and hash for atomic swap
   * @returns {{secret: string, secretHash: string}}
   */
  static generateSecret() {
    const secret = "0x" + crypto.randomBytes(32).toString("hex");
    const secretHash = ethers.utils.keccak256(secret);

    console.log("🔐 Secret Generated");
    console.log("  Secret:", secret);
    console.log("  Hash:", secretHash);
    console.log("⚠️  KEEP SECRET SAFE! Share only the hash!");

    return { secret, secretHash };
  }

  /**
   * Generate swap ID from parameters
   * Must be identical on both chains for matching
   */
  static generateSwapId(initiator, participant, amount, secretHash, nonce) {
    const swapId = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [initiator, participant, amount, secretHash, nonce]
      )
    );

    console.log("🆔 Swap ID Generated:", swapId);
    return swapId;
  }

  /**
   * Calculate timelock timestamp
   * @param {number} hours Hours from now
   */
  static getTimelock(hours = 24) {
    const timelock = Math.floor(Date.now() / 1000) + hours * 3600;
    const date = new Date(timelock * 1000);

    console.log(`⏰ Timelock: ${hours}h (expires ${date.toLocaleString()})`);
    return timelock;
  }

  /**
   * Initiate atomic swap
   */
  static async initiateSwap(
    contract,
    btcbrContract,
    participant,
    amount,
    secretHash,
    timelockHours = 24
  ) {
    const signer = contract.signer;
    const initiator = await signer.getAddress();
    const nonce = Math.floor(Math.random() * 1000000);

    // Generate swap ID
    const swapId = this.generateSwapId(
      initiator,
      participant,
      amount,
      secretHash,
      nonce
    );

    // Calculate timelock
    const timelock = this.getTimelock(timelockHours);

    console.log("\n📝 Initiating Swap...");
    console.log("  Initiator:", initiator);
    console.log("  Participant:", participant);
    console.log("  Amount:", ethers.utils.formatEther(amount), "BTCBR");
    console.log("  Secret Hash:", secretHash);
    console.log("  Timelock:", timelockHours, "hours");

    // Approve tokens
    console.log("\n✅ Approving tokens...");
    const approveTx = await btcbrContract.approve(contract.address, amount);
    await approveTx.wait();
    console.log("  Approved!");

    // Create swap
    console.log("\n🔒 Creating swap...");
    const tx = await contract.initiate(
      swapId,
      participant,
      btcbrContract.address,
      amount,
      secretHash,
      timelock
    );

    console.log("  Transaction:", tx.hash);
    const receipt = await tx.wait();
    console.log("  ✅ Swap Created! Gas used:", receipt.gasUsed.toString());

    return {
      swapId,
      nonce,
      timelock,
      transaction: tx.hash,
    };
  }

  /**
   * Complete swap by revealing secret
   */
  static async completeSwap(contract, swapId, secret) {
    const signer = contract.signer;
    const participant = await signer.getAddress();

    console.log("\n🎯 Completing Swap...");
    console.log("  Swap ID:", swapId);
    console.log("  Participant:", participant);
    console.log("  Secret:", secret);

    // Verify secret hash matches
    const swap = await contract.swaps(swapId);
    const computedHash = ethers.utils.keccak256(secret);

    if (computedHash !== swap.secretHash) {
      throw new Error("Secret does not match hash!");
    }

    console.log("  ✅ Secret verified!");

    // Complete swap
    const tx = await contract.complete(swapId, secret);
    console.log("  Transaction:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Swap Completed! Gas used:", receipt.gasUsed.toString());

    return receipt;
  }

  /**
   * Refund swap after timelock
   */
  static async refundSwap(contract, swapId) {
    const signer = contract.signer;
    const initiator = await signer.getAddress();

    console.log("\n🔄 Refunding Swap...");
    console.log("  Swap ID:", swapId);
    console.log("  Initiator:", initiator);

    // Check if refundable
    const swap = await contract.swaps(swapId);
    const now = Math.floor(Date.now() / 1000);

    if (now < swap.timelock) {
      throw new Error(
        `Timelock not expired! Wait until ${new Date(swap.timelock * 1000)}`
      );
    }

    // Refund
    const tx = await contract.refund(swapId);
    console.log("  Transaction:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Refunded! Gas used:", receipt.gasUsed.toString());

    return receipt;
  }

  /**
   * Get swap details
   */
  static async getSwapDetails(contract, swapId) {
    const swap = await contract.swaps(swapId);
    const isActive = await contract.isActive(swapId);
    const isCompletable = await contract.isCompletable(swapId);
    const isRefundable = await contract.isRefundable(swapId);

    const states = ["EMPTY", "OPEN", "COMPLETED", "REFUNDED", "EXPIRED"];

    console.log("\n📊 Swap Details");
    console.log("  Swap ID:", swapId);
    console.log("  Initiator:", swap.initiator);
    console.log("  Participant:", swap.participant);
    console.log("  Token:", swap.token);
    console.log("  Amount:", ethers.utils.formatEther(swap.amount), "BTCBR");
    console.log("  Secret Hash:", swap.secretHash);
    console.log("  Timelock:", new Date(swap.timelock * 1000).toLocaleString());
    console.log("  State:", states[swap.state]);
    console.log("  Active:", isActive);
    console.log("  Completable:", isCompletable);
    console.log("  Refundable:", isRefundable);

    return {
      initiator: swap.initiator,
      participant: swap.participant,
      token: swap.token,
      amount: swap.amount,
      secretHash: swap.secretHash,
      timelock: swap.timelock,
      state: states[swap.state],
      isActive,
      isCompletable,
      isRefundable,
    };
  }

  /**
   * Monitor swap for secret revelation
   */
  static async monitorSwap(contract, swapId, callback) {
    console.log("\n👀 Monitoring swap for secret...");
    console.log("  Swap ID:", swapId);

    // Listen for completion event
    const filter = contract.filters.SwapCompleted(swapId);

    contract.on(filter, (id, participant, secret, event) => {
      console.log("\n🎉 Secret Revealed!");
      console.log("  Secret:", secret);
      console.log("  Revealed by:", participant);
      console.log("  Block:", event.blockNumber);

      if (callback) callback(secret);
    });

    console.log("  Listening...");
  }
}

// Export for use in other scripts
module.exports = AtomicSwapHelper;

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "generate-secret":
      AtomicSwapHelper.generateSecret();
      break;

    case "help":
    default:
      console.log(`
Atomic Swap Helper - CLI Usage

Commands:
  node atomic-swap-helper.js generate-secret
      Generate a new secret and hash for atomic swap
      
  node atomic-swap-helper.js help
      Show this help message

Examples:
  # Generate secret
  node atomic-swap-helper.js generate-secret
  
  # Use in script
  const AtomicSwapHelper = require('./atomic-swap-helper.js');
  const { secret, secretHash } = AtomicSwapHelper.generateSecret();
            `);
      break;
  }
}
