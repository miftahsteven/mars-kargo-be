"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageController = void 0;
const prisma_js_1 = require("../lib/prisma.js");
class PackageController {
    /**
     * Fetch Delivery Packages / Tasks for Courier
     */
    static async getPackages(req, res) {
        try {
            let tasks = [];
            try {
                tasks = await prisma_js_1.prisma.deliveryTask.findMany({
                    orderBy: { createdAt: 'desc' },
                });
            }
            catch (e) {
                tasks = [];
            }
            res.status(200).json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil data tugas.' });
        }
    }
    /**
     * Fetch Package by Resi Number
     */
    static async getPackageByResi(req, res) {
        try {
            const { resi } = req.params;
            let pkg = null;
            try {
                pkg = await prisma_js_1.prisma.deliveryTask.findFirst({
                    where: { resi: { equals: resi, mode: 'insensitive' } },
                });
            }
            catch (e) {
                pkg = null;
            }
            if (!pkg) {
                res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
                return;
            }
            res.status(200).json({ success: true, data: pkg });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Gagal mengambil detail paket.' });
        }
    }
    /**
     * Update Status Package Resi
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, recipientSignedName, proofPhotoUrl, proofSignatureUrl, notes, latitude, longitude } = req.body;
            let updatedTask = null;
            try {
                updatedTask = await prisma_js_1.prisma.deliveryTask.update({
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
            }
            catch (e) { }
            res.status(200).json({
                success: true,
                message: `Status resi berhasil diperbarui menjadi ${status}.`,
                data: updatedTask,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Gagal memperbarui status paket.' });
        }
    }
}
exports.PackageController = PackageController;
