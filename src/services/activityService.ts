import { prisma } from '../lib/prisma.js';

export class ActivityService {
  /**
   * Helper: Resolve input userId (which may be Google ID, NIP, or Email) to valid PostgreSQL User.id
   */
  private static async resolveUserId(userId?: string): Promise<string | undefined> {
    if (!userId) return undefined;
    try {
      const byId = await prisma.user.findUnique({ where: { id: userId } });
      if (byId) return byId.id;

      const byGoogle = await prisma.user.findFirst({ where: { googleId: userId } });
      if (byGoogle) return byGoogle.id;

      const byEmail = await prisma.user.findFirst({ where: { email: userId } });
      if (byEmail) return byEmail.id;

      const byNip = await prisma.user.findFirst({ where: { nip: userId } });
      if (byNip) return byNip.id;

      const firstUser = await prisma.user.findFirst();
      return firstUser?.id;
    } catch (err) {
      console.warn('[ActivityService] resolveUserId error:', err);
      return undefined;
    }
  }

  /**
   * Log general mobile app activity in PostgreSQL
   */
  public static async logActivity(params: {
    userId?: string;
    actionType: 'REGISTER' | 'LOGIN' | 'LOGOUT' | 'SCAN_BARCODE' | 'UPDATE_STATUS' | 'GPS_UPDATE';
    description: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const validUserId = await this.resolveUserId(params.userId);
      await prisma.activityLog.create({
        data: {
          userId: validUserId,
          actionType: params.actionType,
          description: params.description,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
      console.log(`[ActivityLog] Action recorded: [${params.actionType}] - ${params.description}`);
    } catch (error) {
      console.error('[ActivityLog] Error saving activity log to database:', error);
    }
  }

  /**
   * Log barcode / QR scan events in PostgreSQL with coordinates
   */
  public static async logScan(params: {
    userId?: string;
    resi: string;
    barcodeData: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }): Promise<void> {
    try {
      const validUserId = await this.resolveUserId(params.userId);
      await prisma.scanLog.create({
        data: {
          userId: validUserId,
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
        userId: validUserId,
        actionType: 'SCAN_BARCODE',
        description: `Melakukan scanning resi ${params.resi} di lokasi (${params.latitude || 0}, ${params.longitude || 0})`,
      });
    } catch (error) {
      console.error('[ScanLog] Error saving scan log to database:', error);
    }
  }

  /**
   * Log GPS Location update in PostgreSQL
   */
  public static async logGPSLocation(params: {
    userId: string;
    latitude: number;
    longitude: number;
    isOnline?: boolean;
  }): Promise<void> {
    try {
      const validUserId = await this.resolveUserId(params.userId);
      if (!validUserId) {
        console.warn(`[GPSLocationLog] User not found for ID "${params.userId}", skipping GPS log.`);
        return;
      }

      await prisma.gPSLocationLog.create({
        data: {
          userId: validUserId,
          latitude: params.latitude,
          longitude: params.longitude,
          isOnline: params.isOnline !== undefined ? params.isOnline : true,
        },
      });

      // Update Courier Profile last known location
      await prisma.courierProfile.updateMany({
        where: { userId: validUserId },
        data: {
          lastGpsLat: params.latitude,
          lastGpsLng: params.longitude,
          statusOnline: params.isOnline !== undefined ? params.isOnline : true,
        },
      });
    } catch (error) {
      console.error('[GPSLocationLog] Error saving GPS location to database:', error);
    }
  }
}
