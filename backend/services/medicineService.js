/**
 * Medicine Service
 * Handles medicine search with database-first approach and Groq AI fallback
 */

import db from '../config/db.pg.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Search for medicine - Database first, Groq fallback
 * @param {string} query - Medicine name or generic name
 * @param {number} userId - Optional user ID for logging search
 * @returns {Promise<Object>} Medicine data with name, type, uses, sideEffects, warnings
 */
export async function searchMedicine(query, userId = null) {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const searchQuery = query.toLowerCase().trim();
  console.log(`[MEDICINE] Searching for: ${searchQuery}`);

  try {
    // 1. Try exact match first
    let result = await db.query(
      `SELECT id, name, generic_name, type, uses, side_effects, warnings 
       FROM medicines 
       WHERE LOWER(name) = $1 OR LOWER(generic_name) = $1 
       LIMIT 1`,
      [searchQuery]
    );

    if (result.rows.length > 0) {
      console.log(`[MEDICINE] Found in database (exact match): ${searchQuery}`);
      await logSearch(userId, searchQuery, true);
      return formatMedicineData(result.rows[0]);
    }

    // 2. Try partial match
    result = await db.query(
      `SELECT id, name, generic_name, type, uses, side_effects, warnings 
       FROM medicines 
       WHERE LOWER(name) ILIKE $1 OR LOWER(generic_name) ILIKE $1 
       LIMIT 5`,
      [`%${searchQuery}%`]
    );

    if (result.rows.length > 0) {
      console.log(`[MEDICINE] Found in database (partial match): ${searchQuery}`);
      await logSearch(userId, searchQuery, true);

      // If multiple matches, return them for user to choose
      if (result.rows.length > 1) {
        return {
          status: 'multiple_matches',
          message: `Found ${result.rows.length} matches. Please select one:`,
          results: result.rows.map(formatMedicineData),
        };
      }

      return formatMedicineData(result.rows[0]);
    }

    // 3. Not found in DB - Use Groq AI as fallback
    console.log(`[MEDICINE] Not found in database, using Groq AI: ${searchQuery}`);
    await logSearch(userId, searchQuery, false);

    const aiData = await fetchFromGroqAI(searchQuery);
    
    // Optionally save to database for future searches
    await saveMedicineToDatabase(aiData);

    return aiData;
  } catch (error) {
    console.error(`[MEDICINE] Search error for "${searchQuery}":`, error.message);
    throw error;
  }
}

/**
 * Get multiple medicine suggestions
 */
export async function getMedicineSuggestions(query, limit = 10) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchQuery = query.toLowerCase().trim();

  const result = await db.query(
    `SELECT id, name, generic_name, type 
     FROM medicines 
     WHERE LOWER(name) ILIKE $1 OR LOWER(generic_name) ILIKE $1 
     LIMIT $2`,
    [`%${searchQuery}%`, limit]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    generic_name: row.generic_name,
    type: row.type,
  }));
}

/**
 * Fetch medicine data from Groq AI
 */
async function fetchFromGroqAI(medicineName) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert, highly accurate medical dictionary. A user is asking for information about the medication: "${medicineName}".
          IMPORTANT INSTRUCTIONS:
          1. Recognize international and Indian brands (e.g., DermaDew, Tranesma, Dolo).
          2. If the drug is used 'off-label' (e.g., Tranesma / Tranexamic Acid is officially for heavy bleeding but commonly used off-label by dermatologists for skin pigmentation), mention BOTH uses.
          3. If it is a topical cream, do NOT list oral side effects like nausea/vomiting unless absorbed systemically. List skin side effects.
          
          Return a strict JSON object with exactly these keys: 
          "name" (properly capitalized brand name + generic name in brackets), 
          "type" (e.g., Topical Cream, Oral Tablet, Antibiotic), 
          "uses" (A concise 1-2 sentence description including primary and common off-label uses), 
          "sideEffects" (an array of exactly 3 concise string side effects), 
          "warnings" (1 critical warning sentence).
          
          Only return the raw JSON object, no markdown.`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 500,
    });

    let aiResponse = completion.choices[0]?.message?.content || '{}';

    // Clean up potential markdown wrapper
    if (aiResponse.includes('```json')) {
      aiResponse = aiResponse.split('```json')[1].split('```')[0].trim();
    } else if (aiResponse.includes('```')) {
      aiResponse = aiResponse.split('```')[1].split('```')[0].trim();
    }

    const medData = JSON.parse(aiResponse);
    return {
      ...medData,
      source: 'groq_ai',
    };
  } catch (error) {
    console.error('[GROQ] AI fetch failed:', error.message);
    // Return fallback response
    return {
      name: medicineName.charAt(0).toUpperCase() + medicineName.slice(1),
      type: 'Medication',
      uses: 'Information not available. Please consult a doctor.',
      sideEffects: ['Please consult a healthcare professional.'],
      warnings: 'Always read the label before use.',
      source: 'fallback',
    };
  }
}

/**
 * Save medicine to database (for future searches)
 */
async function saveMedicineToDatabase(medData) {
  try {
    // Check if already exists
    const existing = await db.query(
      'SELECT id FROM medicines WHERE LOWER(name) = $1 LIMIT 1',
      [medData.name.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return; // Already in DB
    }

    // Insert new medicine
    await db.query(
      `INSERT INTO medicines (name, type, uses, side_effects, warnings) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT DO NOTHING`,
      [
        medData.name,
        medData.type || 'Unknown',
        medData.uses || '',
        medData.sideEffects || [],
        medData.warnings || '',
      ]
    );

    console.log(`[MEDICINE] Saved to database: ${medData.name}`);
  } catch (error) {
    console.error('[MEDICINE] Failed to save to database:', error.message);
    // Non-critical failure, don't throw
  }
}

/**
 * Log search for analytics
 */
async function logSearch(userId, query, foundInDb) {
  try {
    await db.query(
      'INSERT INTO search_history (user_id, query, found_in_db) VALUES ($1, $2, $3)',
      [userId || null, query, foundInDb]
    );
  } catch (error) {
    console.error('[MEDICINE] Failed to log search:', error.message);
    // Non-critical failure
  }
}

/**
 * Format medicine data from database row
 */
function formatMedicineData(row) {
  return {
    id: row.id,
    name: row.name,
    generic_name: row.generic_name || null,
    type: row.type || 'Unknown',
    uses: row.uses || '',
    sideEffects: Array.isArray(row.side_effects) ? row.side_effects : [],
    warnings: row.warnings || '',
    source: 'database',
  };
}

export default {
  searchMedicine,
  getMedicineSuggestions,
};
