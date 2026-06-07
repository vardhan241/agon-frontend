import { VehicleRecord, HistoryRecord } from "../types";

const BASE_URL = "http://192.168.1.3:8001";

// =====================================================
// Types
// =====================================================

export interface FindResponse {
  found: boolean;
  plate_number?: string;
  bay_number?: string;
  created_at?: string;
}

export interface SaveResponse {
  success: boolean;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
}

export interface StatsResponse {
  total_vehicles: number;
  today_entries: number;
  free_bays: number;
}

export interface HistoryResponse {
  history: HistoryRecord[];
}

// =====================================================
// Find Vehicle
// =====================================================

export async function apiFindVehicle(
  plateNumber: string,
): Promise<FindResponse> {
  const response = await fetch(
    `${BASE_URL}/vehicle/${plateNumber.trim().toUpperCase()}`,
  );

  if (!response.ok) {
    return { found: false };
  }

  return response.json();
}

// =====================================================
// Park Vehicle
// =====================================================

export async function apiSaveVehicle(
  plateNumber: string,
  bayNumber: string,
): Promise<SaveResponse> {
  const response = await fetch(`${BASE_URL}/park_vehicle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plate_number: plateNumber.trim().toUpperCase(),
      bay_number: bayNumber.trim().toUpperCase(),
    }),
  });

  return response.json();
}

// =====================================================
// Get All Vehicles
// =====================================================

export async function apiListVehicles() {
  const response = await fetch(`${BASE_URL}/vehicles`);

  const data = await response.json();

  return data.vehicles;
}

// =====================================================
// Delete Vehicle
// =====================================================

export async function apiDeleteVehicle(
  plateNumber: string,
): Promise<DeleteResponse> {
  const response = await fetch(
    `${BASE_URL}/vehicle/${plateNumber.trim().toUpperCase()}`,
    {
      method: "DELETE",
    },
  );

  return response.json();
}

export async function apiScanPlate(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/scan_plate`, {
    method: "POST",
    body: formData,
  });

  return response.json();
}
// =====================================================
// Dashboard Stats
// =====================================================

export async function apiGetStats(): Promise<StatsResponse> {
  const response = await fetch(`${BASE_URL}/stats`);

  return response.json();
}

// =====================================================
// History
// =====================================================

export async function apiGetHistory(): Promise<HistoryResponse> {
  const response = await fetch(`${BASE_URL}/history`);

  return response.json();
}
export async function apiBayLookup(bayNumber: string) {
  const response = await fetch(`${BASE_URL}/vehicles`);

  if (!response.ok) {
    throw new Error("Network error");
  }

  const vehicles = await response.json();

  const vehicle = vehicles.find(
    (v: any) => v.bay_number?.toUpperCase() === bayNumber.toUpperCase(),
  );

  if (!vehicle) {
    return { found: false };
  }

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

  return {
    success: true,
  };
}
