import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Swagger options
const swaggerOptions = {
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
      { name: 'Health', description: 'Health and monitoring' },
      { name: 'Playground', description: 'Interactive API testing' }
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
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../index.js')
  ]
};

// Generate swagger spec
let swaggerSpec;
try {
  // Try to load from file first
  const swaggerPath = path.join(__dirname, '../../docs/swagger.json');
  if (fs.existsSync(swaggerPath)) {
    swaggerSpec = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
  } else {
    swaggerSpec = swaggerJsdoc(swaggerOptions);
  }
} catch (error) {
  console.warn('Swagger generation failed, using basic spec:', error.message);
  swaggerSpec = swaggerOptions.definition;
}

// Swagger UI setup
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nor Chain API Documentation',
  customfavIcon: '/favicon.ico'
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
router.get('/json', (req, res) => {
  res.json(swaggerSpec);
});

export default router;

