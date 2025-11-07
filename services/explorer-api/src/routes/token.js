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
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)'
];

/**
 * GET /api/token/tokeninfo
 * Get token information
 */
router.get('/tokeninfo', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  const { contractaddress } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const provider = getProvider();
    const contract = new ethers.Contract(validAddress, ERC20_ABI, provider);

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name().catch(() => 'Unknown'),
      contract.symbol().catch(() => 'UNKNOWN'),
      contract.decimals().catch(() => 18),
      contract.totalSupply().catch(() => BigInt(0))
    ]);

    const result = {
      contractAddress: validAddress,
      tokenName: name,
      symbol: symbol,
      divisor: decimals.toString(),
      tokenType: 'ERC20',
      totalSupply: totalSupply.toString(),
      blueCheckmark: 'false',
      description: '',
      website: '',
      email: '',
      blog: '',
      reddit: '',
      slack: '',
      facebook: '',
      twitter: '',
      github: '',
      telegram: '',
      wechat: '',
      linkedin: '',
      discord: ''
    };

    res.json(formatResponse('1', result));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/token/tokensupply
 * Get token total supply
 */
router.get('/tokensupply', defaultRateLimiter, cacheMiddleware(30000), asyncHandler(async (req, res) => {
  const { contractaddress } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const provider = getProvider();
    const contract = new ethers.Contract(validAddress, ERC20_ABI, provider);
    const totalSupply = await contract.totalSupply().catch(() => BigInt(0));

    res.json(formatResponse('1', totalSupply.toString()));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/token/tokenbalance
 * Get token balance for an address
 */
router.get('/tokenbalance', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { contractaddress, address } = req.query;

  if (!contractaddress || !address) {
    return res.json(formatResponse('0', null, 'Missing contractaddress or address parameter'));
  }

  const validContractAddress = validateAddress(contractaddress);
  const validAddress = validateAddress(address);

  if (!validContractAddress || !validAddress) {
    return res.json(formatResponse('0', null, 'Invalid address format'));
  }

  try {
    const provider = getProvider();
    const contract = new ethers.Contract(validContractAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(validAddress).catch(() => BigInt(0));

    res.json(formatResponse('1', balance.toString()));
  } catch (error) {
    res.json(formatResponse('0', null, error.message));
  }
}));

/**
 * GET /api/token/tokentx
 * Get token transfers
 */
router.get('/tokentx', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { contractaddress, address, startblock = 0, endblock = 'latest', page = 1, offset = 10, sort = 'desc' } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validContractAddress = validateAddress(contractaddress);
  if (!validContractAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    
    const fromBlock = startblock === 0 ? Math.max(0, currentBlock - 10000) : parseInt(startblock);
    const toBlock = endblock === 'latest' ? currentBlock : parseInt(endblock);

    const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
    
    const filter = {
      address: validContractAddress,
      topics: [
        TRANSFER_TOPIC,
        address ? ethers.zeroPadValue(validateAddress(address), 32) : null,
        address ? ethers.zeroPadValue(validateAddress(address), 32) : null
      ],
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    // Remove null values from filter
    if (!filter.topics[1]) delete filter.topics[1];
    if (!filter.topics[2]) delete filter.topics[2];

    const logs = await provider.getLogs(filter);
    
    const transfers = await Promise.all(logs.map(async (log) => {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256'],
        log.data
      );
      
      const block = await provider.getBlock(log.blockNumber).catch(() => null);
      
      return {
        blockNumber: log.blockNumber.toString(),
        timeStamp: block ? block.timestamp.toString() : '',
        hash: log.transactionHash,
        nonce: '',
        blockHash: log.blockHash,
        from: '0x' + log.topics[1].slice(26),
        contractAddress: log.address,
        to: '0x' + log.topics[2].slice(26),
        value: decoded[0].toString(),
        tokenName: '',
        tokenSymbol: '',
        tokenDecimal: '18',
        transactionIndex: log.index.toString(),
        gas: '',
        gasPrice: '',
        gasUsed: '',
        cumulativeGasUsed: '',
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
 * GET /api/token/tokenholderlist
 * Get token holders (simplified - requires indexing)
 */
router.get('/tokenholderlist', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { contractaddress, page = 1, offset = 10 } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  // This requires full token holder indexing
  // For now, return empty array with note
  res.json(formatResponse('1', [], 'Token holder list requires full blockchain indexing. Use /tokentx endpoint to track transfers.'));
}));

/**
 * GET /api/token/tokennfttx
 * Get ERC-721 NFT token transfers
 * Etherscan/BSCScan compatible endpoint
 */
router.get('/tokennfttx', defaultRateLimiter, cacheMiddleware(5000), asyncHandler(async (req, res) => {
  const { contractaddress, address, startblock = 0, endblock = 'latest', page = 1, offset = 10, sort = 'desc' } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validContractAddress = validateAddress(contractaddress);
  if (!validContractAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  try {
    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();
    
    const fromBlock = startblock === 0 ? Math.max(0, currentBlock - 10000) : parseInt(startblock);
    const toBlock = endblock === 'latest' ? currentBlock : parseInt(endblock);

    const TRANSFER_NFT_TOPIC = ethers.id('Transfer(address,address,uint256)');
    
    const filter = {
      address: validContractAddress,
      topics: [
        TRANSFER_NFT_TOPIC,
        address ? ethers.zeroPadValue(validateAddress(address), 32) : null,
        address ? ethers.zeroPadValue(validateAddress(address), 32) : null
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
        tokenDecimal: '0',
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
 * GET /api/token/tokenholderlist
 * Get top token holders
 * Etherscan/BSCScan compatible endpoint
 */
router.get('/tokenholderlist', defaultRateLimiter, cacheMiddleware(10000), asyncHandler(async (req, res) => {
  const { contractaddress, page = 1, offset = 10 } = req.query;

  if (!contractaddress) {
    return res.json(formatResponse('0', null, 'Missing contractaddress parameter'));
  }

  const validAddress = validateAddress(contractaddress);
  if (!validAddress) {
    return res.json(formatResponse('0', null, 'Invalid contract address format'));
  }

  // This requires full token holder indexing
  res.json(formatResponse('1', [], 'Top token holders requires full blockchain indexing. Use /tokentx endpoint to track transfers.'));
}));

export default router;


