// PM2 Ecosystem Configuration
// Run with: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'otom-backend',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000',
      interpreter: 'python3',
      cwd: '/Users/sukinyang/Downloads/otom-main',
      env: {
        PYTHONPATH: '/Users/sukinyang/Downloads/otom-main'
      },
      // Auto-restart configuration
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      // Logging
      log_file: './logs/otom-combined.log',
      out_file: './logs/otom-out.log',
      error_file: './logs/otom-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Performance
      instances: 1,
      exec_mode: 'fork',
      // Health check
      max_memory_restart: '500M'
    },
    {
      name: 'otom-celery-worker',
      script: 'celery',
      args: '-A core.tasks.celery_config worker --loglevel=info',
      interpreter: 'python3',
      cwd: '/Users/sukinyang/Downloads/otom-main',
      env: {
        PYTHONPATH: '/Users/sukinyang/Downloads/otom-main'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      log_file: './logs/celery-combined.log',
      out_file: './logs/celery-out.log',
      error_file: './logs/celery-error.log'
    }
  ]
};
