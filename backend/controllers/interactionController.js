/**
 * Interaction Controller
 * Handles drug interaction checks
 */

import interactionService from '../services/interactionService.js';

/**
 * Check interactions between medicines
 */
export async function checkInteractions(req, res, next) {
  try {
    const { medicines } = req.body;

    const result = await interactionService.checkInteractions(medicines);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[INTERACTIONS] Check error:', error.message);
    res.status(400).json({ error: error.message });
  }
}

export default { checkInteractions };
