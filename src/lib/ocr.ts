import Tesseract from 'tesseract.js';

export async function performOCR(file: File) {
  try {
    const imageUrl = URL.createObjectURL(file);
    const result = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {}
    });

    const raw = result.data.text.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');

    // Match Indian plate format: MH12AB1234
    const match = raw.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}/);
    const plateNumber = match ? match[0] : (raw.length >= 6 ? raw.slice(0, 10) : null);

    return { plateNumber };
  } catch (error) {
    console.error(error);
    return { plateNumber: null };
  }
}
