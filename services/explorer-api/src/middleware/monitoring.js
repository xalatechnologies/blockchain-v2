/**
 * Monitoring and Health Check Middleware
 */

import os from 'os';

let requestCount = 0;
let errorCount = 0;
const requestTimings = [];
const MAX_TIMINGS = 1000;

/**
 * Request monitoring middleware
 */
export const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  // Track request
  requestCount++;
  
  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (requestTimings.length >= MAX_TIMINGS) {
      requestTimings.shift();
    }
    requestTimings.push(duration);
    
    if (res.statusCode >= 400) {
      errorCount++;
    }
  });
  
  next();
};

/**
 * Health check endpoint data
 */
export const getHealthData = () => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    },
    requests: {
      total: requestCount,
      errors: errorCount,
      errorRate: requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: requestTimings.length > 0 
        ? Math.round(requestTimings.reduce((a, b) => a + b, 0) / requestTimings.length) + 'ms'
        : '0ms',
      p95ResponseTime: requestTimings.length > 0
        ? Math.round(requestTimings.sort((a, b) => a - b)[Math.floor(requestTimings.length * 0.95)]) + 'ms'
        : '0ms'
    },
    chain: {
      chainId: process.env.CHAIN_ID || '65001',
      rpcUrl: process.env.RPC_URL || 'https://rpc.xaheen.org'
    }
  };
};

/**
 * Metrics endpoint
 */
export const getMetrics = () => {
  return {
    requests_total: requestCount,
    requests_errors: errorCount,
    requests_error_rate: requestCount > 0 ? (errorCount / requestCount) : 0,
    response_time_avg_ms: requestTimings.length > 0 
      ? requestTimings.reduce((a, b) => a + b, 0) / requestTimings.length 
      : 0,
    response_time_p95_ms: requestTimings.length > 0
      ? requestTimings.sort((a, b) => a - b)[Math.floor(requestTimings.length * 0.95)]
      : 0,
    memory_heap_used_bytes: process.memoryUsage().heapUsed,
    memory_heap_total_bytes: process.memoryUsage().heapTotal,
    memory_rss_bytes: process.memoryUsage().rss,
    uptime_seconds: process.uptime()
  };
};

export default {
  requestMonitoring,
  getHealthData,
  getMetrics
};

