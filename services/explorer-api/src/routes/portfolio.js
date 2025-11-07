import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, validateAddress, formatResponse } from '../utils/provider.js';
import { ethers } from 'ethers';

const router = express.Router();

// Standard ERC-20 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

/**
 * GET /api/portfolio/getaddressportfolio
 * Get complete token portfolio for an address
 * Etherscan API v2 compatible endpoint
 */
router.get('/getaddressportfolio', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address, chainid } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    
    // Get native balance
    const nativeBalance = await provider.getBalance(validAddress);
    
    // Get token transfers to find all tokens this address has interacted with
    const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
    const fromBlock = Math.max(0, currentBlock - 100000); // Last 100k blocks
    
    const filter = {
      topics: [
        TRANSFER_TOPIC,
        ethers.zeroPadValue(validAddress, 32),
        null // Any recipient
      ],
      fromBlock: fromBlock,
      toBlock: currentBlock
    };

    const logs = await provider.getLogs(filter);
    
    // Extract unique token addresses
    const tokenAddresses = [...new Set(logs.map(log => log.address))];
    
    // Get balances for each token
    const tokenBalances = await Promise.all(
      tokenAddresses.slice(0, 100).map(async (tokenAddress) => {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const [balance, name, symbol, decimals] = await Promise.all([
            contract.balanceOf(validAddress).catch(() => BigInt(0)),
            contract.name().catch(() => 'Unknown'),
            contract.symbol().catch(() => 'UNKNOWN'),
            contract.decimals().catch(() => 18)
          ]);

          if (balance === BigInt(0)) {
            return null; // Skip zero balances
          }

          return {
            contractAddress: tokenAddress,
            tokenName: name,
            symbol: symbol,
            decimals: decimals.toString(),
            balance: balance.toString(),
            balanceFormatted: ethers.formatUnits(balance, decimals)
          };
        } catch (error) {
          return null;
        }
      })
    );

    const result = {
      address: validAddress,
      chainId: chainid || process.env.CHAIN_ID || '65001',
      nativeBalance: nativeBalance.toString(),
      nativeBalanceFormatted: ethers.formatEther(nativeBalance),
      tokens: tokenBalances.filter(Boolean)
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;

