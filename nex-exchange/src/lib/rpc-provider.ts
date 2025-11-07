import { ethers } from "ethers";

/**
 * RPC Provider Configuration
 * 
 * We use both HTTP and WebSocket:
 * - HTTP: For transactions and queries (wagmi handles this)
 * - WebSocket: For real-time subscriptions (blocks, events, logs)
 */

const NORCHAIN_RPC_HTTP = process.env.NEXT_PUBLIC_NORCHAIN_RPC || "https://rpc.norchain.org";
const NORCHAIN_RPC_WS = process.env.NEXT_PUBLIC_NORCHAIN_WS || "wss://ws.norchain.org:8546";

// HTTP Provider (for transactions and queries)
let httpProvider: ethers.JsonRpcProvider | null = null;

// WebSocket Provider (for real-time subscriptions)
let wsProvider: ethers.WebSocketProvider | null = null;

/**
 * Get HTTP RPC provider (singleton)
 */
export function getHttpProvider(): ethers.JsonRpcProvider {
  if (!httpProvider) {
    httpProvider = new ethers.JsonRpcProvider(NORCHAIN_RPC_HTTP, {
      name: "NorChain",
      chainId: 65001,
    });
  }
  return httpProvider;
}

/**
 * Get WebSocket provider (singleton)
 * Use for real-time subscriptions: blocks, events, logs
 */
export function getWsProvider(): ethers.WebSocketProvider {
  if (!wsProvider) {
    wsProvider = new ethers.WebSocketProvider(NORCHAIN_RPC_WS, {
      name: "NorChain",
      chainId: 65001,
    });

    // Handle connection errors
    wsProvider.websocket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    wsProvider.websocket.addEventListener("close", () => {
      console.warn("WebSocket closed, reconnecting...");
      wsProvider = null; // Reset to allow reconnection
    });
  }
  return wsProvider;
}

/**
 * Subscribe to new blocks
 */
export async function subscribeToBlocks(
  callback: (blockNumber: number) => void
): Promise<() => void> {
  const provider = getWsProvider();
  
  // Subscribe to new blocks
  const subscriptionId = await provider.send("eth_subscribe", ["newHeads"]);
  
  // Listen for block updates
  provider.on("block", (blockNumber) => {
    callback(blockNumber);
  });

  // Return unsubscribe function
  return async () => {
    await provider.send("eth_unsubscribe", [subscriptionId]);
  };
}

/**
 * Subscribe to contract events
 */
export async function subscribeToEvents(
  contractAddress: string,
  eventSignature: string,
  callback: (log: ethers.Log) => void
): Promise<() => void> {
  const provider = getWsProvider();
  
  // Create filter
  const filter = {
    address: contractAddress,
    topics: [ethers.id(eventSignature)],
  };

  // Subscribe to logs
  const subscriptionId = await provider.send("eth_subscribe", [
    "logs",
    filter,
  ]);

  // Listen for events
  provider.on(filter, (log) => {
    callback(log);
  });

  // Return unsubscribe function
  return async () => {
    await provider.send("eth_unsubscribe", [subscriptionId]);
  };
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber(): Promise<number> {
  const provider = getHttpProvider();
  return await provider.getBlockNumber();
}

/**
 * Get block by number
 */
export async function getBlock(blockNumber: number): Promise<ethers.Block | null> {
  const provider = getHttpProvider();
  return await provider.getBlock(blockNumber);
}

/**
 * Cleanup providers (for testing)
 */
export function cleanupProviders(): void {
  if (wsProvider) {
    try {
      wsProvider.destroy?.();
    } catch (error) {
      // Ignore cleanup errors
    }
    wsProvider = null;
  }
  httpProvider = null;
}

