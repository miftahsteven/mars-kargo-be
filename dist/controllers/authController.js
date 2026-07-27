"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const prisma_js_1 = require("../lib/prisma.js");
const emailService_js_1 = require("../services/emailService.js");
const activityService_js_1 = require("../services/activityService.js");
const userModel_js_1 = require("../models/userModel.js");
class AuthController {
    /**
     * 1. REGISTRASI BIASA
     */
    static async register(req, res) {
        try {
            const { fullName, phone, email, gender } = req.body;
            if (!fullName || !phone || !email || !gender) {
                res.status(400).json({
                    success: false,
                    message: 'Mohon lengkapi semua field (Nama Lengkap, Nomor HP/WhatsApp, Email, dan Jenis Kelamin).',
                });
                return;
            }
            // Check existing email via Prisma / UserModel fallback
            let existingEmail = null;
            try {
                existingEmail = await prisma_js_1.prisma.user.findUnique({ where: { email } });
            }
            catch (e) {
                existingEmail = userModel_js_1.UserModel.findByEmail(email);
            }
            if (existingEmail) {
                res.status(400).json({
                    success: false,
                    message: `Email ${email} sudah terdaftar dalam sistem. Silakan gunakan email lain atau login.`,
                });
                return;
            }
            // Generate NIP (e.g. MK-5821)
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const nip = `MK-${randomDigits}`;
            // Generate password/PIN (e.g. MK8492)
            const passChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let password = 'MK';
            for (let i = 0; i < 4; i++) {
                password += passChars.charAt(Math.floor(Math.random() * passChars.length));
            }
            // Generate activation token
            const activationToken = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            // Create new user in PostgreSQL Database via Prisma
            let createdUser = null;
            try {
                createdUser = await prisma_js_1.prisma.user.create({
                    data: {
                        fullName,
                        phone,
                        email,
                        gender,
                        nip,
                        password,
                        activationToken,
                        isActivated: false,
                        assignedZone: 'Jakarta Pusat',
                        courierProfile: {
                            create: {
                                nip,
                                assignedZone: 'Jakarta Pusat',
                                statusOnline: true,
                            },
                        },
                    },
                });
            }
            catch (err) {
                console.warn('[AuthController] Prisma connection warning, using fallback store:', err);
                createdUser = userModel_js_1.UserModel.create({
                    fullName,
                    phone,
                    email,
                    gender,
                    nip,
                    password,
                    activationToken,
                    isActivated: false,
                    assignedZone: 'Jakarta Pusat',
                });
            }
            // Log Registration Activity
            await activityService_js_1.ActivityService.logActivity({
                userId: createdUser.id,
                actionType: 'REGISTER',
                description: `Registrasi kurir baru (${fullName} - NIP: ${nip}) via aplikasi mobile`,
                ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
            });
            // Send Email via Nodemailer (admin@mscode.id / kiwx rpro syxc kbax)
            await emailService_js_1.EmailService.sendActivationEmail({
                toEmail: email,
                toName: fullName,
                nip,
                password,
                activationToken,
            });
            const activationUrl = `${env_js_1.ENV.BASE_URL}/api/auth/activate?token=${activationToken}`;
            res.status(201).json({
                success: true,
                message: `Registrasi berhasil! Username (NIP) dan Password beserta link aktivasi telah dikirimkan ke email ${email}.`,
                data: {
                    nip: createdUser.nip,
                    password: createdUser.password,
                    email: createdUser.email,
                    isActivated: createdUser.isActivated,
                    activationUrl: activationUrl,
                },
            });
        }
        catch (error) {
            console.error('[AuthController] Register error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat registrasi.' });
        }
    }
    /**
     * 2. AKTIVASI AKUN VIA LINK EMAIL
     */
    static async activate(req, res) {
        try {
            const token = req.query.token || req.params.token || req.body.token;
            if (!token) {
                res.status(400).send('<h1>Token Aktivasi Tidak Ditemukan</h1>');
                return;
            }
            let user = null;
            try {
                user = await prisma_js_1.prisma.user.findFirst({
                    where: {
                        OR: [{ activationToken: token }, { nip: token }, { email: token }],
                    },
                });
            }
            catch (e) {
                user = userModel_js_1.UserModel.findByActivationToken(token) || userModel_js_1.UserModel.findByNip(token);
            }
            if (!user) {
                res.status(404).send(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #E53935;">Token Tidak Valid</h1>
            <p>Token aktivasi tidak ditemukan atau sudah kadaluarsa.</p>
          </div>
        `);
                return;
            }
            if (user.isActivated) {
                res.send(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #E6F7EE; border-radius: 16px; margin: 40px auto; max-width: 500px;">
            <h1 style="color: #1FA96A;">Akun Sudah Aktif</h1>
            <p>Akun <strong>${user.nip}</strong> sudah teraktivasi sebelumnya. Anda dapat langsung login di aplikasi mobile MarsCargo.</p>
          </div>
        `);
                return;
            }
            // Mark user activated!
            try {
                await prisma_js_1.prisma.user.update({
                    where: { id: user.id },
                    data: { isActivated: true },
                });
            }
            catch (e) {
                userModel_js_1.UserModel.update(user.id, { isActivated: true });
            }
            // Log Activation Activity
            await activityService_js_1.ActivityService.logActivity({
                userId: user.id,
                actionType: 'UPDATE_STATUS',
                description: `Aktivasi akun berhasil untuk ${user.fullName} (${user.nip}) via Tautam Email`,
            });
            res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aktivasi Akun Berhasil - MarsCargo</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f5f7; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: #ffffff; padding: 36px 28px; border-radius: 20px; text-align: center; max-width: 440px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border-top: 6px solid #1FA96A; }
            .icon { font-size: 54px; margin-bottom: 12px; }
            h1 { color: #1FA96A; margin-bottom: 8px; font-size: 24px; }
            p { color: #555; line-height: 1.5; font-size: 14px; }
            .cred { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 12px; padding: 14px; margin: 18px 0; text-align: left; }
            .badge { background: #E6F7EE; color: #1FA96A; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>AKUN BERHASIL DIAKTIVASI!</h1>
            <p>Selamat <strong>${user.fullName}</strong>! Akun kurir MarsCargo Anda telah aktif dan siap digunakan.</p>
            <div class="cred">
              <div style="font-size: 11px; color: #888; font-weight: 700; margin-bottom: 6px;">KREDENSIAL LOGIN:</div>
              <div>Username / NIP: <strong style="color: #E53935;">${user.nip}</strong></div>
              <div>Password / PIN: <strong style="color: #E53935;">${user.password}</strong></div>
              <div style="margin-top: 8px;">Status: <span class="badge">● AKTIF / READY LOGIN</span></div>
            </div>
            <p style="font-size: 12px; color: #888;">Silakan buka aplikasi mobile MarsCargo dan masuk dengan kredensial Anda.</p>
          </div>
        </body>
        </html>
      `);
        }
        catch (error) {
            console.error('[AuthController] Activate error:', error);
            res.status(500).send('<h1>Terjadi kesalahan server saat aktivasi</h1>');
        }
    }
    /**
     * 3. LOGIN (DENGAN AKUN REGISTRASI / NIP & PASSWORD)
     */
    static async login(req, res) {
        try {
            const { nip, password } = req.body;
            if (!nip || !password) {
                res.status(400).json({ success: false, message: 'NIP/Email dan Password wajib diisi.' });
                return;
            }
            // Find by NIP or Email via Prisma / UserModel fallback
            let user = null;
            try {
                user = await prisma_js_1.prisma.user.findFirst({
                    where: {
                        OR: [
                            { nip: { equals: nip, mode: 'insensitive' } },
                            { email: { equals: nip, mode: 'insensitive' } },
                        ],
                    },
                });
            }
            catch (e) {
                user = userModel_js_1.UserModel.findByNip(nip) || userModel_js_1.UserModel.findByEmail(nip);
            }
            if (!user) {
                res.status(401).json({ success: false, message: 'NIP / Email tidak terdaftar dalam sistem.' });
                return;
            }
            if (user.password !== password) {
                // Log Failed Login Attempt
                await activityService_js_1.ActivityService.logActivity({
                    userId: user.id,
                    actionType: 'LOGIN',
                    description: `Gagal login: Password salah untuk ${user.nip}`,
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    userAgent: req.headers['user-agent'],
                });
                res.status(401).json({ success: false, message: 'Password / PIN yang Anda masukkan salah.' });
                return;
            }
            // CHECK ACTIVATION STATUS! USER CANNOT LOGIN IF NOT ACTIVATED!
            if (!user.isActivated) {
                await activityService_js_1.ActivityService.logActivity({
                    userId: user.id,
                    actionType: 'LOGIN',
                    description: `Gagal login: Akun ${user.nip} belum diaktivasi via email`,
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    userAgent: req.headers['user-agent'],
                });
                res.status(403).json({
                    success: false,
                    isActivated: false,
                    message: `AKUN BELUM DIAKTIVASI!\n\nSilakan periksa email (${user.email}) Anda dan klik link aktivasi terlebih dahulu sebelum melakukan login.`,
                    user: {
                        nip: user.nip,
                        email: user.email,
                    },
                });
                return;
            }
            // Generate JWT Token
            const token = jsonwebtoken_1.default.sign({ id: user.id, nip: user.nip, email: user.email }, env_js_1.ENV.JWT_SECRET, { expiresIn: '7d' });
            // Log Successful Login Activity
            await activityService_js_1.ActivityService.logActivity({
                userId: user.id,
                actionType: 'LOGIN',
                description: `Berhasil login ke portal kurir (${user.fullName} - ${user.nip})`,
                ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
            });
            res.status(200).json({
                success: true,
                message: 'Login berhasil.',
                token,
                user: {
                    uid: user.id,
                    name: user.fullName,
                    nip: user.nip,
                    email: user.email,
                    phone: user.phone,
                    gender: user.gender,
                    assignedZone: user.assignedZone,
                },
            });
        }
        catch (error) {
            console.error('[AuthController] Login error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
        }
    }
    /**
     * 4. GOOGLE AUTH LOGIN
     */
    static async googleAuth(req, res) {
        try {
            const { googleId, email, name, picture, phone, gender } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'Email Google wajib disertakan.' });
                return;
            }
            let user = null;
            try {
                user = await prisma_js_1.prisma.user.findFirst({
                    where: {
                        OR: [{ email: { equals: email, mode: 'insensitive' } }, { googleId }],
                    },
                });
            }
            catch (e) {
                user = userModel_js_1.UserModel.findByEmail(email) || (googleId ? userModel_js_1.UserModel.findByGoogleId(googleId) : undefined);
            }
            // Existing User with complete profile -> Log in directly
            if (user && user.phone && user.gender) {
                if (!user.isActivated) {
                    try {
                        await prisma_js_1.prisma.user.update({ where: { id: user.id }, data: { isActivated: true } });
                    }
                    catch (e) {
                        userModel_js_1.UserModel.update(user.id, { isActivated: true });
                    }
                }
                const token = jsonwebtoken_1.default.sign({ id: user.id, nip: user.nip, email: user.email }, env_js_1.ENV.JWT_SECRET, { expiresIn: '7d' });
                await activityService_js_1.ActivityService.logActivity({
                    userId: user.id,
                    actionType: 'LOGIN',
                    description: `Login via Google Auth (${user.email})`,
                });
                res.status(200).json({
                    success: true,
                    requiresProfileCompletion: false,
                    message: 'Login Google berhasil.',
                    token,
                    user: {
                        uid: user.id,
                        name: user.fullName,
                        nip: user.nip,
                        email: user.email,
                        phone: user.phone,
                        gender: user.gender,
                        assignedZone: user.assignedZone,
                    },
                });
                return;
            }
            // If user exists partially or is completely new -> Needs profile completion (Name, HP/WhatsApp, Gender)
            res.status(200).json({
                success: true,
                requiresProfileCompletion: true,
                message: 'Lengkapi profil pendaftaran Google Anda (Nomor WhatsApp & Gender).',
                googleData: {
                    googleId: googleId || `g-${Date.now()}`,
                    email: email,
                    name: (user && user.fullName) || name || '',
                    phone: (user && user.phone) || phone || '',
                    gender: (user && user.gender) || gender || 'Laki-laki',
                },
            });
        }
        catch (error) {
            console.error('[AuthController] Google auth error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat Google Login.' });
        }
    }
    /**
     * 5. LENGKAPI PROFIL GOOGLE AUTH REGISTRASI
     */
    static async completeGoogleProfile(req, res) {
        try {
            const { googleId, email, fullName, phone, gender } = req.body;
            if (!email || !fullName || !phone || !gender) {
                res.status(400).json({
                    success: false,
                    message: 'Mohon lengkapi semua field (Nama Lengkap, Nomor HP/WhatsApp, dan Jenis Kelamin).',
                });
                return;
            }
            let user = null;
            try {
                user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
            }
            catch (e) {
                user = userModel_js_1.UserModel.findByEmail(email);
            }
            if (user) {
                // Update profile
                try {
                    user = await prisma_js_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            fullName,
                            phone,
                            gender,
                            googleId: googleId || user.googleId,
                            isActivated: true,
                        },
                    });
                }
                catch (e) {
                    user = userModel_js_1.UserModel.update(user.id, {
                        fullName,
                        phone,
                        gender,
                        googleId: googleId || user.googleId,
                        isActivated: true,
                    });
                }
            }
            else {
                // Create new user with Google Auth
                const randomDigits = Math.floor(1000 + Math.random() * 9000);
                const nip = `MK-${randomDigits}`;
                const password = `G-${Math.floor(1000 + Math.random() * 9000)}`;
                try {
                    user = await prisma_js_1.prisma.user.create({
                        data: {
                            fullName,
                            phone,
                            email,
                            gender,
                            nip,
                            password,
                            googleId,
                            isActivated: true,
                            assignedZone: 'Jakarta Pusat',
                            courierProfile: {
                                create: {
                                    nip,
                                    assignedZone: 'Jakarta Pusat',
                                    statusOnline: true,
                                },
                            },
                        },
                    });
                }
                catch (e) {
                    user = userModel_js_1.UserModel.create({
                        fullName,
                        phone,
                        email,
                        gender,
                        nip,
                        password,
                        googleId,
                        isActivated: true,
                        assignedZone: 'Jakarta Pusat',
                    });
                }
            }
            // Log Activity
            await activityService_js_1.ActivityService.logActivity({
                userId: user.id,
                actionType: 'REGISTER',
                description: `Pendaftaran profil Google Auth selesai (${user.fullName} - ${user.nip})`,
            });
            // Generate JWT Token
            const token = jsonwebtoken_1.default.sign({ id: user.id, nip: user.nip, email: user.email }, env_js_1.ENV.JWT_SECRET, { expiresIn: '7d' });
            res.status(200).json({
                success: true,
                message: 'Registrasi Google berhasil diselesaikan.',
                token,
                user: {
                    uid: user.id,
                    name: user.fullName,
                    nip: user.nip,
                    email: user.email,
                    phone: user.phone,
                    gender: user.gender,
                    assignedZone: user.assignedZone,
                },
            });
        }
        catch (error) {
            console.error('[AuthController] Complete Google Profile error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menyimpan profil Google.' });
        }
    }
}
exports.AuthController = AuthController;
