import { Router } from 'express';
import { PackageController } from '../controllers/packageController.js';

const router = Router();

router.get('/', PackageController.getPackages);
router.get('/:resi', PackageController.getPackageByResi);
router.post('/pickup', PackageController.pickupPackage);
router.post('/delivered', PackageController.deliverPackage);
router.post('/location', PackageController.updateLocation);
router.post('/kendala', PackageController.reportKendala);
router.post('/upload', PackageController.uploadImage);
router.patch('/:id/status', PackageController.updateStatus);

export default router;
