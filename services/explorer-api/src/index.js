import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { cacheMiddleware } from './middleware/cache.js';
import { apiKeyMiddleware } from './middleware/apiKey.js';

// Routes
import accountRoutes from './routes/account.js';
import transactionRoutes from './routes/transaction.js';
import blockRoutes from './routes/block.js';
import tokenRoutes from './routes/token.js';
import contractRoutes from './routes/contract.js';
import statsRoutes from './routes/stats.js';
import proxyRoutes from './routes/proxy.js';
import logsRoutes from './routes/logs.js';
import portfolioRoutes from './routes/portfolio.js';
import playgroundRoutes from './routes/playground.js';
import graphqlRoutes from './routes/graphql.js';
import aiRoutes from './routes/ai.js';
import healthRoutes from './routes/health.js';
import swaggerRoutes from './routes/swagger.js';
import { developerFriendlyHeaders, enhancedErrorHandler } from './middleware/developerFriendly.js';
import { validateInput, securityHeaders, securityAuditLog, validateApiKey } from './middleware/security.js';
import { requestMonitoring } from './middleware/monitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Monitoring
app.use(requestMonitoring);

// Security audit logging
app.use(securityAuditLog);

// Input validation and sanitization
app.use(validateInput);

// Developer-friendly headers
app.use(developerFriendlyHeaders);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check routes
app.use('/health', healthRoutes);

// Swagger documentation
app.use('/api-docs', swaggerRoutes);

// API routes
app.use(`${API_PREFIX}/account`, accountRoutes);
app.use(`${API_PREFIX}/transaction`, transactionRoutes);
app.use(`${API_PREFIX}/block`, blockRoutes);
app.use(`${API_PREFIX}/token`, tokenRoutes);
app.use(`${API_PREFIX}/contract`, contractRoutes);
app.use(`${API_PREFIX}/stats`, statsRoutes);
app.use(`${API_PREFIX}/proxy`, proxyRoutes);
app.use(`${API_PREFIX}/logs`, logsRoutes);
app.use(`${API_PREFIX}/portfolio`, portfolioRoutes);
app.use(`${API_PREFIX}/playground`, playgroundRoutes);
app.use(`${API_PREFIX}/graphql`, graphqlRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Nor Chain Explorer API',
    version: '1.0.0',
    description: 'Comprehensive REST API for Nor Chain blockchain explorer',
    chainId: process.env.CHAIN_ID || 65001,
    endpoints: {
      account: `${API_PREFIX}/account`,
      transaction: `${API_PREFIX}/transaction`,
      block: `${API_PREFIX}/block`,
      token: `${API_PREFIX}/token`,
      contract: `${API_PREFIX}/contract`,
      stats: `${API_PREFIX}/stats`,
      proxy: `${API_PREFIX}/proxy`,
      logs: `${API_PREFIX}/logs`,
      portfolio: `${API_PREFIX}/portfolio`,
      playground: `${API_PREFIX}/playground`,
      graphql: `${API_PREFIX}/graphql`,
      ai: `${API_PREFIX}/ai`,
      health: '/health'
    },
    documentation: 'https://docs.norchain.org/api',
    rpc: process.env.RPC_URL || 'https://rpc.xaheen.org'
  });
});

// Error handling (use enhanced version)
app.use(enhancedErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nor Chain Explorer API running on port ${PORT}`);
  console.log(`📡 RPC: ${process.env.RPC_URL || 'https://rpc.xaheen.org'}`);
  console.log(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
  console.log(`📚 Docs: http://localhost:${PORT}/`);
});

export default app;


