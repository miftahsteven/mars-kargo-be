"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_js_1 = require("./config/env.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const packageRoutes_js_1 = __importDefault(require("./routes/packageRoutes.js"));
const activityRoutes_js_1 = __importDefault(require("./routes/activityRoutes.js"));
const notificationRoutes_js_1 = __importDefault(require("./routes/notificationRoutes.js"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/packages', packageRoutes_js_1.default);
app.use('/api/activity', activityRoutes_js_1.default);
app.use('/api/notifications', notificationRoutes_js_1.default);
// Healthcheck Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'MarsCargo Dedicated Mobile Backend API with Prisma ORM',
        version: '1.0.0',
        smtpUser: env_js_1.ENV.SMTP_USER,
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
      <p>Status: <strong style="color: #1FA96A;">ONLINE (Port ${env_js_1.ENV.PORT})</strong></p>
    </div>
  `);
});
// Start Server listening on 0.0.0.0 for external network access
app.listen(env_js_1.ENV.PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 MarsCargo Dedicated Mobile Backend Server Running!`);
    console.log(`📡 Localhost: http://localhost:${env_js_1.ENV.PORT}`);
    console.log(`📡 Network URL: http://192.168.18.174:${env_js_1.ENV.PORT}`);
    console.log(`🗄️ Database: PostgreSQL (marskdb)`);
    console.log(`📧 SMTP Configured User: ${env_js_1.ENV.SMTP_USER}`);
    console.log(`🔑 Firebase Google Client ID: ${env_js_1.ENV.GOOGLE_WEB_CLIENT_ID}`);
    console.log(`=======================================================`);
});
