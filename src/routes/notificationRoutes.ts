import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/user/:userId', NotificationController.getNotifications);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
