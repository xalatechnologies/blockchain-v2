/**
 * Event Monitor
 *
 * Monitors Fill events from SettlementInbox on spoke chains
 */

import { ethers } from "ethers";

const SETTLEMENT_INBOX_ABI = [
  "event Fill(bytes32 indexed fillId, address indexed trader, int256 xhtDelta, uint256 cashDelta, uint256 nonce, uint256 timestamp)",
  "function isFillProcessed(bytes32 fillId) external view returns (bool)",
  "function getCurrentNonce() external view returns (uint256)",
];

export class EventMonitor {
  constructor(spokeConfig, receiptForwarder) {
    this.config = spokeConfig;
    this.receiptForwarder = receiptForwarder;
    this.provider = null;
    this.settlementInbox = null;
    this.isRunning = false;
    this.lastProcessedBlock = 0;
    this.processedFills = new Set();
    this.stats = {
      eventsDetected: 0,
      eventsForwarded: 0,
      eventsFailed: 0,
      lastEventTime: null,
    };
  }

  async initialize() {
    // Connect to spoke chain
    this.provider = new ethers.JsonRpcProvider(this.config.rpc);

    // Get current block
    this.lastProcessedBlock = await this.provider.getBlockNumber();

    // Connect to SettlementInbox contract
    this.settlementInbox = new ethers.Contract(
      this.config.settlementInboxAddress,
      SETTLEMENT_INBOX_ABI,
      this.provider
    );

    console.log(`   Initialized ${this.config.name} monitor`);
    console.log(`   Starting from block: ${this.lastProcessedBlock}`);
    console.log(`   Confirmations required: ${this.config.requiredConfirmations}`);
  }

  async start() {
    this.isRunning = true;

    // Start polling for new events
    this.pollInterval = setInterval(
      () => this.pollForEvents(),
      this.config.pollIntervalMs || 5000
    );

    // Also listen to real-time events (as backup to polling)
    this.setupEventListener();
  }

  async stop() {
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Remove event listeners
    if (this.settlementInbox) {
      this.settlementInbox.removeAllListeners();
    }
  }

  /**
   * Setup real-time event listener
   */
  setupEventListener() {
    this.settlementInbox.on("Fill", async (fillId, trader, xhtDelta, cashDelta, nonce, timestamp, event) => {
      console.log(`\n📥 New Fill event on ${this.config.name}:`);
      console.log(`   Fill ID: ${fillId}`);
      console.log(`   Trader: ${trader}`);
      console.log(`   XHT Delta: ${ethers.formatEther(xhtDelta)}`);
      console.log(`   Block: ${event.log.blockNumber}`);

      this.stats.eventsDetected++;
      this.stats.lastEventTime = new Date();

      // Wait for confirmations before processing
      await this.waitForConfirmations(event.log.blockNumber);

      // Process the fill
      await this.processFill(event);
    });
  }

  /**
   * Poll for new Fill events (more reliable than websocket)
   */
  async pollForEvents() {
    if (!this.isRunning) return;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const confirmedBlock = currentBlock - this.config.requiredConfirmations;

      if (confirmedBlock <= this.lastProcessedBlock) {
        return; // No new confirmed blocks
      }

      // Query events from last processed to confirmed block
      const events = await this.settlementInbox.queryFilter(
        "Fill",
        this.lastProcessedBlock + 1,
        confirmedBlock
      );

      if (events.length > 0) {
        console.log(`\n📥 Found ${events.length} confirmed Fill events on ${this.config.name}`);

        for (const event of events) {
          await this.processFill(event);
        }
      }

      this.lastProcessedBlock = confirmedBlock;
    } catch (error) {
      console.error(`❌ Error polling ${this.config.name}:`, error.message);
    }
  }

  /**
   * Wait for required confirmations
   */
  async waitForConfirmations(eventBlock) {
    const targetBlock = eventBlock + this.config.requiredConfirmations;

    while (this.isRunning) {
      const currentBlock = await this.provider.getBlockNumber();

      if (currentBlock >= targetBlock) {
        console.log(`   ✅ ${this.config.requiredConfirmations} confirmations reached`);
        return;
      }

      // Wait for next block
      const blocksToWait = targetBlock - currentBlock;
      const waitTime = blocksToWait * this.config.blockTime;
      console.log(`   ⏳ Waiting for ${blocksToWait} more blocks (~${Math.round(waitTime / 1000)}s)...`);

      await new Promise((resolve) => setTimeout(resolve, this.config.blockTime));
    }
  }

  /**
   * Process a Fill event
   */
  async processFill(event) {
    const [fillId, trader, xhtDelta, cashDelta, nonce, timestamp] = event.args;

    // Check if already processed
    if (this.processedFills.has(fillId)) {
      console.log(`   ⏭️  Already processed fill ${fillId}`);
      return;
    }

    console.log(`\n🔄 Processing fill ${fillId} on ${this.config.name}...`);

    try {
      // Get signed quote from the transaction
      const tx = await event.getTransaction();
      const receipt = await event.getTransactionReceipt();

      // Extract quote from transaction data (if available)
      // In production, you'd parse the transaction input data
      const signedQuote = "0x"; // Placeholder

      // Build fill receipt
      const fillReceipt = {
        fillId,
        chainId: this.config.chainId,
        trader,
        xhtDelta,
        proceeds: cashDelta,
        timestamp,
        nonce,
        signature: "0x", // Will be signed by relayer
        signedQuote,
      };

      // Forward to SettlementHub
      const success = await this.receiptForwarder.forwardReceipt(fillReceipt);

      if (success) {
        this.processedFills.add(fillId);
        this.stats.eventsForwarded++;
        console.log(`   ✅ Receipt forwarded successfully`);
      } else {
        this.stats.eventsFailed++;
        console.log(`   ❌ Failed to forward receipt`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing fill:`, error.message);
      this.stats.eventsFailed++;
    }
  }

  /**
   * Get monitor status
   */
  getStatus() {
    return {
      chainId: this.config.chainId,
      name: this.config.name,
      isRunning: this.isRunning,
      lastProcessedBlock: this.lastProcessedBlock,
      stats: this.stats,
    };
  }
}
