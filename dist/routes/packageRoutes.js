"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packageController_js_1 = require("../controllers/packageController.js");
const router = (0, express_1.Router)();
router.get('/', packageController_js_1.PackageController.getPackages);
router.get('/:resi', packageController_js_1.PackageController.getPackageByResi);
router.patch('/:id/status', packageController_js_1.PackageController.updateStatus);
exports.default = router;
