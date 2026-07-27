const fs = require('fs');

async function getJSON(url, retries = 3) {
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

// Map from OpenF1 circuit_short_name to our JS variable name in trackData.ts
const nameMapping = {
  'Sakhir': 'f1', // usually we called it bahrain
  'Jeddah': 'jeddahCircuit',
  'Melbourne': 'melbourne',
  'Suzuka': 'suzuka',
  'Shanghai': 'shanghai',
  'Miami': 'miami',
  'Imola': 'imola',
  'Monte Carlo': 'monaco',
  'Montreal': 'montreal',
  'Montréal': 'montreal',
  'Catalunya': 'barcelona',
  'Barcelona': 'barcelona',
  'Spielberg': 'redBullRing',
  'Silverstone': 'silverstone',
  'Hungaroring': 'hungaroring',
  'Budapest': 'hungaroring',
  'Spa-Francorchamps': 'gt', // reusing gtTrack for Spa
  'Zandvoort': 'zandvoort',
  'Monza': 'f3', // reusing f3Track for Monza in original code
  'Baku': 'baku',
  'Singapore': 'singapore',
  'Austin': 'cota',
  'Mexico City': 'mexico',
  'Interlagos': 'interlagos',
  'São Paulo': 'interlagos',
  'Las Vegas': 'lasVegas',
  'Lusail': 'lusail',
  'Yas Marina Circuit': 'abuDhabi',
  'Yas Island': 'abuDhabi'
};

const processed = new Set();
let outputData = fs.readFileSync('lib/trackData.ts', 'utf8');

(async () => {
  try {
    const sessions = await getJSON('https://api.openf1.org/v1/sessions?year=2024&session_type=Race');
    console.log(`Found ${sessions.length} races.`);
    
    for (const session of sessions) {
      const varPrefix = nameMapping[session.circuit_short_name];
      if (!varPrefix) {
        console.log(`Unknown mapping for ${session.circuit_short_name}, skipping...`);
        continue;
      }
      if (processed.has(varPrefix)) continue;
      
      console.log(`Processing ${session.country_name} - ${session.circuit_short_name}...`);
      
      const laps = await getJSON(`https://api.openf1.org/v1/laps?session_key=${session.session_key}&driver_number=1`);
      if (!laps || laps.length === 0) {
        console.log(`No laps for driver 1, skipping...`);
        continue;
      }
      
      const validLaps = laps.filter(l => l.lap_duration && l.lap_duration > 50);
      if (validLaps.length === 0) continue;
      
      const bestLap = validLaps.sort((a,b)=>a.lap_duration - b.lap_duration)[0];
      const start = new Date(bestLap.date_start).getTime();
      const end = start + bestLap.lap_duration * 1000;
      
      const locs = await getJSON(`https://api.openf1.org/v1/location?session_key=${session.session_key}&driver_number=1&date>=${new Date(start).toISOString()}&date<${new Date(end).toISOString()}`);
      
      if (!locs || locs.length < 50) {
         console.log(`Not enough location data.`);
         continue;
      }

      // Removed aggressive downsampling and integer rounding to make the track layout extremely accurate
      const thinned = locs.map(p => ({ x: p.x, y: p.y }));
      
      const varName = varPrefix + 'Track';
      const def = `
const ${varPrefix}Points: Point2D[] = ${JSON.stringify(thinned)};
const ${varName}: TrackGeometry = {
  name: "${session.circuit_short_name === 'Sakhir' ? 'Bahrain International Circuit' : session.circuit_short_name}",
  country: "${session.country_name}",
  lengthKm: 5.0,
  totalLaps: 50,
  type: 'circuit',
  referenceLine: ${varPrefix}Points,
  innerEdge: [],
  outerEdge: [],
  startFinishIdx: 0,
  drsZones: [],
  sectors: [
    { name: 'S1', startIdx: 0, endIdx: Math.floor(${varPrefix}Points.length * 0.33) },
    { name: 'S2', startIdx: Math.floor(${varPrefix}Points.length * 0.33), endIdx: Math.floor(${varPrefix}Points.length * 0.66) },
    { name: 'S3', startIdx: Math.floor(${varPrefix}Points.length * 0.66), endIdx: ${varPrefix}Points.length - 1 },
  ],
  rotation: 0,
};`;

      // We'll replace the existing definition if it exists
      // The old definition either looks like `const nameTrack = makeCircuit(...)` or `const nameTrack: TrackGeometry = { ... }`
      const regexMake = new RegExp(`const\\s+${varName}\\s*=\\s*makeCircuit\\(.*?\\);`, 's');
      const regexPoints = new RegExp(`const\\s+${varPrefix}Points.*?;\\s*const\\s+${varName}:\\s*TrackGeometry\\s*=\\s*{.*?};`, 's');
      const regexCatmull = new RegExp(`const\\s+${varPrefix}Reference\\s*=\\s*catmullRomLoop\\(.*?\\);\\s*const\\s+${varName}:\\s*TrackGeometry\\s*=\\s*{.*?};`, 's');

      if (regexMake.test(outputData)) {
        outputData = outputData.replace(regexMake, def.trim());
        console.log(`Replaced ${varName}`);
        processed.add(varPrefix);
      } else if (regexPoints.test(outputData)) {
        outputData = outputData.replace(regexPoints, def.trim());
        console.log(`Replaced ${varName} (existing point data)`);
        processed.add(varPrefix);
      } else if (regexCatmull.test(outputData)) {
        outputData = outputData.replace(regexCatmull, def.trim());
        console.log(`Replaced ${varName} (catmull-rom original)`);
        processed.add(varPrefix);
      } else {
        // Just append if not found, though we should map them properly.
        console.log(`Could not find ${varName} to replace.`);
      }
      
      // Delay to avoid 429
      await new Promise(r => setTimeout(r, 1000));
    }
    
    fs.writeFileSync('lib/trackData.ts', outputData);
    console.log(`Done! Injected ${processed.size} accurate tracks.`);
  } catch (e) {
    console.error(e);
  }
})();
