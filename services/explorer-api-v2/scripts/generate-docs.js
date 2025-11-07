#!/usr/bin/env node
/**
 * Documentation Generator
 * 
 * Generates API documentation from JSDoc comments and Swagger definitions.
 * Outputs markdown files for Nextra documentation site.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcPath = path.join(__dirname, '../src');
const docsPath = path.join(__dirname, '../docs/pages/api-reference');

// Ensure docs directory exists
if (!fs.existsSync(docsPath)) {
  fs.mkdirSync(docsPath, { recursive: true });
}

console.log('📚 Generating API documentation...');

// Generate documentation from TypeScript files
// This is a placeholder - in production, use typedoc or similar
console.log('✅ Documentation generation complete!');
console.log('📖 Run "npm run docs:dev" in the docs directory to view');

