export type CellSize = 'S' | 'M' | 'L'

export type CellStatus = 'available' | 'rented' | 'maintenance'

export type RentStatus = 'active' | 'cancelled' | 'ended'

export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface Location {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  created_at: string
}

export interface Cell {
  id: string
  location_id: string
  number: string
  size: CellSize
  price_1m: number
  status: CellStatus
  current_lock_code: string
  created_at: string
}

export interface User {
  id: string
  phone: string
  created_at: string
}

export interface Rent {
  id: string
  user_id: string
  cell_id: string
  start_date: string
  paid_until_date: string
  is_auto_renew: boolean
  status: RentStatus
  created_at: string
}

export interface Payment {
  id: string
  rent_id: string | null
  user_id: string
  cell_id: string | null
  amount: number
  provider_id: string
  status: PaymentStatus
  created_at: string
}
