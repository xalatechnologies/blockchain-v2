import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, validateAddress, formatResponse } from '../utils/provider.js';
import { ethers } from 'ethers';

const router = express.Router();

// ERC-20 Transfer event signature
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
// ERC-721 Transfer event signature
const TRANSFER_NFT_TOPIC = ethers.id('Transfer(address,address,uint256)');

/**
 * GET /api/account/balance
 * Get account balance (native token - NOR)
 */
router.get('/balance', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const provider = getProvider();
    const balance = await provider.getBalance(validAddress);
    const balanceInEther = ethers.formatEther(balance);

    res.json(formatResponse('1', balanceInEther));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/account/txlist
 * Get transaction list for an address
 */
router.get('/txlist', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { address, startblock = 0, endblock = 'latest', page = 1, offset = 10, sort = 'desc' } = req.query;

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
    
    const start = startblock === 0 ? Math.max(0, currentBlock - 10000) : parseInt(startblock);
    const end = endblock === 'latest' ? currentBlock : parseInt(endblock);
    
    // Get transactions (simplified - in production, use indexer)
    const transactions = [];
    
    // For now, return empty array with note that full indexing is needed
    res.json(formatResponse('1', transactions, 'Transaction indexing in progress. Use RPC directly for now.'));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/account/tokentx
 * Get token transfers for an address
 */
router.get('/tokentx', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { address, contractaddress, startblock = 0, endblock = 'latest', page = 1, offset = 10, sort = 'desc' } = req.query;

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
    
    const fromBlock = startblock === 0 ? Math.max(0, currentBlock - 10000) : parseInt(startblock);
    const toBlock = endblock === 'latest' ? currentBlock : parseInt(endblock);

    const filter = {
      address: contractaddress ? validateAddress(contractaddress) : null,
      topics: [TRANSFER_TOPIC, 
        validAddress ? ethers.zeroPadValue(validAddress, 32) : null,
        validAddress ? ethers.zeroPadValue(validAddress, 32) : null
      ],
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    // Remove null values from filter
    Object.keys(filter).forEach(key => {
      if (filter[key] === null) delete filter[key];
    });

    const logs = await provider.getLogs(filter);
    
    const transfers = await Promise.all(logs.map(async (log) => {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256'],
        log.data
      );
      
      const block = await provider.getBlock(log.blockNumber).catch(() => null);
      const tx = await provider.getTransaction(log.transactionHash).catch(() => null);
      const receipt = await provider.getTransactionReceipt(log.transactionHash).catch(() => null);
      
      // Try to get token info
      let tokenName = '';
      let tokenSymbol = '';
      let tokenDecimal = '18';
      
      try {
        const ERC20_ABI = [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)'
        ];
        const tokenContract = new ethers.Contract(log.address, ERC20_ABI, provider);
        [tokenName, tokenSymbol, tokenDecimal] = await Promise.all([
          tokenContract.name().catch(() => ''),
          tokenContract.symbol().catch(() => ''),
          tokenContract.decimals().catch(() => 18)
        ]);
        tokenDecimal = tokenDecimal.toString();
      } catch (e) {
        // Token info not available
      }
      
      return {
        blockNumber: log.blockNumber.toString(),
        timeStamp: block ? block.timestamp.toString() : '',
        hash: log.transactionHash,
        from: '0x' + log.topics[1].slice(26),
        to: '0x' + log.topics[2].slice(26),
        value: decoded[0].toString(),
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        tokenDecimal: tokenDecimal,
        transactionIndex: log.index.toString(),
        gas: tx ? tx.gas.toString() : '',
        gasPrice: tx && tx.gasPrice ? tx.gasPrice.toString() : '',
        gasUsed: receipt ? receipt.gasUsed.toString() : '',
        cumulativeGasUsed: receipt ? receipt.cumulativeGasUsed.toString() : '',
        input: 'deprecated',
        confirmations: (currentBlock - log.blockNumber).toString()
      };
    }));

    // Sort and paginate
    const sorted = sort === 'desc' 
      ? transfers.reverse() 
      : transfers;
    
    const start = (parseInt(page) - 1) * parseInt(offset);
    const end = start + parseInt(offset);
    const paginated = sorted.slice(start, end);

    res.json(formatResponse('1', paginated));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/account/tokenlist
 * Get list of tokens held by an address
 */
router.get('/tokenlist', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  // This would require token registry or scanning all Transfer events
  // For now, return empty array
  res.json(formatResponse('1', [], 'Token list requires token registry. Use /tokentx endpoint instead.'));
}));

/**
 * GET /api/account/getminedblocks
 * Get blocks mined by an address (validator)
 */
