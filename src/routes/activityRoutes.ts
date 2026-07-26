import { Router } from 'express';
import { ActivityController } from '../controllers/activityController.js';

const router = Router();

// Log general app action (Login, Logout, Navigation, Button clicks)
router.post('/log', ActivityController.logActivity);

// Log Barcode/QR Scanning with Resi, Latitude, Longitude, and Address
router.post('/scan', ActivityController.logScan);

// Log GPS Tracker Location Updates (Latitude & Longitude)
router.post('/gps', ActivityController.logGPSLocation);

// Fetch user activity & scan history
router.get('/user/:userId', ActivityController.getUserActivities);

export default router;
