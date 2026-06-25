// ========================================================================
// TRACK GEOMETRY DATA
// Pre-built track layouts for each racing series.
// Coordinates are in an arbitrary world-space; the renderer normalizes.
// Each track has: referenceLine (racing line), innerEdge, outerEdge.
// ========================================================================

import type { TrackGeometry, Point2D } from './replayTypes';

// ── Utility: generate smooth curves ──────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function cubicBezier(
  p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, steps: number
): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    pts.push({ x, y });
  }
  return pts;
}

/** Generate a smooth closed loop from control points using Catmull-Rom spline */
function catmullRomLoop(controlPoints: Point2D[], pointsPerSegment = 40): Point2D[] {
  const n = controlPoints.length;
  const result: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      result.push({ x, y });
    }
  }

  return result;
}

/** Offset a polyline by a fixed distance (positive = left, negative = right) */
function offsetPolyline(line: Point2D[], dist: number): Point2D[] {
  const n = line.length;
  if (n < 2) return line;

  const result: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const prev = line[(i - 1 + n) % n];
    const next = line[(i + 1) % n];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Normal (perpendicular) direction
    const nx = -dy / len;
    const ny = dx / len;
    result.push({
      x: line[i].x + nx * dist,
      y: line[i].y + ny * dist,
    });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// F1 — Bahrain International Circuit inspired
// ═══════════════════════════════════════════════════════════════════════
const f1ControlPoints: Point2D[] = [
  { x: 500, y: 100 },  // Turn 1 entry (long straight end)
  { x: 600, y: 130 },
  { x: 640, y: 200 },  // Turn 2-3 complex
  { x: 620, y: 300 },
  { x: 650, y: 380 },  // Turn 4
  { x: 600, y: 450 },
  { x: 520, y: 480 },  // Turn 5-6
  { x: 440, y: 500 },
  { x: 380, y: 520 },  // Turn 7-8
  { x: 300, y: 510 },
  { x: 250, y: 460 },  // Turn 9-10
  { x: 220, y: 380 },
  { x: 180, y: 300 },  // Turn 11-12
  { x: 150, y: 220 },
  { x: 200, y: 150 },  // Turn 13-14 
  { x: 300, y: 110 },  // Turn 15 (last corner)
  { x: 400, y: 95 },   // Start/finish straight
];

const f1Reference = catmullRomLoop(f1ControlPoints, 50);
const f1Track: TrackGeometry = {
  name: 'Bahrain International Circuit',
  country: 'Bahrain',
  lengthKm: 5.412,
  totalLaps: 57,
  type: 'circuit',
  referenceLine: f1Reference,
  innerEdge: offsetPolyline(f1Reference, -12),
  outerEdge: offsetPolyline(f1Reference, 12),
  startFinishIdx: Math.floor(f1Reference.length * 0.94),
  drsZones: [
    { startIdx: Math.floor(f1Reference.length * 0.88), endIdx: Math.floor(f1Reference.length * 0.98) },
    { startIdx: Math.floor(f1Reference.length * 0.25), endIdx: Math.floor(f1Reference.length * 0.35) },
  ],
  sectors: [
    { name: 'S1', startIdx: 0, endIdx: Math.floor(f1Reference.length * 0.33) },
    { name: 'S2', startIdx: Math.floor(f1Reference.length * 0.33), endIdx: Math.floor(f1Reference.length * 0.66) },
    { name: 'S3', startIdx: Math.floor(f1Reference.length * 0.66), endIdx: f1Reference.length - 1 },
  ],
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// F2 — Jeddah Corniche inspired (fast street/circuit hybrid)
// ═══════════════════════════════════════════════════════════════════════
const f2ControlPoints: Point2D[] = [
  { x: 100, y: 300 },
  { x: 150, y: 150 },
  { x: 300, y: 80 },
  { x: 500, y: 70 },
  { x: 650, y: 100 },
  { x: 700, y: 200 },
  { x: 680, y: 350 },
  { x: 600, y: 450 },
  { x: 450, y: 500 },
  { x: 300, y: 520 },
  { x: 180, y: 480 },
  { x: 120, y: 400 },
];

const f2Reference = catmullRomLoop(f2ControlPoints, 50);
const f2Track: TrackGeometry = {
  name: 'Jeddah Corniche Circuit',
  country: 'Saudi Arabia',
  lengthKm: 6.174,
  totalLaps: 50,
  type: 'circuit',
  referenceLine: f2Reference,
  innerEdge: offsetPolyline(f2Reference, -10),
  outerEdge: offsetPolyline(f2Reference, 10),
  startFinishIdx: 0,
  drsZones: [
    { startIdx: Math.floor(f2Reference.length * 0.80), endIdx: Math.floor(f2Reference.length * 0.95) },
  ],
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// F3 — Monza inspired (fast with chicanes)
// ═══════════════════════════════════════════════════════════════════════
const f3ControlPoints: Point2D[] = [
  { x: 200, y: 100 },
  { x: 400, y: 80 },
  { x: 600, y: 90 },   // Curva Grande approach
  { x: 680, y: 160 },
  { x: 650, y: 250 },   // Variante della Roggia
  { x: 680, y: 340 },
  { x: 620, y: 420 },   // Lesmo curves
  { x: 520, y: 460 },
  { x: 400, y: 500 },   // Ascari
  { x: 280, y: 480 },
  { x: 180, y: 400 },   // Parabolica
  { x: 140, y: 280 },
  { x: 150, y: 180 },
];

const f3Reference = catmullRomLoop(f3ControlPoints, 45);
const f3Track: TrackGeometry = {
  name: 'Autodromo Nazionale Monza',
  country: 'Italy',
  lengthKm: 5.793,
  totalLaps: 30,
  type: 'circuit',
  referenceLine: f3Reference,
  innerEdge: offsetPolyline(f3Reference, -11),
  outerEdge: offsetPolyline(f3Reference, 11),
  startFinishIdx: 0,
  drsZones: [
    { startIdx: Math.floor(f3Reference.length * 0.90), endIdx: Math.floor(f3Reference.length * 0.99) },
    { startIdx: Math.floor(f3Reference.length * 0.15), endIdx: Math.floor(f3Reference.length * 0.28) },
  ],
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// Formula E — Monaco E-Prix inspired (tight street circuit)
// ═══════════════════════════════════════════════════════════════════════
const feControlPoints: Point2D[] = [
  { x: 300, y: 100 },
  { x: 500, y: 90 },
  { x: 600, y: 140 },   // Sainte Dévote
  { x: 620, y: 240 },
  { x: 580, y: 300 },   // Casino hairpin
  { x: 620, y: 370 },
  { x: 550, y: 430 },   // Portier
  { x: 440, y: 460 },
  { x: 350, y: 490 },   // Chicane
  { x: 260, y: 450 },
  { x: 200, y: 380 },   // Tabac
  { x: 160, y: 290 },
  { x: 180, y: 200 },   // Rascasse
  { x: 230, y: 140 },
];

const feReference = catmullRomLoop(feControlPoints, 45);
const feTrack: TrackGeometry = {
  name: 'Monaco E-Prix Circuit',
  country: 'Monaco',
  lengthKm: 3.337,
  totalLaps: 45,
  type: 'street',
  referenceLine: feReference,
  innerEdge: offsetPolyline(feReference, -8),
  outerEdge: offsetPolyline(feReference, 8),
  startFinishIdx: 0,
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// NASCAR — Daytona International Speedway (D-shaped superspeedway)
// ═══════════════════════════════════════════════════════════════════════
function buildOvalTrack(
  cx: number, cy: number,
  radiusX: number, radiusY: number,
  flatTopFraction: number,
  points: number
): Point2D[] {
  const result: Point2D[] = [];
  const flatTopLen = radiusX * flatTopFraction;

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    let angle: number;

    if (t < 0.25) {
      // Bottom straight → Turn 1-2
      angle = Math.PI * 0.5 + (t / 0.25) * Math.PI;
    } else if (t < 0.5) {
      // Turn 1-2 → Top straight
      angle = Math.PI * 1.5 + ((t - 0.25) / 0.25) * Math.PI * 0.5;
      // Flatten top portion
    } else if (t < 0.75) {
      // Top straight → Turn 3-4
      angle = Math.PI * 2.0 + ((t - 0.5) / 0.25) * Math.PI * 0.5;
    } else {
      // Turn 3-4 → Bottom straight
      angle = Math.PI * 0.5 * ((t - 0.75) / 0.25);
    }

    // Use tri-oval D-shape
    const x = cx + radiusX * Math.cos(angle);
    const y = cy + radiusY * Math.sin(angle);
    result.push({ x, y });
  }
  return result;
}

// Simpler approach: parametric D-oval
const nascarControlPoints: Point2D[] = [];
const nascarPts = 200;
for (let i = 0; i < nascarPts; i++) {
  const t = (i / nascarPts) * Math.PI * 2;
  // Squashed oval (tri-oval shape via harmonic distortion)
  const rx = 300;
  const ry = 150;
  const x = 400 + rx * Math.cos(t) + 30 * Math.cos(2 * t);
  const y = 300 + ry * Math.sin(t);
  nascarControlPoints.push({ x, y });
}

const nascarTrack: TrackGeometry = {
  name: 'Daytona International Speedway',
  country: 'USA',
  lengthKm: 4.023,
  totalLaps: 200,
  type: 'oval',
  referenceLine: nascarControlPoints,
  innerEdge: offsetPolyline(nascarControlPoints, -18),
  outerEdge: offsetPolyline(nascarControlPoints, 18),
  startFinishIdx: 0,
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// GT World Challenge — Spa-Francorchamps inspired
// ═══════════════════════════════════════════════════════════════════════
const gtControlPoints: Point2D[] = [
  { x: 100, y: 400 },   // La Source hairpin
  { x: 200, y: 350 },
  { x: 350, y: 200 },   // Eau Rouge/Raidillon uphill
  { x: 400, y: 100 },
  { x: 500, y: 60 },    // Kemmel straight
  { x: 650, y: 80 },
  { x: 720, y: 150 },   // Les Combes
  { x: 700, y: 250 },
  { x: 650, y: 300 },   // Malmedy/Rivage
  { x: 700, y: 380 },
  { x: 680, y: 460 },   // Pouhon
  { x: 580, y: 500 },
  { x: 450, y: 520 },   // Fagnes/Stavelot
  { x: 320, y: 510 },
  { x: 220, y: 480 },   // Blanchimont
  { x: 140, y: 460 },   // Bus Stop chicane
];

const gtReference = catmullRomLoop(gtControlPoints, 50);
const gtTrack: TrackGeometry = {
  name: 'Circuit de Spa-Francorchamps',
  country: 'Belgium',
  lengthKm: 7.004,
  totalLaps: 24,
  type: 'circuit',
  referenceLine: gtReference,
  innerEdge: offsetPolyline(gtReference, -13),
  outerEdge: offsetPolyline(gtReference, 13),
  startFinishIdx: 0,
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// Top Fuel — NHRA Dragstrip (1000 ft / ~305m straight)
// ═══════════════════════════════════════════════════════════════════════
const dragStripLength = 600;
const dragLanes = 2;
const dragReference: Point2D[] = [];
const dragInner: Point2D[] = [];
const dragOuter: Point2D[] = [];

for (let i = 0; i <= 100; i++) {
  const x = 100 + (i / 100) * dragStripLength;
  dragReference.push({ x, y: 300 });
  dragInner.push({ x, y: 260 });
  dragOuter.push({ x, y: 340 });
}

const dragTrack: TrackGeometry = {
  name: 'NHRA Championship Dragstrip',
  country: 'USA',
  lengthKm: 0.305,
  totalLaps: 1,
  type: 'drag',
  referenceLine: dragReference,
  innerEdge: dragInner,
  outerEdge: dragOuter,
  startFinishIdx: 0,
  rotation: 0,
};

// ═══════════════════════════════════════════════════════════════════════
// TRACK REGISTRY — Maps series ID → TrackGeometry
// ═══════════════════════════════════════════════════════════════════════
export const TRACK_REGISTRY: Record<string, TrackGeometry> = {
  f1: f1Track,
  f2: f2Track,
  f3: f3Track,
  'formula-e': feTrack,
  nascar: nascarTrack,
  'gt-world-challenge': gtTrack,
  'top-fuel': dragTrack,
};

/** Get the track geometry for a series, with fallback */
export function getTrackForSeries(seriesId: string): TrackGeometry {
  return TRACK_REGISTRY[seriesId] || f1Track;
}

/**
 * Compute the cumulative distance along a polyline.
 * Returns an array of distances where result[i] is the distance from point 0 to point i.
 */
export function computeCumulativeDistances(line: Point2D[]): number[] {
  const dists: number[] = [0];
  for (let i = 1; i < line.length; i++) {
    const dx = line[i].x - line[i - 1].x;
    const dy = line[i].y - line[i - 1].y;
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  return dists;
}

/**
 * Find the closest point on a polyline to a given (x, y).
 * Returns the index and the fractional position [0, totalLength].
 */
export function projectOntoPolyline(
  line: Point2D[],
  cumDists: number[],
  px: number,
  py: number
): { index: number; distance: number } {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < line.length; i++) {
    const dx = line[i].x - px;
    const dy = line[i].y - py;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  return { index: bestIdx, distance: cumDists[bestIdx] };
}

/**
 * Get (x, y) at a given cumulative distance along a polyline.
 * Wraps around for closed loops.
 */
export function positionAtDistance(
  line: Point2D[],
  cumDists: number[],
  targetDist: number
): Point2D {
  const totalLen = cumDists[cumDists.length - 1];
  if (totalLen <= 0) return line[0];

  const d = ((targetDist % totalLen) + totalLen) % totalLen;

  // Binary search for the segment
  let lo = 0;
  let hi = cumDists.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumDists[mid] <= d) lo = mid;
    else hi = mid;
  }

  const segLen = cumDists[hi] - cumDists[lo];
  if (segLen <= 0) return line[lo];

  const t = (d - cumDists[lo]) / segLen;
  return {
    x: lerp(line[lo].x, line[hi].x, t),
    y: lerp(line[lo].y, line[hi].y, t),
  };
}
