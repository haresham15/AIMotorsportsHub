import fs from 'fs';
import path from 'path';
import { TRACK_REGISTRY, getTrackForCircuit } from '../lib/trackData';
import { NASCAR_TRACK_REGISTRY } from '../lib/nascarTracks';

interface Point2D {
  x: number;
  y: number;
}

interface TrackGeometry {
  name: string;
  country?: string;
  lengthKm: number;
  totalLaps: number;
  type?: string;
  referenceLine: Point2D[];
  innerEdge?: Point2D[];
  outerEdge?: Point2D[];
  startFinishIdx?: number;
}

function analyzeTrack(key: string, track: TrackGeometry) {
  const pts = track.referenceLine || [];
  if (pts.length < 10) {
    return { key, name: track.name, status: 'ERROR', message: 'Too few points' };
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let totalLength = 0;
  let maxStep = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;

    const next = pts[(i + 1) % pts.length];
    const dist = Math.hypot(next.x - p.x, next.y - p.y);
    totalLength += dist;
    if (dist > maxStep) maxStep = dist;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const avgStep = totalLength / pts.length;
  const stepRatio = maxStep / (avgStep || 1);

  // Check if closed
  const startEndDist = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  const isClosed = startEndDist < avgStep * 3;

  const warnings: string[] = [];
  if (stepRatio > 10) warnings.push(`High step jump (${stepRatio.toFixed(1)}x avg step)`);
  if (!isClosed) warnings.push(`Track loop not smoothly closed (gap: ${startEndDist.toFixed(1)}px)`);
  if (width < 50 || height < 50) warnings.push(`Abnormally small dimensions (${width.toFixed(0)}x${height.toFixed(0)})`);

  return {
    key,
    name: track.name,
    pointsCount: pts.length,
    width: Math.round(width),
    height: Math.round(height),
    lengthKm: track.lengthKm,
    totalLaps: track.totalLaps,
    isClosed,
    warnings,
    status: warnings.length === 0 ? 'OK' : 'WARNING'
  };
}

function renderTrackSvg(track: TrackGeometry, strokeColor = '#38bdf8') {
  const pts = track.referenceLine || [];
  if (pts.length < 5) return '<p>No data</p>';

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = Math.min(230 / w, 140 / h);
  const ox = (260 - w * scale) / 2;
  const oy = (170 - h * scale) / 2;

  // In RaceReplayCanvas: toScreen(p) = { x: p.x * scale + tx, y: h - (p.y * scale + ty) }
  // So higher y is towards the top in Cartesian coordinates, meaning in SVG screen coordinates it flips:
  const d = pts.map((p, i) => {
    const sx = ox + (p.x - minX) * scale;
    const sy = oy + (h - (p.y - minY)) * scale;
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ') + ' Z';

  const sIdx = track.startFinishIdx || 0;
  const sPt = pts[sIdx] || pts[0];
  const sSx = ox + (sPt.x - minX) * scale;
  const sSy = oy + (h - (sPt.y - minY)) * scale;

  // 15% progression dot
  const mIdx = Math.floor(pts.length * 0.12);
  const mPt = pts[mIdx] || pts[1];
  const mSx = ox + (mPt.x - minX) * scale;
  const mSy = oy + (h - (mPt.y - minY)) * scale;

  return `
    <svg viewBox="0 0 260 170">
      <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      <circle cx="${sSx.toFixed(1)}" cy="${sSy.toFixed(1)}" r="5" fill="#22c55e" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="${mSx.toFixed(1)}" cy="${mSy.toFixed(1)}" r="3" fill="#f59e0b" />
    </svg>
  `;
}

async function main() {
  console.log('--- Starting Track Audit ---');

  const allTracks = { ...TRACK_REGISTRY, ...NASCAR_TRACK_REGISTRY };
  const keys = Object.keys(allTracks);
  console.log(`Auditing ${keys.length} total track geometries...`);

  const results = [];
  for (const key of keys) {
    const res = analyzeTrack(key, allTracks[key]);
    results.push(res);
  }

  const warnings = results.filter(r => r.status === 'WARNING');
  console.log(`Audit results: ${results.length - warnings.length} OK, ${warnings.length} with warnings.`);
  if (warnings.length > 0) {
    console.log('Warnings found in:');
    for (const w of warnings) {
      console.log(`  - ${w.key} (${w.name}): ${(w.warnings || []).join('; ')}`);
    }
  }

  // Generate Visual Gallery HTML
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Apexis Complete Track Geometry Audit</title>
  <style>
    body {
      background: #0b0e13;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 28px;
      margin: 0;
    }
    h1 { font-size: 26px; color: #fff; margin-bottom: 6px; }
    p.subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .stats-bar {
      display: flex;
      gap: 20px;
      margin-bottom: 32px;
      background: #151a23;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }
    .stat-box { font-size: 13px; color: #94a3b8; }
    .stat-box strong { font-size: 18px; color: #38bdf8; display: block; }
    .category-title {
      font-size: 20px;
      font-weight: 700;
      color: #f59e0b;
      margin: 36px 0 16px 0;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-count {
      font-size: 12px;
      background: #1e293b;
      color: #94a3b8;
      padding: 3px 8px;
      border-radius: 999px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 16px;
    }
    .card {
      background: #151a23;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card:hover {
      border-color: #38bdf8;
      box-shadow: 0 6px 20px rgba(56,189,248,0.15);
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-meta {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 10px;
    }
    svg {
      width: 100%;
      height: 180px;
      background: #07090e;
      border-radius: 8px;
      border: 1px solid #1e293b;
      margin-bottom: 10px;
    }
    .badges {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    .status-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
    }
    .status-ok { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .status-warn { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .legend-indicators {
      display: flex;
      gap: 8px;
      font-size: 10px;
      color: #94a3b8;
    }
    .indicator { display: flex; align-items: center; gap: 4px; }
    .dot-green { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; }
    .dot-amber { width: 7px; height: 7px; background: #f59e0b; border-radius: 50%; }
  </style>
</head>
<body>
  <h1>Apexis Comprehensive Track Geometry Audit</h1>
  <p class="subtitle">Complete audit of all F1, OpenF1, and NASCAR circuits rendered on the 2D Replay Canvas.</p>

  <div class="stats-bar">
    <div class="stat-box"><strong>${keys.length}</strong> Total Registered Venues</div>
    <div class="stat-box"><strong>${results.filter(r => r.status === 'OK').length}</strong> Geometrically Sound</div>
    <div class="stat-box"><strong>${warnings.length}</strong> Flagged for Review</div>
  </div>

  <div class="category-title">
    <span>Formula 1 & Global Circuits (OpenF1 Telemetry)</span>
    <span class="category-count">${Object.keys(TRACK_REGISTRY).length} Circuits</span>
  </div>
  <div class="grid">
`;

  // 1. F1 Tracks
  for (const [key, track] of Object.entries(TRACK_REGISTRY)) {
    const analysis = analyzeTrack(key, track);
    const statusClass = analysis.status === 'OK' ? 'status-ok' : 'status-warn';
    html += `
      <div class="card">
        <div>
          <div class="card-title" title="${track.name}">${track.name}</div>
          <div class="card-meta">${key} • ${track.lengthKm || '?'} km • ${track.totalLaps || '?'} laps</div>
          ${renderTrackSvg(track, '#38bdf8')}
        </div>
        <div class="badges">
          <span class="status-badge ${statusClass}">${analysis.status}</span>
          <div class="legend-indicators">
            <span class="indicator"><span class="dot-green"></span> S/F</span>
            <span class="indicator"><span class="dot-amber"></span> Dir</span>
          </div>
        </div>
      </div>
    `;
  }

  html += `
  </div>

  <div class="category-title">
    <span>NASCAR Cup & Ovals Registry</span>
    <span class="category-count">${Object.keys(NASCAR_TRACK_REGISTRY).length} Circuits</span>
  </div>
  <div class="grid">
`;

  // 2. NASCAR Tracks
  for (const [key, track] of Object.entries(NASCAR_TRACK_REGISTRY)) {
    const analysis = analyzeTrack(key, track);
    const statusClass = analysis.status === 'OK' ? 'status-ok' : 'status-warn';
    html += `
      <div class="card">
        <div>
          <div class="card-title" title="${track.name}">${track.name}</div>
          <div class="card-meta">${key} • ${track.lengthKm} km • ${track.totalLaps} laps</div>
          ${renderTrackSvg(track, '#f59e0b')}
        </div>
        <div class="badges">
          <span class="status-badge ${statusClass}">${analysis.status}</span>
          <div class="legend-indicators">
            <span class="indicator"><span class="dot-green"></span> S/F</span>
            <span class="indicator"><span class="dot-amber"></span> Dir</span>
          </div>
        </div>
      </div>
    `;
  }

  html += `
  </div>
</body>
</html>
`;

  const outputPath = path.join(__dirname, '../public/track_audit_gallery.html');
  fs.writeFileSync(outputPath, html);
  console.log(`Visual audit gallery generated at: ${outputPath}`);
}

main().catch(console.error);