router.get('/getminedblocks', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { address, blocktype = 'blocks', page = 1, offset = 10 } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const validAddress = validateAddress(address);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  // This requires block indexing by validator address
  // For now, return empty array
  res.json(formatResponse('1', [], 'Block indexing by validator requires full indexer.'));
}));

/**
 * GET /api/account/txlistinternal
 * Get internal transactions (contract calls) for an address
 * Etherscan/BSCScan compatible endpoint
 */
router.get('/txlistinternal', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { address, startblock = 0, endblock = 'latest', page = 1, offset = 10, sort = 'desc' } = req.query;

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
    
    const fromBlock = startblock === 0 ? Math.max(0, currentBlock - 10000) : parseInt(startblock);
    const toBlock = endblock === 'latest' ? currentBlock : parseInt(endblock);

    // Internal transactions are trace calls - requires trace API
    // For now, return empty array with note
    res.json(formatResponse('1', [], 'Internal transactions require trace API. Use debug_traceTransaction for now.'));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/account/tokennfttx
 * Get ERC-721 NFT token transfers for an address
 * Etherscan/BSCScan compatible endpoint
 */
router.get('/tokennfttx', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { address, contractaddress, startblock = 0, endblock = 'latest', page = 1, offset = 10, sort = 'desc' } = req.query;

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
    
    const fromBlock = startblock === 0 ? Math.max(0, currentBlock - 10000) : parseInt(startblock);
    const toBlock = endblock === 'latest' ? currentBlock : parseInt(endblock);

    // ERC-721 uses same Transfer event but with tokenId in topics[3]
    const filter = {
      address: contractaddress ? validateAddress(contractaddress) : null,
      topics: [
        TRANSFER_NFT_TOPIC,
        validAddress ? ethers.zeroPadValue(validAddress, 32) : null,
        validAddress ? ethers.zeroPadValue(validAddress, 32) : null
      ],
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    // Remove null values from filter
    if (!filter.topics[1]) delete filter.topics[1];
    if (!filter.topics[2]) delete filter.topics[2];

    const logs = await provider.getLogs(filter);
    
    const transfers = await Promise.all(logs.map(async (log) => {
      const block = await provider.getBlock(log.blockNumber).catch(() => null);
      const tx = await provider.getTransaction(log.transactionHash).catch(() => null);
      const receipt = await provider.getTransactionReceipt(log.transactionHash).catch(() => null);
      
      // TokenId is in topics[3] for ERC-721
      const tokenId = log.topics.length > 3 ? BigInt(log.topics[3]).toString() : '0';
      
      return {
        blockNumber: log.blockNumber.toString(),
        timeStamp: block ? block.timestamp.toString() : '',
        hash: log.transactionHash,
        nonce: tx ? tx.nonce.toString() : '',
        blockHash: log.blockHash,
        from: '0x' + log.topics[1].slice(26),
        contractAddress: log.address,
        to: '0x' + log.topics[2].slice(26),
        tokenID: tokenId,
        tokenName: '',
        tokenSymbol: '',
        tokenDecimal: '0', // NFTs don't have decimals
        transactionIndex: log.index.toString(),
        gas: tx ? tx.gas.toString() : '',
        gasPrice: tx && tx.gasPrice ? tx.gasPrice.toString() : '',
        gasUsed: receipt ? receipt.gasUsed.toString() : '',
        cumulativeGasUsed: receipt ? receipt.cumulativeGasUsed.toString() : '',
        input: 'deprecated',
        confirmations: (currentBlock - log.blockNumber).toString()
      };
    }));

    // Sort and paginate
    const sorted = sort === 'desc' 
      ? transfers.reverse() 
      : transfers;
    
    const start = (parseInt(page) - 1) * parseInt(offset);
    const end = start + parseInt(offset);
    const paginated = sorted.slice(start, end);

    res.json(formatResponse('1', paginated));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/account/balancemulti
 * Get multiple account balances in a single call
 * Etherscan/BSCScan compatible endpoint
 */
router.get('/balancemulti', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { address, tag = 'latest' } = req.query;

  if (!address) {
    return res.json(formatResponse('0', null, 'Missing address parameter'));
  }

  const addresses = address.split(',').map(addr => validateAddress(addr.trim())).filter(Boolean);

  if (addresses.length === 0) {
    return res.json(formatResponse('0', null, 'No valid addresses provided'));
  }

  if (addresses.length > 20) {
    return res.json(formatResponse('0', null, 'Maximum 20 addresses per request'));
  }

  try {
    const provider = getProvider();
    const balances = await Promise.all(
      addresses.map(async (addr) => {
        const balance = await provider.getBalance(addr, tag);
        return {
          account: addr,
          balance: balance.toString()
        };
      })
    );

    res.json(formatResponse('1', balances));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

export default router;


