import Tesseract from 'tesseract.js';

export async function performOCR(file: File) {
  try {
    const url = URL.createObjectURL(file);
    const result = await Tesseract.recognize(url, 'eng', {
      logger: () => {},
    });

    const raw = result.data.text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    console.log('[OCR RAW]', raw);

    // Try strict Indian format first: MH12AB1234
    let match = raw.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}/);
    
    // Fallback: any 6-10 alphanumeric chars
    if (!match) match = raw.match(/[A-Z0-9]{6,10}/);

    const plate = match ? match[0] : null;
    console.log('[OCR PLATE]', plate);
    return { plateNumber: plate };
  } catch {
    return { plateNumber: null };
  }
}
