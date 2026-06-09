import { VehicleRecord, HistoryRecord } from "../types";

const STORAGE_KEY = "yardloc_vehicles";

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
}
export interface HistoryResponse {
  history: HistoryRecord[];
}

// Helper to get local data instantly
function getLocalVehicles(): any[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocalVehicles(data: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function apiSaveVehicle(
  plateNumber: string,
  bayNumber: string,
): Promise<SaveResponse> {
  const plate = plateNumber.trim().toUpperCase();
  const bay = bayNumber.trim().toUpperCase();
  const vehicles = getLocalVehicles();
  const existingIdx = vehicles.findIndex((v) => v.car_number === plate);

  let action = "saved";
  if (existingIdx >= 0) {
    vehicles[existingIdx].bay_number = bay;
    vehicles[existingIdx].updated_at = new Date().toISOString();
    action = "updated";
  } else {
    vehicles.unshift({
      car_number: plate,
      bay_number: bay,
      created_at: new Date().toISOString(),
    });
  }

  saveLocalVehicles(vehicles);
  return Promise.resolve({
    success: true,
    message: "Saved successfully",
    action,
  });
}

export async function apiFindVehicle(
  plateNumber: string,
): Promise<FindResponse> {
  const plate = plateNumber.trim().toUpperCase();
  const vehicles = getLocalVehicles();
  const found = vehicles.find((v) => v.car_number === plate);

  if (found) {
    return Promise.resolve({
      found: true,
      plate_number: found.car_number,
      bay_number: found.bay_number,
    });
  }
  return Promise.resolve({ found: false });
}

export async function apiListVehicles() {
  return Promise.resolve(getLocalVehicles());
}

export async function apiDeleteVehicle(
  plateNumber: string,
): Promise<DeleteResponse> {
  let vehicles = getLocalVehicles();
  vehicles = vehicles.filter(
    (v) => v.car_number !== plateNumber.trim().toUpperCase(),
  );
  saveLocalVehicles(vehicles);
  return Promise.resolve({ success: true });
}

export async function apiGetStats(): Promise<StatsResponse> {
  const vehicles = getLocalVehicles();
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  return Promise.resolve({
    total_vehicles: vehicles.length,
    today_entries: vehicles.filter(
      (v: any) =>
        new Date(v.updated_at || v.created_at).getTime() >= startOfDay,
    ).length,
    free_bays:
      32 - new Set(vehicles.map((v: any) => v.bay_number.toUpperCase())).size,
  });
}

export async function apiGetHistory(): Promise<HistoryResponse> {
  return Promise.resolve({ history: [] });
}

// =====================================================
// MISSING EXPORTS RESTORED BELOW
// =====================================================

export async function apiBayLookup(bayNumber: string) {
  const vehicles = getLocalVehicles();
  const vehicle = vehicles.find(
    (v: any) => v.bay_number?.toUpperCase() === bayNumber.toUpperCase(),
  );

  if (!vehicle) return Promise.resolve({ found: false });

  return Promise.resolve({
    found: true,
    car_number: vehicle.car_number,
    bay_number: vehicle.bay_number,
    created_at: vehicle.created_at,
    updated_at: vehicle.updated_at,
  });
}

export async function apiClearYard() {
  saveLocalVehicles([]);
  return Promise.resolve({ success: true });
}
