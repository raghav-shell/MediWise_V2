/**
 * Cabinet Routes
 */

import express from 'express';
import cabinetController from '../controllers/cabinetController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cabinet routes require authentication
router.use(authenticateToken);

router.get('/', cabinetController.getCabinet);
router.post('/', cabinetController.addMedicine);
router.patch('/:id', cabinetController.updateMedicine);
router.delete('/:id', cabinetController.removeMedicine);

export default router;
