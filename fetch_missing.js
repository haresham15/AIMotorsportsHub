const fs = require('fs');

async function getJSON(url) {
  const res = await fetch(url);
  return await res.json();
}

const targets = [
  { prefix: 'monaco', session_key: 9510 },    // Monaco race 2024
  { prefix: 'montreal', session_key: 9526 },  // Canada race 2024
  { prefix: 'barcelona', session_key: 9534 }, // Spain race 2024
];

let data = fs.readFileSync('lib/trackData.ts', 'utf8');

(async () => {
  try {
    for (const t of targets) {
      console.log(`Processing ${t.prefix}...`);
      const laps = await getJSON(`https://api.openf1.org/v1/laps?session_key=${t.session_key}&driver_number=1`);
      const bestLap = laps.filter(l => l.lap_duration > 50).sort((a,b)=>a.lap_duration - b.lap_duration)[0];
      const start = new Date(bestLap.date_start).getTime();
      const end = start + bestLap.lap_duration * 1000;
      
      const locs = await getJSON(`https://api.openf1.org/v1/location?session_key=${t.session_key}&driver_number=1&date>=${new Date(start).toISOString()}&date<${new Date(end).toISOString()}`);
      
      const downsample = Math.ceil(locs.length / 180);
      const thinned = locs.filter((_, i) => i % downsample === 0).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
      
      const def = `
const ${t.prefix}Points: Point2D[] = ${JSON.stringify(thinned)};
const ${t.prefix}Track: TrackGeometry = {
  name: "${t.prefix}",
  country: "${t.prefix}",
  lengthKm: 5.0,
  totalLaps: 50,
  type: 'circuit',
  referenceLine: ${t.prefix}Points,
  innerEdge: [],
  outerEdge: [],
  startFinishIdx: 0,
  drsZones: [],
  sectors: [
    { name: 'S1', startIdx: 0, endIdx: Math.floor(${t.prefix}Points.length * 0.33) },
    { name: 'S2', startIdx: Math.floor(${t.prefix}Points.length * 0.33), endIdx: Math.floor(${t.prefix}Points.length * 0.66) },
    { name: 'S3', startIdx: Math.floor(${t.prefix}Points.length * 0.66), endIdx: ${t.prefix}Points.length - 1 },
  ],
  rotation: 0,
};`;

      const regexMake = new RegExp(`const\\s+${t.prefix}Track\\s*=\\s*makeCircuit\\(.*?\\);`, 's');
      if (regexMake.test(data)) {
        data = data.replace(regexMake, def.trim());
        console.log(`Replaced ${t.prefix}Track`);
      }
    }
    fs.writeFileSync('lib/trackData.ts', data);
    console.log('Done!');
  } catch(e){
    console.error(e);
  }
})();
