/**
 * Scan Routes
 */

import express from 'express';
import scanController from '../controllers/scanController.js';

const router = express.Router();

// Scan endpoint is public (no auth required)
router.post('/', scanController.scanPrescription);

export default router;
