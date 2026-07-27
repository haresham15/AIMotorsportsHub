const fs = require('fs');
const generated = JSON.parse(fs.readFileSync('generated_tracks.json'));
let data = fs.readFileSync('lib/trackData.ts', 'utf8');

for (const track of generated) {
  // Try to find an existing makeCircuit definition
  // e.g. "const melbourneTrack = makeCircuit('Albert Park Grand Prix Circuit',"
  const regex = new RegExp(`const\\s+${track.varName}\\s*=\\s*makeCircuit\\(.*?\\);`, 's');
  
  if (regex.test(data)) {
    data = data.replace(regex, track.def.trim());
    console.log(`Replaced ${track.varName}`);
  } else {
    // If not found, maybe it's named slightly differently, e.g. sakhirTrack vs f1Track
    console.log(`Could not find ${track.varName}`);
  }
}

fs.writeFileSync('lib/trackData.ts', data);
console.log('Done injecting 2024 generated tracks.');
