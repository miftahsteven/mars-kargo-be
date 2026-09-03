import { Router } from 'express';
import { DistribusiRealController } from '../controllers/distribusiRealController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const tempUploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.xlsx';
    cb(null, `excel_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

const router = Router();

// 1. Get national summary KPI
router.get('/summary', DistribusiRealController.getSummary);

// 2. Get provinces aggregated list
router.get('/provinces', DistribusiRealController.getProvinces);

// 3. Get regencies breakdown for selected province
router.get('/regencies', DistribusiRealController.getRegencies);

// 4. Get kecamatan & kode pos table
router.get('/subdistricts', DistribusiRealController.getSubdistricts);

// 5. Get school distribution & school list table
router.get('/schools', DistribusiRealController.getSchools);

// 6. Get status / health
router.get('/status', DistribusiRealController.getStatus);

// 7. Upload Excel endpoint (file field name: "file" or "excel")
router.post('/upload', upload.single('file'), DistribusiRealController.uploadExcel);

export default router;
