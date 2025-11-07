#!/usr/bin/env node
/**
 * Database Setup Script
 * Creates database schema and initializes tables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('🗄️  Setting up database...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'norchain_explorer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('📝 Creating tables and indexes...');
    await pool.query(schema);
    console.log('✅ Schema created successfully\n');

    // Initialize sync status
    console.log('📊 Initializing sync status...');
    await pool.query(
      `INSERT INTO sync_status (last_synced_block, is_syncing, sync_errors)
       VALUES (0, false, 0)
       ON CONFLICT DO NOTHING`
    );
    console.log('✅ Sync status initialized\n');

    console.log('🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Start indexer: node src/services/indexer-service.js');
    console.log('2. Start API: npm start');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === '42P01') {
      console.error('\n💡 Tip: Make sure the database exists:');
      console.error('   CREATE DATABASE norchain_explorer;');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

