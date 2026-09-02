import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Using commonjs if __dirname is not available, or define it:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Point2D {
  x: number;
  y: number;
}

const NASCART_TRACK_NAMES = [
  "Bowman Gray Stadium",
  "Daytona International Speedway",
  "Atlanta Motor Speedway",
  "Las Vegas Motor Speedway",
  "Phoenix Raceway",
  "Bristol Motor Speedway",
  "Richmond Raceway",
  "Talladega Superspeedway",
  "Texas Motor Speedway",
  "Dover Motor Speedway",
  "Kansas Speedway",
  "Darlington Raceway",
  "North Wilkesboro Speedway",
  "Charlotte Motor Speedway ROVAL",
  "Charlotte Motor Speedway",
  "World Wide Technology Raceway",
  "Sonoma Raceway",
  "Iowa Speedway",
  "New Hampshire Motor Speedway",
  "Chicago Street Course",
  "Indianapolis Motor Speedway",
  "Pocono Raceway",
  "Michigan International Speedway",
  "Watkins Glen International",
  "Homestead-Miami Speedway",
  "Martinsville Speedway",
  "Nashville Superspeedway",
  "Rockingham Speedway",
  "Lime Rock Park",
  "Portland International Raceway",
  "Lucas Oil Indianapolis Raceway Park",
  "Milwaukee Mile"
];

// Helper to convert lat/lon to somewhat local Cartesian for a track (approximate is fine for relative shape)
function latLonToMeters(lat: number, lon: number, lat0: number): Point2D {
  const R = 6378137; // Earth radius in meters
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const lat0Rad = lat0 * Math.PI / 180;
  
  const x = R * lonRad * Math.cos(lat0Rad);
  const y = R * latRad;
  return { x, y };
}

// Stitches disconnected ways into a single continuous path
function stitchWays(ways: Point2D[][]): Point2D[] {
  if (ways.length === 0) return [];
  if (ways.length === 1) return ways[0];

  let currentPath = [...ways[0]];
  const remainingWays = ways.slice(1).map(w => [...w]);

  while (remainingWays.length > 0) {
    const endPoint = currentPath[currentPath.length - 1];
    
    // Find the way that starts closest to our current end point
    let bestWayIdx = -1;
    let reverse = false;
    let minDistance = Infinity;

    for (let i = 0; i < remainingWays.length; i++) {
      const w = remainingWays[i];
      const distToStart = Math.hypot(w[0].x - endPoint.x, w[0].y - endPoint.y);
      const distToEnd = Math.hypot(w[w.length - 1].x - endPoint.x, w[w.length - 1].y - endPoint.y);

      if (distToStart < minDistance) {
        minDistance = distToStart;
        bestWayIdx = i;
        reverse = false;
      }
      if (distToEnd < minDistance) {
        minDistance = distToEnd;
        bestWayIdx = i;
        reverse = true;
      }
    }

    if (bestWayIdx !== -1) {
      let nextWay = remainingWays[bestWayIdx];
      if (reverse) nextWay.reverse();
      
      // If the points are very close, skip the first point to avoid duplicate
      if (minDistance < 5) { // less than 5 meters
        nextWay = nextWay.slice(1);
      }
      currentPath = currentPath.concat(nextWay);
      remainingWays.splice(bestWayIdx, 1);
    } else {
      break;
    }
  }

  return currentPath;
}

function catmullRomLoop(controlPoints: Point2D[], pointsPerSegment = 5): Point2D[] {
  const points: Point2D[] = [];
  const n = controlPoints.length;
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
      points.push({ x, y });
    }
  }
  return points;
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

  // 4. Rotation (optional) - align start/finish roughly horizontal
  const lookahead = Math.floor(centered.length * 0.05) || 1;
  const dx = centered[lookahead].x - centered[0].x;
  const dy = centered[lookahead].y - centered[0].y;
  let angle = Math.atan2(dy, dx);
  const rotationAngle = -angle;

  const cosTh = Math.cos(rotationAngle);
  const sinTh = Math.sin(rotationAngle);

  // Rotate around (500,500)
  return centered.map(p => {
    const rx = p.x - 500;
    const ry = p.y - 500;
    return {
      x: 500 + (rx * cosTh - ry * sinTh),
      y: 500 + (rx * sinTh + ry * cosTh)
    };
  });
}

async function fetchFromOverpass(query: string) {
  const url = 'https://overpass-api.de/api/interpreter';
  for(let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'AIMotorsportsHub/1.0',
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429) {
        console.log(`Rate limited, waiting...`);
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      throw new Error(`Status ${res.status}`);
    } catch(e) {
      if(i === 2) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function main() {
  console.log('Starting NASCAR track ingestion pipeline...');
  const generatedTracks: Record<string, Point2D[]> = {};

  for (const trackName of NASCART_TRACK_NAMES) {
    console.log(`Processing ${trackName}...`);
    // Use regex for loose matching. E.g., "Daytona"
    let shortName = trackName.split(' ')[0];
    if (trackName.includes('World Wide')) shortName = 'Gateway';
    if (trackName.includes('Charlotte Motor Speedway ROVAL')) shortName = 'ROVAL';
    if (trackName.includes('Charlotte Motor Speedway')) shortName = 'Charlotte Motor Speedway';
    
    // We search for highway=raceway and name matching the short name
    const query = `
      [out:json];
      (
        way["highway"="raceway"]["name"~"${shortName}",i];
        way["sport"="motor"]["name"~"${shortName}",i];
      );
      out geom;
    `;
    
    try {
      const data = await fetchFromOverpass(query);
      if (!data || !data.elements || data.elements.length === 0) {
        console.log(`  No data found for ${trackName}. Skipping.`);
        continue;
      }

      // Filter out kart tracks or drag strips
      let elements = data.elements.filter((e: any) => {
         const name = e.tags?.name?.toLowerCase() || '';
         return !name.includes('kart') && !name.includes('drag');
      });

      // Special handling for Charlotte ROVAL vs Oval
      if (trackName === 'Charlotte Motor Speedway ROVAL') {
        elements = elements.filter((e: any) => e.tags?.name?.toLowerCase().includes('roval'));
      } else if (trackName === 'Charlotte Motor Speedway') {
        elements = elements.filter((e: any) => !e.tags?.name?.toLowerCase().includes('roval'));
      }

      if (elements.length === 0) {
        console.log(`  Filtered out all ways for ${trackName}. Skipping.`);
        continue;
      }

      // Convert lat/lon to local Cartesian
      const refLat = elements[0].geometry[0].lat;
      const ways = elements.map((e: any) => {
        return e.geometry.map((g: any) => latLonToMeters(g.lat, g.lon, refLat));
      });

      // Stitch ways together
      const stitchedPath = stitchWays(ways);
      
      // Smooth the path with Catmull-Rom
      const smoothed = catmullRomLoop(stitchedPath, 5);

      // Normalize
      const normalized = normalizeCoordinates(smoothed);
      
      generatedTracks[trackName] = normalized;
      console.log(`  Generated geometry for ${trackName} with ${normalized.length} points.`);
    } catch (e) {
      console.error(`  Failed to process ${trackName}: ${e}`);
    }

    // Delay to respect Overpass API limits
    await new Promise(r => setTimeout(r, 2000));
  }

  const outputPath = path.join(__dirname, '..', 'generatedNascarTracks.json');
  fs.writeFileSync(outputPath, JSON.stringify(generatedTracks, null, 2));
  console.log(`Done! Wrote ${Object.keys(generatedTracks).length} tracks to ${outputPath}`);
}

main().catch(console.error);
