const fs = require('fs');
const path = require('path');

const generatedTracks = require('../lib/generatedTracks.json');

// Read NASCAR tracks from ts file or compiled
const nascarTracksContent = fs.readFileSync(path.join(__dirname, '../lib/nascarTracks.ts'), 'utf8');

// Parse nascar track specs using simple regex or node require
// Let's create an HTML file showing all tracks with their orientation and start/finish point
let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Apexis Track Geometry Audit</title>
  <style>
    body {
      background: #0b0e13;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      margin: 0;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #fff;
    }
    p.subtitle {
      color: #94a3b8;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #f59e0b;
      margin: 32px 0 16px 0;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .card {
      background: #151a23;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .card h3 {
      font-size: 14px;
      margin: 0 0 4px 0;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card .meta {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 8px;
    }
    svg {
      width: 100%;
      height: 180px;
      background: #07090e;
      border-radius: 6px;
      border: 1px solid #1e293b;
      display: block;
    }
    .legend {
      display: flex;
      gap: 12px;
      font-size: 10px;
      margin-top: 6px;
      color: #94a3b8;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <h1>Apexis Track Geometry Audit Gallery</h1>
  <p class="subtitle">Inspecting reference line geometries, orientations, start/finish lines, and direction for all supported tracks.</p>

  <div class="section-title">OpenF1 / Grand Prix Track Geometries (generatedTracks.json)</div>
  <div class="grid">
`;

function renderTrackCard(name, key, lengthKm, laps, pts, startIdx = 0, strokeColor = '#38bdf8') {
  if (!pts || pts.length < 5) return '';
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = 220 / Math.max(w, h);
  const ox = (260 - w * scale) / 2;
  const oy = (170 - h * scale) / 2;

  // In standard screen coords: Y goes down.
  // In canvas replay: y is inverted: `h - (p.y * scale + ty)`.
  // To display the track EXACTLY as it appears on the RaceReplayCanvas:
  // We flip Y so top of SVG corresponds to top of screen.
  // Let's render both: reference line and start/finish marker.
  const d = pts.map((p, i) => {
    const sx = ox + (p.x - minX) * scale;
    // In RaceReplayCanvas: toScreen(p) = { x: p.x * scale + tx, y: h - (p.y * scale + ty) }
    // Higher p.y means LOWER on canvas, or vice-versa depending on coordinate system.
    // In generatedTracks.json: Sakhir points have y between 240 and 760.
    const sy = oy + (h - (p.y - minY)) * scale;
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ') + ' Z';

  const startPt = pts[startIdx] || pts[0];
  const startSx = ox + (startPt.x - minX) * scale;
  const startSy = oy + (h - (startPt.y - minY)) * scale;

  // Midpoint to show forward direction
  const midIdx = Math.floor(pts.length * 0.15);
  const midPt = pts[midIdx];
  const midSx = ox + (midPt.x - minX) * scale;
  const midSy = oy + (h - (midPt.y - minY)) * scale;

  return `
    <div class="card">
      <h3 title="${name}">${name}</h3>
      <div class="meta">${key} • ${lengthKm || '?'} km • ${pts.length} pts</div>
      <svg viewBox="0 0 260 170">
        <!-- Track line -->
        <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        <!-- Start/Finish line dot (Green) -->
        <circle cx="${startSx.toFixed(1)}" cy="${startSy.toFixed(1)}" r="4.5" fill="#22c55e" stroke="#fff" stroke-width="1" />
        <!-- 15% progression dot (Yellow) to indicate driving direction -->
        <circle cx="${midSx.toFixed(1)}" cy="${midSy.toFixed(1)}" r="3" fill="#eab308" />
      </svg>
      <div class="legend">
        <div class="legend-item"><span class="dot" style="background:#22c55e"></span> S/F</div>
        <div class="legend-item"><span class="dot" style="background:#eab308"></span> Direction &gt;</div>
      </div>
    </div>
  `;
}

for (const [key, track] of Object.entries(generatedTracks)) {
  html += renderTrackCard(track.name || key, key, track.lengthKm, track.totalLaps, track.referenceLine, track.startFinishIdx || 0, '#38bdf8');
}

html += `
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '../public/track_audit_gallery.html'), html);
console.log('Successfully wrote gallery to public/track_audit_gallery.html');
