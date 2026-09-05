import type { Point2D, TrackGeometry } from './replayTypes';

/**
 * Computes a smooth, curve-aligned pit lane for any track geometry.
 *
 * The pit lane consists of:
 * 1. Pit Entry Taper: Peels off the racing line ~200-300m before the start/finish line.
 * 2. Pit Straight & Garages: Runs parallel to the main straight separated by the pit wall.
 * 3. Pit Exit Taper: Extends past the start/finish line and merges smoothly back onto the track.
 */
export function generatePitLaneForTrack(track: TrackGeometry): Point2D[] {
  // If track already has a manually defined pitLane, use it
  if (track.pitLane && track.pitLane.length >= 4) {
    return track.pitLane;
  }

  const ref = track.referenceLine;
  const n = ref?.length ?? 0;
  if (n < 10) return [];

  // Drag strip handling: Parallel return road from shutdown area back to staging
  if (track.type === 'drag' || track.name.toLowerCase().includes('drag')) {
    const pStart = ref[0];
    const pEnd = ref[ref.length - 1];
    const returnOffset = -36; // Lane offset on the return road
    return [
      { x: pEnd.x, y: pEnd.y },
      { x: pEnd.x, y: pEnd.y + returnOffset },
      { x: pStart.x + 80, y: pStart.y + returnOffset },
      { x: pStart.x, y: pStart.y + returnOffset },
      { x: pStart.x, y: pStart.y },
    ];
  }

  const sfIdx = track.startFinishIdx ?? 0;

  // Determine inward direction toward the inside of the track (where pit lane sits)
  // We compare reference line to innerEdge
  let inwardMultiplier = 1;
  const sfPoint = ref[sfIdx % n];
  const nextPoint = ref[(sfIdx + 1) % n];
  const prevPoint = ref[(sfIdx - 1 + n) % n];

  const tangX = nextPoint.x - prevPoint.x;
  const tangY = nextPoint.y - prevPoint.y;
  const tangLen = Math.sqrt(tangX * tangX + tangY * tangY) || 1;
  // Normal vector (-dy, dx)
  const normX = -tangY / tangLen;
  const normY = tangX / tangLen;

  if (track.innerEdge && track.innerEdge.length > 0) {
    // Find closest innerEdge point to sfPoint
    let closestDistSq = Infinity;
    let closestInner = track.innerEdge[0];
    for (const ip of track.innerEdge) {
      const dsq = (ip.x - sfPoint.x) ** 2 + (ip.y - sfPoint.y) ** 2;
      if (dsq < closestDistSq) {
        closestDistSq = dsq;
        closestInner = ip;
      }
    }
    const toInnerX = closestInner.x - sfPoint.x;
    const toInnerY = closestInner.y - sfPoint.y;
    const dot = normX * toInnerX + normY * toInnerY;
    inwardMultiplier = dot >= 0 ? 1 : -1;
  }

  // Determine span of pit lane around start-finish
  // Typically ~10-14% of the track points (e.g. 25-45 points on a 300-point circuit)
  const halfSpan = Math.max(12, Math.min(45, Math.round(n * 0.065)));
  const totalPoints = halfSpan * 2 + 1;

  // Lateral offset distance in world units (standard pit wall separation)
  const lateralOffset = 18;

  const pitPoints: Point2D[] = [];

  for (let step = -halfSpan; step <= halfSpan; step++) {
    const idx = (sfIdx + step + n) % n;
    const p = ref[idx];
    const pNext = ref[(idx + 1) % n];
    const pPrev = ref[(idx - 1 + n) % n];

    const dx = pNext.x - pPrev.x;
    const dy = pNext.y - pPrev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = (-dy / len) * inwardMultiplier;
    const ny = (dx / len) * inwardMultiplier;

    // Normalised position along pit lane: 0.0 (entry) -> 0.5 (start/finish / garages) -> 1.0 (exit)
    const u = (step + halfSpan) / (totalPoints - 1);

    // Smooth entry and exit tapers:
    // First 25% (u < 0.25): Smooth transition from racing line (0) to lateralOffset
    // Middle 50% (0.25 <= u <= 0.75): Constant parallel offset through pit lane and boxes
    // Final 25% (u > 0.75): Smooth transition from lateralOffset back to racing line (0)
    let offsetFactor = 1.0;
    if (u < 0.25) {
      const t = u / 0.25;
      offsetFactor = 3 * t * t - 2 * t * t * t; // Cubic smoothstep
    } else if (u > 0.75) {
      const t = (1 - u) / 0.25;
      offsetFactor = 3 * t * t - 2 * t * t * t; // Cubic smoothstep
    }

    const currentOffset = lateralOffset * offsetFactor;

    pitPoints.push({
      x: p.x + nx * currentOffset,
      y: p.y + ny * currentOffset,
    });
  }

  return pitPoints;
}

/**
 * Ensures that a given TrackGeometry has a valid pitLane populated.
 */
export function ensureTrackWithPitLane(track: TrackGeometry): TrackGeometry {
  if (track.pitLane && track.pitLane.length >= 4) {
    return track;
  }
  return {
    ...track,
    pitLane: generatePitLaneForTrack(track),
  };
}
