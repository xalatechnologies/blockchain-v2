#!/usr/bin/env node
/**
 * API Test Script
 * Quick test of all major endpoints
 */

import { NorChainAPI } from '../sdk/norchain-sdk-js/src/index.js';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
const TEST_TOKEN = '0x26c0eaF731885b14c031cc50dB79b36458E0b355';

async function testAPI() {
  console.log('🧪 Testing Nor Chain API...\n');
  
  const api = new NorChainAPI({
    baseURL: API_URL.replace('/api', ''),
    chainId: 65001
  });
  
  const tests = [];
  
  // Test 1: Account Balance
  try {
    const balance = await api.account.getBalance(TEST_ADDRESS);
    tests.push({ name: 'Account Balance', status: '✅', result: balance });
  } catch (error) {
    tests.push({ name: 'Account Balance', status: '❌', error: error.message });
  }
  
  // Test 2: Token Info
  try {
    const tokenInfo = await api.token.getInfo(TEST_TOKEN);
    tests.push({ name: 'Token Info', status: '✅', result: `${tokenInfo.name} (${tokenInfo.symbol})` });
  } catch (error) {
    tests.push({ name: 'Token Info', status: '❌', error: error.message });
  }
  
  // Test 3: Network Stats
  try {
    const stats = await api.stats.getNetworkStats();
    tests.push({ name: 'Network Stats', status: '✅', result: `Chain ID: ${stats.result.chainId}` });
  } catch (error) {
    tests.push({ name: 'Network Stats', status: '❌', error: error.message });
  }
  
  // Test 4: Gas Oracle
  try {
    const gas = await api.stats.getGasOracle();
    tests.push({ name: 'Gas Oracle', status: '✅', result: `Safe: ${gas.result.SafeGasPrice}` });
  } catch (error) {
    tests.push({ name: 'Gas Oracle', status: '❌', error: error.message });
  }
  
  // Print results
  console.log('Test Results:\n');
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    if (test.result) {
      console.log(`   ${test.result}`);
    }
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  const passed = tests.filter(t => t.status === '✅').length;
  const failed = tests.filter(t => t.status === '❌').length;
  
  console.log(`\n📊 ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

testAPI().catch(console.error);

