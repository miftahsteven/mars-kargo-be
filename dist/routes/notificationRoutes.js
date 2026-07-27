"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_js_1 = require("../controllers/notificationController.js");
const router = (0, express_1.Router)();
router.get('/user/:userId', notificationController_js_1.NotificationController.getNotifications);
router.patch('/:id/read', notificationController_js_1.NotificationController.markAsRead);
exports.default = router;
