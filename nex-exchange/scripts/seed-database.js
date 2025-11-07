#!/usr/bin/env node

/**
 * Database Seed Script
 * Seeds initial data for development/testing
 */

const { Pool } = require("pg");

async function seedDatabase() {
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
    console.log("🌱 Seeding database...");

    // Seed price history (sample data)
    const tokens = [
      "0xbe0d0ec34A93a2Ec08492715a51C613B7E530D80", // NOR
      "0x66cb1f680b1c9eFBebEe97EB83d7981401B5fDd2", // DRHT
      "0x0cF8e180350253271f4b917CcFb0aCCc4862F262", // BTCBR
    ];

    const prices = [
      { token: tokens[0], price: 0.006, volume: 1250000, liquidity: 5500000 },
      { token: tokens[1], price: 0.27, volume: 50000, liquidity: 500000 },
      { token: tokens[2], price: 0.00005, volume: 250000, liquidity: 2500000 },
    ];

    for (const { token, price, volume, liquidity } of prices) {
      await pool.query(
        `INSERT INTO price_history (token_address, price_usd, volume_24h, liquidity, chain_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [token, price, volume, liquidity, 65001]
      );
    }

    console.log("✅ Seeded price history");

    console.log("\n✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

