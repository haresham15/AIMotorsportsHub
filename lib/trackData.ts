// ========================================================================
// TRACK GEOMETRY DATA
// ========================================================================

import type { TrackGeometry, Point2D } from './replayTypes';
import generatedTracks from './generatedTracks.json';
import { getNascarTrack, NASCAR_TRACK_REGISTRY } from './nascarTracks';

// ── Utility: generate smooth curves ──────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function cubicBezier(
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
export function catmullRomLoop(controlPoints: Point2D[], pointsPerSegment = 40): Point2D[] {
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

  if (result.length > 0) {
    result.push({ ...result[0] });
  }
  return result;
}

/** Offset a polyline by a fixed distance (positive = left, negative = right) */
export function offsetPolyline(line: Point2D[], dist: number): Point2D[] {
  const n = line.length;
  if (n < 2) return line;

  const isClosed = line[0].x === line[n - 1].x && line[0].y === line[n - 1].y;
  const ptsToProcess = isClosed ? n - 1 : n;

  const result: Point2D[] = [];
  for (let i = 0; i < ptsToProcess; i++) {
    let prev, next;
    if (isClosed) {
      prev = line[(i - 1 + ptsToProcess) % ptsToProcess];
      next = line[(i + 1) % ptsToProcess];
    } else {
      prev = i === 0 ? line[0] : line[i - 1];
      next = i === ptsToProcess - 1 ? line[ptsToProcess - 1] : line[i + 1];
    }

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    result.push({
      x: line[i].x + nx * dist,
      y: line[i].y + ny * dist,
    });
  }

  if (isClosed && result.length > 0) {
    result.push({ ...result[0] });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// TRACK LOOKUP & REGISTRY
// ═══════════════════════════════════════════════════════════════════════

const DRAG_STRIP: TrackGeometry = {
  name: 'Drag Strip',
  country: 'USA',
  lengthKm: 0.3048, // NHRA 1,000-foot competition distance (304.8m)
  totalLaps: 1,
  type: 'drag',
  innerEdge: [{ x: -450, y: -22 }, { x: 450, y: -22 }],
  outerEdge: [{ x: -450, y: 22 }, { x: 450, y: 22 }],
  referenceLine: [{ x: -450, y: 0 }, { x: 450, y: 0 }],
  startFinishIdx: 0
};

export const TRACK_REGISTRY: Record<string, TrackGeometry> = {
  ...(generatedTracks as Record<string, TrackGeometry>),
  ...NASCAR_TRACK_REGISTRY,
  'Drag Strip': DRAG_STRIP,
};

/** Look up a circuit geometry by circuit name (fuzzy match), with series fallback */
export function getTrackForCircuit(circuitName?: string, seriesId?: string): TrackGeometry {
  if (seriesId === 'nascar' || seriesId?.startsWith('nascar-')) {
    const nascarTrack = getNascarTrack(circuitName);
    if (nascarTrack) return nascarTrack;
  }

  if (circuitName) {
    // Check NASCAR tracks first if circuitName matches a NASCAR venue
    const nascarTrack = getNascarTrack(circuitName);
    if (nascarTrack) return nascarTrack;

    const lower = circuitName.toLowerCase();
    const venues = Object.entries(TRACK_REGISTRY).sort(([a], [b]) => b.length - a.length);
    for (const [venue, geometry] of venues) {
      if (lower.includes(venue.toLowerCase()) || venue.toLowerCase().includes(lower)) {
        return geometry;
      }
    }
  }

  // Fallback
  return getTrackForSeries(seriesId || 'f1');
}

/** Get the track geometry for a series, with fallback */
export function getTrackForSeries(seriesId: string): TrackGeometry {
  if (seriesId === 'nascar' || seriesId.startsWith('nascar-')) {
    const fallbackMap: Record<string, string> = {
      'nascar': 'Daytona International Speedway',
      'nascar-cup': 'Daytona International Speedway',
      'nascar-xfinity': 'Charlotte Motor Speedway',
      'nascar-trucks': 'Bristol Motor Speedway',
    };
    return NASCAR_TRACK_REGISTRY[fallbackMap[seriesId]] || NASCAR_TRACK_REGISTRY['Daytona International Speedway'] || Object.values(NASCAR_TRACK_REGISTRY)[0];
  }

  const fallbackMap: Record<string, string> = {
    'f1': 'Sakhir',
    'f2': 'Jeddah',
    'f3': 'Monza',
    'formula-e': 'Monte Carlo',
    'gt-world-challenge': 'Spa-Francorchamps',
    'top-fuel': 'Drag Strip',
    'wec': 'Spa-Francorchamps'
  };

  const targetVenue = fallbackMap[seriesId] || 'Sakhir';
  return TRACK_REGISTRY[targetVenue] || Object.values(TRACK_REGISTRY)[0];
}

/**
 * Compute the cumulative distance along a polyline.
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
 */
export function positionAtDistance(
  line: Point2D[],
  cumDists: number[],
  targetDist: number
): Point2D {
  const totalLen = cumDists[cumDists.length - 1];
  if (totalLen <= 0) return line[0];

  const d = ((targetDist % totalLen) + totalLen) % totalLen;

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
