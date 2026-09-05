import { describe, expect, it } from 'vitest'
import { generateReplayData } from './raceSimulator'
import type { TrackGeometry } from './replayTypes'
import tracks from './generatedTracks.json'

const monacoTrack = tracks['Monte Carlo'] as unknown as TrackGeometry
const zandvoortTrack = tracks['Zandvoort'] as unknown as TrackGeometry

describe('race simulator track math', () => {
  it('uses each F1 circuit lap count for race replays', () => {
    const drivers = [{code:'TST',name:'Test Driver',number:1,team:'Test',color:'#fff'}]
    const monaco = generateReplayData('f1', monacoTrack, drivers, 'Qualifying')
    expect(monaco.totalLaps).toBe(20)
    expect(monaco.sessionInfo.sessionType).toBe('Qualifying')
    expect(tracks['Monte Carlo'].totalLaps).toBe(78)
    expect(tracks.Monza.totalLaps).toBe(53)
    expect(tracks['Monte Carlo'].lengthKm).not.toBe(tracks.Monza.lengthKm)
  })
  it('returns no frames for invalid geometry', () => {
    const replay = generateReplayData('f1', {name:'Bad',country:'',lengthKm:1,totalLaps:10,referenceLine:[]} as unknown as TrackGeometry, [], 'Race')
    expect(replay.frames).toEqual([])
    expect(replay.totalLaps).toBe(0)
  })

  it('generates dynamic gears, throttle, and braking throughout a lap', () => {
    const drivers = [{ code: 'ANT', name: 'Andrea Kimi Antonelli', number: 12, team: 'Mercedes', color: '#00D2BE' }]
    const replay = generateReplayData('f1', zandvoortTrack, drivers, 'Race')
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
    // Qualifying uses realistic multi-stint lap count (20 laps for Monte Carlo)
    const replay = generateReplayData('f1', monacoTrack, drivers, 'Qualifying')
    expect(replay.frames.length).toBeGreaterThan(0)

    // Check the final frame
    const lastFrame = replay.frames[replay.frames.length - 1]
    const driverState = lastFrame.drivers['VER']
    expect(driverState).toBeDefined()
    expect(driverState.lap).toBeGreaterThanOrEqual(replay.totalLaps)
    expect(driverState.finished).toBe(true)
    expect(driverState.retired).toBe(false)
    // Verify distance is scaled to physical metres (20 laps of Monte Carlo ~3.337km = ~66,740m)
    expect(driverState.dist).toBeGreaterThan(60000)
    expect(driverState.dist).toBeLessThan(70000)
  })

  it('generates parallel side-by-side drag lanes for Top Fuel', () => {
    const dragTrack = {
      name: 'Drag Strip',
      country: 'USA',
      lengthKm: 0.402,
      totalLaps: 1,
      type: 'drag' as const,
      innerEdge: [{ x: -400, y: -20 }, { x: 400, y: -20 }],
      outerEdge: [{ x: -400, y: 20 }, { x: 400, y: 20 }],
      referenceLine: [{ x: -400, y: 0 }, { x: 400, y: 0 }],
      startFinishIdx: 0,
    }
    const drivers = [
      { code: 'TF1', name: 'Brittany Force', number: 1, team: 'JFR', color: '#ff0000' },
      { code: 'TF2', name: 'Antron Brown', number: 2, team: 'ABM', color: '#0000ff' }
    ]
    const replay = generateReplayData('top-fuel', dragTrack, drivers, 'Race')
    expect(replay.frames.length).toBeGreaterThan(10)

    const sampleFrame = replay.frames[5]
    expect(sampleFrame.drivers['TF1']).toBeDefined()
    expect(sampleFrame.drivers['TF2']).toBeDefined()

    // Driver 1 should be in left lane (y = -10), Driver 2 in right lane (y = +10)
    expect(sampleFrame.drivers['TF1'].y).toBe(-10)
    expect(sampleFrame.drivers['TF2'].y).toBe(10)
  })

  it('accurately propagates sessionMeta into sessionInfo', () => {
    const drivers = [{ code: 'VER', name: 'Max Verstappen', number: 1, team: 'Red Bull', color: '#3671C6' }]
    const sessionMeta = {
      year: 2025,
      round: 14,
      circuitName: 'Circuit de Spa-Francorchamps',
      country: 'Belgium',
      eventName: 'Belgian Grand Prix',
      sessionType: 'Race',
    }
    const replay = generateReplayData('f1', monacoTrack, drivers, 'Race', sessionMeta)
    expect(replay.sessionInfo.year).toBe(2025)
    expect(replay.sessionInfo.round).toBe(14)
    expect(replay.sessionInfo.circuitName).toBe('Circuit de Spa-Francorchamps')
    expect(replay.sessionInfo.country).toBe('Belgium')
    expect(replay.sessionInfo.eventName).toBe('Belgian Grand Prix')
  })

  it('generates authentic race control messages for session events', () => {
    const drivers = [{ code: 'HAM', name: 'Lewis Hamilton', number: 44, team: 'Ferrari', color: '#E8002D' }]
    const replay = generateReplayData('f1', monacoTrack, drivers, 'Qualifying')
    expect(replay.raceControlMessages).toBeDefined()
    expect(replay.raceControlMessages!.length).toBeGreaterThanOrEqual(2)
    expect(replay.raceControlMessages![0].message).toContain('GREEN FLAG')
    expect(replay.raceControlMessages![0].flag).toBe('GREEN')
    expect(replay.raceControlMessages![1].message).toContain('DRS ENABLED')
  })

  it('accurately simulates Top Fuel 1,000-ft pass with reaction time and parachute deployment', () => {
    const dragTrack = {
      name: 'Drag Strip',
      country: 'USA',
      lengthKm: 0.3048,
      totalLaps: 1,
      type: 'drag' as const,
      innerEdge: [{ x: -450, y: -22 }, { x: 450, y: -22 }],
      outerEdge: [{ x: -450, y: 22 }, { x: 450, y: 22 }],
      referenceLine: [{ x: -450, y: 0 }, { x: 450, y: 0 }],
      startFinishIdx: 0,
    }
    const drivers = [
      { code: 'BFO', name: 'Brittany Force', number: 1, team: 'JFR', color: '#FFD700' },
      { code: 'ANT', name: 'Antron Brown', number: 2, team: 'ABM', color: '#FF4500' }
    ]
    const replay = generateReplayData('top-fuel', dragTrack, drivers, 'Race')
    
    // Initial frame: Staged, zero speed, reaction time defined
    const initialFrame = replay.frames[0]
    expect(initialFrame.drivers['BFO'].reactionTime).toBeGreaterThan(0.03)
    expect(initialFrame.drivers['BFO'].gear).toBe(1) // Direct drive

    // Final frame: Both cars have finished the 1,000 ft pass, chutes deployed, ET ~3.7s
    const lastFrame = replay.frames[replay.frames.length - 1]
    const bfoFinal = lastFrame.drivers['BFO']
    expect(bfoFinal.finished).toBe(true)
    expect(bfoFinal.chuteDeployed).toBe(true)
    expect(bfoFinal.elapsedTime).toBeGreaterThanOrEqual(3.5)
    expect(bfoFinal.elapsedTime).toBeLessThanOrEqual(4.0)
  })

  it('accurately models Formula E 1-speed EV transmission and battery energy consumption', () => {
    const drivers = [{ code: 'WEH', name: 'Pascal Wehrlein', number: 94, team: 'Porsche', color: '#FFFFFF' }]
    const replay = generateReplayData('formula-e', monacoTrack, drivers, 'Race')
    
    expect(replay.frames[0].drivers['WEH'].gear).toBe(1) // 1-speed EV
    expect(replay.frames[0].drivers['WEH'].energyPct).toBe(100)

    // Over the course of the race, battery energy depletes
    const midFrame = replay.frames[Math.floor(replay.frames.length / 2)]
    expect(midFrame.drivers['WEH'].energyPct).toBeLessThan(100)
    expect(midFrame.drivers['WEH'].energyPct).toBeGreaterThan(0)
  })

  it('accurately breaks NASCAR races into 3 stages and computes stage laps to go', () => {
    const drivers = [{ code: 'LAR', name: 'Kyle Larson', number: 5, team: 'Hendrick', color: '#0055A5' }]
    const replay = generateReplayData('nascar', monacoTrack, drivers, 'Race')
    
    const initialFrame = replay.frames[0].drivers['LAR']
    expect(initialFrame.stageNumber).toBe(1)
    expect(initialFrame.stageLapsToGo).toBeGreaterThan(0)

    const finalFrame = replay.frames[replay.frames.length - 1].drivers['LAR']
    expect(finalFrame.stageNumber).toBe(3)
  })

  it('accurately divides WEC into Hypercar and LMGT3 classes with class positions', () => {
    const drivers = [
      { code: 'BUE', name: 'Sébastien Buemi', number: 8, team: 'Toyota', color: '#E5001C' },
      { code: 'GIO', name: 'Antonio Giovinazzi', number: 51, team: 'Ferrari', color: '#DC0000' },
      { code: 'BAC', name: 'Klaus Bachler', number: 92, team: 'Manthey', color: '#FF7F00' },
      { code: 'ROS', name: 'Valentino Rossi', number: 46, team: 'WRT', color: '#FFFF00' },
    ]
    const replay = generateReplayData('wec', monacoTrack, drivers, 'Race')
    
    const frame = replay.frames[10]
    expect(frame.drivers['BUE'].carClass).toBe('HYPERCAR')
    expect(frame.drivers['GIO'].carClass).toBe('HYPERCAR')
    expect(frame.drivers['BAC'].carClass).toBe('LMGT3')
    expect(frame.drivers['ROS'].carClass).toBe('LMGT3')

    // Top LMGT3 driver has class position 1
    expect(frame.drivers['BAC'].classPosition).toBe(1)
  })
})
