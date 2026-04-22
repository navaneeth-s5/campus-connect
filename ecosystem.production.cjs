module.exports = {
  apps: [
    {
      name: 'campus-connect',
      script: 'server.js',
      cwd: './backend',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
