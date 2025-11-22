/**
 * PM2 Ecosystem Configuration
 * For production deployment on VPS
 */

require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'polyfield-backend',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/home/linuxuser/polyfieldapp/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ALLOWED_ORIGINS: '*',
        CLOB_API_URL: 'https://clob.polymarket.com',
        GAMMA_API_URL: 'https://gamma-api.polymarket.com',
        POLYMARKET_API_KEY: process.env.POLYMARKET_API_KEY,
        POLYMARKET_SECRET: process.env.POLYMARKET_SECRET,
        POLYMARKET_PASSPHRASE: process.env.POLYMARKET_PASSPHRASE,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};

