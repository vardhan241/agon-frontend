import { VehicleRecord, StatsData } from '../types';
import { apiListVehicles, apiGetStats } from './api';

const STORAGE_KEY = 'yardloc_vehicles';
export const TOTAL_BAYS = 32;

export function getVehicles(): VehicleRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveVehicles(vehicles: VehicleRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
}

export async function refreshVehicleCache(): Promise<VehicleRecord[]> {
  try {
    const response = await apiListVehicles();
    if (response.success && response.vehicles) {
      saveVehicles(response.vehicles);
      return response.vehicles;
    }
    return getVehicles();
  } catch { return getVehicles(); }
}

export function findVehicleInCache(carNumber: string): VehicleRecord | undefined {
  return getVehicles().find(v => v.car_number.toUpperCase() === carNumber.toUpperCase());
}

export function findVehicleByBay(bayNumber: string): VehicleRecord | undefined {
  return getVehicles().find(v => v.bay_number.toUpperCase() === bayNumber.toUpperCase());
}

export function getOccupiedBays(): string[] {
  return getVehicles().map(v => v.bay_number.toUpperCase());
}

export function getBayOccupant(bayNumber: string): VehicleRecord | undefined {
  return getVehicles().find(v => v.bay_number.toUpperCase() === bayNumber.toUpperCase());
}

export async function fetchStats(): Promise<StatsData> {
  try {
    const resp = await apiGetStats();
    if (resp.success) {
      return {
        total_vehicles: resp.total_vehicles,
        today_entries: resp.today_entries,
        free_bays: resp.free_bays,
        total_bays: resp.total_bays,
      };
    }
  } catch { /* fallback */ }
  const vehicles = getVehicles();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return {
    total_vehicles: vehicles.length,
    today_entries: vehicles.filter(v => new Date(v.updated_at || v.created_at).getTime() >= startOfDay).length,
    free_bays: TOTAL_BAYS - new Set(vehicles.map(v => v.bay_number.toUpperCase())).size,
    total_bays: TOTAL_BAYS,
  };
}

export function seedSampleData(): void {
  const existing = getVehicles();
  if (existing.length > 0) return;
  const now = Date.now();
  saveVehicles([
    { car_number: 'MH12AB1234', bay_number: 'A02', created_at: new Date(now - 2 * 3600000).toISOString() },
    { car_number: 'KA05MN9988', bay_number: 'C02', created_at: new Date(now - 4 * 3600000).toISOString() },
    { car_number: 'TN09XY4421', bay_number: 'B11', created_at: new Date(now - 24 * 3600000).toISOString() },
  ]);
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return formatTimestamp(iso);
}

export function formatExactTime(iso: string): string {
  const d = new Date(iso), now = new Date();
  const time = d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const isYesterday = d.getDate() === yest.getDate() && d.getMonth() === yest.getMonth() && d.getFullYear() === yest.getFullYear();
  if (isToday) return `Today \u2022 ${time}`;
  if (isYesterday) return `Yesterday \u2022 ${time}`;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short' }) + ` \u2022 ${time}`;
}

export function generateCSV(vehicles: VehicleRecord[]): string {
  const header = 'Car Number,Bay Number,Created At,Updated At';
  const rows = vehicles.map(v =>
    `${v.car_number},${v.bay_number},${formatTimestamp(v.created_at)},${v.updated_at ? formatTimestamp(v.updated_at) : ''}`
  );
  return [header, ...rows].join('\n');
}

export function downloadCSV(vehicles: VehicleRecord[]): void {
  const csv = generateCSV(vehicles);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yardloc_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
