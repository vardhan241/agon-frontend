import { VehicleRecord, HistoryRecord } from "../types";

const BASE_URL = "https://agon-backend-wl3r.onrender.com";

export interface FindResponse {
  found: boolean;
  plate_number?: string;
  bay_number?: string;
  created_at?: string;
}
export interface SaveResponse {
  success: boolean;
  message?: string;
  action?: string;
}
export interface DeleteResponse {
  success: boolean;
  message?: string;
}
export interface StatsResponse {
  total_vehicles: number;
  today_entries: number;
  free_bays: number;
  total_bays?: number;
}
export interface HistoryResponse {
  history: HistoryRecord[];
}

// Revert to local OCR, so this network endpoint is disabled
export async function apiScanPlate(file: File) {
  throw new Error("Using Local OCR");
}

export async function apiSaveVehicle(
  plateNumber: string,
  bayNumber: string,
): Promise<SaveResponse> {
  const response = await fetch(`${BASE_URL}/park_vehicle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plate_number: plateNumber.trim().toUpperCase(),
      bay_number: bayNumber.trim().toUpperCase(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Database connection rejected");
  }

  return response.json();
}

export async function apiFindVehicle(
  plateNumber: string,
): Promise<FindResponse> {
  const response = await fetch(
    `${BASE_URL}/vehicle/${plateNumber.trim().toUpperCase()}`,
  );
  if (!response.ok) return { found: false };
  return response.json();
}

export async function apiListVehicles() {
  const response = await fetch(`${BASE_URL}/vehicles`);
  if (!response.ok) throw new Error("Failed to fetch vehicles list");
  const data = await response.json();
  return data.vehicles;
}

export async function apiDeleteVehicle(
  plateNumber: string,
): Promise<DeleteResponse> {
  const response = await fetch(
    `${BASE_URL}/vehicle/${plateNumber.trim().toUpperCase()}`,
    { method: "DELETE" },
  );
  return response.json();
}

export async function apiGetStats(): Promise<StatsResponse> {
  const response = await fetch(`${BASE_URL}/stats`);
  if (!response.ok) throw new Error("Failed to load stats");
  return response.json();
}

export async function apiGetHistory(): Promise<HistoryResponse> {
  const response = await fetch(`${BASE_URL}/history`);
  if (!response.ok) throw new Error("Failed to load history");
  return response.json();
}

export async function apiBayLookup(bayNumber: string) {
  const response = await fetch(`${BASE_URL}/vehicles`);
  if (!response.ok) throw new Error("Network error");
  const data = await response.json();
  const vehicle = data.vehicles?.find(
    (v: any) => v.bay_number?.toUpperCase() === bayNumber.toUpperCase(),
  );

  if (!vehicle) return { found: false };
  return {
    found: true,
    car_number: vehicle.car_number,
    bay_number: vehicle.bay_number,
    created_at: vehicle.created_at,
    updated_at: vehicle.updated_at,
  };
}

export async function apiClearYard() {
  const vehicles = await apiListVehicles();
  for (const vehicle of vehicles) {
    await apiDeleteVehicle(vehicle.car_number || vehicle.plate_number);
  }
  return { success: true };
}
