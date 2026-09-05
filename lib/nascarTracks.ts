import type { Point2D, TrackGeometry } from './replayTypes'
import { generatePitLaneForTrack } from './pitLaneGenerator'

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

function catmullRomLoop(controlPoints: Point2D[], pointsPerSegment = 50): Point2D[] {
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

/**
 * Normalizes coordinates into a consistent 1000x1000 viewport centered at (500, 500),
 * preserving exact geometric orientation (no arbitrary auto-rotation).
 */
function normalizeCoordinates(points: Point2D[]): Point2D[] {
  if (points.length === 0) return points

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const width = maxX - minX
  const height = maxY - minY
  const maxDim = Math.max(width, height)
  const scale = 800 / (maxDim || 1)

  const scaled = points.map(p => ({
    x: (p.x - minX) * scale,
    y: (p.y - minY) * scale
  }))

  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const offsetX = 500 - (scaledWidth / 2)
  const offsetY = 500 - (scaledHeight / 2)

  return scaled.map(p => ({
    x: p.x + offsetX,
    y: p.y + offsetY
  }))
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
  const rawLine = catmullRomLoop(spec.points, 50)
  const referenceLine = normalizeCoordinates(rawLine)
  const width = spec.width ?? (spec.type === 'circuit' || spec.type === 'street' ? 14 : 26)
  const innerEdge = offsetLoop(referenceLine, width)
  const outerEdge = offsetLoop(referenceLine, -width)
  const baseGeom: TrackGeometry = {
    name: spec.name,
    country: spec.country ?? 'United States',
    lengthKm: spec.lengthKm,
    totalLaps: spec.laps,
    type: spec.type ?? 'oval',
    referenceLine,
    innerEdge,
    outerEdge,
    startFinishIdx: 0,
    drsZones: [],
    sectors: [
      { name: 'S1', startIdx: 0, endIdx: Math.floor(referenceLine.length / 3) },
      { name: 'S2', startIdx: Math.floor(referenceLine.length / 3), endIdx: Math.floor(referenceLine.length * 2 / 3) },
      { name: 'S3', startIdx: Math.floor(referenceLine.length * 2 / 3), endIdx: referenceLine.length - 1 },
    ],
    rotation: 0,
  }
  return {
    ...baseGeom,
    pitLane: generatePitLaneForTrack(baseGeom),
  }
}

// ═══════════════════════════════════════════════════════════════════════
// AUTHENTIC NASCAR CIRCUIT GEOMETRY PRESETS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Phoenix Raceway (Avondale, AZ) — 1.0-mile low-banked tri-oval
 * Distinctive features:
 * - Straight backstretch along the North
 * - Sweeping wide Turns 3 & 4 on the West
 * - Start / Finish line located shortly after Turn 4 exit
 * - The iconic DOGLEG frontstretch that bows outwards/south
 * - Banked Turns 1 & 2 on the East (tighter radius than T3/T4)
 * - Authentic counter-clockwise NASCAR racing direction
 */
const phoenixRacewayPoints: Point2D[] = [
  // ── Start / Finish Line (Frontstretch near Turn 4 exit) ──
  { x: -260, y: -130 },
  // ── Frontstretch sweeping towards the Dogleg ─────────────
  { x: -170, y: -160 },
  { x: -80, y: -185 },
  // ── The Dogleg (iconic outward curve bulging South) ─────
  { x: 10, y: -198 },
  { x: 100, y: -190 },
  { x: 185, y: -165 },
  // ── Turn 1 Entry (Southeast) ────────────────────────────
  { x: 255, y: -125 },
  // ── Turns 1 & 2 (East banking: tighter radius) ──────────
  { x: 325, y: -65 },
  { x: 365, y: 5 },
  { x: 345, y: 85 },
  { x: 285, y: 155 },
  // ── Turn 2 Exit onto Backstretch ────────────────────────
  { x: 215, y: 180 },
  // ── Backstretch (Flat horizontal straight along North) ──
  { x: 100, y: 180 },
  { x: 0, y: 180 },
  { x: -100, y: 180 },
  // ── Turn 3 Entry (Northwest) ────────────────────────────
  { x: -215, y: 180 },
  // ── Turns 3 & 4 (West banking: wider sweeping radius) ───
  { x: -310, y: 150 },
  { x: -380, y: 90 },
  { x: -415, y: 0 },
  { x: -390, y: -80 },
  { x: -325, y: -120 },
]

/**
 * Indianapolis Motor Speedway (Speedway, IN) — 2.5-mile rectangular oval
 * Distinctive features:
 * - 4 distinct 90-degree corners
 * - 2 long straights (North backstretch & South frontstretch)
 * - 2 short chutes (East and West)
 */
const brickyardRectangular: Point2D[] = [
  // Start / finish (Yard of Bricks on South frontstretch)
  { x: 0, y: -180 },
  { x: 220, y: -180 },
  // Turn 1 (90° corner SE)
  { x: 320, y: -160 },
  { x: 360, y: -110 },
  // East Short Chute
  { x: 360, y: 0 },
  // Turn 2 (90° corner NE)
  { x: 360, y: 110 },
  { x: 320, y: 160 },
  // Backstretch (North)
  { x: 220, y: 180 },
  { x: 0, y: 180 },
  { x: -220, y: 180 },
  // Turn 3 (90° corner NW)
  { x: -320, y: 160 },
  { x: -360, y: 110 },
  // West Short Chute
  { x: -360, y: 0 },
  // Turn 4 (90° corner SW)
  { x: -360, y: -110 },
  { x: -320, y: -160 },
  { x: -220, y: -180 },
]

/**
 * Pocono Raceway (Long Pond, PA) — 2.5-mile "Tricky Triangle"
 * Distinctive features:
 * - Frontstretch: 3,740 ft along South
 * - Turn 1 (SE): 14° banking
 * - Long Pond Straight: 3,055 ft heading to Tunnel Turn
 * - Turn 2 Tunnel Turn (North): 8° banking
 * - Short Straight: 1,780 ft heading to Turn 3
 * - Turn 3 (SW): 6° banking
 */
const poconoTriangle: Point2D[] = [
  // Start / finish on South frontstretch
  { x: 0, y: -180 },
  { x: 260, y: -180 },
  // Turn 1 (SE banking)
  { x: 350, y: -140 },
  { x: 380, y: -70 },
  { x: 340, y: -10 },
  // Long Pond Straight heading to Turn 2
  { x: 220, y: 80 },
  { x: 100, y: 155 },
  // Turn 2 Tunnel Turn (North apex)
  { x: 0, y: 195 },
  { x: -60, y: 175 },
  // Short Straight heading to Turn 3
  { x: -160, y: 100 },
  { x: -260, y: 10 },
  // Turn 3 (SW)
  { x: -340, y: -70 },
  { x: -330, y: -140 },
  { x: -240, y: -180 },
]

/**
 * Darlington Raceway (Darlington, SC) — 1.366-mile egg-shaped oval
 * Turns 1-2 are wide and sweeping (East); Turns 3-4 are tight and narrow (West).
 */
const darlingtonEgg: Point2D[] = [
  // Start / finish on frontstretch
  { x: 0, y: -170 },
  { x: 240, y: -185 },
  // Turns 1 & 2 (Wide and sweeping East end)
  { x: 350, y: -120 },
  { x: 395, y: 0 },
  { x: 350, y: 120 },
  { x: 240, y: 185 },
  // Backstretch heading West
  { x: 0, y: 170 },
  { x: -200, y: 150 },
  // Turns 3 & 4 (Tight and narrow West end)
  { x: -320, y: 90 },
  { x: -350, y: 0 },
  { x: -320, y: -90 },
  { x: -200, y: -150 },
]

/**
 * Daytona & Talladega Superspeedway Tri-Ovals
 * Flat backstretch at the North; gentle tri-oval bend on South with start/finish line.
 */
const superspeedwayTriOval = (length = 410, height = 180, triOffset = 25): Point2D[] => [
  // Start/Finish in the tri-oval apex
  { x: 0, y: -height - triOffset },
  { x: 140, y: -height },
  { x: 280, y: -height + 15 },
  // Turns 1 & 2
  { x: length * 0.88, y: -height * 0.5 },
  { x: length, y: 0 },
  { x: length * 0.88, y: height * 0.5 },
  { x: 280, y: height },
  // Flat Backstretch
  { x: 140, y: height },
  { x: 0, y: height },
  { x: -140, y: height },
  { x: -280, y: height },
  // Turns 3 & 4
  { x: -length * 0.88, y: height * 0.5 },
  { x: -length, y: 0 },
  { x: -length * 0.88, y: -height * 0.5 },
  { x: -280, y: -height + 15 },
  { x: -140, y: -height },
]

/**
 * Quad-Oval (Charlotte, Atlanta, Texas)
 * Double dogleg on frontstretch with pointed tri-oval at start/finish.
 */
const quadOval = (length = 405, height = 180): Point2D[] => [
  // Start/Finish at center point of frontstretch
  { x: 0, y: -height - 20 },
  { x: 80, y: -height + 10 },
  { x: 200, y: -height },
  { x: 290, y: -height + 25 },
  // Turns 1 & 2
  { x: length * 0.9, y: -height * 0.4 },
  { x: length, y: 0 },
  { x: length * 0.9, y: height * 0.5 },
  { x: 260, y: height },
  // Backstretch
  { x: 100, y: height },
  { x: -100, y: height },
  { x: -260, y: height },
  // Turns 3 & 4
  { x: -length * 0.9, y: height * 0.5 },
  { x: -length, y: 0 },
  { x: -length * 0.9, y: -height * 0.4 },
  { x: -290, y: -height + 25 },
  { x: -200, y: -height },
  { x: -80, y: -height + 10 },
]

/** Paperclip (Martinsville, Bowman Gray) */
const paperclip = (length = 410, height = 95): Point2D[] => [
  { x: 0, y: -height },
  { x: length * 0.7, y: -height },
  { x: length * 0.95, y: -height * 0.6 },
  { x: length, y: 0 },
  { x: length * 0.95, y: height * 0.6 },
  { x: length * 0.7, y: height },
  { x: 0, y: height },
  { x: -length * 0.7, y: height },
  { x: -length * 0.95, y: height * 0.6 },
  { x: -length, y: 0 },
  { x: -length * 0.95, y: -height * 0.6 },
  { x: -length * 0.7, y: -height },
]

/** Symmetrical Oval (Bristol, Dover) */
const oval = (length = 390, height = 190): Point2D[] => [
  { x: 0, y: -height },
  { x: length * 0.6, y: -height },
  { x: length * 0.9, y: -height * 0.6 },
  { x: length, y: 0 },
  { x: length * 0.9, y: height * 0.6 },
  { x: length * 0.6, y: height },
  { x: 0, y: height },
  { x: -length * 0.6, y: height },
  { x: -length * 0.9, y: height * 0.6 },
  { x: -length, y: 0 },
  { x: -length * 0.9, y: -height * 0.6 },
  { x: -length * 0.6, y: -height },
]

/** D-shaped Oval (Las Vegas, Kansas, Michigan, Richmond, Iowa, Nashville) */
const dOval = (length = 405, height = 185): Point2D[] => [
  // Frontstretch curved like a D
  { x: 0, y: -height - 18 },
  { x: 160, y: -height - 10 },
  { x: 290, y: -height + 15 },
  // Turns 1 & 2
  { x: length * 0.9, y: -height * 0.4 },
  { x: length, y: 0 },
  { x: length * 0.9, y: height * 0.5 },
  { x: 260, y: height },
  // Flat Backstretch
  { x: 100, y: height },
  { x: 0, y: height },
  { x: -100, y: height },
  { x: -260, y: height },
  // Turns 3 & 4
  { x: -length * 0.9, y: height * 0.5 },
  { x: -length, y: 0 },
  { x: -length * 0.9, y: -height * 0.4 },
  { x: -290, y: -height + 15 },
  { x: -160, y: -height - 10 },
]

// ═══════════════════════════════════════════════════════════════════════
// TRACK SPECIFICATIONS DICTIONARY
// ═══════════════════════════════════════════════════════════════════════

const specs: Record<string, TrackSpec> = {
  'Phoenix Raceway': { name: 'Phoenix Raceway', lengthKm: 1.645, laps: 312, points: phoenixRacewayPoints },
  'Daytona International Speedway': { name: 'Daytona International Speedway', lengthKm: 4.023, laps: 200, points: superspeedwayTriOval(420, 185, 28) },
  'Talladega Superspeedway': { name: 'Talladega Superspeedway', lengthKm: 4.281, laps: 188, points: superspeedwayTriOval(430, 185, 30) },
  'Indianapolis Motor Speedway': { name: 'Indianapolis Motor Speedway', lengthKm: 4.023, laps: 160, points: brickyardRectangular },
  'Pocono Raceway': { name: 'Pocono Raceway', lengthKm: 4.023, laps: 160, points: poconoTriangle },
  'Darlington Raceway': { name: 'Darlington Raceway', lengthKm: 2.198, laps: 367, points: darlingtonEgg },
  'Charlotte Motor Speedway': { name: 'Charlotte Motor Speedway', lengthKm: 2.414, laps: 400, points: quadOval(410, 180) },
  'Atlanta Motor Speedway': { name: 'Atlanta Motor Speedway', lengthKm: 2.414, laps: 260, points: quadOval(400, 182) },
  'Texas Motor Speedway': { name: 'Texas Motor Speedway', lengthKm: 2.414, laps: 267, points: quadOval(410, 175) },
  'Las Vegas Motor Speedway': { name: 'Las Vegas Motor Speedway', lengthKm: 2.414, laps: 267, points: dOval(405, 180) },
  'Kansas Speedway': { name: 'Kansas Speedway', lengthKm: 2.414, laps: 267, points: dOval(405, 180) },
  'Michigan International Speedway': { name: 'Michigan International Speedway', lengthKm: 3.219, laps: 200, points: dOval(415, 185) },
  'Richmond Raceway': { name: 'Richmond Raceway', lengthKm: 1.207, laps: 400, points: dOval(390, 175) },
  'Iowa Speedway': { name: 'Iowa Speedway', lengthKm: 1.408, laps: 350, points: dOval(395, 175) },
  'Nashville Superspeedway': { name: 'Nashville Superspeedway', lengthKm: 2.145, laps: 300, points: dOval(405, 180) },
  'Rockingham Speedway': { name: 'Rockingham Speedway', lengthKm: 1.637, laps: 250, points: dOval(400, 175) },
  'Homestead-Miami Speedway': { name: 'Homestead-Miami Speedway', lengthKm: 2.414, laps: 267, points: oval(405, 180) },
  'Bristol Motor Speedway': { name: 'Bristol Motor Speedway', lengthKm: 0.858, laps: 500, points: oval(360, 170) },
  'Dover Motor Speedway': { name: 'Dover Motor Speedway', lengthKm: 1.609, laps: 400, points: oval(390, 168) },
  'Martinsville Speedway': { name: 'Martinsville Speedway', lengthKm: 0.847, laps: 500, points: paperclip(415, 80) },
  'Bowman Gray Stadium': { name: 'Bowman Gray Stadium', lengthKm: 0.402, laps: 200, points: paperclip(380, 80) },
  'North Wilkesboro Speedway': { name: 'North Wilkesboro Speedway', lengthKm: 1.006, laps: 250, points: oval(395, 140) },
  'New Hampshire Motor Speedway': { name: 'New Hampshire Motor Speedway', lengthKm: 1.703, laps: 301, points: paperclip(405, 125) },
  'World Wide Technology Raceway': { name: 'World Wide Technology Raceway', lengthKm: 2.012, laps: 240, points: darlingtonEgg },
  'Lucas Oil Indianapolis Raceway Park': { name: 'Lucas Oil Indianapolis Raceway Park', lengthKm: 1.104, laps: 200, points: oval(400, 125) },
  'Milwaukee Mile': { name: 'Milwaukee Mile', lengthKm: 1.609, laps: 175, points: oval(400, 145) },

  // Road courses
  'Circuit of the Americas': {
    name: 'Circuit of the Americas',
    lengthKm: 5.513,
    laps: 68,
    type: 'circuit',
    points: [
      { x: -390, y: -160 }, { x: -80, y: -165 }, { x: 20, y: -250 }, { x: 80, y: -90 },
      { x: 245, y: -210 }, { x: 375, y: -110 }, { x: 210, y: 20 }, { x: 355, y: 130 },
      { x: 150, y: 245 }, { x: -20, y: 80 }, { x: -100, y: 225 }, { x: -205, y: 55 },
      { x: -365, y: 150 }, { x: -260, y: -20 }
    ]
  },
  'Watkins Glen International': {
    name: 'Watkins Glen International',
    lengthKm: 3.949,
    laps: 90,
    type: 'circuit',
    points: [
      { x: -370, y: -175 }, { x: 100, y: -180 }, { x: 330, y: -80 }, { x: 235, y: 25 },
      { x: 365, y: 165 }, { x: 80, y: 220 }, { x: -80, y: 95 }, { x: -250, y: 210 },
      { x: -355, y: 55 }, { x: -180, y: -20 }
    ]
  },
  'Sonoma Raceway': {
    name: 'Sonoma Raceway',
    lengthKm: 3.203,
    laps: 110,
    type: 'circuit',
    points: [
      { x: -350, y: -170 }, { x: -80, y: -180 }, { x: 40, y: -75 }, { x: -80, y: 45 },
      { x: 70, y: 190 }, { x: 230, y: 120 }, { x: 370, y: 220 }, { x: 330, y: 15 },
      { x: 155, y: -60 }, { x: 290, y: -190 }, { x: 30, y: -210 }, { x: -170, y: -70 },
      { x: -360, y: 70 }
    ]
  },
  'Charlotte Motor Speedway ROVAL': {
    name: 'Charlotte Motor Speedway ROVAL',
    lengthKm: 3.669,
    laps: 109,
    type: 'circuit',
    points: [
      { x: -400, y: -115 }, { x: -80, y: -120 }, { x: 20, y: -45 }, { x: -80, y: 20 },
      { x: 120, y: 80 }, { x: 15, y: 145 }, { x: 260, y: 155 }, { x: 400, y: 50 },
      { x: 350, y: -130 }, { x: 80, y: -155 }, { x: -120, y: -55 }, { x: -320, y: -160 }
    ]
  },
  'Chicago Street Course': {
    name: 'Chicago Street Course',
    lengthKm: 3.444,
    laps: 75,
    type: 'street',
    points: [
      { x: -340, y: -200 }, { x: 10, y: -200 }, { x: 15, y: -80 }, { x: 310, y: -80 },
      { x: 320, y: 80 }, { x: 120, y: 85 }, { x: 120, y: 230 }, { x: -80, y: 225 },
      { x: -85, y: 70 }, { x: -350, y: 70 }
    ]
  },
  'Autodromo Hermanos Rodriguez': {
    name: 'Autodromo Hermanos Rodriguez',
    country: 'Mexico',
    lengthKm: 3.894,
    laps: 100,
    type: 'circuit',
    points: [
      { x: -390, y: -150 }, { x: 160, y: -150 }, { x: 350, y: -55 }, { x: 260, y: 40 },
      { x: 375, y: 175 }, { x: 140, y: 220 }, { x: 25, y: 80 }, { x: -130, y: 190 },
      { x: -320, y: 80 }, { x: -210, y: -30 }
    ]
  },
  'Lime Rock Park': {
    name: 'Lime Rock Park',
    lengthKm: 2.462,
    laps: 100,
    type: 'circuit',
    points: [
      { x: -390, y: -130 }, { x: 80, y: -150 }, { x: 330, y: -60 }, { x: 260, y: 80 },
      { x: 370, y: 180 }, { x: 50, y: 205 }, { x: -120, y: 80 }, { x: -330, y: 140 }
    ]
  },
  'Portland International Raceway': {
    name: 'Portland International Raceway',
    lengthKm: 3.166,
    laps: 75,
    type: 'circuit',
    points: [
      { x: -360, y: -170 }, { x: -80, y: -190 }, { x: 180, y: -150 }, { x: 360, y: -20 },
      { x: 300, y: 170 }, { x: 90, y: 95 }, { x: 10, y: 250 }, { x: -180, y: 230 },
      { x: -120, y: 55 }, { x: -320, y: 100 }, { x: -250, y: -40 }
    ]
  },
}

export const NASCAR_TRACK_REGISTRY: Record<string, TrackGeometry> = Object.fromEntries(
  Object.entries(specs).map(([key, spec]) => [key, geometry(spec)])
)

const aliases: Record<string, string> = {
  'gateway motorsports park': 'World Wide Technology Raceway',
  'wwt raceway': 'World Wide Technology Raceway',
  'gateway': 'World Wide Technology Raceway',
  'charlotte roval': 'Charlotte Motor Speedway ROVAL',
  'roval': 'Charlotte Motor Speedway ROVAL',
  'cota': 'Circuit of the Americas',
  'autodromo hermanos rodriguez': 'Autodromo Hermanos Rodriguez',
  'mexico city': 'Autodromo Hermanos Rodriguez',
  'indianapolis raceway park': 'Lucas Oil Indianapolis Raceway Park',
  'lucas oil raceway': 'Lucas Oil Indianapolis Raceway Park',
  'phoenix': 'Phoenix Raceway',
  'daytona': 'Daytona International Speedway',
  'talladega': 'Talladega Superspeedway',
  'brickyard': 'Indianapolis Motor Speedway',
  'indianapolis': 'Indianapolis Motor Speedway',
  'ims': 'Indianapolis Motor Speedway',
  'pocono': 'Pocono Raceway',
  'darlington': 'Darlington Raceway',
  'bristol': 'Bristol Motor Speedway',
  'martinsville': 'Martinsville Speedway',
  'charlotte': 'Charlotte Motor Speedway',
  'atlanta': 'Atlanta Motor Speedway',
  'texas': 'Texas Motor Speedway',
  'las vegas': 'Las Vegas Motor Speedway',
  'kansas': 'Kansas Speedway',
  'michigan': 'Michigan International Speedway',
  'richmond': 'Richmond Raceway',
  'iowa': 'Iowa Speedway',
  'nashville': 'Nashville Superspeedway',
  'rockingham': 'Rockingham Speedway',
  'homestead': 'Homestead-Miami Speedway',
  'homestead miami': 'Homestead-Miami Speedway',
  'dover': 'Dover Motor Speedway',
  'bowman gray': 'Bowman Gray Stadium',
  'north wilkesboro': 'North Wilkesboro Speedway',
  'new hampshire': 'New Hampshire Motor Speedway',
  'loudon': 'New Hampshire Motor Speedway',
  'milwaukee': 'Milwaukee Mile',
  'milwaukee mile': 'Milwaukee Mile',
  'watkins glen': 'Watkins Glen International',
  'the glen': 'Watkins Glen International',
  'sonoma': 'Sonoma Raceway',
  'chicago': 'Chicago Street Course',
  'chicago street': 'Chicago Street Course',
  'lime rock': 'Lime Rock Park',
  'portland': 'Portland International Raceway',
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getNascarTrack(circuitName?: string): TrackGeometry | undefined {
  if (!circuitName) return undefined
  const normalized = normalizeName(circuitName)
  const alias = aliases[normalized]
  if (alias && NASCAR_TRACK_REGISTRY[alias]) return NASCAR_TRACK_REGISTRY[alias]

  const candidates = Object.entries(NASCAR_TRACK_REGISTRY)
    .map(([name, track]) => ({ normalized: normalizeName(name), track }))
    .sort((a, b) => b.normalized.length - a.normalized.length)
  const exactMatch = candidates.find(({ normalized: venue }) => normalized === venue)
  if (exactMatch) return exactMatch.track
  return candidates.find(({ normalized: venue }) => normalized.includes(venue) || venue.includes(normalized))?.track
}
