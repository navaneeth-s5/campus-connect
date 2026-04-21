module.exports = {
  apps: [
    {
      name: 'campus-backend',
      script: 'node',
      args: 'server.js',
      cwd: './backend',
      watch: false,
      env: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'campus-frontend',
      script: 'node_modules/vite/bin/vite.js',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'development',
      }
    }
  ]
};
