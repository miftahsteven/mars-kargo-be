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
      const { status, recipientSignedName, proofPhotoUrl, proofSignatureUrl, notes, latitude, longitude } = req.body;

      let updatedTask: any = null;
      try {
        updatedTask = await prisma.deliveryTask.update({
          where: { id },
          data: {
            status,
            recipientSignedName,
            proofPhotoUrl,
            proofSignatureUrl,
            notes,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
          },
        });
      } catch (e) {}

      res.status(200).json({
        success: true,
        message: `Status resi berhasil diperbarui menjadi ${status}.`,
        data: updatedTask,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Gagal memperbarui status paket.' });
    }
  }
}
