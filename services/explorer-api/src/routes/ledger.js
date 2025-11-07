import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateAddress, formatResponse } from '../utils/provider.js';
import ledgerService from '../services/ledger.js';

const router = express.Router();

/**
 * GET /api/ledger/account
 * Get account ledger (all transactions affecting an address)
 */
router.get('/account', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address, startblock = 0, endblock, page = 1, limit = 50, sort = 'desc' } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const ledger = await ledgerService.getAccountLedger(validAddress, {
      startBlock: parseInt(startblock),
      endBlock: endblock ? parseInt(endblock) : null,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    });

    res.json(formatResponse('1', ledger));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/ledger/balance-history
 * Get balance history for an address
 */
router.get('/balance-history', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  const { address, startblock = 0, endblock, interval = 'hour' } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const history = await ledgerService.getBalanceHistory(validAddress, {
      startBlock: parseInt(startblock),
      endBlock: endblock ? parseInt(endblock) : null,
      interval
    });

    res.json(formatResponse('1', history));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/ledger/token
 * Get token ledger for an address
 */
router.get('/token', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address, contractaddress, startblock = 0, endblock, page = 1, limit = 50 } = req.query;

  if (!address || !contractaddress) {
    return res.json(formatResponse('0', null, 'Missing address or contractaddress parameter'));
  }

  const validAddress = validateAddress(address);
  const validContractAddress = validateAddress(contractaddress);

  if (!validAddress || !validContractAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const ledger = await ledgerService.getTokenLedger(validAddress, validContractAddress, {
      startBlock: parseInt(startblock),
      endBlock: endblock ? parseInt(endblock) : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(formatResponse('1', ledger));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/ledger/statement
 * Get account statement (like bank statement)
 */
router.get('/statement', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address, startdate, enddate } = req.query;

  if (!address || !startdate || !enddate) {
    return res.json(formatResponse('0', null, 'Missing address, startdate, or enddate parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const startTimestamp = Math.floor(new Date(startdate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(enddate).getTime() / 1000);

    const statement = await ledgerService.getAccountStatement(validAddress, startTimestamp, endTimestamp);

    res.json(formatResponse('1', statement));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/ledger/token-holders
 * Get token holder rankings
 */
router.get('/token-holders', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  const { contractaddress, limit = 100 } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const rankings = await ledgerService.getTokenHolderRankings(validAddress, parseInt(limit));

    res.json(formatResponse('1', rankings));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/ledger/transaction-flow
 * Get transaction flow analysis
 */
router.get('/transaction-flow', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { txhash } = req.query;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const flow = await ledgerService.getTransactionFlow(txhash);

    res.json(formatResponse('1', flow));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;

