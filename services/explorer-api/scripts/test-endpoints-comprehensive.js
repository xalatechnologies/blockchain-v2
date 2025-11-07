#!/usr/bin/env node
/**
 * Comprehensive Endpoint Test Script
 * Tests all API endpoints and generates detailed report
 * Can run standalone without Jest
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TIMEOUT = 15000;
const OUTPUT_FILE = path.join(__dirname, '../test-results.json');

// Test data
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
const TEST_TOKEN = '0x26c0eaF731885b14c031cc50dB79b36458E0b355';
const TEST_TX_HASH = '0x' + 'a'.repeat(64);
const TEST_BLOCK = 1;

const testResults = {
  timestamp: new Date().toISOString(),
  apiUrl: API_URL,
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Comprehensive endpoint list
const endpoints = [
  // Health & Monitoring
  { category: 'Health', name: 'Health Check', method: 'GET', path: '/health', expectedStatus: 200 },
  { category: 'Health', name: 'Liveness Probe', method: 'GET', path: '/health/live', expectedStatus: 200 },
  { category: 'Health', name: 'Readiness Probe', method: 'GET', path: '/health/ready', expectedStatus: [200, 503] },
  { category: 'Health', name: 'Prometheus Metrics', method: 'GET', path: '/health/metrics', expectedStatus: 200 },
  
  // Root & Docs
  { category: 'Root', name: 'API Root', method: 'GET', path: '/', expectedStatus: 200 },
  { category: 'Root', name: 'Swagger UI', method: 'GET', path: '/api-docs', expectedStatus: [200, 302] },
  
  // Account
  { category: 'Account', name: 'Get Balance', method: 'GET', path: '/api/account/balance', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Account', name: 'Get Balance (Invalid)', method: 'GET', path: '/api/account/balance', params: { address: 'invalid' }, expectedStatus: 200, expectError: true },
  { category: 'Account', name: 'Get Balance (Missing)', method: 'GET', path: '/api/account/balance', expectedStatus: 200, expectError: true },
  { category: 'Account', name: 'Transaction List', method: 'GET', path: '/api/account/txlist', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Account', name: 'Internal Transactions', method: 'GET', path: '/api/account/txlistinternal', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Account', name: 'Token Transfers', method: 'GET', path: '/api/account/tokentx', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Account', name: 'NFT Transfers', method: 'GET', path: '/api/account/tokennfttx', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Account', name: 'Token List', method: 'GET', path: '/api/account/tokenlist', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Account', name: 'Multiple Balances', method: 'GET', path: '/api/account/balancemulti', params: { address: `${TEST_ADDRESS},0x0000000000000000000000000000000000000001` }, expectedStatus: 200 },
  { category: 'Account', name: 'Mined Blocks', method: 'GET', path: '/api/account/getminedblocks', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  
  // Transaction
  { category: 'Transaction', name: 'Get Status', method: 'GET', path: '/api/transaction/getstatus', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  { category: 'Transaction', name: 'Get Receipt Status', method: 'GET', path: '/api/transaction/gettxreceiptstatus', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  { category: 'Transaction', name: 'Get Receipt', method: 'GET', path: '/api/transaction/gettxreceipt', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  { category: 'Transaction', name: 'Get Transaction Info', method: 'GET', path: '/api/transaction/gettxinfo', params: { txhash: TEST_TX_HASH }, expectedStatus: 200 },
  
  // Block
  { category: 'Block', name: 'Get Block Info', method: 'GET', path: '/api/block/getblockinfo', params: { blockno: TEST_BLOCK }, expectedStatus: 200 },
  { category: 'Block', name: 'Get Block Reward', method: 'GET', path: '/api/block/getblockreward', params: { blockno: TEST_BLOCK }, expectedStatus: 200 },
  { category: 'Block', name: 'Get Block Countdown', method: 'GET', path: '/api/block/getblockcountdown', params: { blockno: 50000 }, expectedStatus: 200 },
  { category: 'Block', name: 'Get Block by Time', method: 'GET', path: '/api/block/getblocknobytime', params: { timestamp: Math.floor(Date.now() / 1000) }, expectedStatus: 200 },
  
  // Token
  { category: 'Token', name: 'Get Token Info', method: 'GET', path: '/api/token/tokeninfo', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { category: 'Token', name: 'Get Token Supply', method: 'GET', path: '/api/token/tokensupply', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { category: 'Token', name: 'Get Token Balance', method: 'GET', path: '/api/token/tokenbalance', params: { contractaddress: TEST_TOKEN, address: TEST_ADDRESS }, expectedStatus: 200 },
  { category: 'Token', name: 'Get Token Transfers', method: 'GET', path: '/api/token/tokentx', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { category: 'Token', name: 'Get NFT Transfers', method: 'GET', path: '/api/token/tokennfttx', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  { category: 'Token', name: 'Get Token Holders', method: 'GET', path: '/api/token/tokenholderlist', params: { contractaddress: TEST_TOKEN }, expectedStatus: 200 },
  
  // Contract
  { category: 'Contract', name: 'Get Contract ABI', method: 'GET', path: '/api/contract/getabi', params: { address: TEST_TOKEN }, expectedStatus: 200 },
  { category: 'Contract', name: 'Get Source Code', method: 'GET', path: '/api/contract/getsourcecode', params: { address: TEST_TOKEN }, expectedStatus: 200 },
  { category: 'Contract', name: 'Get Contract Creation', method: 'GET', path: '/api/contract/getcontractcreation', params: { contractaddresses: TEST_TOKEN }, expectedStatus: 200 },
  
  // Stats
  { category: 'Stats', name: 'Network Stats', method: 'GET', path: '/api/stats/networkstats', expectedStatus: 200 },
  { category: 'Stats', name: 'Gas Oracle', method: 'GET', path: '/api/stats/gasoracle', expectedStatus: 200 },
  { category: 'Stats', name: 'Node Count', method: 'GET', path: '/api/stats/nodecount', expectedStatus: 200 },
  { category: 'Stats', name: 'ETH Supply', method: 'GET', path: '/api/stats/ethsupply', expectedStatus: 200 },
  { category: 'Stats', name: 'Chain Size', method: 'GET', path: '/api/stats/chainsize', expectedStatus: 200 },
  
  // Logs
  { category: 'Logs', name: 'Get Logs', method: 'GET', path: '/api/logs/getLogs', params: { topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', fromBlock: 0, toBlock: 'latest' }, expectedStatus: 200 },
  
  // Portfolio
  { category: 'Portfolio', name: 'Get Address Portfolio', method: 'GET', path: '/api/portfolio/getaddressportfolio', params: { address: TEST_ADDRESS }, expectedStatus: 200 },
  
  // Playground
  { category: 'Playground', name: 'Playground Info', method: 'GET', path: '/api/playground', expectedStatus: 200 },
  { category: 'Playground', name: 'Playground Examples', method: 'GET', path: '/api/playground/examples', params: { language: 'javascript' }, expectedStatus: 200 },
  { category: 'Playground', name: 'Migration Guide', method: 'GET', path: '/api/playground/migrate', expectedStatus: 200 },
  
  // AI
  { category: 'AI', name: 'Predict Gas Price', method: 'GET', path: '/api/ai/predict-gas-price', expectedStatus: 200 },
  
  // Proxy
  { category: 'Proxy', name: 'Proxy Block Number', method: 'GET', path: '/api/proxy/eth_blockNumber', expectedStatus: 200 },
  { category: 'Proxy', name: 'Proxy Get Balance', method: 'GET', path: '/api/proxy/eth_getBalance', params: { address: TEST_ADDRESS, tag: 'latest' }, expectedStatus: 200 },
];

async function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const url = new URL(API_URL + endpoint.path);
    
    // Add query parameters
    if (endpoint.params) {
      Object.entries(endpoint.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'NorChain-API-Tester/1.0',
        'Accept': 'application/json'
      }
    };
    
    // Handle POST
    let postData = null;
    if (endpoint.method === 'POST' && endpoint.body) {
      postData = JSON.stringify(endpoint.body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = client.request(options, (res) => {
      const duration = performance.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
          ? endpoint.expectedStatus 
          : [endpoint.expectedStatus];
        
        let success = expectedStatuses.includes(res.statusCode);
        let responseData = null;
        
        // Try to parse JSON
        try {
          responseData = JSON.parse(data);
          if (endpoint.expectError) {
            success = responseData.status === '0';
          }
        } catch (e) {
          // Not JSON, that's okay
        }
        
        resolve({
          name: endpoint.name,
          category: endpoint.category,
          method: endpoint.method,
          path: endpoint.path,
          status: res.statusCode,
          expectedStatus: endpoint.expectedStatus,
          success,
          duration: duration,
          responseSize: data.length,
          headers: res.headers,
          hasResult: responseData && responseData.hasOwnProperty('result'),
          error: endpoint.expectError && responseData ? responseData.message : null
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        category: endpoint.category,
        method: endpoint.method,
        path: endpoint.path,
        status: 'ERROR',
        success: false,
        error: error.message,
        duration: performance.now() - startTime
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        category: endpoint.category,
        method: endpoint.method,
        path: endpoint.path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout',
        duration: TIMEOUT
      });
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Comprehensive API Endpoint Testing\n');
  console.log(`Target: ${API_URL}`);
  console.log(`Total Endpoints: ${endpoints.length}\n`);
  console.log('━'.repeat(100));
  
  const startTime = performance.now();
  
  // Group by category
  const byCategory = {};
  endpoints.forEach(ep => {
    if (!byCategory[ep.category]) {
      byCategory[ep.category] = [];
    }
    byCategory[ep.category].push(ep);
  });
  
  // Test each endpoint
  for (const [category, categoryEndpoints] of Object.entries(byCategory)) {
    console.log(`\n📁 ${category} (${categoryEndpoints.length} endpoints)`);
    console.log('─'.repeat(100));
    
    for (const endpoint of categoryEndpoints) {
      testResults.total++;
      const result = await makeRequest(endpoint);
      testResults.tests.push(result);
      
      const statusIcon = result.success ? '✅' : '❌';
      const statusText = typeof result.status === 'number' ? result.status.toString() : result.status;
      const durationText = `${result.duration.toFixed(0)}ms`.padStart(8);
      
      console.log(`${statusIcon} ${result.name.padEnd(45)} ${statusText.padStart(3)} ${durationText}`);
      
      if (result.success) {
        testResults.passed++;
      } else {
        testResults.failed++;
        if (result.error) {
          console.log(`   ⚠️  ${result.error}`);
        }
      }
      
      // Small delay to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  const totalTime = performance.now() - startTime;
  testResults.totalTime = totalTime;
  testResults.successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  
  // Print summary
  console.log('\n' + '━'.repeat(100));
  console.log('\n📊 Test Summary');
  console.log('━'.repeat(100));
  console.log(`Total Tests:     ${testResults.total}`);
  console.log(`✅ Passed:       ${testResults.passed} (${testResults.successRate}%)`);
  console.log(`❌ Failed:       ${testResults.failed}`);
  console.log(`⏱️  Total Time:   ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📈 Avg Response:  ${(totalTime / testResults.total).toFixed(0)}ms`);
  
  // Category breakdown
  console.log('\n📁 Results by Category');
  console.log('━'.repeat(100));
  const categoryStats = {};
  testResults.tests.forEach(test => {
    if (!categoryStats[test.category]) {
      categoryStats[test.category] = { total: 0, passed: 0 };
    }
    categoryStats[test.category].total++;
    if (test.success) {
      categoryStats[test.category].passed++;
    }
  });
  
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    const icon = stats.passed === stats.total ? '✅' : '⚠️';
    console.log(`${icon} ${category.padEnd(20)} ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  // Failed tests details
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests Details');
    console.log('━'.repeat(100));
    testResults.tests
      .filter(t => !t.success)
      .forEach(test => {
        console.log(`\n${test.name} (${test.method} ${test.path})`);
        console.log(`   Status: ${test.status} (expected ${test.expectedStatus})`);
        if (test.error) {
          console.log(`   Error: ${test.error}`);
        }
        if (test.duration) {
          console.log(`   Duration: ${test.duration.toFixed(0)}ms`);
        }
      });
  }
  
  // Security headers check
  console.log('\n🔒 Security Headers Check');
  console.log('━'.repeat(100));
  const healthTest = testResults.tests.find(t => t.path === '/health');
  if (healthTest && healthTest.headers) {
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    securityHeaders.forEach(header => {
      const present = healthTest.headers[header] || healthTest.headers[header.toLowerCase()];
      console.log(`${present ? '✅' : '❌'} ${header}: ${present || 'missing'}`);
    });
  }
  
  // Save results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Results saved to: ${OUTPUT_FILE}`);
  
  console.log('\n' + '━'.repeat(100));
  
  if (testResults.failed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testResults.failed} test(s) failed. Review details above.`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

