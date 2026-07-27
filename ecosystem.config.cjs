module.exports = {
  apps: [
    {
      name: 'mars-kargo-backend:7021',
      script: './dist/index.js', // Compiled JavaScript (Run: npm run build first)
      exec_mode: 'fork', // Must be 'fork' (do NOT use 'cluster' for TypeScript/Node apps)
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 7021,
        DATABASE_URL: 'postgresql://user_mscode:B47054ii%21%23%24@49.128.186.89:4825/marskdb?schema=public',
        JWT_SECRET: 'mars_kargo_secret_key_2026_super_secure',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 465,
        SMTP_SECURE: 'true',
        SMTP_USER: 'admin@mscode.id',
        SMTP_PASS: 'kiwx rpro syxc kbax',
        BASE_URL: 'https://apps-api.marscargo.net',
        GOOGLE_WEB_CLIENT_ID: '912101013229-j9lh8nku0fqqet57r0rhrrd2jdnjmgqh.apps.googleusercontent.com',
      },
    },
  ],
};
