const fs = require('fs');
const points = JSON.parse(fs.readFileSync('austria_track.json'));
let data = fs.readFileSync('lib/trackData.ts', 'utf8');

const replacement = `
const redBullRingPoints: Point2D[] = ${JSON.stringify(points)};
const redBullRingTrack: TrackGeometry = {
  name: 'Red Bull Ring',
  country: 'Austria',
  lengthKm: 4.318,
  totalLaps: 71,
  type: 'circuit',
  referenceLine: redBullRingPoints,
  innerEdge: [],
  outerEdge: [],
  startFinishIdx: 0,
  drsZones: [
    { startIdx: Math.floor(redBullRingPoints.length * 0.88), endIdx: Math.floor(redBullRingPoints.length * 0.98) },
    { startIdx: Math.floor(redBullRingPoints.length * 0.25), endIdx: Math.floor(redBullRingPoints.length * 0.35) },
  ],
  sectors: [
    { name: 'S1', startIdx: 0, endIdx: Math.floor(redBullRingPoints.length * 0.33) },
    { name: 'S2', startIdx: Math.floor(redBullRingPoints.length * 0.33), endIdx: Math.floor(redBullRingPoints.length * 0.66) },
    { name: 'S3', startIdx: Math.floor(redBullRingPoints.length * 0.66), endIdx: redBullRingPoints.length - 1 },
  ],
  rotation: 0,
};`;

const oldDef = `const redBullRingTrack = makeCircuit('Red Bull Ring', 'Austria', 4.318, 71, [
  { x: 300, y: 200 }, { x: 500, y: 100 }, { x: 650, y: 120 },
  { x: 700, y: 200 }, { x: 680, y: 320 }, { x: 600, y: 420 },
  { x: 450, y: 480 }, { x: 300, y: 460 }, { x: 180, y: 380 },
  { x: 160, y: 280 },
]);`;

if (data.includes(oldDef)) {
  data = data.replace(oldDef, replacement.trim());
  fs.writeFileSync('lib/trackData.ts', data);
  console.log('Successfully updated Red Bull Ring track layout in trackData.ts');
} else {
  console.log('Failed to find exact old definition block.');
}
