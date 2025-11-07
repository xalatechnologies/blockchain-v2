// Using Joi for validation - install: npm install joi
// For now, using basic validation
export const configValidationSchema = null;

export const configValidationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // RPC
  RPC_URL: Joi.string().required(),
  CHAIN_ID: Joi.number().default(65001),

  // Cache
  CACHE_TTL: Joi.number().default(300),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Indexer
  INDEXER_ENABLED: Joi.boolean().default(false),
  INDEXER_SYNC_INTERVAL: Joi.number().default(3000),
  INDEXER_BATCH_SIZE: Joi.number().default(100),
});

