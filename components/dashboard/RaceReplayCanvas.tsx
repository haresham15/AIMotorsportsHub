'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { ReplayData, RaceFrame, PlaybackState, Point2D } from '@/lib/replayTypes'
import { REPLAY_FPS, TRACK_STATUS_MAP, TYRE_COMPOUNDS } from '@/lib/replayTypes'
import { COLORS } from '@/lib/theme'

interface Props {
  data: ReplayData
  playback: PlaybackState
  onPlaybackChange: (p: Partial<PlaybackState>) => void
  onDriverSelect: (codes: string[]) => void
  liveTrackStatus?: string
  isRaceDone?: boolean
}

/* ── colour helpers ─────────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/* ── bounding box ───────────────────────────────────────────────── */
function bounds(pts: Point2D[]) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  for (const p of pts) {
    if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x
    if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y
  }
  return { xMin, xMax, yMin, yMax }
}

export default function RaceReplayCanvas({ data, playback, onPlaybackChange, onDriverSelect, liveTrackStatus, isRaceDone = false }: Props) {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const frameIdxRef = useRef(playback.frameIndex)

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 450 })
  const cachedTrackCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const playbackRef = useRef(playback)
  const liveTrackStatusRef = useRef(liveTrackStatus)
  useEffect(() => {
    playbackRef.current = playback
  })
  useEffect(() => {
    liveTrackStatusRef.current = liveTrackStatus
  }, [liveTrackStatus])

  /* keep ref in sync, but only override if it's a manual scrub/skip (>2 frames difference) */
  useEffect(() => { 
    if (Math.abs(frameIdxRef.current - playback.frameIndex) > 2) {
      frameIdxRef.current = playback.frameIndex 
    }
  }, [playback.frameIndex])

  /* ── compute viewport transform (world → screen) ─────────────── */
  const getTransform = useCallback((w: number, h: number) => {
    let all = [...data.trackGeometry.innerEdge, ...data.trackGeometry.outerEdge]
    if (all.length === 0) all = data.trackGeometry.referenceLine
    if (all.length === 0) return { scale: 1, tx: 0, ty: 0 }
    const b = bounds(all)
    const pad = 0.08
    const worldW = Math.max(1, b.xMax - b.xMin)
    const worldH = Math.max(1, b.yMax - b.yMin)
    const scaleX = w * (1 - 2 * pad) / worldW
    const scaleY = h * (1 - 2 * pad) / worldH
    const scale = Math.min(scaleX, scaleY)
    const tx = w / 2 - scale * (b.xMin + worldW / 2)
    const ty = h / 2 - scale * (b.yMin + worldH / 2)
    return { scale, tx, ty }
  }, [data.trackGeometry])

  /* ── resize observer ──────────────────────────────────────────── */
  useEffect(() => {
    const el = canvasRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setCanvasSize({ w: Math.round(width), h: Math.round(Math.max(350, height)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── pre-render track cache ───────────────────────────────────── */
  useEffect(() => {
    if (canvasSize.w <= 0 || canvasSize.h <= 0) return;
    const w = canvasSize.w;
    const h = canvasSize.h;
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = w;
    cacheCanvas.height = h;
    const cacheCtx = cacheCanvas.getContext('2d', { alpha: false });
    if (!cacheCtx) return;

    const { scale, tx, ty } = getTransform(w, h)
    const toScreen = (p: Point2D) => ({ x: p.x * scale + tx, y: h - (p.y * scale + ty) })

    /* background */
    cacheCtx.fillStyle = COLORS.graphite950
    cacheCtx.fillRect(0, 0, w, h)

    /* subtle grid */
    cacheCtx.strokeStyle = 'rgba(255,255,255,0.02)'
    cacheCtx.lineWidth = 1
    for (let gx = 0; gx < w; gx += 40) { cacheCtx.beginPath(); cacheCtx.moveTo(gx, 0); cacheCtx.lineTo(gx, h); cacheCtx.stroke() }
    for (let gy = 0; gy < h; gy += 40) { cacheCtx.beginPath(); cacheCtx.moveTo(0, gy); cacheCtx.lineTo(w, gy); cacheCtx.stroke() }

    /* track status colour (use default for cache) */
    const trackColor = 'rgba(59,130,246,0.25)'
    const isDrag = data.trackGeometry.type === 'drag'

    const drawLine = (pts: Point2D[], color: string, width: number, isClosed = false) => {
      if (pts.length < 2) return
      cacheCtx.beginPath()
      cacheCtx.lineCap = 'round'
      cacheCtx.lineJoin = 'round'
      const s0 = toScreen(pts[0])
      cacheCtx.moveTo(s0.x, s0.y)
      for (let i = 1; i < pts.length; i++) {
        const s = toScreen(pts[i])
        cacheCtx.lineTo(s.x, s.y)
      }
      if (isClosed && !isDrag) cacheCtx.closePath()
      cacheCtx.strokeStyle = color
      cacheCtx.lineWidth = width
      cacheCtx.stroke()
    }

    if (isDrag) {
      drawLine(data.trackGeometry.outerEdge, trackColor, 30)
      drawLine(data.trackGeometry.innerEdge, trackColor, 30)
      drawLine(data.trackGeometry.outerEdge, 'rgba(100,160,255,0.3)', 2)
      drawLine(data.trackGeometry.innerEdge, 'rgba(100,160,255,0.3)', 2)
      cacheCtx.setLineDash([8, 5])
      drawLine(data.trackGeometry.referenceLine, 'rgba(96,165,250,0.12)', 1)
      cacheCtx.setLineDash([])
    } else {
      const ref = data.trackGeometry.referenceLine
      if (ref.length > 0) {
        drawLine(ref, trackColor, 12, true) // Base glow

        const n = ref.length
        const s1End = Math.floor(n / 3)
        const s2End = Math.floor(2 * n / 3)

        const sec1 = ref.slice(0, s1End + 1)
        const sec2 = ref.slice(s1End, s2End + 1)
        const sec3 = ref.slice(s2End)
        if (sec3.length > 0 && n > 0) sec3.push(ref[0])

        drawLine(sec1, COLORS.flagRed, 6) // Sector 1 Red
        drawLine(sec2, '#06b6d4', 6) // Sector 2 Teal
        drawLine(sec3, COLORS.amber, 6) // Sector 3 Yellow
      }
    }

    if (playback.showDrsZones && data.trackGeometry.drsZones) {
      for (const zone of data.trackGeometry.drsZones) {
        const source = data.trackGeometry.outerEdge.length > 0 ? data.trackGeometry.outerEdge : data.trackGeometry.referenceLine
        const pts = source.slice(zone.startIdx, zone.endIdx + 1)
        if (pts.length > 1) drawLine(pts, 'rgba(34,197,94,0.8)', 10)
      }
    }

    /* pit lane */
    if (!isDrag && data.trackGeometry.pitLane && data.trackGeometry.pitLane.length >= 2) {
      const pit = data.trackGeometry.pitLane
      // Draw pit road foundation with asphalt styling
      drawLine(pit, 'rgba(148, 163, 184, 0.20)', 8)
      // Dashed lane guidance line
      cacheCtx.setLineDash([4, 4])
      drawLine(pit, 'rgba(245, 158, 11, 0.45)', 1.5)
      cacheCtx.setLineDash([])

      // Demarcate Pit Entry line and Pit Exit line
      const entryPt = toScreen(pit[0])
      const exitPt = toScreen(pit[pit.length - 1])
      
      cacheCtx.fillStyle = 'rgba(245, 158, 11, 0.85)'
      cacheCtx.font = 'bold 8px "JetBrains Mono", monospace'
      cacheCtx.textAlign = 'center'
      cacheCtx.fillText('PIT IN', entryPt.x, entryPt.y - 6)

      cacheCtx.fillStyle = 'rgba(34, 197, 94, 0.85)'
      cacheCtx.fillText('PIT OUT', exitPt.x, exitPt.y - 6)

      // Pit Box marker (mid-point of pit lane)
      const midIdx = Math.floor(pit.length / 2)
      const boxPt = toScreen(pit[midIdx])
      cacheCtx.strokeStyle = 'rgba(245, 158, 11, 0.5)'
      cacheCtx.lineWidth = 1.5
      cacheCtx.strokeRect(boxPt.x - 4, boxPt.y - 4, 8, 8)
    }

    if (!isDrag) {
      const sfIdx = data.trackGeometry.startFinishIdx || 0
      const ref = data.trackGeometry.referenceLine
      if (ref.length > Math.max(1, sfIdx)) {
        const p = ref[sfIdx]
        const next = ref[(sfIdx + 1) % ref.length]
        const dx = next.x - p.x
        const dy = next.y - p.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const nx = -dy / len
        const ny = dx / len
        
        const sfLength = 5 / scale 
        const a = toScreen({ x: p.x + nx * sfLength, y: p.y + ny * sfLength })
        const b = toScreen({ x: p.x - nx * sfLength, y: p.y - ny * sfLength })
        
        cacheCtx.beginPath(); cacheCtx.moveTo(a.x, a.y); cacheCtx.lineTo(b.x, b.y)
        cacheCtx.strokeStyle = COLORS.textPrimary; cacheCtx.lineWidth = 4; cacheCtx.stroke()
      }
    } else {
      const ref = data.trackGeometry.referenceLine
      if (ref.length >= 2) {
        const startP = toScreen(ref[0])
        const endP = toScreen(ref[ref.length - 1])
        // 1,000-ft finish line is at ~34% down the total strip length (including shutdown)
        const finishRatio = 0.34
        const finishP = toScreen({
          x: ref[0].x + (ref[ref.length - 1].x - ref[0].x) * finishRatio,
          y: ref[0].y + (ref[ref.length - 1].y - ref[0].y) * finishRatio,
        })

        // Staging Beams
        cacheCtx.strokeStyle = COLORS.greenFlag; cacheCtx.lineWidth = 3
        cacheCtx.beginPath(); cacheCtx.moveTo(startP.x, startP.y - 35); cacheCtx.lineTo(startP.x, startP.y + 35); cacheCtx.stroke()
        cacheCtx.fillStyle = COLORS.greenFlag; cacheCtx.font = 'bold 9px "JetBrains Mono", monospace'; cacheCtx.textAlign = 'center'
        cacheCtx.fillText('STAGING BEAMS', startP.x, startP.y - 42)

        // 1,000-FT Finish Beam
        cacheCtx.strokeStyle = '#f59e0b'; cacheCtx.lineWidth = 3
        cacheCtx.beginPath(); cacheCtx.moveTo(finishP.x, finishP.y - 35); cacheCtx.lineTo(finishP.x, finishP.y + 35); cacheCtx.stroke()
        cacheCtx.fillStyle = '#f59e0b'; cacheCtx.font = 'bold 9px "JetBrains Mono", monospace'; cacheCtx.textAlign = 'center'
        cacheCtx.fillText('1,000 FT FINISH', finishP.x, finishP.y - 42)

        // Shutdown Run-off Boundary
        cacheCtx.strokeStyle = COLORS.flagRed; cacheCtx.lineWidth = 2
        cacheCtx.beginPath(); cacheCtx.moveTo(endP.x, endP.y - 35); cacheCtx.lineTo(endP.x, endP.y + 35); cacheCtx.stroke()
        cacheCtx.fillStyle = COLORS.flagRed; cacheCtx.font = 'bold 9px "JetBrains Mono", monospace'; cacheCtx.textAlign = 'center'
        cacheCtx.fillText('SHUTDOWN RUN-OFF', endP.x, endP.y - 42)
      }
    }
    cachedTrackCanvasRef.current = cacheCanvas;
  }, [canvasSize, data.trackGeometry, getTransform, playback.showDrsZones])

  /* ── draw one frame ───────────────────────────────────────────── */
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: RaceFrame) => {
    const { scale, tx, ty } = getTransform(w, h)
    const toScreen = (p: Point2D) => ({ x: p.x * scale + tx, y: h - (p.y * scale + ty) })

    /* draw cached background track */
    if (cachedTrackCanvasRef.current) {
      ctx.drawImage(cachedTrackCanvasRef.current, 0, 0)
    } else {
      ctx.clearRect(0, 0, w, h)
    }

    const statusInfo = TRACK_STATUS_MAP[frame.trackStatus || '1'] || TRACK_STATUS_MAP['1']

    /* safety car */
    if (frame.safetyCar) {
      const sc = frame.safetyCar
      const scp = toScreen({ x: sc.x, y: sc.y })
      const alpha = sc.alpha

      if (sc.phase === 'deploying' || sc.phase === 'returning') {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 125)
        const glowR = 16 + pulse * 6
        ctx.beginPath(); ctx.arc(scp.x, scp.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,200,0,${0.3 * alpha * pulse})`; ctx.fill()
      } else {
        ctx.beginPath(); ctx.arc(scp.x, scp.y, 14, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,165,0,0.15)`; ctx.fill()
      }

      ctx.beginPath(); ctx.arc(scp.x, scp.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,165,0,${alpha})`; ctx.fill()
      ctx.strokeStyle = `rgba(255,100,0,${alpha})`; ctx.lineWidth = 2; ctx.stroke()

      ctx.fillStyle = `rgba(255,255,255,${Math.max(0.3, alpha)})`
      ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left'
      ctx.fillText('SC', scp.x + 14, scp.y + 4)

      if (sc.phase === 'deploying') {
        ctx.fillStyle = `rgba(255,200,0,${0.8 * alpha})`; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center'
        ctx.fillText('SC DEPLOYING', scp.x, scp.y + 20)
      } else if (sc.phase === 'returning') {
        ctx.fillStyle = `rgba(255,200,0,${0.8 * alpha})`; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center'
        ctx.fillText('SC IN', scp.x, scp.y + 20)
      }
    }

    /* driver dots and trails */
    const currentFi = Math.min(Math.floor(frameIdxRef.current), data.frames.length - 1)
    const trailLength = 30 // ~1.2 seconds of history
    const startFi = Math.max(0, currentFi - trailLength)

    const driverEntries = Object.entries(frame.drivers)
    for (const [code, d] of driverEntries) {
      const sp = toScreen({ x: d.x, y: d.y })
      const color = data.driverColors[code] || COLORS.textPrimary
      const [r, g, b] = hexToRgb(color)
      const isSelected = playbackRef.current.selectedDrivers.includes(code)
      const isLeader = d.position <= 3

      /* ghost trail */
      ctx.beginPath()
      let started = false
      for (let i = startFi; i <= currentFi; i++) {
        const pastD = data.frames[i].drivers[code]
        if (!pastD) continue
        const p = toScreen({ x: pastD.x, y: pastD.y })
        if (!started) {
          ctx.moveTo(p.x, p.y)
          started = true
        } else {
          ctx.lineTo(p.x, p.y)
        }
      }
      if (started) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = `rgba(${r},${g},${b},${isSelected ? 0.7 : 0.25})`
        ctx.lineWidth = isSelected ? 3.5 : 1.5
        ctx.stroke()
      }

      /* outer pulse for leaders or selected */
      if (isLeader || isSelected) {
        ctx.beginPath(); ctx.arc(sp.x, sp.y, isSelected ? 16 : 12, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${isSelected ? 0.25 : 0.1})`; ctx.fill()
      }

      /* car dot */
      const radius = isSelected ? 7 : (d.inPit ? 4 : 5.5)
      const tyreColor = TYRE_COMPOUNDS[d.tyre]?.color || COLORS.textPrimary
      
      ctx.beginPath(); ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = d.inPit ? `rgba(${r},${g},${b},0.4)` : color
      ctx.fill()
      ctx.strokeStyle = tyreColor; ctx.lineWidth = isSelected ? 2 : 1.2; ctx.stroke()

      /* label */
      if (isSelected || playbackRef.current.showDriverLabels) {
        ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 9px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
        ctx.fillText(code, sp.x, sp.y - (isSelected ? 16 : 14))
      }

      /* focus ring for selected driver on track */
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, radius + 4, 0, Math.PI * 2)
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      /* pit indicator badge */
      if (d.inPit) {
        ctx.fillStyle = '#f59e0b'
        ctx.font = 'bold 8px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(d.pitPhase === 'STOP' ? 'BOX' : 'PIT', sp.x, sp.y + (isSelected ? 16 : 14))
      }

      /* DRS indicator (only relevant for F1, F2, F3) */
      const currentSeries = data.sessionInfo?.seriesId || 'f1';
      if (d.drs >= 10 && ['f1', 'f2', 'f3'].includes(currentSeries)) {
        ctx.beginPath(); ctx.arc(sp.x + (isSelected ? 9 : 7), sp.y - (isSelected ? 9 : 7), 2.5, 0, Math.PI * 2)
        ctx.fillStyle = COLORS.greenFlag; ctx.fill()
      }
    }

    /* HUD: track status banner (incorporates real-time live track alerts if in live mode) */
    const effectiveTrackStatus = (playbackRef.current.isLiveMode && !isRaceDone && liveTrackStatusRef.current)
      ? liveTrackStatusRef.current
      : frame.trackStatus;
    if (effectiveTrackStatus && effectiveTrackStatus !== '1') {
      const si = TRACK_STATUS_MAP[effectiveTrackStatus] || statusInfo
      ctx.fillStyle = si.color
      ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'
      ctx.fillText(si.label, 16, 24)
    }

    /* HUD: live status pill on top right (closed out once race is done) */
    if (playbackRef.current.isLiveMode && !isRaceDone) {
      ctx.beginPath()
      ctx.arc(w - 56, 20, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 11px "JetBrains Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText('LIVE', w - 16, 24)
    }


    /* ── Series-Tailored HUD Overlay ─────────────────────────────── */
    const seriesId = data.sessionInfo?.seriesId || 'f1';
    const sessionType = data.sessionInfo?.sessionType || 'Race';
    const isDrag = seriesId === 'top-fuel' || data.trackGeometry.type === 'drag';
    const isWec = seriesId === 'wec' || seriesId === 'gt-world-challenge';
    const isFE = seriesId === 'formula-e';
    const isNascar = seriesId === 'nascar' || seriesId?.startsWith('nascar-');
    const isQuali = sessionType.toLowerCase().includes('qualifying') || sessionType.toLowerCase().includes('shootout');

    const driversArr = Object.entries(frame.drivers);
    const selectedCode = playbackRef.current.selectedDrivers[0];
    const targetDriver = (selectedCode && frame.drivers[selectedCode]) 
      ? frame.drivers[selectedCode] 
      : (driversArr.find(([, d]) => d.position === 1)?.[1] || driversArr[0]?.[1]);
    const secondDriver = driversArr.find(([, d]) => d.position === 2)?.[1];

    // Shift bottom-left HUD vertically when a driver is focused to prevent overlapping DriverTelemetryPanel
    const hudY = selectedCode ? h - 280 : h - 16;
    const hudYSub = selectedCode ? h - 300 : h - 36;
    const hudYTert = selectedCode ? h - 320 : h - 56;

    if (isDrag) {
      // ── Top Fuel HUD ──
      const speedMph = targetDriver ? Math.round(targetDriver.speed * 0.621371) : 0;
      const etSec = targetDriver?.elapsedTime ?? frame.t;
      
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left'
      ctx.fillText('1,000 FT ELIMINATION • ROUND 1', 16, hudYTert)
      
      ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 13px "JetBrains Mono", monospace'
      ctx.fillText(`ET: ${etSec.toFixed(3)}s • SPEED: ${speedMph} MPH`, 16, hudYSub)

      ctx.fillStyle = COLORS.textSecondary; ctx.font = '10px "JetBrains Mono", monospace'
      const p1Rt = targetDriver?.reactionTime ? `+${targetDriver.reactionTime.toFixed(3)}s` : '+0.038s';
      const p2Rt = secondDriver?.reactionTime ? `+${secondDriver.reactionTime.toFixed(3)}s` : '+0.046s';
      ctx.fillText(`RT: P1 ${p1Rt} | P2 ${p2Rt}`, 16, hudY)

      // Chute deployment notification banner
      if (targetDriver?.chuteDeployed) {
        ctx.save()
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1.5
        const bannerW = 230, bannerH = 22
        const bx = (w - bannerW) / 2
        ctx.fillRect(bx, 14, bannerW, bannerH)
        ctx.strokeRect(bx, 14, bannerW, bannerH)
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 10px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PARACHUTES DEPLOYED (SHUTDOWN)', w / 2, 29)
        ctx.restore()
      }
    } else if (isWec) {
      // ── WEC Endurance HUD ──
      const durationSec = data.sessionInfo.eventName.includes('24') ? 24 * 3600 : 6 * 3600;
      const remSec = Math.max(0, durationSec - frame.t);
      const remH = Math.floor(remSec / 3600)
      const remM = Math.floor((remSec % 3600) / 60)
      const remS = Math.floor(remSec % 60)
      const remStr = `${String(remH).padStart(2, '0')}:${String(remM).padStart(2, '0')}:${String(remS).padStart(2, '0')}`

      ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left'
      const stintStr = `STINT ${targetDriver?.stintNumber || 1} • LAP ${frame.lap}/${data.totalLaps}`
      ctx.fillText(stintStr, 16, hudY)

      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px "JetBrains Mono", monospace'
      ctx.fillText(`TIME REMAINING: ${remStr}`, 16, hudYSub)

      if (targetDriver?.carClass) {
        ctx.fillStyle = targetDriver.carClass === 'HYPERCAR' ? '#ef4444' : '#f59e0b'
        ctx.font = 'bold 10px "JetBrains Mono", monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`${targetDriver.carClass} • CLASS P${targetDriver.classPosition || targetDriver.position}`, 16, 44)
      }
    } else if (isFE) {
      // ── Formula E HUD ──
      const energy = targetDriver?.energyPct !== undefined ? targetDriver.energyPct.toFixed(1) : '98.0';
      ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left'
      ctx.fillText(`E-PRIX • LAP ${frame.lap}/${data.totalLaps}`, 16, hudY)

      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px "JetBrains Mono", monospace'
      const atkStr = targetDriver?.attackMode ? ' • ⚡ ATTACK MODE (350 kW)' : '';
      ctx.fillText(`ENERGY: ${energy}%${atkStr}`, 16, hudYSub)
    } else if (isNascar) {
      // ── NASCAR HUD ──
      const stageName = targetDriver?.stageNumber === 3 ? 'FINAL STAGE' : `STAGE ${targetDriver?.stageNumber || 1}`;
      const lapsToGo = targetDriver?.stageLapsToGo ? `${targetDriver.stageLapsToGo} TO GO IN STAGE` : `LAP ${frame.lap}/${data.totalLaps}`;
      const speedMph = targetDriver ? Math.round(targetDriver.speed * 0.621371) : 190;

      ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left'
      ctx.fillText(`NASCAR • ${stageName} • ${lapsToGo}`, 16, hudY)

      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px "JetBrains Mono", monospace'
      ctx.fillText(`SPEED: ${speedMph} MPH`, 16, hudYSub)
    } else if (isQuali) {
      // ── Qualifying HUD ──
      const qPhase = targetDriver?.qualifyingPhase || 'Q3 SHOOTOUT';
      ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left'
      ctx.fillText(`QUALIFYING • ${qPhase}`, 16, hudY)

      const totalSec = frame.t
      const mins = Math.floor(totalSec / 60)
      const secs = Math.floor(totalSec % 60)
      ctx.fillStyle = COLORS.textSecondary; ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(`SESSION TIME: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, 16, hudYSub)
    } else {
      // ── Grand Prix / F1 Fallback HUD ──
      ctx.fillStyle = COLORS.textPrimary; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left'
      const lapPrefix = (playbackRef.current.isLiveMode && !isRaceDone) ? 'LIVE • ' : ''
      const lapStr = `${lapPrefix}LAP ${frame.lap}/${data.totalLaps}`

      ctx.fillText(lapStr, 16, hudY)

      const totalSec = frame.t
      const hrs = Math.floor(totalSec / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      const secs = Math.floor(totalSec % 60)
      const timeStr = hrs > 0
        ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      ctx.fillStyle = COLORS.textSecondary; ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(timeStr, 16, hudYSub)
    }


    /* speed indicator */
    ctx.fillStyle = COLORS.textMuted; ctx.font = '11px Inter'; ctx.textAlign = 'right'
    ctx.fillText(`${playbackRef.current.speed}x`, w - 16, h - 16)
  }, [data, getTransform])

  /* ── animation loop ───────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (data.frames.length === 0) {
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)
      return
    }

    let running = true
    let lastSyncTime = 0

    const tick = (timestamp: number) => {
      if (!running) return

      const isPlaying = playbackRef.current.isPlaying
      const speed = playbackRef.current.speed

      if (isPlaying) {
        if (lastTimeRef.current > 0) {
          const elapsed = (timestamp - lastTimeRef.current) / 1000
          const advance = elapsed * REPLAY_FPS * speed
          const newIdx = Math.min(frameIdxRef.current + advance, data.frames.length - 1)

          if (newIdx !== frameIdxRef.current) {
            frameIdxRef.current = newIdx
            // Throttle React state updates to ~10 FPS (every 100ms) to prevent main thread stutter
            // while keeping the internal canvas rendering smoothly at 60 FPS.
            if (timestamp - lastSyncTime > 100 || newIdx >= data.frames.length - 1) {
              lastSyncTime = timestamp
              onPlaybackChange({ frameIndex: newIdx })
            }
          }
        }
        lastTimeRef.current = timestamp
      } else {
        lastTimeRef.current = 0
      }

      const fi = Math.min(Math.floor(frameIdxRef.current), data.frames.length - 1)
      if (fi >= 0 && fi < data.frames.length) {
        drawFrame(ctx, canvasSize.w, canvasSize.h, data.frames[fi])
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [data, canvasSize, drawFrame, onPlaybackChange])

  /* ── keyboard shortcuts ───────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); onPlaybackChange({ isPlaying: !playback.isPlaying }) }
      if (e.key === 'ArrowRight') onPlaybackChange({ frameIndex: Math.min(frameIdxRef.current + REPLAY_FPS * 5, data.frames.length - 1) })
      if (e.key === 'ArrowLeft') onPlaybackChange({ frameIndex: Math.max(frameIdxRef.current - REPLAY_FPS * 5, 0) })
      if (e.key === 'ArrowUp') {
        const speeds = [0.5, 1, 2, 4, 8, 16]
        const idx = speeds.indexOf(playback.speed)
        if (idx < speeds.length - 1) onPlaybackChange({ speed: speeds[idx + 1] })
      }
      if (e.key === 'ArrowDown') {
        const speeds = [0.5, 1, 2, 4, 8, 16]
        const idx = speeds.indexOf(playback.speed)
        if (idx > 0) onPlaybackChange({ speed: speeds[idx - 1] })
      }
      if (e.key === 'r' || e.key === 'R') onPlaybackChange({ frameIndex: 0, isPlaying: true })
      if (e.key === 'l' || e.key === 'L') onPlaybackChange({ showDriverLabels: !playback.showDriverLabels })
      if (e.key === 'd' || e.key === 'D') onPlaybackChange({ showDrsZones: !playback.showDrsZones })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [playback, data.frames.length, onPlaybackChange])

  /* ── click to select driver ───────────────────────────────────── */
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { scale, tx, ty } = getTransform(canvasSize.w, canvasSize.h)

    const fi = Math.min(Math.floor(frameIdxRef.current), data.frames.length - 1)
    const frame = data.frames[fi]
    if (!frame) return

    let closestCode = ''
    let closestDist = 400 // 20px radius squared

    for (const [code, d] of Object.entries(frame.drivers)) {
      const sx = d.x * scale + tx
      const sy = canvasSize.h - (d.y * scale + ty)
      const dist = (mx - sx) ** 2 + (my - sy) ** 2
      if (dist < closestDist) { closestDist = dist; closestCode = code }
    }

    if (closestCode) {
      const currentSelected = playbackRef.current.selectedDrivers
      if (e.shiftKey) {
        const sel = currentSelected.includes(closestCode)
          ? currentSelected.filter(c => c !== closestCode)
          : [...currentSelected, closestCode]
        onDriverSelect(sel)
      } else {
        onDriverSelect(currentSelected[0] === closestCode && currentSelected.length === 1 ? [] : [closestCode])
      }
    } else {
      onDriverSelect([])
    }
  }, [data, canvasSize, getTransform, onDriverSelect])

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.w}
      height={canvasSize.h}
      onClick={handleCanvasClick}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        borderRadius: 'var(--radius-lg)',
        cursor: 'crosshair',
      }}
    />
  )
}
