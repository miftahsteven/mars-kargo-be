"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const router = (0, express_1.Router)();
// 1. Regular Registration (Sends Email with Username, Password & Activation Link via SMTP)
router.post('/register', authController_js_1.AuthController.register);
// 2. Account Activation Link Callback (GET & POST)
router.get('/activate', authController_js_1.AuthController.activate);
router.post('/activate', authController_js_1.AuthController.activate);
// 3. Login Endpoint (Validates credentials & checks activation status)
router.post('/login', authController_js_1.AuthController.login);
// 4. Google Auth Endpoint (Supports Google Sign In & Profile completion check)
router.post('/google', authController_js_1.AuthController.googleAuth);
// 5. Complete Google Profile Endpoint (Completes HP/WhatsApp & Gender)
router.post('/google/complete-profile', authController_js_1.AuthController.completeGoogleProfile);
exports.default = router;
