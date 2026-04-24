/**
 * Cabinet Controller
 * Handles user medicine cabinet operations
 */

import cabinetService from '../services/cabinetService.js';

/**
 * Get user's cabinet
 */
export async function getCabinet(req, res, next) {
  try {
    const meds = await cabinetService.getCabinet(req.user.id);

    res.json({
      success: true,
      medicines: meds,
      count: meds.length,
    });
  } catch (error) {
    console.error('[CABINET] Get error:', error.message);
    res.status(500).json({ error: 'Failed to fetch cabinet' });
  }
}

/**
 * Add medicine to cabinet
 */
export async function addMedicine(req, res, next) {
  try {
    const { medicine_name, dosage, notes } = req.body;

    const med = await cabinetService.addMedicineToCabinet(
      req.user.id,
      medicine_name,
      dosage,
      notes
    );

    res.status(201).json({
      success: true,
      medicine: med,
    });
  } catch (error) {
    console.error('[CABINET] Add error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Remove medicine from cabinet
 */
export async function removeMedicine(req, res, next) {
  try {
    const { id } = req.params;

    await cabinetService.removeMedicineFromCabinet(id, req.user.id);

    res.json({
      success: true,
      message: 'Medicine removed from cabinet',
    });
  } catch (error) {
    console.error('[CABINET] Remove error:', error.message);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Update medicine in cabinet
 */
export async function updateMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const { dosage, notes } = req.body;

    const med = await cabinetService.updateMedicineInCabinet(
      id,
      req.user.id,
      dosage,
      notes
    );

    res.json({
      success: true,
      medicine: med,
    });
  } catch (error) {
    console.error('[CABINET] Update error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

export default {
  getCabinet,
  addMedicine,
  removeMedicine,
  updateMedicine,
};
