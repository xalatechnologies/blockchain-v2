#!/usr/bin/env node

/**
 * Cross-Chain Swap Validator Service
 *
 * Monitors BSC for swap requests and executes them on NorChain
 *
 * Flow:
 * 1. Listen for SwapRequested events on BSC
 * 2. Bridge tokens BSC → NorChain
 * 3. Execute swap on NoorSwap (NorChain)
 * 4. Bridge result NorChain → BSC
 * 5. Complete swap on BSC
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenvConfig({ path: '../../.env' });

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Configuration
const CONFIG = {
  bsc: {
    rpc: process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed.binance.org',
    chainId: 56,
    contracts: {
      crossChainRouter: '0x5B5F78D3743319698cdf5613DEe64869f2a3526c',
      norBridge: '0x75dc5817e128a60920964Ff12Bcc17480c8e57B1',  // UPDATED: V2 bridge with real mint
      btcbrBridge: '0x1A2651144788544222544FcC0109DECCE60AD1A6'
    }
  },
  norChain: {
    rpc: process.env.PRIVATE_CHAIN_RPC || 'https://rpc.norchain.org',
    chainId: 65001,
    contracts: {
      norChainHandler: '0xFfbD6d56d310582e514B0FA62cEd9809f96Bf90c',
      noorSwapRouter: '0x0cf8e180350253271f4b917ccfb0accc4862f265',
      norBridge: '0xe447647577cc340B0D853F9A8F052E9BF5D673c1'  // UPDATED: New NorChain bridge
    }
  },
  validator: {
    privateKey: process.env.MAIN_WALLET_PRIVATE_KEY
  }
};

// Providers
const bscProvider = new ethers.JsonRpcProvider(CONFIG.bsc.rpc);
const norProvider = new ethers.JsonRpcProvider(CONFIG.norChain.rpc);

// Wallets
const bscWallet = new ethers.Wallet(CONFIG.validator.privateKey, bscProvider);
const norWallet = new ethers.Wallet(CONFIG.validator.privateKey, norProvider);

// Load ABIs
const CROSS_CHAIN_ROUTER_ABI = [
  'event SwapRequested(uint256 indexed swapId, address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)',
  'function swapRequests(uint256 swapId) view returns (address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 timestamp, bool completed, bool cancelled)',
  'function completeSwap(uint256 swapId, uint256 amountOut) external',
  'function cancelSwap(uint256 swapId, string reason) external'
];

const NOR_CHAIN_HANDLER_ABI = [
  'function executeSwap(uint256 swapId, address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external',
  'event SwapExecuted(uint256 indexed swapId, address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)',
  'event SwapFailed(uint256 indexed swapId, address indexed user, string reason)'
];

const BRIDGE_ABI = [
  'function initiateBridge(uint256 amount, string memory destinationChain) external returns (uint256)',
  'function completeBridge(uint256 bridgeId, address user, uint256 amount, bytes32 sourceTransferId) external',
  'event BridgeInitiated(uint256 indexed bridgeId, address indexed user, uint256 amount, string destinationChain)',
  'event BridgeCompleted(uint256 indexed bridgeId, address indexed user, uint256 amount, bytes32 sourceTransferId)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)'
];

// Contract instances
const crossChainRouter = new ethers.Contract(
  CONFIG.bsc.contracts.crossChainRouter,
  CROSS_CHAIN_ROUTER_ABI,
  bscWallet
);

const norChainHandler = new ethers.Contract(
  CONFIG.norChain.contracts.norChainHandler,
  NOR_CHAIN_HANDLER_ABI,
  norWallet
);

// Bridge contract instances
const bscBridge = new ethers.Contract(
  CONFIG.bsc.contracts.norBridge,
  BRIDGE_ABI,
  bscWallet
);

const norChainBridge = new ethers.Contract(
  CONFIG.norChain.contracts.norBridge,
  BRIDGE_ABI,
  norWallet
);

// State tracking
const processedSwaps = new Set();
const pendingSwaps = new Map();

// Helper functions
function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = {
    INFO: BLUE,
    SUCCESS: GREEN,
    WARNING: YELLOW,
    ERROR: RED
  }[level] || RESET;

  console.log(`${color}[${timestamp}] [${level}]${RESET} ${message}`);
}

async function getTokenMapping(bscToken) {
  // Map BSC token addresses to NorChain addresses
  const TOKEN_MAP = {
    // NOR (UPDATED - Correct NorChain address)
    '0x7C9B26Ad3b26cAab39f9945B40B2c30309ed490E': '0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80',
    // BTCBR
    '0x03FC6dA7C9E48201b8FEC1Ca53EA62eA6514d48f': '0x0cF8e180350253271f4b917CcFb0aCCc4862F262',
    // USDT
    '0x55d398326f99059fF775485246999027B3197955': '0x55d398326f99059fF775485246999027B3197955'
  };

  return TOKEN_MAP[bscToken.toLowerCase()] || bscToken;
}

async function realBridgeTransfer(fromChain, toChain, token, amount, user) {
  /**
   * Real bridge transfer using deployed bridge contracts
   *
   * Flow:
   * 1. Lock tokens on source chain via bridge.initiateBridge()
   * 2. Get bridge ID from event
   * 3. Complete bridge on destination chain via bridge.completeBridge()
   * 4. User receives tokens on destination chain
   */

  try {
    log('INFO', `🌉 Real bridge: ${fromChain} → ${toChain}, ${ethers.formatEther(amount)} tokens`);

    if (fromChain === 'BSC' && toChain === 'NorChain') {
      // BSC → NorChain: Burn on BSC, Unlock on NorChain

      log('INFO', `  [1/3] Initiating bridge on BSC (burn)...`);

      // Note: In current implementation, tokens are transferred to bridge
      // In future, would actually burn NOR_BSC tokens
      const initTx = await bscBridge.initiateBridge(amount, 'NorChain');
      const initReceipt = await initTx.wait();

      log('SUCCESS', `  Bridge initiated on BSC: ${initTx.hash}`);

      // Parse BridgeInitiated event to get bridgeId
      const bridgeEvent = initReceipt.logs
        .map(log => {
          try {
            return bscBridge.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === 'BridgeInitiated');

      if (!bridgeEvent) {
        throw new Error('BridgeInitiated event not found');
      }

      const bridgeId = bridgeEvent.args.bridgeId;
      log('INFO', `  Bridge ID: ${bridgeId}`);

      log('INFO', `  [2/3] Completing bridge on NorChain (unlock)...`);

      // Complete bridge on NorChain - unlocks NOR tokens
      const sourceTransferId = ethers.keccak256(ethers.toUtf8Bytes(`${initTx.hash}-${bridgeId}`));
      const completeTx = await norChainBridge.completeBridge(
        bridgeId,
        user,
        amount,
        sourceTransferId
      );
      await completeTx.wait();

      log('SUCCESS', `  Bridge completed on NorChain: ${completeTx.hash}`);
      log('SUCCESS', `  User received ${ethers.formatEther(amount)} NOR on NorChain`);

      return { success: true, bridgeId, sourceTx: initTx.hash, destTx: completeTx.hash };

    } else if (fromChain === 'NorChain' && toChain === 'BSC') {
      // NorChain → BSC: Lock on NorChain, Mint on BSC

      log('INFO', `  [1/3] Initiating bridge on NorChain (lock)...`);

      const initTx = await norChainBridge.initiateBridge(amount, 'BSC');
      const initReceipt = await initTx.wait();

      log('SUCCESS', `  Bridge initiated on NorChain: ${initTx.hash}`);

      // Parse BridgeInitiated event
      const bridgeEvent = initReceipt.logs
        .map(log => {
          try {
            return norChainBridge.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === 'BridgeInitiated');

      if (!bridgeEvent) {
        throw new Error('BridgeInitiated event not found');
      }

      const bridgeId = bridgeEvent.args.bridgeId;
      log('INFO', `  Bridge ID: ${bridgeId}`);

      log('INFO', `  [2/3] Completing bridge on BSC (mint)...`);

      // Complete bridge on BSC - mints NOR_BSC tokens
      const sourceTransferId = ethers.keccak256(ethers.toUtf8Bytes(`${initTx.hash}-${bridgeId}`));
      const completeTx = await bscBridge.completeBridge(
        bridgeId,
        user,
        amount,
        sourceTransferId
      );
      await completeTx.wait();

      log('SUCCESS', `  Bridge completed on BSC: ${completeTx.hash}`);
      log('SUCCESS', `  User received ${ethers.formatEther(amount)} NOR on BSC`);

      return { success: true, bridgeId, sourceTx: initTx.hash, destTx: completeTx.hash };

    } else {
      throw new Error(`Unsupported bridge route: ${fromChain} → ${toChain}`);
    }

  } catch (error) {
    log('ERROR', `Bridge transfer failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function handleSwapRequest(swapId, user, tokenIn, tokenOut, amountIn, minAmountOut) {
  const startTime = Date.now();

  try {
    log('INFO', `========================================`);
    log('INFO', `Processing Swap Request #${swapId}`);
    log('INFO', `User: ${user}`);
    log('INFO', `Swap: ${ethers.formatEther(amountIn)} ${tokenIn.slice(0, 10)}... → ${tokenOut.slice(0, 10)}...`);
    log('INFO', `Min Output: ${ethers.formatEther(minAmountOut)}`);

    // Check if already processed
    if (processedSwaps.has(swapId.toString())) {
      log('WARNING', `Swap ${swapId} already processed, skipping`);
      return;
    }

    // Mark as processing
    processedSwaps.add(swapId.toString());
    pendingSwaps.set(swapId.toString(), {
      user,
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      startTime: Date.now()
    });

    // Step 1: Bridge tokens from BSC to NorChain
    log('INFO', `[1/4] Bridging tokens BSC → NorChain...`);
    const norTokenIn = await getTokenMapping(tokenIn);
    const bridgeResult = await realBridgeTransfer('BSC', 'NorChain', tokenIn, amountIn, user);

    if (!bridgeResult.success) {
      throw new Error(`Bridge transfer failed: ${bridgeResult.error}`);
    }

    log('SUCCESS', `Tokens bridged to NorChain (Bridge ID: ${bridgeResult.bridgeId})`);

    // Step 2: Execute swap on NorChain
    log('INFO', `[2/4] Executing swap on NoorSwap...`);
    const norTokenOut = await getTokenMapping(tokenOut);

    const swapTx = await norChainHandler.executeSwap(
      swapId,
      user,
      norTokenIn,
      norTokenOut,
      amountIn,
      minAmountOut
    );

    log('INFO', `Swap transaction sent: ${swapTx.hash}`);
    const swapReceipt = await swapTx.wait();
    log('SUCCESS', `Swap executed on NorChain (block ${swapReceipt.blockNumber})`);

    // Parse swap result to get actual output amount
    const swapEvent = swapReceipt.logs
      .map(log => {
        try {
          return norChainHandler.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event && event.name === 'SwapExecuted');

    if (!swapEvent) {
      throw new Error('Swap execution event not found');
    }

    const amountOut = swapEvent.args.amountOut;
    log('SUCCESS', `Swap output: ${ethers.formatEther(amountOut)} tokens`);

    // Step 3: Bridge result back to BSC
    log('INFO', `[3/4] Bridging result NorChain → BSC...`);
    const bridgeBackResult = await realBridgeTransfer('NorChain', 'BSC', tokenOut, amountOut, user);

    if (!bridgeBackResult.success) {
      throw new Error(`Bridge back failed: ${bridgeBackResult.error}`);
    }

    log('SUCCESS', `Tokens bridged back to BSC (Bridge ID: ${bridgeBackResult.bridgeId})`);

    // Step 4: Complete swap on BSC
    log('INFO', `[4/4] Completing swap on BSC...`);
    const completeTx = await crossChainRouter.completeSwap(swapId, amountOut);
    log('INFO', `Complete transaction sent: ${completeTx.hash}`);
    const completeReceipt = await completeTx.wait();
    log('SUCCESS', `Swap completed on BSC (block ${completeReceipt.blockNumber})`);

    // Clean up
    pendingSwaps.delete(swapId.toString());

    const elapsed = (Date.now() - startTime) / 1000;
    log('SUCCESS', `========================================`);
    log('SUCCESS', `Swap #${swapId} COMPLETE in ${elapsed.toFixed(1)}s`);
    log('SUCCESS', `User received: ${ethers.formatEther(amountOut)} tokens`);
    log('SUCCESS', `========================================`);

  } catch (error) {
    log('ERROR', `Swap ${swapId} failed: ${error.message}`);

    // Attempt to cancel and refund
    try {
      log('INFO', `Attempting to cancel swap ${swapId}...`);
      const cancelTx = await crossChainRouter.cancelSwap(swapId, error.message);
      await cancelTx.wait();
      log('SUCCESS', `Swap ${swapId} cancelled, user refunded`);
    } catch (cancelError) {
      log('ERROR', `Failed to cancel swap ${swapId}: ${cancelError.message}`);
    }

    pendingSwaps.delete(swapId.toString());
  }
}

async function startService() {
  log('INFO', `========================================`);
  log('INFO', `Cross-Chain Swap Validator Service`);
  log('INFO', `========================================`);
  log('INFO', ``);
  log('INFO', `Configuration:`);
  log('INFO', `  BSC RPC: ${CONFIG.bsc.rpc}`);
  log('INFO', `  NorChain RPC: ${CONFIG.norChain.rpc}`);
  log('INFO', `  Validator: ${bscWallet.address}`);
  log('INFO', ``);
  log('INFO', `Contracts:`);
  log('INFO', `  CrossChainRouter (BSC): ${CONFIG.bsc.contracts.crossChainRouter}`);
  log('INFO', `  NorChainHandler (NorChain): ${CONFIG.norChain.contracts.norChainHandler}`);
  log('INFO', ``);

  // Check balances
  const bscBalance = await bscProvider.getBalance(bscWallet.address);
  const norBalance = await norProvider.getBalance(norWallet.address);

  log('INFO', `Balances:`);
  log('INFO', `  BSC: ${ethers.formatEther(bscBalance)} BNB`);
  log('INFO', `  NorChain: ${ethers.formatEther(norBalance)} NOR`);
  log('INFO', ``);

  if (bscBalance < ethers.parseEther('0.01')) {
    log('WARNING', `Low BSC balance! Please fund with BNB`);
  }

  if (norBalance < ethers.parseEther('100')) {
    log('WARNING', `Low NorChain balance! Please fund with NOR`);
  }

  // Set up event listener
  log('INFO', `Setting up event listeners...`);

  crossChainRouter.on('SwapRequested', async (swapId, user, tokenIn, tokenOut, amountIn, minAmountOut, event) => {
    log('INFO', ``);
    log('INFO', `🔔 NEW SWAP REQUEST DETECTED`);

    await handleSwapRequest(swapId, user, tokenIn, tokenOut, amountIn, minAmountOut);
  });

  // Bridge event listeners for direct bridge transfers (not swaps)
  norChainBridge.on('BridgeInitiated', async (bridgeId, user, amount, destinationChain, event) => {
    log('INFO', ``);
    log('INFO', `🌉 BRIDGE REQUEST: NorChain → BSC`);
    log('INFO', `  Bridge ID: ${bridgeId}`);
    log('INFO', `  User: ${user}`);
    log('INFO', `  Amount: ${ethers.formatEther(amount)} NOR`);

    try {
      // Complete bridge on BSC (mint NOR_BSC)
      const tx = event.log.transactionHash;
      const sourceTransferId = ethers.keccak256(ethers.toUtf8Bytes(`${tx}-${bridgeId}`));

      log('INFO', `  Completing bridge on BSC...`);
      const completeTx = await bscBridge.completeBridge(bridgeId, user, amount, sourceTransferId);
      await completeTx.wait();

      log('SUCCESS', `✅ Bridge completed! ${ethers.formatEther(amount)} NOR_BSC minted on BSC`);
    } catch (error) {
      log('ERROR', `Failed to complete bridge: ${error.message}`);
    }
  });

  bscBridge.on('BridgeInitiated', async (bridgeId, user, amount, destinationChain, event) => {
    log('INFO', ``);
    log('INFO', `🌉 BRIDGE REQUEST: BSC → NorChain`);
    log('INFO', `  Bridge ID: ${bridgeId}`);
    log('INFO', `  User: ${user}`);
    log('INFO', `  Amount: ${ethers.formatEther(amount)} NOR`);

    try {
      // Complete bridge on NorChain (unlock NOR)
      const tx = event.log.transactionHash;
      const sourceTransferId = ethers.keccak256(ethers.toUtf8Bytes(`${tx}-${bridgeId}`));

      log('INFO', `  Completing bridge on NorChain...`);
      const completeTx = await norChainBridge.completeBridge(bridgeId, user, amount, sourceTransferId);
      await completeTx.wait();

      log('SUCCESS', `✅ Bridge completed! ${ethers.formatEther(amount)} NOR unlocked on NorChain`);
    } catch (error) {
      log('ERROR', `Failed to complete bridge: ${error.message}`);
    }
  });

  log('SUCCESS', `Event listeners active (swaps + bridges)!`);
  log('INFO', ``);
  log('SUCCESS', `========================================`);
  log('SUCCESS', `SERVICE RUNNING - Waiting for swaps...`);
  log('SUCCESS', `========================================`);
  log('INFO', ``);

  // Keep alive
  setInterval(async () => {
    const bscBlock = await bscProvider.getBlockNumber();
    const norBlock = await norProvider.getBlockNumber();
    log('INFO', `Heartbeat - BSC: ${bscBlock}, NorChain: ${norBlock}, Pending: ${pendingSwaps.size}`);
  }, 60000); // Every minute
}

// Error handling
process.on('uncaughtException', (error) => {
  log('ERROR', `Uncaught exception: ${error.message}`);
  log('ERROR', error.stack);
});

process.on('unhandledRejection', (error) => {
  log('ERROR', `Unhandled rejection: ${error.message}`);
  log('ERROR', error.stack);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('INFO', '');
  log('INFO', 'Shutting down gracefully...');
  log('INFO', `Pending swaps: ${pendingSwaps.size}`);
  process.exit(0);
});

// Start the service
startService().catch((error) => {
  log('ERROR', `Failed to start service: ${error.message}`);
  process.exit(1);
});
