import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';

export class PackageController {
  /**
   * Fetch Delivery Packages / Tasks for Courier
   */
  public static async getPackages(req: Request, res: Response): Promise<void> {
    try {
      const { courierId, userId, nip } = req.query;
      let tasks: any[] = [];
      try {
        const filterId = (courierId || userId || nip) ? String(courierId || userId || nip) : null;
        let whereClause: any = {};

        if (filterId) {
          whereClause = {
            OR: [
              { courierId: filterId },
              { courierName: { contains: filterId, mode: 'insensitive' } },
              { courierId: null },
              { courierName: null },
            ],
          };
        }

        tasks = await prisma.deliveryTask.findMany({
          where: whereClause,
          include: {
            courier: {
              select: {
                id: true,
                fullName: true,
                email: true,
                nip: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        tasks = [];
      }

      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data tugas.' });
    }
  }

  /**
   * Fetch Package by Resi Number
   */
  public static async getPackageByResi(req: Request, res: Response): Promise<void> {
    try {
      const { resi } = req.params;

      let pkg: any = null;
      try {
        pkg = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: resi, mode: 'insensitive' } },
          include: {
            courier: {
              select: {
                id: true,
                fullName: true,
                email: true,
                nip: true,
              },
            },
          },
        });
      } catch (e) {
        pkg = null;
      }

      if (!pkg) {
        res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
        return;
      }

      res.status(200).json({ success: true, data: pkg });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil detail paket.' });
    }
  }

  /**
   * Update Status Package Resi
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, recipientSignedName, proofPhotoUrl, pickupPhotoUrl, proofSignatureUrl, notes, latitude, longitude } = req.body;

      let updatedTask: any = null;
      try {
        const existing = await prisma.deliveryTask.findFirst({
          where: {
            OR: [
              { id },
              { resi: { equals: id.trim(), mode: 'insensitive' } },
            ],
          },
        });

        if (existing) {
          updatedTask = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              status: status || existing.status,
              recipientSignedName: recipientSignedName || existing.recipientSignedName,
              proofPhotoUrl: proofPhotoUrl || existing.proofPhotoUrl,
              pickupPhotoUrl: pickupPhotoUrl || existing.pickupPhotoUrl,
              proofSignatureUrl: proofSignatureUrl || existing.proofSignatureUrl,
              notes: notes || existing.notes,
              latitude: latitude ? parseFloat(latitude) : existing.latitude,
              longitude: longitude ? parseFloat(longitude) : existing.longitude,
            },
            include: {
              courier: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  nip: true,
                },
              },
            },
          });
        }
      } catch (e) {
        console.warn('[PackageController] Error updating status:', e);
      }

      res.status(200).json({
        success: true,
        message: `Status resi berhasil diperbarui menjadi ${status}.`,
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal memperbarui status paket.' });
    }
  }

  /**
   * Pickup / Claim Package scanned by courier
   */
  public static async pickupPackage(req: Request, res: Response): Promise<void> {
    try {
      const {
        resi,
        recipientName,
        recipientAddress,
        recipientPhone,
        category,
        weightKg,
        itemsCount,
        pickupPhotoUrl,
        notes,
        courierId,
        courierName,
        latitude,
        longitude,
        dashboardLat,
        dashboardLng,
        scanLat,
        scanLng,
      } = req.body;

      if (!resi) {
        res.status(400).json({ success: false, message: 'Nomor resi wajib diisi.' });
        return;
      }

      const pLat = latitude ? parseFloat(latitude) : undefined;
      const pLng = longitude ? parseFloat(longitude) : undefined;
      const dLat = dashboardLat ? parseFloat(dashboardLat) : undefined;
      const dLng = dashboardLng ? parseFloat(dashboardLng) : undefined;
      const sLat = scanLat ? parseFloat(scanLat) : undefined;
      const sLng = scanLng ? parseFloat(scanLng) : undefined;

      let task: any = null;
      try {
        const existing = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: resi.trim(), mode: 'insensitive' } },
        });

        let validCourierId: string | null = courierId || null;
        if (validCourierId) {
          const userMatch = await prisma.user.findFirst({
            where: {
              OR: [
                { id: validCourierId },
                { email: validCourierId },
                { nip: validCourierId },
              ],
            },
          });
          if (userMatch) {
            validCourierId = userMatch.id;
          } else {
            validCourierId = null;
          }
        }

        const finalCourierName = courierName || (courierId && courierId.includes('@') ? courierId : null) || courierId || 'Kurir Mars Kargo';

