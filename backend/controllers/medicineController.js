/**
 * Medicine Search Controller
 * Handles medicine search requests
 */

import medicineService from '../services/medicineService.js';

/**
 * Search for a medicine
 * Database first, Groq AI fallback
 */
export async function searchMedicine(req, res, next) {
  try {
    const { q } = req.query;
    const userId = req.user?.id || null;

    const medicine = await medicineService.searchMedicine(q, userId);

    res.json({
      success: true,
      ...medicine,
    });
  } catch (error) {
    console.error('[SEARCH] Error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get medicine suggestions (autocomplete)
 */
export async function getMedicineSuggestions(req, res, next) {
  try {
    const { q, limit } = req.query;

    const suggestions = await medicineService.getMedicineSuggestions(
      q,
      parseInt(limit) || 10
    );

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('[SEARCH] Suggestions error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

export default { searchMedicine, getMedicineSuggestions };
