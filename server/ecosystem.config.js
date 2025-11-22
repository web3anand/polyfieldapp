/**
 * PM2 Ecosystem Configuration
 * For production deployment on VPS
 */

module.exports = {
  apps: [
    {
      name: 'polyfield-backend',
      script: './dist/index.js',
      instances: 2, // Use 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
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

