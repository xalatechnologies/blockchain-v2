import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { getProvider, validateAddress } from '../utils/provider.js';
import { ethers } from 'ethers';

const router = express.Router();

// GraphQL Schema
const schema = buildSchema(`
  type Query {
    # Account queries
    account(address: String!): Account
    balance(address: String!): String
    transactions(address: String!, limit: Int, offset: Int): [Transaction]
    tokenTransfers(address: String!, contractAddress: String, limit: Int): [TokenTransfer]
    
    # Token queries
    token(contractAddress: String!): Token
    tokenBalance(contractAddress: String!, address: String!): String
    
    # Transaction queries
    transaction(hash: String!): Transaction
    transactionReceipt(hash: String!): TransactionReceipt
    
    # Block queries
    block(number: Int): Block
    latestBlock: Block
    
    # Stats queries
    networkStats: NetworkStats
    gasOracle: GasOracle
  }
  
  type Account {
    address: String!
    balance: String!
    transactionCount: Int
  }
  
  type Transaction {
    hash: String!
    from: String!
    to: String
    value: String!
    blockNumber: Int
    timestamp: Int
    gas: String
    gasPrice: String
    status: String
  }
  
  type TransactionReceipt {
    hash: String!
    blockNumber: Int!
    status: String!
    gasUsed: String!
    logs: [Log]
  }
  
  type Log {
    address: String!
    topics: [String!]!
    data: String!
  }
  
  type TokenTransfer {
    hash: String!
    from: String!
    to: String!
    value: String!
    tokenAddress: String!
    tokenSymbol: String
    blockNumber: Int!
    timestamp: Int
  }
  
  type Token {
    address: String!
    name: String
    symbol: String
    decimals: Int
    totalSupply: String
  }
  
  type Block {
    number: Int!
    hash: String!
    timestamp: Int!
    gasUsed: String!
    gasLimit: String!
    transactionCount: Int
    miner: String
  }
  
  type NetworkStats {
    chainId: String!
    chainName: String!
    currentBlock: Int!
    blockTime: String!
    peerCount: Int!
  }
  
  type GasOracle {
    safeGasPrice: String!
    proposeGasPrice: String!
    fastGasPrice: String!
  }
`);

// GraphQL Resolvers
const root = {
  account: async ({ address }) => {
    const provider = getProvider();
    const validAddress = validateAddress(address);
    if (!validAddress) throw new Error('Invalid address');
    
    const balance = await provider.getBalance(validAddress);
    const txCount = await provider.getTransactionCount(validAddress);
    
    return {
      address: validAddress,
      balance: balance.toString(),
      transactionCount: txCount
    };
  },
  
  balance: async ({ address }) => {
    const provider = getProvider();
    const validAddress = validateAddress(address);
    if (!validAddress) throw new Error('Invalid address');
    
    const balance = await provider.getBalance(validAddress);
    return balance.toString();
  },
  
  token: async ({ contractAddress }) => {
    const provider = getProvider();
    const validAddress = validateAddress(contractAddress);
    if (!validAddress) throw new Error('Invalid contract address');
    
    const ERC20_ABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(validAddress, ERC20_ABI, provider);
    
    try {
      const [name, symbol, decimals, supply] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => BigInt(0))
      ]);
      
      return {
        address: validAddress,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: supply.toString()
      };
    } catch (error) {
      throw new Error('Failed to fetch token info');
    }
  },
  
  transaction: async ({ hash }) => {
    const provider = getProvider();
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(hash).catch(() => null),
      provider.getTransactionReceipt(hash).catch(() => null)
    ]);
    
    if (!tx) throw new Error('Transaction not found');
    
    const block = tx.blockNumber ? await provider.getBlock(tx.blockNumber).catch(() => null) : null;
    
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      blockNumber: tx.blockNumber,
      timestamp: block ? Number(block.timestamp) : null,
      gas: tx.gas.toString(),
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : null,
      status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending'
    };
  },
  
  block: async ({ number }) => {
    const provider = getProvider();
    const blockNumber = number || await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, true);
    
    if (!block) throw new Error('Block not found');
    
    return {
      number: block.number,
      hash: block.hash,
      timestamp: Number(block.timestamp),
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      transactionCount: block.transactions ? block.transactions.length : 0,
      miner: block.miner || block.author || '0x0000000000000000000000000000000000000000'
    };
  },
  
  latestBlock: async () => {
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, true);
    
    return {
      number: block.number,
      hash: block.hash,
      timestamp: Number(block.timestamp),
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      transactionCount: block.transactions ? block.transactions.length : 0,
      miner: block.miner || block.author || '0x0000000000000000000000000000000000000000'
    };
  },
  
  networkStats: async () => {
    const provider = getProvider();
    const [currentBlock, peerCount] = await Promise.all([
      provider.getBlockNumber(),
      provider.send('net_peerCount', []).catch(() => '0x0')
    ]);
    
    return {
      chainId: process.env.CHAIN_ID || '65001',
      chainName: 'Nor Chain',
      currentBlock,
      blockTime: '3',
      peerCount: parseInt(peerCount, 16)
    };
  },
  
  gasOracle: async () => {
    const provider = getProvider();
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(3000000000);
    
    return {
      safeGasPrice: gasPrice.toString(),
      proposeGasPrice: gasPrice.toString(),
      fastGasPrice: gasPrice.toString()
    };
  }
};

// GraphQL endpoint
router.use(
  '/',
  defaultRateLimiter,
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true, // Enable GraphiQL interface
    customFormatErrorFn: (err) => {
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: {
          code: 'GRAPHQL_ERROR',
          help: 'https://docs.norchain.org/api/graphql'
        }
      };
    }
  })
);

export default router;

