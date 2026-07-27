const fs = require('fs');
(async () => {
  try {
    const lapsRes = await fetch('https://api.openf1.org/v1/laps?session_key=9550&driver_number=1');
    const laps = await lapsRes.json();
    const bestLap = laps.sort((a,b)=>a.lap_duration - b.lap_duration)[0];
    console.log('Best lap:', bestLap.lap_number, bestLap.date_start, bestLap.lap_duration);

    const start = new Date(bestLap.date_start).toISOString();
    const end = new Date(new Date(start).getTime() + bestLap.lap_duration * 1000).toISOString();
    
    console.log('Fetching locs between', start, end);
    const locRes = await fetch(`https://api.openf1.org/v1/location?session_key=9550&driver_number=1&date>=${start}&date<${end}`);
    const locs = await locRes.json();
    
    const downsampled = locs.map(p => ({x: p.x, y: p.y}));
    console.log('Got', downsampled.length, 'points');
    fs.writeFileSync('austria_track.json', JSON.stringify(downsampled));
  } catch (e) {
    console.error(e);
  }
})();
