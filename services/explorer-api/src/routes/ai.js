import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateAddress, formatResponse } from '../utils/provider.js';
import aiService from '../services/ai.js';

const router = express.Router();

/**
 * POST /api/ai/analyze-contract
 * Analyze smart contract for security and insights
 */
router.post('/analyze-contract', defaultRateLimiter, cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const { contractaddress } = req.body;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const analysis = await aiService.analyzeContract(validAddress);
    res.json(formatResponse('1', analysis));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * POST /api/ai/analyze-transaction
 * Analyze transaction for insights and recommendations
 */
router.post('/analyze-transaction', defaultRateLimiter, cacheMiddleware(60000), asyncHandler(async (req, res) => {
  const { txhash } = req.body;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const analysis = await aiService.analyzeTransaction(txhash);
    res.json(formatResponse('1', analysis));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * POST /api/ai/detect-token-type
 * Detect token standard (ERC-20, ERC-721, ERC-1155)
 */
router.post('/detect-token-type', defaultRateLimiter, cacheMiddleware(300000), asyncHandler(async (req, res) => {
  const { contractaddress } = req.body;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const tokenType = await aiService.detectTokenType(validAddress);
    res.json(formatResponse('1', tokenType));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * POST /api/ai/transaction-summary
 * Generate AI-powered transaction summary
 */
router.post('/transaction-summary', defaultRateLimiter, cacheMiddleware(60000), asyncHandler(async (req, res) => {
  const { txhash } = req.body;

  if (!txhash) {
    return res.json(formatResponse('0', null, 'Missing txhash parameter'));
  }

  try {
    const summary = await aiService.generateTransactionSummary(txhash);
    res.json(formatResponse('1', summary));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/ai/predict-gas-price
 * Predict optimal gas price based on network conditions
 */
router.get('/predict-gas-price', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  try {
    const prediction = await aiService.predictGasPrice();
    res.json(formatResponse('1', prediction));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;

