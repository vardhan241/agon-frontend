export type AppView = 'home' | 'park' | 'find' | 'list' | 'history' | 'admin'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export interface VehicleRecord {
  car_number: string
  bay_number: string
  created_at?: string
  updated_at?: string
}

export interface HistoryRecord {
  car_number: string
  bay_number: string
  action: string
  timestamp: string
}

export interface StatsData {
  total_vehicles: number
  today_entries: number
  free_bays: number
  total_bays: number
}

export interface FindResponse {
  found: boolean
  car_number?: string
  bay_number?: string
  updated_at?: string
}

export interface SaveResponse {
  success: boolean
  action?: string
}

export interface HistoryResponse {
  success: boolean
  history: HistoryRecord[]
}

export interface StatsResponse {
  success: boolean
  total_vehicles: number
  today_entries: number
  free_bays: number
  total_bays: number
}
