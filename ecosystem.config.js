module.exports = {
  apps: [
    {
      name: 'ad-copy-generator',
      script: './backend.js',
      instances: 'max',
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        LOG_LEVEL: 'info',
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_LEVEL: 'warn',
      },

      // Auto-restart configuration
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['logs', 'node_modules', 'dist'],

      // Graceful shutdown
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000,

      // Error handling
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
    }
  ],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/ad-copy-generator.git',
      path: '/var/www/ad-copy-generator',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
