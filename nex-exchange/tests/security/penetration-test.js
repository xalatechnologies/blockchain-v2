#!/usr/bin/env node

/**
 * Penetration Testing Script
 * Tests for common security vulnerabilities
 */

const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Test cases
const testCases = [
  {
    name: "SQL Injection in tokenIn parameter",
    test: async () => {
      const payload = JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80'; DROP TABLE users; --",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "100",
        chainId: 65001,
      });

      const response = await fetch(`${BASE_URL}/api/swap/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      // Should reject invalid input, not execute SQL
      return response.status === 400;
    },
  },
  {
    name: "XSS in amountIn parameter",
    test: async () => {
      const payload = JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "<script>alert('XSS')</script>",
        chainId: 65001,
      });

      const response = await fetch(`${BASE_URL}/api/swap/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      // Should reject invalid input
      return response.status === 400;
    },
  },
  {
    name: "Rate limiting",
    test: async () => {
      const payload = JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "100",
        chainId: 65001,
      });

      // Send 150 requests rapidly
      const requests = Array(150).fill(null).map(() =>
        fetch(`${BASE_URL}/api/swap/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      // Should rate limit after threshold
      return rateLimited.length > 0;
    },
  },
  {
    name: "Input validation - negative amounts",
    test: async () => {
      const payload = JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "-100",
        chainId: 65001,
      });

      const response = await fetch(`${BASE_URL}/api/swap/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      return response.status === 400;
    },
  },
  {
    name: "Input validation - extremely large amounts",
    test: async () => {
      const payload = JSON.stringify({
        tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
        tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
        amountIn: "999999999999999999999999999999",
        chainId: 65001,
      });

      const response = await fetch(`${BASE_URL}/api/swap/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      // Should handle gracefully (either reject or process)
      return response.status !== 500;
    },
  },
];

async function runPenetrationTests() {
  console.log("🔒 Running Penetration Tests...\n");

  const results = [];

  for (const testCase of testCases) {
    try {
      const passed = await testCase.test();
      results.push({
        name: testCase.name,
        passed,
        status: passed ? "✅ PASS" : "❌ FAIL",
      });
    } catch (error) {
      results.push({
        name: testCase.name,
        passed: false,
        status: "❌ ERROR",
        error: error.message,
      });
    }
  }

  console.log("\n📊 Test Results:");
  results.forEach((result) => {
    console.log(`${result.status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);

  if (passed < total) {
    process.exit(1);
  }
}

runPenetrationTests();

