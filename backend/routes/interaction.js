/**
 * Interaction Routes
 */

import express from 'express';
import interactionController from '../controllers/interactionController.js';

const router = express.Router();

// Interaction checks are public (no auth required)
router.post('/', interactionController.checkInteractions);

export default router;
