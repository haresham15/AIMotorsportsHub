import { RaceData } from './types'

export const INITIAL_DATA: RaceData[] = [
  { driver_id: '1', position: 1, gap_to_leader: 'Interval', last_lap: '1:30.231', tire_compound: 'Medium', drivers: { name: 'Max Verstappen', series_id: 'f1' } },
  { driver_id: '2', position: 2, gap_to_leader: '+2.145', last_lap: '1:30.412', tire_compound: 'Hard', drivers: { name: 'Lando Norris', series_id: 'f1' } },
  { driver_id: '3', position: 3, gap_to_leader: '+5.321', last_lap: '1:30.655', tire_compound: 'Medium', drivers: { name: 'Charles Leclerc', series_id: 'f1' } },
  { driver_id: '4', position: 4, gap_to_leader: '+12.433', last_lap: '1:31.002', tire_compound: 'Hard', drivers: { name: 'Lewis Hamilton', series_id: 'f1' } },
  { driver_id: '5', position: 5, gap_to_leader: '+18.991', last_lap: '1:31.123', tire_compound: 'Soft', drivers: { name: 'Oscar Piastri', series_id: 'f1' } },
  { driver_id: '10', position: 1, gap_to_leader: 'Interval', last_lap: '50.231', tire_compound: 'Slick', drivers: { name: 'Chase Elliott', series_id: 'nascar' } },
  { driver_id: '11', position: 2, gap_to_leader: '+0.145', last_lap: '50.412', tire_compound: 'Slick', drivers: { name: 'Kyle Larson', series_id: 'nascar' } },
  { driver_id: '12', position: 3, gap_to_leader: '+0.321', last_lap: '50.655', tire_compound: 'Slick', drivers: { name: 'William Byron', series_id: 'nascar' } },
  { driver_id: '13', position: 4, gap_to_leader: '+0.433', last_lap: '51.002', tire_compound: 'Slick', drivers: { name: 'Denny Hamlin', series_id: 'nascar' } },
  { driver_id: '14', position: 5, gap_to_leader: '+0.991', last_lap: '51.123', tire_compound: 'Slick', drivers: { name: 'Joey Logano', series_id: 'nascar' } },
]
