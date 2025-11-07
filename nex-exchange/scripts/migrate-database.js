#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles database migrations and updates
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function migrateDatabase() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    (process.env.DB_HOST
      ? `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "nex"}`
      : null);

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const applied = await pool.query("SELECT version FROM schema_migrations");
    const appliedVersions = new Set(applied.rows.map((r) => r.version));

    // Find migration files
    const migrationsDir = path.join(__dirname, "../migrations");
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log("📁 Created migrations directory");
      return;
    }

    const migrations = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`📦 Found ${migrations.length} migration(s)`);

    for (const migration of migrations) {
      const version = migration.replace(".sql", "");
      if (appliedVersions.has(version)) {
        console.log(`⏭️  Skipping ${version} (already applied)`);
        continue;
      }

      console.log(`🔄 Applying ${version}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, migration), "utf8");

      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [version]
        );
        await pool.query("COMMIT");
        console.log(`✅ Applied ${version}`);
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    }

    console.log("\n✅ All migrations applied!");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

