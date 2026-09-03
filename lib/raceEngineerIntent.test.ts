import { describe, expect, it } from 'vitest'
import { resolveLocalTelemetryIntent } from './raceEngineerIntent'

describe('Race Engineer Local Intent Engine', () => {
  const mockContext = {
    liveRaceData: [
      {
        driver_id: 'ANT',
        car_number: '12',
        position: 1,
        gap_to_leader: 'LEADER',
        last_lap: '1:18.240',
        tire_compound: 'Hard',
        team_name: 'Mercedes',
        drivers: { name: 'Andrea Kimi Antonelli' },
      },
      {
        driver_id: 'RUS',
        car_number: '63',
        position: 2,
        gap_to_leader: '+1.2s',
        last_lap: '1:18.420',
        tire_compound: 'Hard',
        team_name: 'Mercedes',
        drivers: { name: 'George Russell' },
      },
      {
        driver_id: 'HAM',
        car_number: '44',
        position: 3,
        gap_to_leader: '+2.5s',
        last_lap: '1:18.600',
        tire_compound: 'Soft',
        team_name: 'Ferrari',
        drivers: { name: 'Lewis Hamilton' },
      },
    ],
    standingsData: {
      driverStandings: [
        { position: 1, firstName: 'Andrea Kimi', lastName: 'Antonelli', points: 242 },
        { position: 2, firstName: 'George', lastName: 'Russell', points: 183 },
        { position: 3, firstName: 'Lewis', lastName: 'Hamilton', points: 183 },
      ],
    },
  }

  it('answers "Who is leading?" instantly using live telemetry', () => {
    const res = resolveLocalTelemetryIntent('Who is leading?', 'Formula 1', mockContext)
    expect(res).toBeTruthy()
    expect(res).toContain('Andrea Kimi Antonelli')
    expect(res).toContain('P1')
    expect(res).toContain('Hard tyres')
  })

  it('answers "What are the gaps to P1?" with exact intervals', () => {
    const res = resolveLocalTelemetryIntent('What are the gaps to P1?', 'Formula 1', mockContext)
    expect(res).toBeTruthy()
    expect(res).toContain('+1.2s')
    expect(res).toContain('+2.5s')
  })

  it('answers tire strategy queries', () => {
    const res = resolveLocalTelemetryIntent('Tire compound strategy?', 'Formula 1', mockContext)
    expect(res).toBeTruthy()
    expect(res).toContain('Hard')
    expect(res).toContain('Soft')
  })

  it('answers championship standings query', () => {
    const res = resolveLocalTelemetryIntent('Championship standings', 'Formula 1', mockContext)
    expect(res).toBeTruthy()
    expect(res).toContain('242 pts')
    expect(res).toContain('183 pts')
  })

  it('answers specific driver queries like "Where is Hamilton?"', () => {
    const res = resolveLocalTelemetryIntent('Where is Hamilton?', 'Formula 1', mockContext)
    expect(res).toBeTruthy()
    expect(res).toContain('Lewis Hamilton')
    expect(res).toContain('P3')
    expect(res).toContain('+2.5s')
  })

  it('answers radio check instantly', () => {
    const res = resolveLocalTelemetryIntent('Radio check', 'Formula 1', mockContext)
    expect(res).toBeTruthy()
    expect(res).toContain('Loud and clear')
  })

  it('returns null for open-ended questions to allow Gemini to handle', () => {
    const res = resolveLocalTelemetryIntent('Explain the aerodynamic ground effect in racing cars', 'Formula 1', mockContext)
    expect(res).toBeNull()
  })
})
