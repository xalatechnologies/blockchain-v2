import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, formatResponse } from '../utils/provider.js';

const router = express.Router();

/**
 * GET /api/transaction/getstatus
 * Get transaction status and receipt
 */
router.get('/getstatus', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { txhash } = req.query;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txhash);

    if (!receipt) {
      return res.json(formatResponse('0', null, 'Transaction not found'));
    }

    const result = {
      isError: receipt.status === 0 ? '1' : '0',
      errDescription: receipt.status === 0 ? 'Transaction failed' : ''
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/transaction/gettxreceiptstatus
 * Get transaction receipt status
 */
router.get('/gettxreceiptstatus', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { txhash } = req.query;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txhash);

    if (!receipt) {
      return res.json(formatResponse('0', null, 'Transaction not found'));
    }

    const result = {
      status: receipt.status === 1 ? '1' : '0'
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/transaction/gettxreceipt
 * Get full transaction receipt
 */
router.get('/gettxreceipt', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { txhash } = req.query;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const provider = getProvider();
    const [tx, receipt, block] = await Promise.all([
      provider.getTransaction(txhash),
      provider.getTransactionReceipt(txhash),
      provider.getBlock('latest')
    ]);

    if (!tx || !receipt) {
      return res.json(formatResponse('0', null, 'Transaction not found'));
    }

    const result = {
      blockNumber: receipt.blockNumber.toString(),
      blockHash: receipt.blockHash,
      transactionIndex: receipt.index.toString(),
      hash: receipt.hash,
      from: receipt.from,
      to: receipt.to || null,
      gasUsed: receipt.gasUsed.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      contractAddress: receipt.contractAddress || null,
      logs: receipt.logs.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockNumber: log.blockNumber.toString(),
        transactionHash: log.transactionHash,
        transactionIndex: log.index.toString(),
        blockHash: log.blockHash,
        logIndex: log.index.toString(),
        removed: log.removed
      })),
      status: receipt.status === 1 ? '1' : '0',
      logsBloom: receipt.logsBloom,
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : '0',
      effectiveGasPrice: receipt.gasPrice ? receipt.gasPrice.toString() : '0'
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/transaction/gettxinfo
 * Get transaction information
 */
router.get('/gettxinfo', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { txhash } = req.query;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const provider = getProvider();
    const [tx, receipt, block] = await Promise.all([
      provider.getTransaction(txhash),
      provider.getTransactionReceipt(txhash).catch(() => null),
      provider.getBlock('latest')
    ]);

    if (!tx) {
      return res.json(formatResponse('0', null, 'Transaction not found'));
    }

    const blockDetails = await provider.getBlock(tx.blockNumber || 'latest');

    const result = {
      blockNumber: tx.blockNumber ? tx.blockNumber.toString() : null,
      timeStamp: blockDetails ? blockDetails.timestamp.toString() : null,
      hash: tx.hash,
      from: tx.from,
      to: tx.to || null,
      value: tx.value.toString(),
      gas: tx.gas.toString(),
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : '0',
      gasUsed: receipt ? receipt.gasUsed.toString() : null,
      cumulativeGasUsed: receipt ? receipt.cumulativeGasUsed.toString() : null,
      input: tx.data,
      confirmations: tx.blockNumber ? (block - tx.blockNumber + 1).toString() : '0',
      isError: receipt ? (receipt.status === 0 ? '1' : '0') : null,
      txreceipt_status: receipt ? (receipt.status === 1 ? '1' : '0') : null,
      contractAddress: receipt ? receipt.contractAddress : null
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;


