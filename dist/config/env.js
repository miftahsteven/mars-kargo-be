"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 7030,
    JWT_SECRET: process.env.JWT_SECRET || 'mars_kargo_secret_key_2026_super_secure',
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true' || true,
    SMTP_USER: process.env.SMTP_USER || 'admin@mscode.id',
    SMTP_PASS: process.env.SMTP_PASS || 'kiwx rpro syxc kbax',
    BASE_URL: process.env.BASE_URL || 'http://localhost:7030',
    GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID || '912101013229-j9lh8nku0fqqet57r0rhrrd2jdnjmgqh.apps.googleusercontent.com',
};
