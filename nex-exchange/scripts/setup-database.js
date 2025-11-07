#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates database schema for NEX Exchange
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  // Get database URL from environment
  const databaseUrl =
    process.env.DATABASE_URL ||
    (process.env.DB_HOST
      ? `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "nex"}`
      : null);

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL or DB_* environment variables not set");
    console.error("\nPlease set one of:");
    console.error("  DATABASE_URL=postgresql://user:pass@host:5432/nex");
    console.error("  OR");
    console.error("  DB_HOST=localhost DB_USER=postgres DB_PASSWORD=pass DB_NAME=nex");
    process.exit(1);
  }

  console.log("📦 Connecting to database...");

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Test connection
    await pool.query("SELECT 1");
    console.log("✅ Database connection successful");

    // Read schema file
    const schemaPath = path.join(__dirname, "../src/lib/db/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("📝 Running schema...");

    // Execute schema
    await pool.query(schema);

    console.log("✅ Database schema created successfully");

    // Verify tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("\n📊 Created tables:");
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log("\n✅ Database setup complete!");
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

