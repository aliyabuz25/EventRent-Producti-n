module.exports = {
  apps: [
    {
      name: 'eventrent',
      script: 'node_modules/vite/bin/vite.js',
      cwd: '/Users/ali_new/Desktop/eventrent',
      interpreter: '/Users/ali_new/.nvm/versions/node/v22.21.1/bin/node',
      args: '--strictPort --port=5050 --host=0.0.0.0',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};