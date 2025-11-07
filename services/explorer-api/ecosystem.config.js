/**
 * PM2 Ecosystem Configuration
 * Production process management
 */

export default {
  apps: [{
    name: 'norchain-api',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      RPC_URL: process.env.RPC_URL || 'https://rpc.xaheen.org',
      CHAIN_ID: process.env.CHAIN_ID || '65001'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'tests', 'coverage']
  }]
};

