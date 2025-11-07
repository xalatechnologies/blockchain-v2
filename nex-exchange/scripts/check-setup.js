#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all required components are configured correctly
 */

const fs = require("fs");
const path = require("path");

const checks = [];
const errors = [];
const warnings = [];

// Check environment variables
function checkEnvVars() {
  console.log("🔍 Checking environment variables...");
  
  const required = [
    "NEXT_PUBLIC_NORCHAIN_RPC",
    "NEXT_PUBLIC_NORCHAIN_WS",
    "NEXT_PUBLIC_CHAIN_ID",
  ];
  
  const optional = [
    "DATABASE_URL",
    "REDIS_URL",
    "NEXT_PUBLIC_NEX_ROUTER_ADDRESS",
  ];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      checks.push(`✅ ${varName} is set`);
    }
  }
  
  for (const varName of optional) {
    if (!process.env[varName]) {
      warnings.push(`Optional environment variable not set: ${varName}`);
    } else {
      checks.push(`✅ ${varName} is set`);
    }
  }
}

// Check database connection
async function checkDatabase() {
  console.log("🔍 Checking database connection...");
  
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    warnings.push("Database not configured (DATABASE_URL or DB_* not set)");
    return;
  }
  
  try {
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || undefined,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "nex",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    });
    
    await pool.query("SELECT 1");
    checks.push("✅ Database connection successful");
    
    // Check tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const expectedTables = [
      "users",
      "limit_orders",
      "stop_loss_orders",
      "dca_schedules",
      "trades",
      "portfolio_snapshots",
      "price_history",
    ];
    
    const existingTables = result.rows.map((r) => r.table_name);
    const missingTables = expectedTables.filter(
      (t) => !existingTables.includes(t)
    );
    
    if (missingTables.length > 0) {
      errors.push(`Missing database tables: ${missingTables.join(", ")}`);
      errors.push("Run: npm run db:setup");
    } else {
      checks.push(`✅ All database tables exist (${existingTables.length} tables)`);
    }
    
    await pool.end();
  } catch (error) {
    errors.push(`Database connection failed: ${error.message}`);
  }
}

// Check file structure
function checkFiles() {
  console.log("🔍 Checking file structure...");
  
  const requiredFiles = [
    "package.json",
    "next.config.js",
    "tsconfig.json",
    "src/lib/rpc-provider.ts",
    "src/lib/db/schema.sql",
    "src/lib/db/client.ts",
    "src/lib/cache.ts",
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, "..", file);
    if (fs.existsSync(filePath)) {
      checks.push(`✅ ${file} exists`);
    } else {
      errors.push(`Missing required file: ${file}`);
    }
  }
}

// Check dependencies
function checkDependencies() {
  console.log("🔍 Checking dependencies...");
  
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    errors.push("package.json not found");
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const requiredDeps = [
    "next",
    "react",
    "ethers",
    "wagmi",
    "@tanstack/react-query",
    "pg",
  ];
  
  for (const dep of requiredDeps) {
    if (
      packageJson.dependencies[dep] ||
      packageJson.devDependencies[dep]
    ) {
      checks.push(`✅ ${dep} is installed`);
    } else {
      warnings.push(`Dependency not found: ${dep}`);
    }
  }
}

// Main check function
async function runChecks() {
  console.log("🚀 NEX Exchange Setup Verification\n");
  
  checkEnvVars();
  checkFiles();
  checkDependencies();
  await checkDatabase();
  
  console.log("\n📊 Results:\n");
  
  if (checks.length > 0) {
    console.log("✅ Checks passed:");
    checks.forEach((check) => console.log(`   ${check}`));
  }
  
  if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach((warning) => console.log(`   ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach((error) => console.log(`   ${error}`));
    console.log("\n❌ Setup incomplete. Please fix the errors above.");
    process.exit(1);
  } else {
    console.log("\n✅ All checks passed! Setup is complete.");
  }
}

runChecks().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

