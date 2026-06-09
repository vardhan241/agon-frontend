const BASE_URL = "https://agon-backend-wl3r.onrender.com"\;

export async function performOCR(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/scan_plate`, { method: "POST", body: formData });
    const data = await response.json();
    return { plateNumber: data.success ? data.plate_number : null };
  } catch {
    return { plateNumber: null };
  }
}
