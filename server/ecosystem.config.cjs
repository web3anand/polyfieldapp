/**
 * PM2 Ecosystem Configuration
 * For production deployment on VPS
 */

const fs = require('fs');
const path = require('path');

// Manually parse .env file
const envPath = path.join(__dirname, '.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log('Loaded env vars:', Object.keys(envVars));
}

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
        ...envVars, // Spread all env vars from .env file
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

