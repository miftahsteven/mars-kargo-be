"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../config/env.js");
class EmailService {
    static transporter = nodemailer_1.default.createTransport({
        host: env_js_1.ENV.SMTP_HOST,
        port: env_js_1.ENV.SMTP_PORT,
        secure: env_js_1.ENV.SMTP_SECURE,
        auth: {
            user: env_js_1.ENV.SMTP_USER,
            pass: env_js_1.ENV.SMTP_PASS,
        },
    });
    static async sendActivationEmail(params) {
        const activationUrl = `${env_js_1.ENV.BASE_URL}/api/auth/activate?token=${params.activationToken}`;
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #FF5A4E 0%, #E53935 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
          .content { padding: 28px 24px; color: #1e1e1e; line-height: 1.6; }
          .cred-box { background: #f8f9fa; border-left: 4px solid #E53935; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .cred-item { font-size: 14px; margin-bottom: 8px; }
          .cred-item strong { color: #E53935; }
          .btn-activate { display: inline-block; background-color: #E53935; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin-top: 16px; text-align: center; }
          .footer { font-size: 11px; color: #9a9a9c; text-align: center; padding: 16px; background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">MarsCargo</h1>
            <p style="margin-top: 4px; font-size: 13px; opacity: 0.9;">Pendaftaran & Aktivasi Akun Kurir</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0;">Halo, ${params.toName}!</h2>
            <p>Selamat! Registrasi akun kurir Anda di MarsCargo telah berhasil diproses.</p>

            <div class="cred-box">
              <div class="cred-item">Username / NIP: <strong>${params.nip}</strong></div>
              <div class="cred-item">Password / PIN: <strong>${params.password}</strong></div>
            </div>

            <p style="color: #e53935; font-weight: 700; background: #fde9e8; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
              ⚠️ PERHATIAN: Akun Anda belum aktif. Anda TIDAK BISA login sebelum mengklik tombol/link aktivasi di bawah ini:
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${activationUrl}" class="btn-activate">AKTIVASI AKUN KURIR SAYA</a>
            </div>

            <p style="font-size: 12px; color: #605d5d;">
              Atau salin dan buka tautan berikut di browser Anda:<br>
              <a href="${activationUrl}" style="color: #4C5FD5;">${activationUrl}</a>
            </p>
          </div>
          <div class="footer">
            MarsCargo Courier System • Email dikirim secara otomatis oleh admin@mscode.id
          </div>
        </div>
      </body>
      </html>
    `;
        try {
            console.log(`[EmailService] Sending activation email via Nodemailer (${env_js_1.ENV.SMTP_USER}) to ${params.toEmail}...`);
            const info = await this.transporter.sendMail({
                from: `"MarsCargo System" <${env_js_1.ENV.SMTP_USER}>`,
                to: params.toEmail,
                subject: `[MarsCargo] Aktivasi Akun Kurir & Kredensial Akses (${params.nip})`,
                html: htmlContent,
            });
            console.log(`[EmailService] Email sent successfully! MessageId: ${info.messageId}`);
            return true;
        }
        catch (error) {
            console.error('[EmailService] SMTP Email delivery error (will log credentials locally for test fallback):', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
