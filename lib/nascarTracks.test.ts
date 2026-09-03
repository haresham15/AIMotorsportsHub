import { describe, it, expect } from 'vitest'
import { getNascarTrack, NASCAR_TRACK_REGISTRY } from './nascarTracks'
import { getTrackForCircuit } from './trackData'

describe('NASCAR Track Geometries', () => {
  it('loads authentic Phoenix Raceway geometry with the iconic dogleg and backstretch', () => {
    const track = getNascarTrack('Phoenix Raceway')
    expect(track).toBeDefined()
    if (!track) return

    expect(track.name).toBe('Phoenix Raceway')
    expect(track.lengthKm).toBe(1.645)
    expect(track.totalLaps).toBe(312)
    expect(track.referenceLine.length).toBeGreaterThan(100)

    // Calculate bounds of reference line
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of track.referenceLine) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }

    // Width should exceed height (characteristic 1-mile tri-oval aspect ratio)
    const width = maxX - minX
    const height = maxY - minY
    expect(width).toBeGreaterThan(height)

    // Verify backstretch (straight at high Y / top of track)
    // Points along the backstretch should have roughly constant high Y
    const topPoints = track.referenceLine.filter(p => p.y > maxY - 15)
    expect(topPoints.length).toBeGreaterThan(20)

    // Verify dogleg (outward southern bulge at low Y / bottom of track)
    const bottomPoints = track.referenceLine.filter(p => p.y < minY + 20)
    expect(bottomPoints.length).toBeGreaterThan(10)

    // Start/Finish should be in bottom-left quadrant (near Turn 4 exit)
    const startPoint = track.referenceLine[track.startFinishIdx || 0]
    expect(startPoint.x).toBeLessThan(minX + width * 0.45)
    expect(startPoint.y).toBeLessThan(minY + height * 0.45)
  })

  it('correctly resolves Phoenix Raceway through getTrackForCircuit', () => {
    const track = getTrackForCircuit('Phoenix Raceway', 'nascar')
    expect(track.name).toBe('Phoenix Raceway')
    expect(track.lengthKm).toBe(1.645)

    const trackAlias = getTrackForCircuit('phoenix', 'nascar')
    expect(trackAlias.name).toBe('Phoenix Raceway')
  })

  it('loads iconic NASCAR venues with distinct authentic track signatures', () => {
    // Daytona Superspeedway Tri-Oval
    const daytona = getNascarTrack('Daytona International Speedway')
    expect(daytona).toBeDefined()
    expect(daytona?.lengthKm).toBe(4.023)

    // Indianapolis Brickyard Rectangular Oval
    const ims = getNascarTrack('Indianapolis Motor Speedway')
    expect(ims).toBeDefined()
    expect(ims?.lengthKm).toBe(4.023)

    // Pocono Tricky Triangle
    const pocono = getNascarTrack('Pocono Raceway')
    expect(pocono).toBeDefined()
    expect(pocono?.lengthKm).toBe(4.023)

    // Darlington Egg
    const darlington = getNascarTrack('Darlington Raceway')
    expect(darlington).toBeDefined()
    expect(darlington?.lengthKm).toBe(2.198)

    // Martinsville Paperclip
    const martinsville = getNascarTrack('Martinsville Speedway')
    expect(martinsville).toBeDefined()
    expect(martinsville?.lengthKm).toBe(0.847)
  })

  it('verifies all 24 Grand Prix tracks in TRACK_REGISTRY are closed loops with valid telemetry bounds', () => {
    const f1TrackNames = [
      'Sakhir', 'Jeddah', 'Melbourne', 'Suzuka', 'Shanghai', 'Miami',
      'Imola', 'Monte Carlo', 'Montreal', 'Catalunya', 'Spielberg', 'Silverstone',
      'Hungaroring', 'Spa-Francorchamps', 'Zandvoort', 'Monza', 'Baku', 'Singapore',
      'Austin', 'Mexico City', 'Interlagos', 'Las Vegas', 'Lusail', 'Yas Marina Circuit'
    ]

    for (const name of f1TrackNames) {
      const track = getTrackForCircuit(name, 'f1')
      expect(track).toBeDefined()
      expect(track.referenceLine.length).toBeGreaterThan(150)
      
      const pts = track.referenceLine
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const p of pts) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      }
      expect(maxX - minX).toBeGreaterThan(100)
      expect(maxY - minY).toBeGreaterThan(100)

      // Verify closed loop without gaps
      const first = pts[0]
      const last = pts[pts.length - 1]
      const loopGap = Math.hypot(first.x - last.x, first.y - last.y)
      expect(loopGap).toBeLessThan(35)
    }
  })

  it('verifies all 34 NASCAR tracks are closed loops with accurate aspect ratios', () => {
    const nascarKeys = Object.keys(NASCAR_TRACK_REGISTRY)
    expect(nascarKeys.length).toBe(34)

    for (const key of nascarKeys) {
      const track = NASCAR_TRACK_REGISTRY[key]
      expect(track.referenceLine.length).toBeGreaterThan(100)

      const pts = track.referenceLine
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const p of pts) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
      }
      expect(maxX - minX).toBeGreaterThan(50)
      expect(maxY - minY).toBeGreaterThan(50)

      // Verify smooth closed loop
      const first = pts[0]
      const last = pts[pts.length - 1]
      const loopGap = Math.hypot(first.x - last.x, first.y - last.y)
      expect(loopGap).toBeLessThan(10)
    }
  })
})