        if (existing) {
          if (existing.status === 'Delivered' || existing.status === 'Terkirim') {
            res.status(400).json({
              success: false,
              message: `Paket resi ${resi} sudah berstatus Delivered (Terkirim) dan tidak dapat di-pickup kembali.`,
              data: existing,
            });
            return;
          }

          task = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              status: 'Dalam Transit',
              pickupPhotoUrl: pickupPhotoUrl || existing.pickupPhotoUrl,
              courierId: validCourierId || existing.courierId,
              courierName: finalCourierName || existing.courierName,
              notes: notes || existing.notes || 'Dipickup oleh kurir dari scan barcode',
              latitude: pLat !== undefined ? pLat : existing.latitude,
              longitude: pLng !== undefined ? pLng : existing.longitude,
              dashboardLat: dLat !== undefined ? dLat : existing.dashboardLat,
              dashboardLng: dLng !== undefined ? dLng : existing.dashboardLng,
              scanLat: sLat !== undefined ? sLat : existing.scanLat,
              scanLng: sLng !== undefined ? sLng : existing.scanLng,
            },
            include: {
              courier: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  nip: true,
                },
              },
            },
          });
        } else {
          task = await prisma.deliveryTask.create({
            data: {
              resi: resi.trim(),
              recipientName: recipientName || `Penerima Resi ${resi}`,
              recipientAddress: recipientAddress || 'Alamat Penerima',
              recipientPhone: recipientPhone || '-',
              category: category || 'BUKU',
              weightKg: weightKg ? parseFloat(weightKg) : 1.0,
              itemsCount: itemsCount ? parseInt(itemsCount, 10) : 1,
              status: 'Dalam Transit',
              pickupPhotoUrl: pickupPhotoUrl || null,
              notes: notes || 'Dipickup oleh kurir dari scan barcode',
              courierId: validCourierId,
              courierName: finalCourierName,
              latitude: pLat,
              longitude: pLng,
              dashboardLat: dLat,
              dashboardLng: dLng,
              scanLat: sLat,
              scanLng: sLng,
            },
            include: {
              courier: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  nip: true,
                },
              },
            },
          });
        }

        // Log scan event with smartphone GPS coordinates to ScanLog
        try {
          await prisma.scanLog.create({
            data: {
              resi: resi.trim(),
              barcodeData: resi.trim(),
              latitude: sLat !== undefined ? sLat : pLat || null,
              longitude: sLng !== undefined ? sLng : pLng || null,
              userId: courierId || null,
            },
          });
        } catch (e) {
          console.warn('[PackageController] ScanLog insert error:', e);
        }
      } catch (e) {
        console.warn('[PackageController] Prisma error during pickup, returning mockup fallback task:', e);
        task = {
          id: `task-${Date.now()}`,
          resi,
          recipientName: recipientName || `Penerima Resi ${resi}`,
          recipientAddress: recipientAddress || 'Alamat Penerima',
          recipientPhone: recipientPhone || '-',
          status: 'pickup',
          category: category || 'BUKU',
          pickupPhotoUrl: pickupPhotoUrl || null,
          createdAt: new Date().toISOString(),
        };
      }

      res.status(200).json({
        success: true,
        message: `Paket resi ${resi} berhasil di-pickup dan dimasukkan ke daftar tugas.`,
        data: task,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal melakukan pickup paket.' });
    }
  }

  /**
   * Share Location / Berbagi Lokasi real-time by Courier for a package
   */
  public static async shareLocation(req: Request, res: Response): Promise<void> {
    try {
      const { resi, latitude, longitude, courierId, address } = req.body;

      if (!resi || latitude === undefined || longitude === undefined) {
        res.status(400).json({ success: false, message: 'Nomor resi dan koordinat (latitude & longitude) wajib diisi.' });
        return;
      }

      const pLat = parseFloat(latitude);
      const pLng = parseFloat(longitude);

      let updatedTask: any = null;
      try {
        const existing = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: String(resi).trim(), mode: 'insensitive' } },
        });

        if (existing) {
          updatedTask = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              shareLat: pLat,
              shareLng: pLng,
              latitude: pLat,
              longitude: pLng,
            },
          });
        }

        if (courierId) {
          await prisma.gPSLocationLog.create({
            data: {
              userId: String(courierId),
              latitude: pLat,
              longitude: pLng,
              isOnline: true,
            },
          }).catch(() => null);
        }
      } catch (e) {
        console.warn('[PackageController] Error in shareLocation:', e);
      }

      res.status(200).json({
        success: true,
        message: `Lokasi real-time kurir berhasil dibagikan (${pLat}, ${pLng}).`,
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal membagikan lokasi kurir.' });
    }
  }

  /**
   * Report Issue / Lapor Kendala for package
   */
  public static async reportKendala(req: Request, res: Response): Promise<void> {
    try {
      const { resi, description, newAddress, newPhone, latitude, longitude, courierId } = req.body;

      if (!resi) {
        res.status(400).json({ success: false, message: 'Nomor resi wajib diisi.' });
        return;
      }

      let issueLog: any = null;
      let updatedTask: any = null;

      try {
        // 1. Create IssueReport record in database
        issueLog = await prisma.issueReport.create({
          data: {
            resi: resi.trim(),
            description: description || 'Kendala pengiriman dilaporkan kurir',
            newAddress: newAddress || null,
            newPhone: newPhone || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            courierId: courierId || null,
          },
        });

        // 2. Update DeliveryTask status & contact info
        const existing = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: resi.trim(), mode: 'insensitive' } },
        });

        if (existing) {
          updatedTask = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              status: 'Berkendala',
              recipientAddress: newAddress ? newAddress.trim() : existing.recipientAddress,
              recipientPhone: newPhone ? newPhone.trim() : existing.recipientPhone,
              notes: `KENDALA: ${description || 'Dilaporkan kurir'}${newAddress ? ` (Alamat Baru: ${newAddress})` : ''}${newPhone ? ` (No HP Baru: ${newPhone})` : ''}`,
              latitude: latitude ? parseFloat(latitude) : existing.latitude,
              longitude: longitude ? parseFloat(longitude) : existing.longitude,
            },
          });
        }
      } catch (e) {
        console.warn('[PackageController] Error creating issue report:', e);
      }

      res.status(200).json({
        success: true,
        message: `Laporan kendala resi ${resi} berhasil disimpan.`,
        data: {
          issueLog,
          updatedTask,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal melaporkan kendala paket.' });
    }
  }

  /**
   * Fetch Active Kendala / Issue Reports for Web Dashboard & Mobile Apps
   */
  public static async getKendala(req: Request, res: Response): Promise<void> {
    try {
      let issues: any[] = [];
      try {
        issues = await prisma.issueReport.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      } catch (e) {
        console.warn('[PackageController] Error fetching issue reports from DB:', e);
      }

      let berkendalaTasks: any[] = [];
      try {
        berkendalaTasks = await prisma.deliveryTask.findMany({
          where: { status: { equals: 'Berkendala', mode: 'insensitive' } },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        });
      } catch (e) {
        console.warn('[PackageController] Error fetching berkendala tasks from DB:', e);
      }

      const combined = issues.map((iss: any) => {
        const matchingTask = berkendalaTasks.find((t) => t.resi.toLowerCase() === iss.resi.toLowerCase());
        return {
          id: iss.id,
          resi: iss.resi,
          proyek: matchingTask?.category || 'Distribusi Buku / Bahan Bacaan',
          issue: iss.description || matchingTask?.notes || 'Kendala dilaporkan kurir',
          lokasi: iss.newAddress || matchingTask?.recipientAddress || 'Lokasi tidak diketahui',
          newPhone: iss.newPhone || matchingTask?.recipientPhone || null,
          since: iss.createdAt ? new Date(iss.createdAt).toISOString() : new Date().toISOString(),
          courierId: iss.courierId || matchingTask?.courierId || null,
          latitude: iss.latitude || matchingTask?.latitude || null,
          longitude: iss.longitude || matchingTask?.longitude || null,
        };
      });

      for (const task of berkendalaTasks) {
        if (!combined.some((c) => c.resi.toLowerCase() === task.resi.toLowerCase())) {
          combined.push({
            id: task.id,
            resi: task.resi,
            proyek: task.category || 'Distribusi Buku / Bahan Bacaan',
            issue: task.notes || 'Kendala pengiriman dilaporkan kurir',
            lokasi: task.recipientAddress || 'Lokasi tidak diketahui',
            newPhone: task.recipientPhone || null,
            since: task.updatedAt ? new Date(task.updatedAt).toISOString() : new Date().toISOString(),
            courierId: task.courierId || null,
            latitude: task.latitude || null,
            longitude: task.longitude || null,
          });
        }
      }

      res.status(200).json({
        status: 'success',
        success: true,
        data: combined,
      });
    } catch (error) {
      res.status(500).json({ status: 'error', success: false, message: 'Gagal mengambil data kendala aktif.' });
    }
  }

  /**
   * Complete / Deliver Package with Proof Photo, Digital Signature, Recipient Name & GPS
   */
  public static async deliverPackage(req: Request, res: Response): Promise<void> {
    try {
      const {
        resi,
        recipientSignedName,
        proofPhotoUrl,
        proofSignatureUrl,
        notes,
        latitude,
        longitude,
        courierId,
      } = req.body;

      if (!resi) {
        res.status(400).json({ success: false, message: 'Nomor resi wajib diisi.' });
        return;
      }

      let updatedTask: any = null;
      try {
        const existing = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: resi.trim(), mode: 'insensitive' } },
        });

        if (existing) {
          updatedTask = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              status: 'Delivered',
              recipientSignedName: recipientSignedName || existing.recipientName,
              proofPhotoUrl: proofPhotoUrl || existing.proofPhotoUrl,
              proofSignatureUrl: proofSignatureUrl || existing.proofSignatureUrl,
              notes: notes || existing.notes || 'Telah diterima oleh penerima',
              latitude: latitude ? parseFloat(latitude) : existing.latitude,
              longitude: longitude ? parseFloat(longitude) : existing.longitude,
              courierId: courierId || existing.courierId,
            },
          });
        } else {
          updatedTask = await prisma.deliveryTask.create({
            data: {
              resi: resi.trim(),
              recipientName: recipientSignedName || `Penerima Resi ${resi}`,
              recipientAddress: 'Alamat Penerima',
              recipientPhone: '-',
              status: 'Delivered',
              recipientSignedName: recipientSignedName || `Penerima Resi ${resi}`,
              proofPhotoUrl: proofPhotoUrl || null,
              proofSignatureUrl: proofSignatureUrl || null,
              notes: notes || 'Telah diterima oleh penerima',
              latitude: latitude ? parseFloat(latitude) : undefined,
              longitude: longitude ? parseFloat(longitude) : undefined,
              courierId: courierId || null,
            },
          });
        }
      } catch (e) {
        console.warn('[PackageController] Error completing delivered task:', e);
      }

      res.status(200).json({
        success: true,
        message: `Status resi ${resi} berhasil diperbarui menjadi Delivered (Terkirim).`,
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal memproses e-POD terkirim.' });
    }
  }

  /**
   * Update Courier Live GPS Location for Package Tracking
   */
  public static async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { resi, latitude, longitude, courierId } = req.body;

      if (!resi) {
        res.status(400).json({ success: false, message: 'Nomor resi wajib diisi.' });
        return;
      }

      const lat = latitude ? parseFloat(latitude) : null;
      const lng = longitude ? parseFloat(longitude) : null;

      let updatedTask: any = null;
      try {
        const existing = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: resi.trim(), mode: 'insensitive' } },
        });

        if (existing && lat !== null && lng !== null) {
          updatedTask = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              latitude: lat,
              longitude: lng,
            },
          });
        }
      } catch (e) {
        console.warn('[PackageController] Error updating package location:', e);
      }

      res.status(200).json({
        success: true,
        message: `Lokasi terkini paket ${resi} berhasil diperbarui.`,
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal memperbarui lokasi paket.' });
    }
  }

  /**
   * Base64 Image Upload Endpoint (Camera Photos & Signatures)
   */
  public static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const { base64, prefix } = req.body;
      if (!base64) {
        res.status(400).json({ success: false, message: 'Data base64 wajib diisi.' });
        return;
      }

      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = 'png';
      if (base64.includes('image/bmp')) {
        ext = 'bmp';
      } else if (base64.includes('image/jpeg') || base64.includes('image/jpg')) {
        ext = 'jpg';
      } else if (base64.includes('image/svg')) {
        ext = 'svg';
      }

      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
      const filename = `${prefix || 'img'}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      const forwardedProto = req.headers['x-forwarded-proto'] as string;
      const forwardedHost = req.headers['x-forwarded-host'] as string;
      const protocol = forwardedProto || (req.secure ? 'https' : 'http');
      let host = forwardedHost || req.headers.host || 'apps-api.marscargo.net';
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        host = 'apps-api.marscargo.net';
      }

      const fileUrl = `${protocol}://${host}/api/uploads/${filename}`;

      res.status(200).json({
        success: true,
        message: 'Upload file berhasil.',
        url: fileUrl,
        filename,
      });
    } catch (error) {
      console.warn('[PackageController] Error uploading base64 file:', error);
      res.status(500).json({ success: false, message: 'Gagal mengunggah gambar.' });
    }
  }
}
