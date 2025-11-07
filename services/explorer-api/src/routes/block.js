import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, validateBlockNumber, formatResponse } from '../utils/provider.js';

const router = express.Router();

/**
 * GET /api/block/getblockreward
 * Get block reward information
 */
router.get('/getblockreward', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { blockno } = req.query;

  if (!blockno) {
    return res.json(formatResponse('0', null, 'Missing blockno parameter'));
  }

  const blockNumber = validateBlockNumber(blockno);
  if (blockNumber === null) {
    return res.json(formatResponse('0', null, 'Invalid block number'));
  }

  try {
    const provider = getProvider();
    const block = await provider.getBlock(blockNumber, true);

    if (!block) {
      return res.json(formatResponse('0', null, 'Block not found'));
    }

    // Calculate block reward (sum of all transaction fees)
    let totalGasUsed = BigInt(0);
    let totalGasPrice = BigInt(0);

    if (block.transactions && block.transactions.length > 0) {
      for (const tx of block.transactions) {
        if (typeof tx === 'object' && tx.gasPrice) {
          const receipt = await provider.getTransactionReceipt(tx.hash).catch(() => null);
          if (receipt) {
            totalGasUsed += receipt.gasUsed;
            totalGasPrice += tx.gasPrice * receipt.gasUsed;
          }
        }
      }
    }

    const result = {
      blockNumber: block.number.toString(),
      timeStamp: block.timestamp.toString(),
      blockMiner: block.miner || block.author || '0x0000000000000000000000000000000000000000',
      blockReward: '0', // Block reward (if any)
      uncles: [],
      uncleInclusionReward: '0',
      totalGasUsed: totalGasUsed.toString(),
      totalGasPrice: totalGasPrice.toString()
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/block/getblockcountdown
 * Get countdown to a specific block
 */
router.get('/getblockcountdown', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { blockno } = req.query;

  if (!blockno) {
    return res.json(formatResponse('0', null, 'Missing blockno parameter'));
  }

  const targetBlock = parseInt(blockno);
  if (isNaN(targetBlock) || targetBlock < 0) {
    return res.json(formatResponse('0', null, 'Invalid block number'));
  }

  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    const currentBlockDetails = await provider.getBlock(currentBlock);

    const blocksRemaining = targetBlock - currentBlock;
    const blockTime = 3; // 3 seconds for Nor Chain
    const estimatedTimeInSeconds = blocksRemaining * blockTime;

    const result = {
      CurrentBlock: currentBlock.toString(),
      CountdownBlock: targetBlock.toString(),
      RemainingBlock: blocksRemaining.toString(),
      EstimateTimeInSec: estimatedTimeInSeconds.toString()
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/block/getblocknobytime
 * Get block number by timestamp
 */
router.get('/getblocknobytime', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { timestamp, closest = 'before' } = req.query;

  if (!timestamp) {
    return res.json(formatResponse('0', null, 'Missing timestamp parameter'));
  }

  const targetTimestamp = parseInt(timestamp);
  if (isNaN(targetTimestamp)) {
    return res.json(formatResponse('0', null, 'Invalid timestamp'));
  }

  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    const currentBlockDetails = await provider.getBlock(currentBlock);

    // Estimate block number based on block time (3 seconds)
    const blockTime = 3;
    const timeDiff = targetTimestamp - parseInt(currentBlockDetails.timestamp);
    const blocksDiff = Math.floor(timeDiff / blockTime);
    const estimatedBlock = currentBlock + blocksDiff;

    // Binary search for exact block (simplified)
    let blockNumber = Math.max(0, Math.min(estimatedBlock, currentBlock));
    let block = await provider.getBlock(blockNumber);

    // Simple linear search (in production, use binary search)
    if (closest === 'before') {
      while (block && parseInt(block.timestamp) > targetTimestamp && blockNumber > 0) {
        blockNumber--;
        block = await provider.getBlock(blockNumber).catch(() => null);
      }
    } else {
      while (block && parseInt(block.timestamp) < targetTimestamp && blockNumber < currentBlock) {
        blockNumber++;
        block = await provider.getBlock(blockNumber).catch(() => null);
      }
    }

    const result = {
      blockNumber: blockNumber.toString(),
      timeStamp: block ? block.timestamp.toString() : timestamp
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/block/getblockinfo
 * Get detailed block information
 */
router.get('/getblockinfo', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { blockno } = req.query;

  if (!blockno) {
    return res.json(formatResponse('0', null, 'Missing blockno parameter'));
  }

  const blockNumber = validateBlockNumber(blockno);
  if (blockNumber === null) {
    return res.json(formatResponse('0', null, 'Invalid block number'));
  }

  try {
    const provider = getProvider();
    const block = await provider.getBlock(blockNumber, true);

    if (!block) {
      return res.json(formatResponse('0', null, 'Block not found'));
    }

    const result = {
      blockNumber: block.number.toString(),
      timeStamp: block.timestamp.toString(),
      blockMiner: block.miner || block.author || '0x0000000000000000000000000000000000000000',
      blockReward: '0',
      uncles: [],
      uncleInclusionReward: '0',
      difficulty: block.difficulty ? block.difficulty.toString() : '0',
      totalDifficulty: '0',
      size: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      extraData: block.extraData,
      hash: block.hash,
      parentHash: block.parentHash,
      sha3Uncles: block.parentHash, // Simplified
      nonce: block.nonce || '0x0000000000000000',
      transactions: block.transactions ? block.transactions.length.toString() : '0'
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;


