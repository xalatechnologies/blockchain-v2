#!/usr/bin/env node
/**
 * Health Check Script
 * Run this to verify API is healthy before deployment
 */

import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TIMEOUT = 5000;

const checks = [
  {
    name: 'Health Check',
    endpoint: '/health',
    expectedStatus: 200
  },
  {
    name: 'Liveness Probe',
    endpoint: '/health/live',
    expectedStatus: 200
  },
  {
    name: 'Readiness Probe',
    endpoint: '/health/ready',
    expectedStatus: 200
  },
  {
    name: 'Metrics',
    endpoint: '/health/metrics',
    expectedStatus: 200
  },
  {
    name: 'API Root',
    endpoint: '/',
    expectedStatus: 200
  },
  {
    name: 'Account Balance',
    endpoint: '/api/account/balance?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    expectedStatus: 200
  }
];

async function checkEndpoint(name, endpoint, expectedStatus) {
  return new Promise((resolve) => {
    const url = `${API_URL}${endpoint}`;
    const startTime = Date.now();
    
    const req = http.get(url, { timeout: TIMEOUT }, (res) => {
      const duration = Date.now() - startTime;
      const success = res.statusCode === expectedStatus;
      
      resolve({
        name,
        endpoint,
        status: res.statusCode,
        expected: expectedStatus,
        success,
        duration: `${duration}ms`
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name,
        endpoint,
        status: 'ERROR',
        expected: expectedStatus,
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        endpoint,
        status: 'TIMEOUT',
        expected: expectedStatus,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runHealthChecks() {
  console.log('🏥 Running Health Checks...\n');
  console.log(`Target: ${API_URL}\n`);
  
  const results = await Promise.all(
    checks.map(check => checkEndpoint(check.name, check.endpoint, check.expectedStatus))
  );
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.status} (${result.duration})`);
      passed++;
    } else {
      console.log(`❌ ${result.name}: ${result.status} (expected ${result.expected})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some health checks failed. Review before deployment.');
    process.exit(1);
  } else {
    console.log('\n✅ All health checks passed!');
    process.exit(0);
  }
}

runHealthChecks();

