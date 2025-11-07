import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, formatResponse } from '../utils/provider.js';

const router = express.Router();

/**
 * GET /api/stats/ethsupply
 * Get total ETH/NOR supply
 */
router.get('/ethsupply', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    
    // Calculate total supply (would need to track all minted/burned tokens)
    // For now, return current block as approximation
    const result = {
      EthSupply: currentBlock.toString(), // Placeholder
      Eth2Staked: '0',
      BurntFees: '0',
      WithdrawalsTotal: '0'
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/stats/ethprice
 * Get ETH/NOR price (would integrate with price oracle)
 */
router.get('/ethprice', defaultRateLimiter, cacheMiddleware(60000), asyncHandler(async (req, res) => {
  // This would typically fetch from a price oracle or DEX
  // For now, return placeholder
  const result = {
    ethbtc: '0',
    ethbtc_timestamp: Date.now().toString(),
    ethusd: '0',
    ethusd_timestamp: Date.now().toString()
  };

  res.json(formatResponse('1', result));
}));

/**
 * GET /api/stats/chainsize
 * Get blockchain size information
 */
router.get('/chainsize', defaultRateLimiter, cacheMiddleware(60000), asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    const block = await provider.getBlock(currentBlock);

    const result = {
      chainSize: '0', // Would need to track actual chain size
      chainSizeFees: '0',
      btcChainSize: '0',
      ethChainSize: '0'
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/stats/nodecount
 * Get network node count
 */
router.get('/nodecount', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const peerCount = await provider.send('net_peerCount', []);

    const result = {
      NodeCount: parseInt(peerCount, 16).toString()
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/stats/networkstats
 * Get comprehensive network statistics
 */
router.get('/networkstats', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const [currentBlock, block, peerCount] = await Promise.all([
      provider.getBlockNumber(),
      provider.getBlock('latest'),
      provider.send('net_peerCount', []).catch(() => '0x0')
    ]);

    const result = {
      chainId: process.env.CHAIN_ID || '65001',
      chainName: 'Nor Chain',
      currentBlock: currentBlock.toString(),
      blockTime: '3', // 3 seconds
      gasPrice: block.gasPrice ? block.gasPrice.toString() : '0',
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      peerCount: parseInt(peerCount, 16).toString(),
      networkId: process.env.CHAIN_ID || '65001',
      nativeCurrency: 'NOR'
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/stats/gasoracle
 * Get gas price oracle information
 */
router.get('/gasoracle', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const block = await provider.getBlock('latest');
    const feeData = await provider.getFeeData();

    const gasPrice = feeData.gasPrice || block.gasPrice || BigInt(3000000000); // 3 gwei default

    const result = {
      LastBlock: block.number.toString(),
      SafeGasPrice: gasPrice.toString(),
      ProposeGasPrice: gasPrice.toString(),
      FastGasPrice: gasPrice.toString(),
      suggestBaseFee: feeData.maxFeePerGas ? (feeData.maxFeePerGas / BigInt(2)).toString() : gasPrice.toString(),
      gasUsedRatio: (Number(block.gasUsed) / Number(block.gasLimit) * 100).toFixed(2)
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;


