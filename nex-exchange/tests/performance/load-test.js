import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const quoteLatency = new Trend("quote_latency");

export const options = {
  stages: [
    { duration: "30s", target: 50 },   // Ramp up to 50 users
    { duration: "1m", target: 100 },   // Stay at 100 users
    { duration: "30s", target: 150 },  // Ramp up to 150 users
    { duration: "1m", target: 150 },   // Stay at 150 users
    { duration: "30s", target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    http_req_failed: ["rate<0.01"],   // Error rate should be less than 1%
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Test quote API
  const quotePayload = JSON.stringify({
    tokenIn: "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80",
    tokenOut: "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2",
    amountIn: "100",
    chainId: 65001,
  });

  const quoteParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "Quote" },
  };

  const quoteStart = Date.now();
  const quoteRes = http.post(`${BASE_URL}/api/swap/quote`, quotePayload, quoteParams);
  const quoteDuration = Date.now() - quoteStart;

  const quoteSuccess = check(quoteRes, {
    "quote status is 200": (r) => r.status === 200,
    "quote has amountOut": (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.amountOut !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!quoteSuccess);
  quoteLatency.add(quoteDuration);

  // Test prices API
  const pricesRes = http.get(`${BASE_URL}/api/prices`, {
    tags: { name: "Prices" },
  });

  check(pricesRes, {
    "prices status is 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "tests/performance/results.json": JSON.stringify(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  // Simple text summary
  return `
  ====================
  Performance Test Results
  ====================
  Total Requests: ${data.metrics.http_reqs.values.count}
  Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%
  Avg Response Time: ${data.metrics.http_req_duration.values.avg}ms
  P95 Response Time: ${data.metrics.http_req_duration.values["p(95)"]}ms
  ====================
  `;
}

