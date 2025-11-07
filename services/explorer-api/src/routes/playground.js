import express from 'express';
import { defaultRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider, validateAddress, formatResponse } from '../utils/provider.js';
import { ethers } from 'ethers';

const router = express.Router();

/**
 * GET /api/playground
 * Interactive API playground endpoint
 */
router.get('/', defaultRateLimiter, asyncHandler(async (req, res) => {
  res.json({
    name: 'Nor Chain API Playground',
    description: 'Interactive API testing and exploration',
    version: '1.0.0',
    endpoints: {
      test: '/api/playground/test',
      examples: '/api/playground/examples',
      migrate: '/api/playground/migrate'
    },
    quickStart: {
      getBalance: 'GET /api/account/balance?address=0x...',
      getTransaction: 'GET /api/transaction/gettxinfo?txhash=0x...',
      getTokenInfo: 'GET /api/token/tokeninfo?contractaddress=0x...'
    },
    documentation: 'https://docs.norchain.org/api',
    sdk: 'https://github.com/nor-chain/norchain-sdk-js',
    support: 'https://discord.gg/norchain'
  });
}));

/**
 * POST /api/playground/test
 * Test API endpoint with sample requests
 */
router.post('/test', defaultRateLimiter, asyncHandler(async (req, res) => {
  const { endpoint, params } = req.body;

  // Sample test endpoints
  const testEndpoints = {
    'account/balance': async () => {
      const address = params?.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const provider = getProvider();
      const balance = await provider.getBalance(address);
      return {
        endpoint: 'account/balance',
        params: { address },
        result: ethers.formatEther(balance),
        example: `GET /api/account/balance?address=${address}`
      };
    },
    'token/tokeninfo': async () => {
      const contractAddress = params?.contractaddress || '0x26c0eaF731885b14c031cc50dB79b36458E0b355';
      const provider = getProvider();
      const ERC20_ABI = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ];
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
      const [name, symbol, decimals, supply] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => BigInt(0))
      ]);
      return {
        endpoint: 'token/tokeninfo',
        params: { contractaddress: contractAddress },
        result: { name, symbol, decimals: decimals.toString(), totalSupply: supply.toString() },
        example: `GET /api/token/tokeninfo?contractaddress=${contractAddress}`
      };
    },
    'stats/networkstats': async () => {
      const provider = getProvider();
      const [currentBlock, block, peerCount] = await Promise.all([
        provider.getBlockNumber(),
        provider.getBlock('latest'),
        provider.send('net_peerCount', []).catch(() => '0x0')
      ]);
      return {
        endpoint: 'stats/networkstats',
        params: {},
        result: {
          chainId: process.env.CHAIN_ID || '65001',
          chainName: 'Nor Chain',
          currentBlock: currentBlock.toString(),
          blockTime: '3',
          peerCount: parseInt(peerCount, 16).toString()
        },
        example: 'GET /api/stats/networkstats'
      };
    }
  };

  if (!endpoint || !testEndpoints[endpoint]) {
    return res.json({
      error: 'Invalid endpoint',
      available: Object.keys(testEndpoints),
      usage: 'POST /api/playground/test with body: { "endpoint": "account/balance", "params": {...} }'
    });
  }

  try {
    const result = await testEndpoints[endpoint]();
    res.json({
      success: true,
      ...result,
      curl: `curl "https://api.norchain.org/api/${result.endpoint}?${new URLSearchParams(result.params).toString()}"`,
      javascript: generateJavaScriptExample(result.endpoint, result.params)
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      help: 'https://docs.norchain.org/api'
    });
  }
}));

/**
 * GET /api/playground/examples
 * Get code examples for different languages
 */
