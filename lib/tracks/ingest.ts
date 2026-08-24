import fs from 'fs';
import path from 'path';

// Define types locally for the ingest script
interface Point2D {
  x: number;
  y: number;
}

interface TrackGeometry {
  name: string;
  country: string;
  lengthKm: number;
  totalLaps: number;
  type: 'circuit';
  referenceLine: Point2D[];
  innerEdge: Point2D[];
  outerEdge: Point2D[];
  startFinishIdx: number;
  drsZones: any[];
  sectors: any[];
  rotation: number;
}

async function getJSON(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.log(`Rate limited on ${url}, waiting 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`Fetch error on ${url}, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

function normalizeCoordinates(points: Point2D[]): Point2D[] {
  if (points.length === 0) return points;

  // 1. Find bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // 2. Scale to fit within a 1000x1000 box while preserving aspect ratio
  const width = maxX - minX;
  const height = maxY - minY;
  const maxDim = Math.max(width, height);
  const scale = 800 / (maxDim || 1); // use 800 to leave some padding

  const scaled = points.map(p => ({
    x: (p.x - minX) * scale,
    y: (p.y - minY) * scale
  }));

  // 3. Center at (500, 500)
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = 500 - (scaledWidth / 2);
  const offsetY = 500 - (scaledHeight / 2);

  const centered = scaled.map(p => ({
    x: p.x + offsetX,
    y: p.y + offsetY
  }));

  // 4. Rotation (optional) - let's align the start/finish straight to be roughly horizontal.
  const lookahead = Math.floor(centered.length * 0.05) || 1;
  const dx = centered[lookahead].x - centered[0].x;
  const dy = centered[lookahead].y - centered[0].y;
  let angle = Math.atan2(dy, dx);
  // We want this angle to be 0 (pointing right)
  const rotationAngle = -angle;

  const cosTh = Math.cos(rotationAngle);
  const sinTh = Math.sin(rotationAngle);

  // Rotate around (500,500)
  const rotated = centered.map(p => {
    const rx = p.x - 500;
    const ry = p.y - 500;
    return {
      x: 500 + (rx * cosTh - ry * sinTh),
      y: 500 + (rx * sinTh + ry * cosTh)
    };
  });

  return rotated;
}

async function main() {
  console.log('Starting track ingestion pipeline...');
  const sessions = await getJSON('https://api.openf1.org/v1/sessions?year=2024&session_type=Race');
  console.log(`Found ${sessions.length} races.`);

  const tracksRecord: Record<string, TrackGeometry> = {};

  for (const session of sessions) {
    const venueName = session.circuit_short_name;
    const country = session.country_name;
    
    // Skip if we already processed this venue
    if (tracksRecord[venueName]) continue;

    console.log(`Processing ${country} - ${venueName}...`);

    const laps = await getJSON(`https://api.openf1.org/v1/laps?session_key=${session.session_key}&driver_number=1`);
    if (!laps || laps.length === 0) {
      console.log(`No laps for driver 1 in ${venueName}, skipping...`);
      continue;
    }

    const validLaps = laps.filter((l: any) => l.lap_duration && l.lap_duration > 50);
    if (validLaps.length === 0) continue;

    const bestLap = validLaps.sort((a: any, b: any) => a.lap_duration - b.lap_duration)[0];
    const start = new Date(bestLap.date_start).getTime();
    const end = start + bestLap.lap_duration * 1000;

    const locs = await getJSON(`https://api.openf1.org/v1/location?session_key=${session.session_key}&driver_number=1&date>=${new Date(start).toISOString()}&date<${new Date(end).toISOString()}`);

    if (!locs || locs.length < 50) {
      console.log(`Not enough location data for ${venueName}.`);
      continue;
    }

    const rawPoints = locs.map((p: any) => ({ x: p.x, y: p.y }));
    const normalizedPoints = normalizeCoordinates(rawPoints);

    const track: TrackGeometry = {
      name: venueName === 'Sakhir' ? 'Bahrain International Circuit' : venueName,
      country: country,
      lengthKm: 5.0, // Keeping simple for now
      totalLaps: 50,
      type: 'circuit',
      referenceLine: normalizedPoints,
      innerEdge: [],
      outerEdge: [],
      startFinishIdx: 0,
      drsZones: [],
      sectors: [
        { name: 'S1', startIdx: 0, endIdx: Math.floor(normalizedPoints.length * 0.33) },
        { name: 'S2', startIdx: Math.floor(normalizedPoints.length * 0.33), endIdx: Math.floor(normalizedPoints.length * 0.66) },
        { name: 'S3', startIdx: Math.floor(normalizedPoints.length * 0.66), endIdx: normalizedPoints.length - 1 },
      ],
      rotation: 0,
    };

    tracksRecord[venueName] = track;
    console.log(`Generated accurate geometry for ${venueName} with ${normalizedPoints.length} points.`);
    await new Promise(r => setTimeout(r, 1000)); // Respect API limit
  }

  const outputPath = path.join(__dirname, '..', 'generatedTracks.json');
  fs.writeFileSync(outputPath, JSON.stringify(tracksRecord, null, 2));
  console.log(`Done! Wrote ${Object.keys(tracksRecord).length} tracks to ${outputPath}`);
}

main().catch(console.error);
