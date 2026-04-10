// pm2 config — runs the AIS worker as a managed background process
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup     (then run the printed sudo command)
//
// Logs:    pm2 logs ais
// Status:  pm2 status
// Stop:    pm2 stop ais
// Restart: pm2 restart ais

module.exports = {
  apps: [
    {
      name: "ais",
      script: "npm",
      args: "run worker:ais",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 100,
      restart_delay: 5000,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
