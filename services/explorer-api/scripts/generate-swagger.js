/**
 * Generate Swagger/OpenAPI documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nor Chain Explorer API',
      version: '1.0.0',
      description: 'Comprehensive REST API for Nor Chain blockchain explorer - Etherscan/BSCScan compatible',
      contact: {
        name: 'Nor Chain Support',
        email: 'support@norchain.org',
        url: 'https://docs.norchain.org'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://api.norchain.org/api',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Account', description: 'Account and address operations' },
      { name: 'Transaction', description: 'Transaction operations' },
      { name: 'Block', description: 'Block operations' },
      { name: 'Token', description: 'Token operations' },
      { name: 'Contract', description: 'Contract operations' },
      { name: 'Stats', description: 'Network statistics' },
      { name: 'AI', description: 'AI-powered analysis' },
      { name: 'Health', description: 'Health and monitoring' }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'query',
          name: 'apikey',
          description: 'API key for authentication (optional but recommended)'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: '0' },
            message: { type: 'string', example: 'Error message' },
            result: { type: 'null' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: { type: 'string', example: '1' },
            message: { type: 'string', example: 'OK' },
            result: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const swaggerSpec = swaggerJsdoc(options);

// Write to file
fs.writeFileSync('./docs/swagger.json', JSON.stringify(swaggerSpec, null, 2));

console.log('✅ Swagger documentation generated at docs/swagger.json');

