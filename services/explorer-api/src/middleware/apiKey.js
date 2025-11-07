export const apiKeyMiddleware = (req, res, next) => {
  if (process.env.API_KEY_ENABLED !== 'true') {
    return next();
  }

  const apiKey = req.query.apikey || req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      status: 'error',
      message: 'API key required',
      code: 401
    });
  }

  const validKeys = (process.env.API_KEYS || '').split(',').filter(k => k.trim());
  
  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid API key',
      code: 403
    });
  }

  req.apiKey = apiKey;
  next();
};


