export interface VehicleRecord {
  car_number: string;
  bay_number: string;
  created_at: string;
  updated_at?: string;
}

export type AppView = 'home' | 'park' | 'find' | 'list' | 'admin' | 'history';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface HistoryRecord {
  car_number: string;
  old_bay: string;
  new_bay: string;
  timestamp: string;
  action: string;
}

export interface StatsData {
  total_vehicles: number;
  today_entries: number;
  free_bays: number;
  total_bays: number;
}
