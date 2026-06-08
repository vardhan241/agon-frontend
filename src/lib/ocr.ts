const API_URL = "https://agon-backend-wl3r.onrender.com"\;

export async function performOCR(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/scan_plate`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success && data.plate_number) {
      return {
        plateNumber: data.plate_number,
      };
    }
    return {
      plateNumber: null,
    };
  } catch (error) {
    console.error(error);
    return {
      plateNumber: null,
    };
  }
}
