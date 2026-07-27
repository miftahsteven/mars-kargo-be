"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const prisma_js_1 = require("../lib/prisma.js");
class ActivityService {
    /**
     * Log general mobile app activity in PostgreSQL
     */
    static async logActivity(params) {
        try {
            await prisma_js_1.prisma.activityLog.create({
                data: {
                    userId: params.userId,
                    actionType: params.actionType,
                    description: params.description,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                },
            });
            console.log(`[ActivityLog] Action recorded: [${params.actionType}] - ${params.description}`);
        }
        catch (error) {
            console.error('[ActivityLog] Error saving activity log to database:', error);
        }
    }
    /**
     * Log barcode / QR scan events in PostgreSQL with coordinates
     */
    static async logScan(params) {
        try {
            await prisma_js_1.prisma.scanLog.create({
                data: {
                    userId: params.userId,
                    resi: params.resi,
                    barcodeData: params.barcodeData,
                    latitude: params.latitude,
                    longitude: params.longitude,
                    address: params.address,
                },
            });
            console.log(`[ScanLog] Scan recorded for resi ${params.resi} at Lat: ${params.latitude}, Lng: ${params.longitude}`);
            // Also record in activity log
            await this.logActivity({
                userId: params.userId,
                actionType: 'SCAN_BARCODE',
                description: `Melakukan scanning resi ${params.resi} di lokasi (${params.latitude || 0}, ${params.longitude || 0})`,
            });
        }
        catch (error) {
            console.error('[ScanLog] Error saving scan log to database:', error);
        }
    }
    /**
     * Log GPS Location update in PostgreSQL
     */
    static async logGPSLocation(params) {
        try {
            await prisma_js_1.prisma.gPSLocationLog.create({
                data: {
                    userId: params.userId,
                    latitude: params.latitude,
                    longitude: params.longitude,
                    isOnline: params.isOnline !== undefined ? params.isOnline : true,
                },
            });
            // Update Courier Profile last known location
            await prisma_js_1.prisma.courierProfile.updateMany({
                where: { userId: params.userId },
                data: {
                    lastGpsLat: params.latitude,
                    lastGpsLng: params.longitude,
                    statusOnline: params.isOnline !== undefined ? params.isOnline : true,
                },
            });
        }
        catch (error) {
            console.error('[GPSLocationLog] Error saving GPS location to database:', error);
        }
    }
}
exports.ActivityService = ActivityService;
