import fs from 'fs';
import path from 'path';

function validateTracks() {
  const filePath = path.join(__dirname, '..', 'generatedTracks.json');
  if (!fs.existsSync(filePath)) {
    console.error('generatedTracks.json not found. Run ingest.ts first.');
    process.exit(1);
  }

  const tracks = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let validCount = 0;
  let errorCount = 0;

  for (const [venueName, track] of Object.entries(tracks)) {
    console.log(`Validating ${venueName}...`);
    const t = track as any;

    if (!t.referenceLine || t.referenceLine.length < 50) {
      console.error(`  [ERROR] Track ${venueName} has less than 50 points in referenceLine.`);
      errorCount++;
      continue;
    }

    // Check bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of t.referenceLine) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    if (width > 1000 || height > 1000) {
      console.error(`  [ERROR] Track ${venueName} bounding box exceeds 1000x1000 (${width.toFixed(2)}x${height.toFixed(2)}).`);
      errorCount++;
      continue;
    }

    if (width < 100 && height < 100) {
      console.error(`  [ERROR] Track ${venueName} bounding box is suspiciously small (${width.toFixed(2)}x${height.toFixed(2)}).`);
      errorCount++;
      continue;
    }

    validCount++;
  }

  console.log(`\nValidation complete: ${validCount} valid, ${errorCount} errors.`);
  if (errorCount > 0) process.exit(1);
}

validateTracks();
