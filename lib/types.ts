export interface CVData {
  driver_id: string;
  position: number;
  gap_to_leader: string;
}

export interface RaceData {
  driver_id: string
  position: number
  gap_to_leader: string
  last_lap: string
  tire_compound: string
  drivers?: {
    name: string
    series_id?: string
  }
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
  sessions: RoundSession[]
}
