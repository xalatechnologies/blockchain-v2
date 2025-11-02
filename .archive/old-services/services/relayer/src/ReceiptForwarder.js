/**
 * Receipt Forwarder
 *
 * Forwards fill receipts to SettlementHub on Xaheen Chain
 */

import { ethers } from "ethers";

const SETTLEMENT_HUB_ABI = [
  "function acknowledgeFill((bytes32 fillId, uint64 chainId, address trader, int256 xhtDelta, uint256 proceeds, uint256 timestamp, uint256 nonce, bytes signature, bytes signedQuote) receipt) external",
  "function batchAcknowledgeFills((bytes32 fillId, uint64 chainId, address trader, int256 xhtDelta, uint256 proceeds, uint256 timestamp, uint256 nonce, bytes signature, bytes signedQuote)[] receipts) external",
  "function isFillProcessed(bytes32 fillId) external view returns (bool)",
];

const PRICE_AUTHORITY_ABI = [
  "function currentQuote() external view returns (uint256 price, uint256 timestamp)",
  "function quoteSigner() external view returns (address)",
];

export class ReceiptForwarder {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.wallet = null;
    this.settlementHub = null;
    this.priceAuthority = null;
    this.pendingReceipts = [];
    this.stats = {
      receiptsForwarded: 0,
      receiptsFailed: 0,
      batchesSubmitted: 0,
    };
  }

  async initialize() {
    console.log("📤 Initializing Receipt Forwarder...");

    // Connect to Xaheen
    this.provider = new ethers.JsonRpcProvider(this.config.xaheenChain.rpc);

    // Create wallet
    if (!this.config.wallet.privateKey) {
      throw new Error("No relayer private key configured");
    }

    this.wallet = new ethers.Wallet(this.config.wallet.privateKey, this.provider);

    // Connect to SettlementHub
    this.settlementHub = new ethers.Contract(
      this.config.xaheenChain.settlementHubAddress,
      SETTLEMENT_HUB_ABI,
      this.wallet
    );

    // Connect to PriceAuthority
    this.priceAuthority = new ethers.Contract(
      this.config.xaheenChain.priceAuthorityAddress,
      PRICE_AUTHORITY_ABI,
      this.provider
    );

    console.log(`✅ Receipt Forwarder initialized (${this.wallet.address})`);
  }

  /**
   * Forward a single receipt to SettlementHub
   */
  async forwardReceipt(receipt) {
    console.log(`\n📤 Forwarding receipt for fill ${receipt.fillId}...`);

    try {
      // Check if already processed on hub
      const isProcessed = await this.settlementHub.isFillProcessed(receipt.fillId);
      if (isProcessed) {
        console.log(`   ⏭️  Already processed on hub`);
        return true;
      }

      // Sign the receipt
      const signedReceipt = await this.signReceipt(receipt);

      // Submit to SettlementHub with retry
      const success = await this.submitWithRetry(signedReceipt);

      if (success) {
        this.stats.receiptsForwarded++;
      } else {
        this.stats.receiptsFailed++;
      }

      return success;
    } catch (error) {
      console.error(`   ❌ Error forwarding receipt:`, error.message);
      this.stats.receiptsFailed++;
      return false;
    }
  }

  /**
   * Sign a receipt with relayer's private key
   */
  async signReceipt(receipt) {
    // Create message hash
    const messageHash = ethers.solidityPackedKeccak256(
      ["bytes32", "uint64", "address", "int256", "uint256", "uint256", "uint256"],
      [
        receipt.fillId,
        receipt.chainId,
        receipt.trader,
        receipt.xhtDelta,
        receipt.proceeds,
        receipt.timestamp,
        receipt.nonce,
      ]
    );

    // Sign the message
    const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));

    return {
      ...receipt,
      signature,
    };
  }

  /**
   * Submit receipt with exponential backoff retry
   */
  async submitWithRetry(receipt, attempt = 1) {
    const maxAttempts = this.config.retry.maxAttempts;

    try {
      console.log(`   📡 Submitting to SettlementHub (attempt ${attempt}/${maxAttempts})...`);

      const tx = await this.settlementHub.acknowledgeFill(receipt, {
        gasLimit: 500000, // 500K gas limit
      });

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);

      const txReceipt = await tx.wait();

      console.log(`   ✅ Transaction confirmed in block ${txReceipt.blockNumber}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Submission failed (attempt ${attempt}):`, error.message);

      // Check if we should retry
      if (attempt < maxAttempts) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.retry.initialDelayMs * Math.pow(this.config.retry.backoffMultiplier, attempt - 1),
          this.config.retry.maxDelayMs
        );

        console.log(`   ⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.submitWithRetry(receipt, attempt + 1);
      }

      // Max attempts reached
      console.error(`   ❌ Max retry attempts (${maxAttempts}) reached`);
      return false;
    }
  }

  /**
   * Add receipt to pending batch
   */
  addToBatch(receipt) {
    this.pendingReceipts.push(receipt);

    // Auto-submit if batch is full
    if (this.pendingReceipts.length >= this.config.batchSize) {
      this.submitBatch();
    }
  }

  /**
   * Submit batch of receipts
   */
  async submitBatch() {
    if (this.pendingReceipts.length === 0) return;

    console.log(`\n📦 Submitting batch of ${this.pendingReceipts.length} receipts...`);

    try {
      // Sign all receipts
      const signedReceipts = await Promise.all(
        this.pendingReceipts.map((r) => this.signReceipt(r))
      );

      // Submit batch
      const tx = await this.settlementHub.batchAcknowledgeFills(signedReceipts, {
        gasLimit: 500000 * signedReceipts.length,
      });

      console.log(`   ⏳ Batch transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      console.log(`   ✅ Batch confirmed in block ${receipt.blockNumber}`);

      this.stats.receiptsForwarded += signedReceipts.length;
      this.stats.batchesSubmitted++;

      // Clear pending
      this.pendingReceipts = [];
    } catch (error) {
      console.error(`   ❌ Batch submission failed:`, error.message);
      this.stats.receiptsFailed += this.pendingReceipts.length;

      // Retry individual receipts
      console.log(`   🔄 Retrying receipts individually...`);
      for (const receipt of this.pendingReceipts) {
        await this.forwardReceipt(receipt);
      }

      this.pendingReceipts = [];
    }
  }

  /**
   * Get current quote from PriceAuthority
   */
  async getCurrentQuote() {
    const [price, timestamp] = await this.priceAuthority.currentQuote();
    return { price, timestamp };
  }

  /**
   * Get forwarder status
   */
  getStatus() {
    return {
      address: this.wallet.address,
      pendingReceipts: this.pendingReceipts.length,
      stats: this.stats,
    };
  }
}
