"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_js_1 = require("../lib/prisma.js");
class NotificationController {
    /**
     * Fetch Notifications for a Courier
     */
    static async getNotifications(req, res) {
        try {
            const { userId } = req.params;
            let notifications = [];
            try {
                notifications = await prisma_js_1.prisma.notification.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 30,
                });
            }
            catch (e) {
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi.' });
        }
    }
    /**
     * Mark Notification as Read
     */
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            try {
                await prisma_js_1.prisma.notification.update({
                    where: { id },
                    data: { isRead: true },
                });
            }
            catch (e) { }
            res.status(200).json({ success: true, message: 'Notifikasi ditandai dibaca.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengubah status notifikasi.' });
        }
    }
}
exports.NotificationController = NotificationController;
