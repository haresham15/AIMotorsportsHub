import { describe, expect, it } from 'vitest'
import { calculateReplayGap, frameToRaceData } from './replayTypes'
import type { RaceFrame, ReplayData } from './replayTypes'

describe('replay standings and timing leaderboard sync', () => {
  it('correctly calculates gap to leader using fixed 200 km/h speed', () => {
    // Leader
    const leaderGap = calculateReplayGap(1, 5000, 10, 0.8, 5000, 10, 0.8)
    expect(leaderGap).toBe('LEADER')

    // P2 55.55 metres behind (at 200 km/h = 55.55 m/s, delta is 1.0s)
    const p2Gap = calculateReplayGap(2, 4944.44, 10, 0.79, 5000, 10, 0.8)
    expect(p2Gap).toBe('+1.0s')

    // 1 lap down
    const p19Gap = calculateReplayGap(19, 1000, 9, 0.2, 5000, 10, 0.8)
    expect(p19Gap).toBe('+1 LAP')

    // 2 laps down
    const p20Gap = calculateReplayGap(20, 500, 8, 0.1, 5000, 10, 0.8)
    expect(p20Gap).toBe('+2 LAPS')
  })

  it('converts RaceFrame into RaceData[] maintaining positions and metadata', () => {
    const mockFrame = {
      t: 120,
      lap: 5,
      trackStatus: '1',
      drivers: {
        ANT: {
          x: 10,
          y: 20,
          position: 1,
          lap: 5,
          dist: 25000,
          relDist: 0.5,
          speed: 310,
          gear: 7,
          tyre: 'HARD',
          tyreLife: 5,
          drs: 0,
          throttle: 100,
          brake: 0,
          inPit: false,
          retired: false,
        },
        RUS: {
          x: 8,
          y: 18,
          position: 2,
          lap: 5,
          dist: 24900,
          relDist: 0.48,
          speed: 305,
          gear: 7,
          tyre: 'MEDIUM',
          tyreLife: 5,
          drs: 12,
          throttle: 98,
          brake: 0,
          inPit: false,
          retired: false,
        },
      },
    } as unknown as RaceFrame

    const mockReplayData = {
      circuit: 'Zandvoort',
      country: 'Netherlands',
      sessionInfo: {
        seriesId: 'f1',
        seriesName: 'Formula 1',
        eventName: 'Dutch Grand Prix',
        circuitName: 'Zandvoort',
        country: 'Netherlands',
        sessionType: 'Race',
        year: 2026,
        round: 12,
      },
      drivers: [
        { code: 'ANT', name: 'Andrea Kimi Antonelli', number: 12, team: 'Mercedes', color: '#00D2BE' },
        { code: 'RUS', name: 'George Russell', number: 63, team: 'Mercedes', color: '#00D2BE' },
      ],
      driverColors: { ANT: '#00D2BE', RUS: '#00D2BE' },
      totalLaps: 72,
      frames: [mockFrame],
      trackGeometry: {
        name: 'Zandvoort',
        country: 'Netherlands',
        lengthKm: 4.259,
        totalLaps: 72,
        type: 'circuit',
        referenceLine: [],
        innerEdge: [],
        outerEdge: [],
        startFinishIdx: 0,
      },
    } as unknown as ReplayData

    const standings = frameToRaceData(mockFrame, mockReplayData, 'f1')

    expect(standings).toHaveLength(2)
    expect(standings[0].driver_id).toBe('ANT')
    expect(standings[0].position).toBe(1)
    expect(standings[0].gap_to_leader).toBe('LEADER')
    expect(standings[0].tire_compound).toBe('HARD')
    expect(standings[0].drivers?.name).toBe('Andrea Kimi Antonelli')

    expect(standings[1].driver_id).toBe('RUS')
    expect(standings[1].position).toBe(2)
    expect(standings[1].gap_to_leader).toMatch(/^\+\d+\.\d+s$/)
    expect(standings[1].tire_compound).toBe('MEDIUM')
    expect(standings[1].drivers?.name).toBe('George Russell')
  })
})
