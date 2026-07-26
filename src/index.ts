import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MarsCargo Dedicated Mobile Backend API with Prisma ORM',
    version: '1.0.0',
    smtpUser: ENV.SMTP_USER,
    database: 'PostgreSQL (marskdb)',
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h1 style="color: #E53935;">MarsCargo Dedicated Mobile Backend API Service</h1>
      <p>Dedicated API service powered by Node.js, Express, Nodemailer SMTP & Prisma ORM (PostgreSQL)</p>
      <p>Status: <strong style="color: #1FA96A;">ONLINE (Port ${ENV.PORT})</strong></p>
    </div>
  `);
});

// Start Server listening on 0.0.0.0 for external network access
app.listen(ENV.PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 MarsCargo Dedicated Mobile Backend Server Running!`);
  console.log(`📡 Localhost: http://localhost:${ENV.PORT}`);
  console.log(`📡 Network URL: http://192.168.18.174:${ENV.PORT}`);
  console.log(`🗄️ Database: PostgreSQL (marskdb)`);
  console.log(`📧 SMTP Configured User: ${ENV.SMTP_USER}`);
  console.log(`🔑 Firebase Google Client ID: ${ENV.GOOGLE_WEB_CLIENT_ID}`);
  console.log(`=======================================================`);
});
