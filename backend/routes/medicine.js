/**
 * Medicine Routes
 */

import express from 'express';
import medicineController from '../controllers/medicineController.js';
import { authenticateTokenOptional } from '../middleware/authMiddleware.js';

const router = express.Router();

// Optional authentication for logging searches
router.get('/search', authenticateTokenOptional, medicineController.searchMedicine);
router.get('/suggestions', medicineController.getMedicineSuggestions);

export default router;
