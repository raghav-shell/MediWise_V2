/**
 * Prescription Scan Service
 * Handles OCR and AI-based prescription parsing
 */

import Tesseract from 'tesseract.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Scan prescription image and extract medicines
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Array>} Array of detected medicines
 */
export async function scanPrescription(base64Image) {
  if (!base64Image) {
    throw new Error('No image provided for scanning');
  }

  console.log('[OCR] Starting prescription scan with Tesseract...');

  try {
    // 1. Run Tesseract OCR on the image
    const { data } = await Tesseract.recognize(base64Image, 'eng');
    const extractedText = data.text;

    if (!extractedText.trim()) {
      throw new Error('Could not read any text from the image');
    }

    console.log('[OCR] Tesseract extraction complete. Parsing with Groq...');

    // 2. Parse extracted text with Groq AI
    const medicines = await parseOCRWithGroq(extractedText);

    return medicines;
  } catch (error) {
    console.error('[OCR] Scan failed:', error.message);
    throw error;
  }
}

/**
 * Parse OCR text with Groq AI to extract structured medicine data
 */
async function parseOCRWithGroq(ocrText) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert medical data extractor. I will provide raw, messy OCR text from a prescription or medicine bottle.
Your ONLY job is to extract the medicine names, types (Tablet, Capsule, Liquid, Cream, etc.), and dosages.
Return the result strictly as a valid JSON array of objects. Do NOT include markdown blocks. Do NOT include any other text.
Format example: [{"name": "Amoxicillin 500mg", "type": "Capsule", "dosage": "1x per day"}]
If you cannot confidently extract medicine information, return an empty array [].`,
        },
        {
          role: 'user',
          content: `Here is the raw OCR text:\n\n${ocrText}`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    let aiResponse = completion.choices[0]?.message?.content || '[]';

    // Clean up potential markdown wrapper
    if (aiResponse.includes('```json')) {
      aiResponse = aiResponse.split('```json')[1].split('```')[0].trim();
    } else if (aiResponse.includes('```')) {
      aiResponse = aiResponse.split('```')[1].split('```')[0].trim();
    }

    const medicines = JSON.parse(aiResponse);

    if (!Array.isArray(medicines)) {
      throw new Error('Invalid response format from AI');
    }

    console.log(`[OCR] Detected ${medicines.length} medicines`);
    return medicines;
  } catch (error) {
    console.error('[OCR] Parsing error:', error.message);
    throw new Error('Failed to parse prescription text');
  }
}

/**
 * Validate medicine structure
 */
export function validateMedicine(med) {
  return (
    med.name &&
    typeof med.name === 'string' &&
    med.name.trim().length > 0
  );
}

/**
 * Format scan response for frontend
 */
export function formatScanResponse(medicines) {
  return {
    success: true,
    detectedMedicines: medicines.filter(validateMedicine),
    count: medicines.filter(validateMedicine).length,
    scanned_at: new Date().toISOString(),
  };
}

export default {
  scanPrescription,
  validateMedicine,
  formatScanResponse,
};
