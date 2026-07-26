import { Router } from 'express';
import { PackageController } from '../controllers/packageController.js';

const router = Router();

router.get('/', PackageController.getPackages);
router.get('/:resi', PackageController.getPackageByResi);
router.patch('/:id/status', PackageController.updateStatus);

export default router;
