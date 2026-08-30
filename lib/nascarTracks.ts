import type { Point2D, TrackGeometry } from './replayTypes'

type TrackKind = 'oval' | 'circuit' | 'street'

interface TrackSpec {
  name: string
  country?: string
  lengthKm: number
  laps: number
  type?: TrackKind
  width?: number
  points: Point2D[]
}

function catmullRomLoop(controlPoints: Point2D[], pointsPerSegment = 24): Point2D[] {
  const points: Point2D[] = []
  for (let index = 0; index < controlPoints.length; index++) {
    const p0 = controlPoints[(index - 1 + controlPoints.length) % controlPoints.length]
    const p1 = controlPoints[index]
    const p2 = controlPoints[(index + 1) % controlPoints.length]
    const p3 = controlPoints[(index + 2) % controlPoints.length]
    for (let step = 0; step < pointsPerSegment; step++) {
      const t = step / pointsPerSegment
      const t2 = t * t
      const t3 = t2 * t
      points.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  points.push({ ...points[0] })
  return points
}

function offsetLoop(line: Point2D[], distance: number): Point2D[] {
  const pointCount = line.length - 1
  const result: Point2D[] = []
  for (let index = 0; index < pointCount; index++) {
    const previous = line[(index - 1 + pointCount) % pointCount]
    const next = line[(index + 1) % pointCount]
    const dx = next.x - previous.x
    const dy = next.y - previous.y
    const length = Math.hypot(dx, dy) || 1
    result.push({ x: line[index].x - (dy / length) * distance, y: line[index].y + (dx / length) * distance })
  }
  result.push({ ...result[0] })
  return result
}

function geometry(spec: TrackSpec): TrackGeometry {
  const referenceLine = catmullRomLoop(spec.points)
  const width = spec.width ?? (spec.type === 'circuit' || spec.type === 'street' ? 7 : 12)
  return {
    name: spec.name,
    country: spec.country ?? 'United States',
    lengthKm: spec.lengthKm,
    totalLaps: spec.laps,
    type: spec.type ?? 'oval',
    referenceLine,
    innerEdge: offsetLoop(referenceLine, width),
    outerEdge: offsetLoop(referenceLine, -width),
    startFinishIdx: 0,
    drsZones: [],
    sectors: [
      { name: 'S1', startIdx: 0, endIdx: Math.floor(referenceLine.length / 3) },
      { name: 'S2', startIdx: Math.floor(referenceLine.length / 3), endIdx: Math.floor(referenceLine.length * 2 / 3) },
      { name: 'S3', startIdx: Math.floor(referenceLine.length * 2 / 3), endIdx: referenceLine.length - 1 },
    ],
    rotation: 0,
  }
}

const oval = (length = 390, height = 190): Point2D[] => [
  { x: -length, y: 0 }, { x: -length * .78, y: height * .82 }, { x: 0, y: height },
  { x: length * .78, y: height * .82 }, { x: length, y: 0 }, { x: length * .78, y: -height * .82 },
  { x: 0, y: -height }, { x: -length * .78, y: -height * .82 },
]

const triOval = (length = 400, height = 190): Point2D[] => [
  { x: -length, y: 0 }, { x: -length * .8, y: height }, { x: 0, y: height * .88 },
  { x: length * .82, y: height }, { x: length, y: 0 }, { x: length * .78, y: -height * .82 },
  { x: length * .1, y: -height }, { x: -length * .32, y: -height * .58 }, { x: -length * .8, y: -height * .82 },
]

const quadOval = (length = 400, height = 180): Point2D[] => [
  { x: -length, y: 0 }, { x: -length * .82, y: height }, { x: -length * .25, y: height * .88 },
  { x: length * .22, y: height * .55 }, { x: length * .82, y: height }, { x: length, y: 0 },
  { x: length * .8, y: -height }, { x: length * .2, y: -height * .85 }, { x: -length * .25, y: -height * .55 },
  { x: -length * .82, y: -height },
]

const paperclip = (length = 410, height = 105): Point2D[] => [
  { x: -length, y: 0 }, { x: -length * .9, y: height * .9 }, { x: 0, y: height },
  { x: length * .9, y: height * .9 }, { x: length, y: 0 }, { x: length * .9, y: -height * .9 },
  { x: 0, y: -height }, { x: -length * .9, y: -height * .9 },
]

const dOval: Point2D[] = [
  { x: -400, y: 0 }, { x: -320, y: 175 }, { x: 40, y: 210 }, { x: 350, y: 150 },
  { x: 410, y: 0 }, { x: 330, y: -170 }, { x: 20, y: -205 }, { x: -120, y: -120 }, { x: -340, y: -165 },
]

const roadAmerica: Point2D[] = [
  { x: -360, y: -170 }, { x: -80, y: -190 }, { x: 180, y: -150 }, { x: 360, y: -20 },
  { x: 300, y: 170 }, { x: 90, y: 95 }, { x: 10, y: 250 }, { x: -180, y: 230 },
  { x: -120, y: 55 }, { x: -320, y: 100 }, { x: -250, y: -40 },
]

const specs: Record<string, TrackSpec> = {
  'Bowman Gray Stadium': { name: 'Bowman Gray Stadium', lengthKm: .402, laps: 200, points: paperclip(390, 82) },
  'Daytona International Speedway': { name: 'Daytona International Speedway', lengthKm: 4.023, laps: 200, points: triOval(410, 190) },
  'Atlanta Motor Speedway': { name: 'Atlanta Motor Speedway', lengthKm: 2.414, laps: 260, points: quadOval(400, 182) },
  'Las Vegas Motor Speedway': { name: 'Las Vegas Motor Speedway', lengthKm: 2.414, laps: 267, points: dOval },
  'Phoenix Raceway': { name: 'Phoenix Raceway', lengthKm: 1.645, laps: 312, points: [{ x: -400, y: -70 }, { x: -290, y: 150 }, { x: 130, y: 180 }, { x: 390, y: 65 }, { x: 340, y: -150 }, { x: 20, y: -180 }, { x: -130, y: -80 }, { x: -330, y: -170 }] },
  'Bristol Motor Speedway': { name: 'Bristol Motor Speedway', lengthKm: .858, laps: 500, points: oval(360, 150) },
  'Circuit of the Americas': { name: 'Circuit of the Americas', lengthKm: 5.513, laps: 68, type: 'circuit', points: [{ x: -390, y: -160 }, { x: -80, y: -165 }, { x: 20, y: -250 }, { x: 80, y: -90 }, { x: 245, y: -210 }, { x: 375, y: -110 }, { x: 210, y: 20 }, { x: 355, y: 130 }, { x: 150, y: 245 }, { x: -20, y: 80 }, { x: -100, y: 225 }, { x: -205, y: 55 }, { x: -365, y: 150 }, { x: -260, y: -20 }] },
  'Richmond Raceway': { name: 'Richmond Raceway', lengthKm: 1.207, laps: 400, points: dOval },
  'Talladega Superspeedway': { name: 'Talladega Superspeedway', lengthKm: 4.281, laps: 188, points: triOval(420, 178) },
  'Texas Motor Speedway': { name: 'Texas Motor Speedway', lengthKm: 2.414, laps: 267, points: quadOval(410, 175) },
  'Dover Motor Speedway': { name: 'Dover Motor Speedway', lengthKm: 1.609, laps: 400, points: oval(390, 168) },
  'Kansas Speedway': { name: 'Kansas Speedway', lengthKm: 2.414, laps: 267, points: dOval },
  'Darlington Raceway': { name: 'Darlington Raceway', lengthKm: 2.198, laps: 367, points: [{ x: -410, y: -20 }, { x: -330, y: 165 }, { x: 20, y: 190 }, { x: 390, y: 95 }, { x: 410, y: -35 }, { x: 290, y: -190 }, { x: -60, y: -165 }, { x: -350, y: -110 }] },
  'North Wilkesboro Speedway': { name: 'North Wilkesboro Speedway', lengthKm: 1.006, laps: 250, points: oval(395, 120) },
  'Charlotte Motor Speedway ROVAL': { name: 'Charlotte Motor Speedway ROVAL', lengthKm: 3.669, laps: 109, type: 'circuit', points: [{ x: -400, y: -115 }, { x: -80, y: -120 }, { x: 20, y: -45 }, { x: -80, y: 20 }, { x: 120, y: 80 }, { x: 15, y: 145 }, { x: 260, y: 155 }, { x: 400, y: 50 }, { x: 350, y: -130 }, { x: 80, y: -155 }, { x: -120, y: -55 }, { x: -320, y: -160 }] },
  'Charlotte Motor Speedway': { name: 'Charlotte Motor Speedway', lengthKm: 2.414, laps: 400, points: quadOval(410, 180) },
  'World Wide Technology Raceway': { name: 'World Wide Technology Raceway', lengthKm: 2.012, laps: 240, points: [{ x: -400, y: 0 }, { x: -330, y: 150 }, { x: 80, y: 160 }, { x: 390, y: 80 }, { x: 405, y: -35 }, { x: 300, y: -150 }, { x: -60, y: -175 }, { x: -350, y: -105 }] },
  'Sonoma Raceway': { name: 'Sonoma Raceway', lengthKm: 3.203, laps: 110, type: 'circuit', points: [{ x: -350, y: -170 }, { x: -80, y: -180 }, { x: 40, y: -75 }, { x: -80, y: 45 }, { x: 70, y: 190 }, { x: 230, y: 120 }, { x: 370, y: 220 }, { x: 330, y: 15 }, { x: 155, y: -60 }, { x: 290, y: -190 }, { x: 30, y: -210 }, { x: -170, y: -70 }, { x: -360, y: 70 }] },
  'Iowa Speedway': { name: 'Iowa Speedway', lengthKm: 1.408, laps: 350, points: dOval },
  'New Hampshire Motor Speedway': { name: 'New Hampshire Motor Speedway', lengthKm: 1.703, laps: 301, points: paperclip(405, 125) },
  'Chicago Street Course': { name: 'Chicago Street Course', lengthKm: 3.444, laps: 75, type: 'street', points: [{ x: -340, y: -200 }, { x: 10, y: -200 }, { x: 15, y: -80 }, { x: 310, y: -80 }, { x: 320, y: 80 }, { x: 120, y: 85 }, { x: 120, y: 230 }, { x: -80, y: 225 }, { x: -85, y: 70 }, { x: -350, y: 70 }] },
  'Indianapolis Motor Speedway': { name: 'Indianapolis Motor Speedway', lengthKm: 4.023, laps: 160, points: paperclip(410, 160) },
  'Pocono Raceway': { name: 'Pocono Raceway', lengthKm: 4.023, laps: 160, points: [{ x: -410, y: -160 }, { x: 390, y: -40 }, { x: 285, y: 205 }, { x: -160, y: 130 }] },
  'Michigan International Speedway': { name: 'Michigan International Speedway', lengthKm: 3.219, laps: 200, points: dOval },
  'Watkins Glen International': { name: 'Watkins Glen International', lengthKm: 3.949, laps: 90, type: 'circuit', points: [{ x: -370, y: -175 }, { x: 100, y: -180 }, { x: 330, y: -80 }, { x: 235, y: 25 }, { x: 365, y: 165 }, { x: 80, y: 220 }, { x: -80, y: 95 }, { x: -250, y: 210 }, { x: -355, y: 55 }, { x: -180, y: -20 }] },
  'Homestead-Miami Speedway': { name: 'Homestead-Miami Speedway', lengthKm: 2.414, laps: 267, points: oval(405, 180) },
  'Martinsville Speedway': { name: 'Martinsville Speedway', lengthKm: .847, laps: 500, points: paperclip(415, 78) },
  'Nashville Superspeedway': { name: 'Nashville Superspeedway', lengthKm: 2.145, laps: 300, points: dOval },
  'Autodromo Hermanos Rodriguez': { name: 'Autodromo Hermanos Rodriguez', country: 'Mexico', lengthKm: 3.894, laps: 100, type: 'circuit', points: [{ x: -390, y: -150 }, { x: 160, y: -150 }, { x: 350, y: -55 }, { x: 260, y: 40 }, { x: 375, y: 175 }, { x: 140, y: 220 }, { x: 25, y: 80 }, { x: -130, y: 190 }, { x: -320, y: 80 }, { x: -210, y: -30 }] },
  'Rockingham Speedway': { name: 'Rockingham Speedway', lengthKm: 1.637, laps: 250, points: dOval },
  'Lime Rock Park': { name: 'Lime Rock Park', lengthKm: 2.462, laps: 100, type: 'circuit', points: [{ x: -390, y: -130 }, { x: 80, y: -150 }, { x: 330, y: -60 }, { x: 260, y: 80 }, { x: 370, y: 180 }, { x: 50, y: 205 }, { x: -120, y: 80 }, { x: -330, y: 140 }] },
  'Portland International Raceway': { name: 'Portland International Raceway', lengthKm: 3.166, laps: 75, type: 'circuit', points: roadAmerica },
  'Lucas Oil Indianapolis Raceway Park': { name: 'Lucas Oil Indianapolis Raceway Park', lengthKm: 1.104, laps: 200, points: oval(400, 118) },
  'Milwaukee Mile': { name: 'Milwaukee Mile', lengthKm: 1.609, laps: 175, points: oval(400, 145) },
}

export const NASCAR_TRACK_REGISTRY: Record<string, TrackGeometry> = Object.fromEntries(
  Object.entries(specs).map(([key, spec]) => [key, geometry(spec)])
)

const aliases: Record<string, string> = {
  'gateway motorsports park': 'World Wide Technology Raceway',
  'wwt raceway': 'World Wide Technology Raceway',
  'gateway': 'World Wide Technology Raceway',
  'charlotte roval': 'Charlotte Motor Speedway ROVAL',
  'cota': 'Circuit of the Americas',
  'autodromo hermanos rodriguez': 'Autodromo Hermanos Rodriguez',
  'mexico city': 'Autodromo Hermanos Rodriguez',
  'indianapolis raceway park': 'Lucas Oil Indianapolis Raceway Park',
  'lucas oil raceway': 'Lucas Oil Indianapolis Raceway Park',
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getNascarTrack(circuitName?: string): TrackGeometry | undefined {
  if (!circuitName) return undefined
  const normalized = normalizeName(circuitName)
  const alias = aliases[normalized]
  if (alias) return NASCAR_TRACK_REGISTRY[alias]

  const candidates = Object.entries(NASCAR_TRACK_REGISTRY)
    .map(([name, track]) => ({ normalized: normalizeName(name), track }))
    .sort((a, b) => b.normalized.length - a.normalized.length)
  const exactMatch = candidates.find(({ normalized: venue }) => normalized === venue)
  if (exactMatch) return exactMatch.track
  return candidates.find(({ normalized: venue }) => normalized.includes(venue) || venue.includes(normalized))?.track
}
