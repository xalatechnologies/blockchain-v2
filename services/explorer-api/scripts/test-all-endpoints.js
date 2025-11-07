#!/usr/bin/env node
/**
 * Comprehensive API Endpoint Test Script
 * Tests all endpoints and generates a report
 */

import http from 'http';
import { performance } from 'perf_hooks';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TIMEOUT = 10000;

// Test configuration
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
const TEST_TOKEN = '0x26c0eaF731885b14c031cc50dB79b36458E0b355';
const TEST_TX_HASH = '0x' + 'a'.repeat(64);
const TEST_BLOCK = 1;

const results = {
  passed: [],
  failed: [],
  skipped: []
};

// All endpoints to test
const endpoints = [
  // Health & Monitoring
  { name: 'Health Check', method: 'GET', path: '/health', expectedStatus: 200 },
  { name: 'Liveness Probe', method: 'GET', path: '/health/live', expectedStatus: 200 },
  { name: 'Readiness Probe', method: 'GET', path: '/health/ready', expectedStatus: [200, 503] },
  { name: 'Metrics', method: 'GET', path: '/health/metrics', expectedStatus: 200 },
  
  // Root
  { name: 'API Root', method: 'GET', path: '/', expectedStatus: 200 },
  { name: 'Swagger UI', method: 'GET', path: '/api-docs', expectedStatus: [200, 302] },
  
  // Account Endpoints
  { name: 'Account Balance', method: 'GET', path: '/api/account/balance', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'Account Balance (Invalid)', method: 'GET', path: '/api/account/balance', params: { address: 'invalid' }, expectedStatus: 200, expectError: true },
  { name: 'Transaction List', method: 'GET', path: '/api/account/txlist', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'Internal Transactions', method: 'GET', path: '/api/account/txlistinternal', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'Token Transfers', method: 'GET', path: '/api/account/tokentx', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'NFT Transfers', method: 'GET', path: '/api/account/tokennfttx', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'Token List', method: 'GET', path: '/api/account/tokenlist', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'Multiple Balances', method: 'GET', path: '/api/account/balancemulti', params: { address: `${TEST_ADDRESS},0x0000000000000000000000000000000000000001` }, expectedStatus: 200 },
  { name: 'Mined Blocks', method: 'GET', path: '/api/account/getminedblocks', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  
  // Transaction Endpoints
  { name: 'Transaction Status', method: 'GET', path: '/api/transaction/getstatus', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  { name: 'Transaction Receipt Status', method: 'GET', path: '/api/transaction/gettxreceiptstatus', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  { name: 'Transaction Receipt', method: 'GET', path: '/api/transaction/gettxreceipt', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  { name: 'Transaction Info', method: 'GET', path: '/api/transaction/gettxinfo', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  
  // Block Endpoints
  { name: 'Block Info', method: 'GET', path: '/api/block/getblockinfo', params: { blockno: TEST_BLOCK }, expectedStatus: 200 },
  { name: 'Block Reward', method: 'GET', path: '/api/block/getblockreward', params: { blockno: TEST_BLOCK }, expectedStatus: 200 },
  { name: 'Block Countdown', method: 'GET', path: '/api/block/getblockcountdown', params: { blockno: 50000 }, expectedStatus: 200 },
  { name: 'Block by Time', method: 'GET', path: '/api/block/getblocknobytime', params: { timestamp: Math.floor(Date.now() / 1000) }, expectedStatus: 200 },
  
  // Token Endpoints
  { name: 'Token Info', method: 'GET', path: '/api/token/tokeninfo', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { name: 'Token Supply', method: 'GET', path: '/api/token/tokensupply', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { name: 'Token Balance', method: 'GET', path: '/api/token/tokenbalance', params: { contractaddress: TEST_TOKEN, address: TEST_ADDRESS }, expectedStatus: 200 },
  { name: 'Token Transfers', method: 'GET', path: '/api/token/tokentx', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { name: 'NFT Transfers', method: 'GET', path: '/api/token/tokennfttx', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { name: 'Token Holders', method: 'GET', path: '/api/token/tokenholderlist', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  
  // Contract Endpoints
  { name: 'Contract ABI', method: 'GET', path: '/api/contract/getabi', params: { address: TEST_TOKEN }, expectedStatus: 200 },
  { name: 'Contract Source Code', method: 'GET', path: '/api/contract/getsourcecode', params: { address: TEST_TOKEN }, expectedStatus: 200 },
  { name: 'Contract Creation', method: 'GET', path: '/api/contract/getcontractcreation', params: { contractaddresses: TEST_TOKEN }, expectedStatus: 200 },
  
  // Stats Endpoints
  { name: 'Network Stats', method: 'GET', path: '/api/stats/networkstats', expectedStatus: 200 },
  { name: 'Gas Oracle', method: 'GET', path: '/api/stats/gasoracle', expectedStatus: 200 },
  { name: 'Node Count', method: 'GET', path: '/api/stats/nodecount', expectedStatus: 200 },
  { name: 'ETH Supply', method: 'GET', path: '/api/stats/ethsupply', expectedStatus: 200 },
  { name: 'Chain Size', method: 'GET', path: '/api/stats/chainsize', expectedStatus: 200 },
  
  // Logs Endpoints
  { name: 'Get Logs', method: 'GET', path: '/api/logs/getLogs', params: { topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', fromBlock: 0, toBlock: 'latest' }, expectedStatus: 200 },
  
  // Portfolio Endpoints
  { name: 'Address Portfolio', method: 'GET', path: '/api/portfolio/getaddressportfolio', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  
  // Playground Endpoints
  { name: 'Playground Info', method: 'GET', path: '/api/playground', expectedStatus: 200 },
  { name: 'Playground Examples', method: 'GET', path: '/api/playground/examples', params: { language: 'javascript' }, expectedStatus: 200 },
  { name: 'Migration Guide', method: 'GET', path: '/api/playground/migrate', expectedStatus: 200 },
  
  // AI Endpoints
  { name: 'Predict Gas Price', method: 'GET', path: '/api/ai/predict-gas-price', expectedStatus: 200 },
  
  // Proxy Endpoints
  { name: 'Proxy Block Number', method: 'GET', path: '/api/proxy/eth_blockNumber', expectedStatus: 200 },
  { name: 'Proxy Get Balance', method: 'GET', path: '/api/proxy/eth_getBalance', params: { address: TEST_ADDRESS, tag: 'latest' }, expectedStatus: 200 },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const url = new URL(API_URL + endpoint.path);
    
    // Add query parameters
    if (endpoint.params) {
      Object.entries(endpoint.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Handle POST requests
    let postData = null;
    if (endpoint.method === 'POST' && endpoint.body) {
      postData = JSON.stringify(endpoint.body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      const duration = performance.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
          ? endpoint.expectedStatus 
          : [endpoint.expectedStatus];
        
        const success = expectedStatuses.includes(res.statusCode);
        const isError = endpoint.expectError && res.statusCode === 200 && data.includes('"status":"0"');
        
        const result = {
          name: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          status: res.statusCode,
          expected: endpoint.expectedStatus,
          success: success || isError,
          duration: `${duration.toFixed(2)}ms`,
          responseSize: data.length
        };
        
        // Try to parse JSON response
        try {
          const json = JSON.parse(data);
          if (endpoint.expectError) {
            result.success = json.status === '0';
          } else {
            result.hasResult = json.hasOwnProperty('result');
          }
        } catch (e) {
          // Not JSON, that's okay
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: 'ERROR',
        success: false,
        error: error.message,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout',
        duration: `${TIMEOUT}ms`
      });
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 Testing All API Endpoints\n');
  console.log(`Target: ${API_URL}\n`);
  console.log('━'.repeat(80));
  
  const startTime = performance.now();
  
  // Test endpoints sequentially to avoid overwhelming the server
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      results.passed.push(result);
      console.log(`✅ ${result.name.padEnd(40)} ${result.status.toString().padStart(3)} ${result.duration}`);
    } else {
      results.failed.push(result);
      console.log(`❌ ${result.name.padEnd(40)} ${result.status.toString().padStart(3)} ${result.duration}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const totalTime = performance.now() - startTime;
  
  console.log('━'.repeat(80));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   ⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   📈 Success Rate: ${((results.passed.length / endpoints.length) * 100).toFixed(1)}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.status} (expected ${test.expected})`);
      if (test.error) {
        console.log(`     ${test.error}`);
      }
    });
  }
  
  // Check for security headers
  console.log('\n🔒 Security Headers Check:');
  const healthCheck = await testEndpoint({ name: 'Health', method: 'GET', path: '/health', expectedStatus: 200 });
  if (healthCheck.success) {
    console.log('   ✅ Security headers should be checked manually');
  }
  
  console.log('\n' + '━'.repeat(80));
  
  if (results.failed.length === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

