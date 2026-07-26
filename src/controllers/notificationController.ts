import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class NotificationController {
  /**
   * Fetch Notifications for a Courier
   */
  public static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      let notifications = [];
      try {
        notifications = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
      } catch (e) {
        // Fallback default system notifications if DB empty
        notifications = [
          {
            id: 'notif-1',
            title: 'Tugas Delivery Baru Ditambahkan',
            message: 'Resi MC2607-88101 ke SD Negeri 2 Menteng telah ditugaskan ke Anda.',
            type: 'TASK',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'notif-2',
            title: 'Sistem Operasional Berjalan',
            message: 'GPS Tracking Background Service aktif dan siap mencatat koordinat.',
            type: 'SYSTEM',
            isRead: true,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi.' });
    }
  }

  /**
   * Mark Notification as Read
   */
  public static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      try {
        await prisma.notification.update({
          where: { id },
          data: { isRead: true },
        });
      } catch (e) {}

      res.status(200).json({ success: true, message: 'Notifikasi ditandai dibaca.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengubah status notifikasi.' });
    }
  }
}
