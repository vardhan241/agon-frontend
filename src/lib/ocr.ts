export async function performOCR(file: File) {
  try {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
            { type: 'text', text: 'Read the vehicle number plate in this image. Reply with ONLY the plate number, nothing else. Example: MH12AB1234' }
          ]
        }]
      })
    });

    const data = await response.json();
    const plate = data.content?.[0]?.text?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null;
    console.log('[Claude OCR]', plate);
    return { plateNumber: plate };
  } catch (e) {
    console.error(e);
    return { plateNumber: null };
  }
}
