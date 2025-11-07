/**
 * Security Middleware
 * Comprehensive security features for production
 */

import { ethers } from 'ethers';

/**
 * Input validation and sanitization
 */
export const validateInput = (req, res, next) => {
  // Sanitize all string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    // Remove null bytes, control characters, and trim
    return str
      .replace(/\0/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();
  };

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  next();
};

/**
 * Validate Ethereum address format
 */
export const validateEthereumAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check format: 0x followed by 40 hex characters
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(address)) {
    return false;
  }

  try {
    // Use ethers to validate checksum
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate transaction hash format
 */
export const validateTxHash = (hash) => {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  
  // Check format: 0x followed by 64 hex characters
  const hashRegex = /^0x[a-fA-F0-9]{64}$/;
  return hashRegex.test(hash);
};

/**
 * Validate block number
 */
export const validateBlockNumber = (blockNumber) => {
  if (blockNumber === 'latest' || blockNumber === 'earliest' || blockNumber === 'pending') {
    return true;
  }
  
  const num = parseInt(blockNumber);
  return !isNaN(num) && num >= 0 && num <= Number.MAX_SAFE_INTEGER;
};

/**
 * Rate limiting per endpoint
 */
export const endpointRateLimits = {
  '/api/account/balance': { windowMs: 60000, max: 200 },
  '/api/account/txlist': { windowMs: 60000, max: 50 },
  '/api/account/tokentx': { windowMs: 60000, max: 50 },
  '/api/token/tokeninfo': { windowMs: 60000, max: 100 },
  '/api/transaction/gettxinfo': { windowMs: 60000, max: 100 },
  '/api/stats/networkstats': { windowMs: 60000, max: 200 },
  '/api/proxy/*': { windowMs: 60000, max: 100 },
  '/api/graphql': { windowMs: 60000, max: 50 },
  default: { windowMs: 60000, max: 100 }
};

/**
 * Request size limits
 */
export const requestSizeLimits = {
  json: '10mb',
  urlencoded: '10mb',
  text: '1mb'
};

/**
 * Security headers
 */
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * IP whitelist/blacklist (optional)
 */
export const ipFilter = (allowedIPs = [], blockedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    // Check blacklist
    if (blockedIPs.length > 0 && blockedIPs.includes(clientIP)) {
      return res.status(403).json({
        status: '0',
        message: 'Access denied',
        result: null
      });
    }
    
    // Check whitelist (if configured)
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        status: '0',
        message: 'Access denied',
        result: null
      });
    }
    
    next();
  };
};

/**
 * Request logging for security audit
 */
export const securityAuditLog = (req, res, next) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined
  };
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // SQL injection
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // SQL injection
    /((\%27)|(\'))union/i, // SQL injection
    /exec(\s|\+)+(s|x)p\w+/i, // SQL injection
    /<script[^>]*>.*?<\/script>/gi, // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i, // XSS
    /<iframe/i, // XSS
    /eval\(/i, // Code injection
    /expression\(/i, // CSS injection
  ];
  
  const requestString = JSON.stringify(auditLog);
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
  
  if (isSuspicious) {
    // Log security event
    console.warn('🚨 SECURITY ALERT:', {
      ...auditLog,
      reason: 'Suspicious request pattern detected'
    });
    
    // Could send to security monitoring service
    // await securityService.logSecurityEvent(auditLog);
  }
  
  next();
};

/**
 * API key validation with enhanced security
 */
export const validateApiKey = (req, res, next) => {
  if (process.env.API_KEY_ENABLED !== 'true') {
    return next();
  }

  const apiKey = req.query.apikey || req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      status: '0',
      message: 'API key required',
      result: null,
      help: {
        getKey: 'https://api.norchain.org/keys',
        documentation: 'https://docs.norchain.org/api/authentication'
      }
    });
  }

  // Validate API key format (should be alphanumeric, 32+ chars)
  if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
    return res.status(401).json({
      status: '0',
      message: 'Invalid API key format',
      result: null
    });
  }

  // Check API key against valid keys
  const validKeys = (process.env.API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  
  if (!validKeys.includes(apiKey)) {
    // Log failed authentication attempt
    console.warn('🔒 Failed API key attempt:', {
      ip: req.ip,
      key: apiKey.substring(0, 8) + '...',
      path: req.path
    });
    
    return res.status(403).json({
      status: '0',
      message: 'Invalid API key',
      result: null
    });
  }

  req.apiKey = apiKey;
  next();
};

export default {
  validateInput,
  validateEthereumAddress,
  validateTxHash,
  validateBlockNumber,
  securityHeaders,
  ipFilter,
  securityAuditLog,
  validateApiKey
};

