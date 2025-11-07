import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, validateAddress, formatResponse } from '../utils/provider.js';
import { ethers } from 'ethers';

const router = express.Router();

/**
 * GET /api/logs/getLogs
 * Get event logs with filtering
 * Etherscan/BSCScan compatible endpoint
 */
router.get('/getLogs', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { 
    address, 
    fromBlock, 
    toBlock = 'latest', 
    topic0, 
    topic1, 
    topic2, 
    topic3,
    topic0_1_opr = 'and',
    topic0_2_opr = 'and',
    topic0_3_opr = 'and',
    topic1_2_opr = 'and',
    topic1_3_opr = 'and',
    topic2_3_opr = 'and',
    page = 1,
    offset = 1000
  } = req.query;

  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    
    const from = fromBlock ? parseInt(fromBlock) : Math.max(0, currentBlock - 10000);
    const to = toBlock === 'latest' ? currentBlock : parseInt(toBlock);

    // Build filter
    const filter = {
      address: address ? validateAddress(address) : null,
      topics: [
        topic0 || null,
        topic1 || null,
        topic2 || null,
        topic3 || null
      ].filter(Boolean),
      fromBlock: from,
      toBlock: to
    };

    // Remove null address
    if (!filter.address) delete filter.address;
    // Remove null topics
    filter.topics = filter.topics.filter(t => t !== null);

    if (filter.topics.length === 0) {
      return res.json(formatResponse('0', null, 'At least one topic is required'));
    }

    const logs = await provider.getLogs(filter);

    // Format logs
    const formattedLogs = await Promise.all(logs.map(async (log) => {
      const block = await provider.getBlock(log.blockNumber).catch(() => null);
      const tx = await provider.getTransaction(log.transactionHash).catch(() => null);

      return {
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockNumber: log.blockNumber.toString(),
        blockHash: log.blockHash,
        timeStamp: block ? block.timestamp.toString() : '',
        gasPrice: tx && tx.gasPrice ? tx.gasPrice.toString() : '',
        gasUsed: '',
        logIndex: log.index.toString(),
        transactionHash: log.transactionHash,
        transactionIndex: log.index.toString()
      };
    }));

    // Paginate
    const start = (parseInt(page) - 1) * parseInt(offset);
    const end = start + parseInt(offset);
    const paginated = formattedLogs.slice(start, end);

    res.json(formatResponse('1', paginated));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;

