const fs = require('fs');

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
}

(async () => {
  try {
    const sessions = await getJSON('https://api.openf1.org/v1/sessions?year=2024&session_type=Race');
    console.log(`Found ${sessions.length} races.`);
    
    let trackDefinitions = [];

    for (const session of sessions) {
      console.log(`Processing ${session.country_name} - ${session.circuit_short_name}...`);
      
      const laps = await getJSON(`https://api.openf1.org/v1/laps?session_key=${session.session_key}&driver_number=1`);
      if (!laps || laps.length === 0) {
        console.log(`No laps for driver 1 in ${session.circuit_short_name}, skipping...`);
        continue;
      }
      
      // Find a complete fast lap to ensure good tracking
      const validLaps = laps.filter(l => l.lap_duration && l.lap_duration > 50);
      if (validLaps.length === 0) continue;
      
      const bestLap = validLaps.sort((a,b)=>a.lap_duration - b.lap_duration)[0];
      
      const start = new Date(bestLap.date_start).getTime();
      const end = start + bestLap.lap_duration * 1000;
      
      const locs = await getJSON(`https://api.openf1.org/v1/location?session_key=${session.session_key}&driver_number=1&date>=${new Date(start).toISOString()}&date<${new Date(end).toISOString()}`);
      
      if (!locs || locs.length < 50) {
         console.log(`Not enough location data for ${session.circuit_short_name}.`);
         continue;
      }

      // Removed aggressive downsampling and integer rounding to make the track layout extremely accurate
      const thinned = locs.map(p => ({ x: p.x, y: p.y }));
      
      // Calculate length
      // Calculate start/finish idx (it's index 0 since we got exactly one lap from start to finish)
      
      // Create JS string
      const varName = session.circuit_short_name.toLowerCase().replace(/[^a-z0-9]/g, '') + 'Track';
      const def = `
const ${varName}Points: Point2D[] = ${JSON.stringify(thinned)};
const ${varName}: TrackGeometry = {
  name: "${session.circuit_short_name}",
  country: "${session.country_name}",
  lengthKm: 5.0, // placeholder
  totalLaps: 50,
  type: 'circuit',
  referenceLine: ${varName}Points,
  innerEdge: [],
  outerEdge: [],
  startFinishIdx: 0,
  drsZones: [], // We don't have accurate DRS zones without track data, canvas can fall back safely
  sectors: [],
  rotation: 0,
};
`;
      trackDefinitions.push({ varName, def, country: session.country_name, name: session.circuit_short_name });
      console.log(`Generated ${varName} with ${thinned.length} points.`);
      
      // Add a small delay to respect API rate limits
      await new Promise(r => setTimeout(r, 200));
    }
    
    fs.writeFileSync('generated_tracks.json', JSON.stringify(trackDefinitions, null, 2));
    console.log('Done!');
  } catch (e) {
    console.error(e);
  }
})();
