import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getProvider } from '../utils/provider.js';
import { getHealthData, getMetrics } from '../middleware/monitoring.js';

const router = express.Router();

/**
 * GET /api/health
 * Comprehensive health check
 */
router.get('/', asyncHandler(async (req, res) => {
  const healthData = getHealthData();
  
  // Check RPC connection
  try {
    const provider = getProvider();
    await provider.getBlockNumber();
    healthData.rpc = {
      status: 'connected',
      chainId: process.env.CHAIN_ID || '65001'
    };
  } catch (error) {
    healthData.rpc = {
      status: 'disconnected',
      error: error.message
    };
    healthData.status = 'degraded';
  }
  
  res.json(healthData);
}));

/**
 * GET /api/health/live
 * Liveness probe (Kubernetes)
 */
router.get('/live', asyncHandler(async (req, res) => {
  res.json({ status: 'alive' });
}));

/**
 * GET /api/health/ready
 * Readiness probe (Kubernetes)
 */
router.get('/ready', asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    await provider.getBlockNumber();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
}));

/**
 * GET /api/health/metrics
 * Prometheus-compatible metrics
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = getMetrics();
  
  // Format as Prometheus metrics
  const prometheusFormat = Object.entries(metrics)
    .map(([key, value]) => {
      const metricName = key.replace(/_/g, '_');
      return `# HELP ${metricName} ${metricName}\n# TYPE ${metricName} gauge\n${metricName} ${value}`;
    })
    .join('\n');
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(prometheusFormat);
}));

export default router;

