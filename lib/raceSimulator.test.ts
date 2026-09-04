import { describe, expect, it } from 'vitest'
import { generateReplayData } from './raceSimulator'
import tracks from './generatedTracks.json'

describe('race simulator track math', () => {
  it('uses each F1 circuit lap count for race replays', () => {
    const drivers = [{code:'TST',name:'Test Driver',number:1,team:'Test',color:'#fff'}]
    const monaco = generateReplayData('f1', tracks['Monte Carlo'] as any, drivers, 'Qualifying')
    expect(monaco.totalLaps).toBe(3)
    expect(monaco.sessionInfo.sessionType).toBe('Qualifying')
    expect(tracks['Monte Carlo'].totalLaps).toBe(78)
    expect(tracks.Monza.totalLaps).toBe(53)
    expect(tracks['Monte Carlo'].lengthKm).not.toBe(tracks.Monza.lengthKm)
  })
  it('returns no frames for invalid geometry', () => {
    const replay = generateReplayData('f1', {name:'Bad',country:'',lengthKm:1,totalLaps:10,referenceLine:[]} as any, [], 'Race')
    expect(replay.frames).toEqual([])
    expect(replay.totalLaps).toBe(0)
  })

  it('generates dynamic gears, throttle, and braking throughout a lap', () => {
    const drivers = [{ code: 'ANT', name: 'Andrea Kimi Antonelli', number: 12, team: 'Mercedes', color: '#00D2BE' }]
    const replay = generateReplayData('f1', tracks['Zandvoort'] as any, drivers, 'Race')
    expect(replay.frames.length).toBeGreaterThan(100)

    const gears = new Set<number>()
    let minThrottle = 100
    let maxThrottle = 0
    let maxBrake = 0
    let minSpeed = Infinity
    let maxSpeed = -Infinity

    // Sample across the first full lap (~1800 frames at 25 FPS for 72s lap)
    for (const frame of replay.frames.slice(0, 1800)) {
      const d = frame.drivers['ANT']
      if (!d) continue
      gears.add(d.gear)
      minThrottle = Math.min(minThrottle, d.throttle)
      maxThrottle = Math.max(maxThrottle, d.throttle)
      maxBrake = Math.max(maxBrake, d.brake)
      minSpeed = Math.min(minSpeed, d.speed)
      maxSpeed = Math.max(maxSpeed, d.speed)
    }

    expect(gears.size).toBeGreaterThanOrEqual(4)
    expect(gears.has(3)).toBe(true)
    expect(gears.has(7)).toBe(true)
    expect(gears.has(8)).toBe(true)
    // Throttle must drop to 0% during braking zones
    expect(minThrottle).toBe(0)
    expect(maxThrottle).toBeGreaterThanOrEqual(95)
    // Brake must activate in deceleration zones
    expect(maxBrake).toBeGreaterThanOrEqual(70)
    // Speed must vary between corners and straights
    expect(maxSpeed - minSpeed).toBeGreaterThan(100)
  })

  it('marks drivers who complete totalLaps as finished: true and retired: false', () => {
    const drivers = [{ code: 'VER', name: 'Max Verstappen', number: 1, team: 'Red Bull', color: '#3671C6' }]
    // Qualifying uses totalLaps = 3 for fast simulation
    const replay = generateReplayData('f1', tracks['Monte Carlo'] as any, drivers, 'Qualifying')
    expect(replay.frames.length).toBeGreaterThan(0)

    // Check the final frame
    const lastFrame = replay.frames[replay.frames.length - 1]
    const driverState = lastFrame.drivers['VER']
    expect(driverState).toBeDefined()
    expect(driverState.lap).toBeGreaterThanOrEqual(replay.totalLaps)
    expect(driverState.finished).toBe(true)
    expect(driverState.retired).toBe(false)
  })
})
