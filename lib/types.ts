export interface CVData {
  driver_id: string;
  position: number;
  gap_to_leader: string;
}

export interface RaceData {
  driver_id: string
  car_number?: string
  position: number
  class_position?: number
  category_code?: string
  current_driver_id?: string
  gap_to_leader: string
  last_lap: string
  last_lap_ms?: number
  stint_duration_ms?: number
  tire_compound: string
  manufacturer?: string
  team_name?: string
  laps_completed?: number
  pit_status?: string
  drs_active?: boolean
  team_color?: string
  drivers?: {
    name: string
    series_id?: string
  }
}

export type TrackStatus = 'GREEN' | 'YELLOW' | 'RED' | 'CHEQUERED' | 'IDLE' | 'UNKNOWN'

export interface LiveSessionData {
  session_id: string
  series: string
  name?: string
  track_name?: string
  status: TrackStatus
  poll_interval_ms: number
  updated_at: string
}

export interface DriverStanding {
  position: number
  points: number
  wins: number
  driverId: string
  driverNumber: string
  code: string
  firstName: string
  lastName: string
  constructorId: string
  constructorName: string
}

export interface ConstructorStanding {
  position: number
  points: number
  wins: number
  constructorId: string
  constructorName: string
}

export interface RoundSession {
  key: number
  name: string
  dateStart: string
}

export interface Round {
  round: number
  name: string
  circuitName: string
  country: string
  date: string
  time: string
  status: 'upcoming' | 'live' | 'completed'
  openF1MeetingKey?: number
  nascarRaceId?: number
  sessions: RoundSession[]
}
