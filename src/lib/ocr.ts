import Tesseract from 'tesseract.js';

export async function performOCR(file: File) {
  try {
    const imageUrl = URL.createObjectURL(file);
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {},
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    const raw = result.data.text
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9]/g, '');

    console.log('[OCR RAW]', raw);

    // Indian plate: DL7CQ1939, MH12AB1234, KA05MN9988
    const match = raw.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}/);
    const plateNumber = match ? match[0] : (raw.length >= 6 ? raw.slice(0, 10) : null);

    console.log('[OCR PLATE]', plateNumber);
    return { plateNumber };
  } catch (error) {
    console.error(error);
    return { plateNumber: null };
  }
}
