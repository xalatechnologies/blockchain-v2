/**
 * Developer-friendly middleware
 * Adds helpful headers, better error messages, and developer resources
 */

export const developerFriendlyHeaders = (req, res, next) => {
  // Add helpful headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Chain-ID', process.env.CHAIN_ID || '65001');
  res.setHeader('X-Documentation', 'https://docs.norchain.org/api');
  res.setHeader('X-Playground', 'https://api.norchain.org/playground');
  res.setHeader('X-SDK-JS', 'https://github.com/nor-chain/norchain-sdk-js');
  res.setHeader('X-Support', 'https://discord.gg/norchain');
  
  // Add rate limit info if available
  if (req.rateLimit) {
    res.setHeader('X-RateLimit-Limit', req.rateLimit.limit);
    res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(req.rateLimit.resetTime).toISOString());
  }
  
  next();
};

export const enhancedErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Enhanced error response with helpful links
  const errorResponse = {
    status: '0',
    message: message,
    result: null,
    error: {
      code: statusCode,
      type: err.name || 'Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    help: {
      documentation: 'https://docs.norchain.org/api',
      examples: 'https://docs.norchain.org/api/examples',
      support: 'https://discord.gg/norchain',
      migration: 'https://docs.norchain.org/api/migration'
    },
    suggestions: getErrorSuggestions(err, req)
  };
  
  res.status(statusCode).json(errorResponse);
};

const getErrorSuggestions = (err, req) => {
  const suggestions = [];
  
  if (err.message?.includes('address')) {
    suggestions.push('Check that the address is valid and properly formatted (0x...)');
    suggestions.push('See address validation: https://docs.norchain.org/api/account/balance');
  }
  
  if (err.message?.includes('rate limit')) {
    suggestions.push('Consider using an API key for higher rate limits');
    suggestions.push('Get API key: https://api.norchain.org/keys');
  }
  
  if (err.message?.includes('not found')) {
    suggestions.push('Verify the transaction/block/address exists on chain');
    suggestions.push('Check explorer: https://explorer.norchain.org');
  }
  
  if (req.path?.includes('/contract/')) {
    suggestions.push('Contract may need verification first');
    suggestions.push('Verify contract: https://docs.norchain.org/api/contract/verify');
  }
  
  return suggestions;
};

