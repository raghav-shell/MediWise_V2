/**
 * Scan Controller
 * Handles prescription scanning
 */

import scanService from '../services/scanService.js';

/**
 * Scan prescription image
 */
export async function scanPrescription(req, res, next) {
  try {
    const { image } = req.body;

    const medicines = await scanService.scanPrescription(image);

    const response = scanService.formatScanResponse(medicines);

    res.json(response);
  } catch (error) {
    console.error('[SCAN] Error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

export default { scanPrescription };
