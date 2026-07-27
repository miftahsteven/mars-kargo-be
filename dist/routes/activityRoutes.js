"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activityController_js_1 = require("../controllers/activityController.js");
const router = (0, express_1.Router)();
// Log general app action (Login, Logout, Navigation, Button clicks)
router.post('/log', activityController_js_1.ActivityController.logActivity);
// Log Barcode/QR Scanning with Resi, Latitude, Longitude, and Address
router.post('/scan', activityController_js_1.ActivityController.logScan);
// Log GPS Tracker Location Updates (Latitude & Longitude)
router.post('/gps', activityController_js_1.ActivityController.logGPSLocation);
// Fetch user activity & scan history
router.get('/user/:userId', activityController_js_1.ActivityController.getUserActivities);
exports.default = router;
