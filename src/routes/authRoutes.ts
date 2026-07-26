import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

// 1. Regular Registration (Sends Email with Username, Password & Activation Link via SMTP)
router.post('/register', AuthController.register);

// 2. Account Activation Link Callback (GET & POST)
router.get('/activate', AuthController.activate);
router.post('/activate', AuthController.activate);

// 3. Login Endpoint (Validates credentials & checks activation status)
router.post('/login', AuthController.login);

// 4. Google Auth Endpoint (Supports Google Sign In & Profile completion check)
router.post('/google', AuthController.googleAuth);

// 5. Complete Google Profile Endpoint (Completes HP/WhatsApp & Gender)
router.post('/google/complete-profile', AuthController.completeGoogleProfile);

export default router;