router.get('/examples', defaultRateLimiter, asyncHandler(async (req, res) => {
  const { language = 'javascript' } = req.query;

  const examples = {
    javascript: {
      name: 'JavaScript/Node.js',
      install: 'npm install @norchain/sdk',
      code: `
import { NorChainAPI } from '@norchain/sdk';

const api = new NorChainAPI({
  apiKey: 'YOUR_API_KEY', // Optional
  chainId: 65001
});

// Get balance
const balance = await api.account.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
console.log('Balance:', balance);

// Get token info
const tokenInfo = await api.token.getInfo('0x26c0eaF731885b14c031cc50dB79b36458E0b355');
console.log('Token:', tokenInfo);

// Get transaction
const tx = await api.transaction.getInfo('0x...');
console.log('Transaction:', tx);
      `.trim(),
      fetch: `
// Using fetch (no SDK)
const response = await fetch(
  'https://api.norchain.org/api/account/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
);
const data = await response.json();
console.log('Balance:', data.result);
      `.trim()
    },
    python: {
      name: 'Python',
      install: 'pip install norchain-sdk',
      code: `
from norchain import NorChainAPI

api = NorChainAPI(api_key='YOUR_API_KEY', chain_id=65001)

# Get balance
balance = api.account.get_balance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
print(f'Balance: {balance}')

# Get token info
token_info = api.token.get_info('0x26c0eaF731885b14c031cc50dB79b36458E0b355')
print(f'Token: {token_info}')

# Get transaction
tx = api.transaction.get_info('0x...')
print(f'Transaction: {tx}')
      `.trim(),
      requests: `
# Using requests (no SDK)
import requests

response = requests.get(
    'https://api.norchain.org/api/account/balance',
    params={'address': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'}
)
data = response.json()
print(f'Balance: {data["result"]}')
      `.trim()
    },
    curl: {
      name: 'cURL',
      code: `
# Get balance
curl "https://api.norchain.org/api/account/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"

# Get token info
curl "https://api.norchain.org/api/token/tokeninfo?contractaddress=0x26c0eaF731885b14c031cc50dB79b36458E0b355"

# Get transaction
curl "https://api.norchain.org/api/transaction/gettxinfo?txhash=0x..."

# With API key
curl "https://api.norchain.org/api/account/balance?address=0x...&apikey=YOUR_API_KEY"
      `.trim()
    }
  };

  res.json({
    language: language,
    examples: examples[language] || examples.javascript,
    allLanguages: Object.keys(examples),
    documentation: 'https://docs.norchain.org/api/examples'
  });
}));

/**
 * GET /api/playground/migrate
 * Migration guide from Etherscan/BSCScan
 */
router.get('/migrate', defaultRateLimiter, asyncHandler(async (req, res) => {
  res.json({
    title: 'Migrate from Etherscan/BSCScan to Nor Chain API',
    description: 'Easy migration guide for developers',
    compatibility: {
      endpoints: '100% compatible - same parameter names and response format',
      responseFormat: 'Identical to Etherscan/BSCScan',
      parameters: 'Same parameter names and types'
    },
    migrationSteps: [
      {
        step: 1,
        title: 'Update Base URL',
        from: 'https://api.etherscan.io/api',
        to: 'https://api.norchain.org/api',
        example: {
          before: 'https://api.etherscan.io/api?module=account&action=balance&address=0x...&apikey=YOUR_KEY',
          after: 'https://api.norchain.org/api/account/balance?address=0x...&apikey=YOUR_KEY'
        }
      },
      {
        step: 2,
        title: 'Update Endpoint Format',
        description: 'Nor Chain API uses RESTful endpoints instead of query parameters',
        examples: [
          {
            etherscan: '?module=account&action=balance&address=0x...',
            norchain: '/api/account/balance?address=0x...'
          },
          {
            etherscan: '?module=token&action=tokeninfo&contractaddress=0x...',
            norchain: '/api/token/tokeninfo?contractaddress=0x...'
          }
        ]
      },
      {
        step: 3,
        title: 'Get API Key (Optional)',
        description: 'Get your free API key for higher rate limits',
        link: 'https://api.norchain.org/keys',
        benefits: [
          'Higher rate limits',
          'Priority support',
          'Advanced features'
        ]
      },
      {
        step: 4,
        title: 'Test Your Integration',
        description: 'Use our playground to test endpoints',
        link: 'https://api.norchain.org/playground'
      }
    ],
    endpointMapping: {
      'account/balance': {
        etherscan: '?module=account&action=balance',
        norchain: '/api/account/balance',
        params: ['address', 'tag']
      },
      'account/txlist': {
        etherscan: '?module=account&action=txlist',
        norchain: '/api/account/txlist',
        params: ['address', 'startblock', 'endblock', 'page', 'offset', 'sort']
      },
      'token/tokeninfo': {
        etherscan: '?module=token&action=tokeninfo',
        norchain: '/api/token/tokeninfo',
        params: ['contractaddress']
      },
      'transaction/gettxreceipt': {
        etherscan: '?module=transaction&action=gettxreceipt',
        norchain: '/api/transaction/gettxreceipt',
        params: ['txhash']
      }
    },
    sdk: {
      javascript: 'npm install @norchain/sdk',
      python: 'pip install norchain-sdk',
      documentation: 'https://docs.norchain.org/api/sdk'
    },
    support: {
      discord: 'https://discord.gg/norchain',
      email: 'dev@norchain.org',
      documentation: 'https://docs.norchain.org/api/migration'
    }
  });
}));

function generateJavaScriptExample(endpoint, params) {
  const paramsStr = Object.entries(params)
    .map(([key, value]) => `  ${key}: '${value}'`)
    .join(',\n');
  
  return `
const response = await fetch(
  'https://api.norchain.org/api/${endpoint}?' + 
  new URLSearchParams({
${paramsStr}
  })
);
const data = await response.json();
console.log(data.result);
  `.trim();
}

export default router;

