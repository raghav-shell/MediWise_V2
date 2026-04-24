/**
 * Interaction Checker Service
 * Handles checking drug interactions between medicines
 */

import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Check interactions between medicines
 * @param {Array<string>} medicines - Array of medicine names
 * @returns {Promise<Object>} Interaction data with riskLevel and interactions array
 */
export async function checkInteractions(medicines) {
  if (!medicines || medicines.length < 2) {
    throw new Error('Please provide at least 2 medications to check');
  }

  console.log(`[INTERACTIONS] Checking interactions for: ${medicines.join(', ')}`);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert clinical pharmacist AI. A user is checking for drug interactions between the following medications: [${medicines.join(', ')}].
          Identify any significant pharmacological interactions. 
          
          Return a STRICT JSON object with exactly these keys:
          "riskLevel" (String: Must be exactly "SAFE", "MODERATE", or "HIGH"),
          "interactions" (An array of objects, each containing: 
             "meds" (array of the 2 interacting drugs), 
             "severity" (String: "Safe", "Moderate Risk", or "High Risk"), 
             "description" (A concise 1-2 sentence explanation of the interaction).
          )
          
          If there are NO interactions, return riskLevel "SAFE" and one item in the array explaining they are generally safe to take together.
          Do NOT include markdown wrapping like \`\`\`json. Return pure JSON.`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    let aiResponse = completion.choices[0]?.message?.content || '{}';

    // Clean up potential markdown wrapper
    if (aiResponse.includes('```json')) {
      aiResponse = aiResponse.split('```json')[1].split('```')[0].trim();
    } else if (aiResponse.includes('```')) {
      aiResponse = aiResponse.split('```')[1].split('```')[0].trim();
    }

    const interactionData = JSON.parse(aiResponse);

    // Validate response structure
    if (!interactionData.riskLevel || !Array.isArray(interactionData.interactions)) {
      throw new Error('Invalid response structure from AI');
    }

    return interactionData;
  } catch (error) {
    console.error('[INTERACTIONS] Error checking interactions:', error.message);
    throw error;
  }
}

/**
 * Format interaction response for frontend
 */
export function formatInteractionResponse(data) {
  return {
    riskLevel: data.riskLevel || 'SAFE',
    interactions: data.interactions || [],
    checked_at: new Date().toISOString(),
  };
}

export default {
  checkInteractions,
  formatInteractionResponse,
};
