import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, formatResponse } from '../utils/provider.js';

const router = express.Router();

/**
 * POST /api/proxy/eth_*
 * Proxy JSON-RPC requests directly to the blockchain node
 */
router.post('/eth_*', defaultRateLimiter, asyncHandler(async (req, res) => {
  const { method, params = [], id = 1 } = req.body;

  if (!method) {
    return res.json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request'
      },
      id
    });
  }

  try {
    const provider = getProvider();
    const result = await provider.send(method, params);

    res.json({
      jsonrpc: '2.0',
      result,
      id
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error.message || 'Server error'
      },
      id
    });
  }
}));

/**
 * GET /api/proxy/eth_blockNumber
 * Get latest block number
 */
router.get('/eth_blockNumber', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();

    res.json({
      jsonrpc: '2.0',
      result: '0x' + blockNumber.toString(16),
      id: 1
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error.message
      },
      id: 1
    });
  }
}));

/**
 * GET /api/proxy/eth_getBalance
 * Get account balance
 */
router.get('/eth_getBalance', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address, tag = 'latest' } = req.query;

  if (!address) {
    return res.json({
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params: missing address'
      },
      id: 1
    });
  }

  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address, tag);

    res.json({
      jsonrpc: '2.0',
      result: balance.toString(),
      id: 1
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error.message
      },
      id: 1
    });
  }
}));

/**
 * GET /api/proxy/eth_getTransactionByHash
 * Get transaction by hash
 */
router.get('/eth_getTransactionByHash', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { txhash } = req.query;

  if (!txhash) {
    return res.json({
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params: missing txhash'
      },
      id: 1
    });
  }

  try {
    const provider = getProvider();
    const tx = await provider.getTransaction(txhash);

    if (!tx) {
      return res.json({
        jsonrpc: '2.0',
        result: null,
        id: 1
      });
    }

    res.json({
      jsonrpc: '2.0',
      result: {
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber ? '0x' + tx.blockNumber.toString(16) : null,
        from: tx.from,
        gas: '0x' + tx.gas.toString(16),
        gasPrice: tx.gasPrice ? '0x' + tx.gasPrice.toString(16) : null,
        hash: tx.hash,
        input: tx.data,
        nonce: '0x' + tx.nonce.toString(16),
        to: tx.to,
        transactionIndex: tx.index !== null ? '0x' + tx.index.toString(16) : null,
        value: '0x' + tx.value.toString(16),
        v: tx.signature ? '0x' + tx.signature.v.toString(16) : null,
        r: tx.signature ? '0x' + tx.signature.r.toString(16) : null,
        s: tx.signature ? '0x' + tx.signature.s.toString(16) : null
      },
      id: 1
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error.message
      },
      id: 1
    });
  }
}));

/**
 * GET /api/proxy/eth_getBlockByNumber
 * Get block by number
 */
router.get('/eth_getBlockByNumber', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { tag = 'latest', full = 'false' } = req.query;

  try {
    const provider = getProvider();
    const block = await provider.getBlock(tag, full === 'true');

    if (!block) {
      return res.json({
        jsonrpc: '2.0',
        result: null,
        id: 1
      });
    }

    res.json({
      jsonrpc: '2.0',
      result: {
        number: block.number ? '0x' + block.number.toString(16) : null,
        hash: block.hash,
        parentHash: block.parentHash,
        nonce: block.nonce || '0x0000000000000000',
        sha3Uncles: block.parentHash,
        logsBloom: block.logsBloom || '0x',
        transactionsRoot: block.transactionsRoot || block.hash,
        stateRoot: block.stateRoot || block.hash,
        receiptsRoot: block.receiptsRoot || block.hash,
        miner: block.miner || block.author || '0x0000000000000000000000000000000000000000',
        difficulty: block.difficulty ? '0x' + block.difficulty.toString(16) : '0x0',
        totalDifficulty: '0x0',
        extraData: block.extraData,
        size: '0x' + block.gasLimit.toString(16),
        gasLimit: '0x' + block.gasLimit.toString(16),
        gasUsed: '0x' + block.gasUsed.toString(16),
        timestamp: '0x' + block.timestamp.toString(16),
        transactions: full === 'true' ? (block.transactions || []) : (block.transactions || []).map(tx => typeof tx === 'string' ? tx : tx.hash),
        uncles: []
      },
      id: 1
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error.message
      },
      id: 1
    });
  }
}));

export default router;


