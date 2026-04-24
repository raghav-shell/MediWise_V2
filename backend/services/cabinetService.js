/**
 * Cabinet Service
 * Handles user's personal medicine cabinet operations
 */

import db from '../config/db.pg.js';

/**
 * Get all medicines in user's cabinet
 */
export async function getCabinet(userId) {
  const result = await db.query(
    'SELECT id, medicine_name, dosage, notes, added_at FROM cabinet WHERE user_id = $1 ORDER BY added_at DESC',
    [userId]
  );

  return result.rows;
}

/**
 * Add medicine to cabinet
 */
export async function addMedicineToCabinet(userId, medicineName, dosage = '', notes = '') {
  if (!medicineName) {
    throw new Error('Medicine name is required');
  }

  try {
    const result = await db.query(
      'INSERT INTO cabinet (user_id, medicine_name, dosage, notes) VALUES ($1, $2, $3, $4) RETURNING id, medicine_name, dosage, notes, added_at',
      [userId, medicineName, dosage, notes]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Medicine already in cabinet');
    }
    throw error;
  }
}

/**
 * Remove medicine from cabinet
 */
export async function removeMedicineFromCabinet(cabinetId, userId) {
  const result = await db.query(
    'DELETE FROM cabinet WHERE id = $1 AND user_id = $2 RETURNING id',
    [cabinetId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Medicine not found in cabinet');
  }

  return true;
}

/**
 * Update medicine in cabinet
 */
export async function updateMedicineInCabinet(cabinetId, userId, dosage, notes) {
  const result = await db.query(
    'UPDATE cabinet SET dosage = $1, notes = $2 WHERE id = $3 AND user_id = $4 RETURNING id, medicine_name, dosage, notes',
    [dosage, notes, cabinetId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Medicine not found in cabinet');
  }

  return result.rows[0];
}

/**
 * Check if medicine exists in user's cabinet
 */
export async function medicineExistsInCabinet(userId, medicineName) {
  const result = await db.query(
    'SELECT id FROM cabinet WHERE user_id = $1 AND LOWER(medicine_name) = LOWER($2)',
    [userId, medicineName]
  );

  return result.rows.length > 0;
}

export default {
  getCabinet,
  addMedicineToCabinet,
  removeMedicineFromCabinet,
  updateMedicineInCabinet,
  medicineExistsInCabinet,
};
