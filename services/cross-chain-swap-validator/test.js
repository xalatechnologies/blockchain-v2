#!/usr/bin/env node

/**
 * Test Script for Cross-Chain Swap
 *
 * Simulates a user requesting a swap from BSC
 */

import { ethers } from 'ethers';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '../../.env' });

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Configuration
const BSC_RPC = process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed.binance.org';
const PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

const CROSS_CHAIN_ROUTER = '0x5B5F78D3743319698cdf5613DEe64869f2a3526c';

// Token addresses on BSC
const NOR_BSC = '0xF8960797C34D8712d1523FfE9Fc9e3557aD3Ff97';
const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955';

const CROSS_CHAIN_ROUTER_ABI = [
  'function swapViaNorChain(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256 swapId)',
  'function swapRequests(uint256 swapId) view returns (address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint256 timestamp, bool completed, bool cancelled)',
  'event SwapRequested(uint256 indexed swapId, address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

async function testSwap() {
  console.log(`${BLUE}========================================${RESET}`);
  console.log(`${BLUE}Cross-Chain Swap Test${RESET}`);
  console.log(`${BLUE}========================================${RESET}\n`);

  // Setup
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`${BLUE}Configuration:${RESET}`);
  console.log(`  User: ${wallet.address}`);
  console.log(`  BSC RPC: ${BSC_RPC}`);
  console.log(`  Router: ${CROSS_CHAIN_ROUTER}\n`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`${BLUE}Wallet Balance:${RESET}`);
  console.log(`  BNB: ${ethers.formatEther(balance)}\n`);

  // Get token contracts
  const tokenIn = new ethers.Contract(USDT_BSC, ERC20_ABI, wallet);
  const tokenOut = new ethers.Contract(NOR_BSC, ERC20_ABI, wallet);
  const router = new ethers.Contract(CROSS_CHAIN_ROUTER, CROSS_CHAIN_ROUTER_ABI, wallet);

  // Get token info
  const symbolIn = await tokenIn.symbol();
  const symbolOut = await tokenOut.symbol();
  const decimalsIn = await tokenIn.decimals();

  console.log(`${BLUE}Swap Details:${RESET}`);
  console.log(`  From: ${symbolIn} (${USDT_BSC})`);
  console.log(`  To: ${symbolOut} (${NOR_BSC})\n`);

  // Check token balance
  const tokenBalance = await tokenIn.balanceOf(wallet.address);
  console.log(`${BLUE}Token Balance:${RESET}`);
  console.log(`  ${symbolIn}: ${ethers.formatUnits(tokenBalance, decimalsIn)}\n`);

  if (tokenBalance < ethers.parseUnits('10', decimalsIn)) {
    console.log(`${YELLOW}⚠️  WARNING: Insufficient ${symbolIn} balance for test${RESET}`);
    console.log(`${YELLOW}   This is a dry-run test - no actual swap will execute${RESET}\n`);
  }

  // Swap parameters
  const amountIn = ethers.parseUnits('10', decimalsIn); // 10 USDT
  const minAmountOut = ethers.parseEther('0.95'); // Expect ~1 NOR with 5% slippage

  console.log(`${BLUE}Swap Parameters:${RESET}`);
  console.log(`  Amount In: ${ethers.formatUnits(amountIn, decimalsIn)} ${symbolIn}`);
  console.log(`  Min Amount Out: ${ethers.formatEther(minAmountOut)} ${symbolOut}\n`);

  try {
    // Step 1: Approve router
    console.log(`${BLUE}[1/3] Approving router to spend ${symbolIn}...${RESET}`);
    const approveTx = await tokenIn.approve(CROSS_CHAIN_ROUTER, amountIn);
    console.log(`  Transaction: ${approveTx.hash}`);
    await approveTx.wait();
    console.log(`${GREEN}✅ Approval confirmed${RESET}\n`);

    // Step 2: Request swap
    console.log(`${BLUE}[2/3] Requesting cross-chain swap...${RESET}`);
    const swapTx = await router.swapViaNorChain(
      USDT_BSC,
      NOR_BSC,
      amountIn,
      minAmountOut
    );
    console.log(`  Transaction: ${swapTx.hash}`);
    const receipt = await swapTx.wait();
    console.log(`${GREEN}✅ Swap request submitted (block ${receipt.blockNumber})${RESET}\n`);

    // Parse event to get swap ID
    const event = receipt.logs
      .map(log => {
        try {
          return router.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e && e.name === 'SwapRequested');

    if (!event) {
      throw new Error('SwapRequested event not found');
    }

    const swapId = event.args.swapId;
    console.log(`${GREEN}✅ Swap ID: ${swapId}${RESET}\n`);

    // Step 3: Monitor swap status
    console.log(`${BLUE}[3/3] Monitoring swap status...${RESET}`);
    console.log(`${YELLOW}⏳ Waiting for validator to process swap...${RESET}\n`);

    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 * 10 seconds = 5 minutes

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const swapRequest = await router.swapRequests(swapId);
      completed = swapRequest.completed;

      attempts++;
      process.stdout.write(`\r  Attempt ${attempts}/${maxAttempts}... `);

      if (completed) {
        console.log(`\n${GREEN}✅ Swap completed!${RESET}\n`);
        break;
      }

      if (swapRequest.cancelled) {
        console.log(`\n${RED}❌ Swap cancelled${RESET}\n`);
        break;
      }
    }

    if (!completed && attempts >= maxAttempts) {
      console.log(`\n${YELLOW}⏱️  Timeout waiting for swap completion${RESET}`);
      console.log(`${YELLOW}   Check validator service logs for details${RESET}\n`);
    }

    // Summary
    console.log(`${BLUE}========================================${RESET}`);
    console.log(`${GREEN}Test Complete${RESET}`);
    console.log(`${BLUE}========================================${RESET}\n`);

    console.log(`${BLUE}Next Steps:${RESET}`);
    console.log(`  1. Check validator service logs`);
    console.log(`  2. Verify swap execution on NorChain`);
    console.log(`  3. Check user's ${symbolOut} balance on BSC\n`);

  } catch (error) {
    console.log(`\n${RED}❌ Error: ${error.message}${RESET}`);
    if (error.data) {
      console.log(`${RED}   Data: ${error.data}${RESET}`);
    }
    console.log(`\n${RED}Test failed!${RESET}\n`);
    process.exit(1);
  }
}

// Run test
testSwap().catch((error) => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});
