export interface Vehicle {
  car_number: string
  bay_number: string
  created_at?: string
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
  history: HistoryItem[]
}

export interface HistoryItem {
  car_number: string
  bay_number: string
  action: string
  timestamp: string
}

export interface StatsResponse {
  success: boolean
  total_vehicles: number
  today_entries: number
  free_bays: number
  total_bays: number
}
