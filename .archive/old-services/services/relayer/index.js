/**
 * Nor Cross-Chain Relayer Service
 *
 * Purpose: Monitor Fill events from spoke chains and forward to SettlementHub
 *
 * Flow:
 * 1. Listen to Fill events from SettlementInbox on each spoke
 * 2. Wait for N confirmations (finality)
 * 3. Sign receipt and forward to SettlementHub on Nor
 * 4. Retry on failure with exponential backoff
 */

import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { EventMonitor } from "./src/EventMonitor.js";
import { ReceiptForwarder } from "./src/ReceiptForwarder.js";
import { config } from "./src/config.js";

dotenvConfig({ path: "../../.env" });

class RelayerService {
  constructor() {
    this.eventMonitors = new Map();
    this.receiptForwarder = null;
    this.isRunning = false;
  }

  async start() {
    console.log("🔗 Nor Cross-Chain Relayer Starting...\n");

    // Initialize receipt forwarder (sends to SettlementHub)
    this.receiptForwarder = new ReceiptForwarder(config);
    await this.receiptForwarder.initialize();

    // Start monitoring each spoke chain
    for (const spoke of config.spokes) {
      console.log(`📡 Starting monitor for ${spoke.name}...`);

      const monitor = new EventMonitor(spoke, this.receiptForwarder);
      await monitor.initialize();
      await monitor.start();

      this.eventMonitors.set(spoke.chainId, monitor);
      console.log(`✅ ${spoke.name} monitor active`);
    }

    this.isRunning = true;
    console.log(`\n✅ Relayer service running`);
    console.log(`📊 Monitoring ${config.spokes.length} spoke chains`);
    console.log(`🎯 Target: ${config.xaheenChain.settlementHubAddress}`);
    console.log();
  }

  async stop() {
    console.log("\n🛑 Stopping relayer service...");
    this.isRunning = false;

    // Stop all monitors
    for (const [chainId, monitor] of this.eventMonitors) {
      await monitor.stop();
      console.log(`✅ Stopped monitor for chain ${chainId}`);
    }

    console.log("✅ Relayer service stopped");
  }

  getStatus() {
    const status = {
      running: this.isRunning,
      monitors: {},
    };

    for (const [chainId, monitor] of this.eventMonitors) {
      status.monitors[chainId] = monitor.getStatus();
    }

    return status;
  }
}

// Start the relayer
const relayer = new RelayerService();

// Graceful shutdown
process.on("SIGINT", async () => {
  await relayer.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await relayer.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

relayer.start().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
