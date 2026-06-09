import Tesseract from 'tesseract.js';

export async function performOCR(file: File) {
  try {
    const url = URL.createObjectURL(file);
    const result = await Tesseract.recognize(url, 'eng', { logger: () => {} });
    const raw = result.data.text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = raw.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}/);
    return { plateNumber: match ? match[0] : (raw.length >= 6 ? raw.slice(0, 10) : null) };
  } catch {
    return { plateNumber: null };
  }
}
