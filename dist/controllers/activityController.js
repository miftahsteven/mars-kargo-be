"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityController = void 0;
const activityService_js_1 = require("../services/activityService.js");
const prisma_js_1 = require("../lib/prisma.js");
class ActivityController {
    /**
     * Log custom activity (Login, Logout, Button Click, etc.)
     */
    static async logActivity(req, res) {
        try {
            const { userId, actionType, description } = req.body;
            await activityService_js_1.ActivityService.logActivity({
                userId,
                actionType: actionType || 'GENERAL_ACTION',
                description: description || 'Mobile App Activity',
                ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
            });
            res.status(200).json({ success: true, message: 'Aktivitas berhasil dicatat.' });
        }
        catch (error) {
            console.error('[ActivityController] Error logging activity:', error);
            res.status(500).json({ success: false, message: 'Gagal mencatat aktivitas.' });
        }
    }
    /**
     * Log Barcode/QR Scanning with Resi, Latitude, and Longitude
     */
    static async logScan(req, res) {
        try {
            const { userId, resi, barcodeData, latitude, longitude, address } = req.body;
            if (!resi) {
                res.status(400).json({ success: false, message: 'Nomor resi wajib diisi.' });
                return;
            }
            await activityService_js_1.ActivityService.logScan({
                userId,
                resi,
                barcodeData: barcodeData || resi,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                address,
            });
            res.status(200).json({
                success: true,
                message: `Hasil scanning resi ${resi} beserta koordinat (${latitude}, ${longitude}) berhasil disimpan di database.`,
            });
        }
        catch (error) {
            console.error('[ActivityController] Error logging scan:', error);
            res.status(500).json({ success: false, message: 'Gagal menyimpan data scan.' });
        }
    }
    /**
     * Log GPS Tracker Location updates (Latitude & Longitude)
     */
    static async logGPSLocation(req, res) {
        try {
            const { userId, latitude, longitude, isOnline } = req.body;
            if (!userId || latitude === undefined || longitude === undefined) {
                res.status(400).json({ success: false, message: 'UserId, Latitude, dan Longitude wajib diisi.' });
                return;
            }
            await activityService_js_1.ActivityService.logGPSLocation({
                userId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                isOnline: isOnline !== undefined ? Boolean(isOnline) : true,
            });
            res.status(200).json({
                success: true,
                message: `Koordinat GPS (${latitude}, ${longitude}) berhasil disimpan di database.`,
            });
        }
        catch (error) {
            console.error('[ActivityController] Error logging GPS location:', error);
            res.status(500).json({ success: false, message: 'Gagal menyimpan lokasi GPS.' });
        }
    }
    /**
     * Get Activity History for a User
     */
    static async getUserActivities(req, res) {
        try {
            const { userId } = req.params;
            const activities = await prisma_js_1.prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            const scans = await prisma_js_1.prisma.scanLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            res.status(200).json({
                success: true,
                data: { activities, scans },
            });
        }
        catch (error) {
            res.status(200).json({
                success: true,
                data: { activities: [], scans: [] },
            });
        }
    }
}
exports.ActivityController = ActivityController;
