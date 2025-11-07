import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 30000, // 30 seconds default
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60000,
  useClones: false
});

export const cacheMiddleware = (duration = null) => {
  return (req, res, next) => {
    if (process.env.ENABLE_CACHE !== 'true') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const ttl = duration || parseInt(process.env.CACHE_TTL) || 30000;
      cache.set(key, body, ttl);
      return originalJson(body);
    };

    next();
  };
};

export const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
      }
    });
  } else {
    cache.flushAll();
  }
};

export { cache };


