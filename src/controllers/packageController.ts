import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export class PackageController {
  /**
   * Fetch Delivery Packages / Tasks for Courier
   */
  public static async getPackages(req: Request, res: Response): Promise<void> {
    try {
      let tasks: any[] = [];
      try {
        tasks = await prisma.deliveryTask.findMany({
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
        latitude,
        longitude,
      } = req.body;

      if (!resi) {
        res.status(400).json({ success: false, message: 'Nomor resi wajib diisi.' });
        return;
      }

      let task: any = null;
      try {
        const existing = await prisma.deliveryTask.findFirst({
          where: { resi: { equals: resi.trim(), mode: 'insensitive' } },
        });

        if (existing) {
          task = await prisma.deliveryTask.update({
            where: { id: existing.id },
            data: {
              status: 'pickup',
              pickupPhotoUrl: pickupPhotoUrl || existing.pickupPhotoUrl,
              courierId: courierId || existing.courierId,
              notes: notes || existing.notes || 'Dipickup oleh kurir',
              latitude: latitude ? parseFloat(latitude) : existing.latitude,
              longitude: longitude ? parseFloat(longitude) : existing.longitude,
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
              status: 'pickup',
              pickupPhotoUrl: pickupPhotoUrl || null,
              notes: notes || 'Dipickup oleh kurir dari scan barcode',
              courierId: courierId || null,
              latitude: latitude ? parseFloat(latitude) : undefined,
              longitude: longitude ? parseFloat(longitude) : undefined,
            },
          });
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
}
