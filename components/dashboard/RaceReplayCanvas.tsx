'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { ReplayData, RaceFrame, PlaybackState, Point2D } from '@/lib/replayTypes'
import { REPLAY_FPS, TRACK_STATUS_MAP, TYRE_COMPOUNDS } from '@/lib/replayTypes'

interface Props {
  data: ReplayData
  playback: PlaybackState
  onPlaybackChange: (p: Partial<PlaybackState>) => void
  onDriverSelect: (codes: string[]) => void
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

export default function RaceReplayCanvas({ data, playback, onPlaybackChange, onDriverSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const frameIdxRef = useRef(playback.frameIndex)

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 450 })
  const cachedTrackCanvasRef = useRef<HTMLCanvasElement | null>(null)

  /* keep ref in sync */
  useEffect(() => { frameIdxRef.current = playback.frameIndex }, [playback.frameIndex])

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
    cacheCtx.fillStyle = '#060a13'
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

        drawLine(sec1, '#ef4444', 6) // Sector 1 Red
        drawLine(sec2, '#06b6d4', 6) // Sector 2 Teal
        drawLine(sec3, '#eab308', 6) // Sector 3 Yellow
      }
    }

    if (playback.showDrsZones && data.trackGeometry.drsZones) {
      for (const zone of data.trackGeometry.drsZones) {
        const source = data.trackGeometry.outerEdge.length > 0 ? data.trackGeometry.outerEdge : data.trackGeometry.referenceLine
        const pts = source.slice(zone.startIdx, zone.endIdx + 1)
        if (pts.length > 1) drawLine(pts, 'rgba(34,197,94,0.8)', 10)
      }
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
        cacheCtx.strokeStyle = '#ffffff'; cacheCtx.lineWidth = 4; cacheCtx.stroke()
      }
    } else {
      const ref = data.trackGeometry.referenceLine
      if (ref.length > 2) {
        const startP = toScreen(ref[0])
        const endP = toScreen(ref[ref.length - 1])
        cacheCtx.strokeStyle = '#4ade80'; cacheCtx.lineWidth = 3
        cacheCtx.beginPath(); cacheCtx.moveTo(startP.x, startP.y - 40); cacheCtx.lineTo(startP.x, startP.y + 40); cacheCtx.stroke()
        cacheCtx.strokeStyle = '#f87171'
        cacheCtx.beginPath(); cacheCtx.moveTo(endP.x, endP.y - 40); cacheCtx.lineTo(endP.x, endP.y + 40); cacheCtx.stroke()
        cacheCtx.fillStyle = '#4ade80'; cacheCtx.font = '10px Inter'; cacheCtx.textAlign = 'center'
        cacheCtx.fillText('START', startP.x, startP.y - 48)
        cacheCtx.fillStyle = '#f87171'
        cacheCtx.fillText('FINISH', endP.x, endP.y - 48)
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

    /* driver dots */
    const driverEntries = Object.entries(frame.drivers)
    for (const [code, d] of driverEntries) {
      const sp = toScreen({ x: d.x, y: d.y })
      const color = data.driverColors[code] || '#3b82f6'
      const [r, g, b] = hexToRgb(color)
      const isSelected = playback.selectedDrivers.includes(code)
      const isLeader = d.position <= 3

      /* outer pulse for leaders or selected */
      if (isLeader || isSelected) {
        ctx.beginPath(); ctx.arc(sp.x, sp.y, isSelected ? 16 : 12, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${isSelected ? 0.25 : 0.1})`; ctx.fill()
      }

      /* car dot */
      const radius = isSelected ? 7 : (d.inPit ? 4 : 5.5)
      ctx.beginPath(); ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = d.inPit ? `rgba(${r},${g},${b},0.4)` : color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = isSelected ? 2 : 1.2; ctx.stroke()

      /* label */
      if (isSelected || playback.showDriverLabels) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
        ctx.fillText(code, sp.x, sp.y - 14)
      }

      /* DRS indicator */
      if (d.drs >= 10) {
        ctx.beginPath(); ctx.arc(sp.x + 8, sp.y - 8, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#22c55e'; ctx.fill()
      }
    }

    /* HUD: track status banner */
    if (frame.trackStatus && frame.trackStatus !== '1') {
      const si = statusInfo
      ctx.fillStyle = si.color
      ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'
      ctx.fillText(si.label, 16, 24)
    }

    /* HUD: lap + time */
    ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left'
    const lapStr = `LAP ${frame.lap}/${data.totalLaps}`
    ctx.fillText(lapStr, 16, h - 16)

    const mins = Math.floor(frame.t / 60)
    const secs = Math.floor(frame.t % 60)
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, 16, h - 36)

    /* speed indicator */
    ctx.fillStyle = '#64748b'; ctx.font = '11px Inter'; ctx.textAlign = 'right'
    ctx.fillText(`${playback.speed}x`, w - 16, h - 16)
  }, [data, playback, getTransform])

  /* ── animation loop ───────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const tick = (timestamp: number) => {
      if (!running) return

      if (playback.isPlaying && lastTimeRef.current > 0) {
        const elapsed = (timestamp - lastTimeRef.current) / 1000
        const advance = elapsed * REPLAY_FPS * playback.speed
        const newIdx = Math.min(frameIdxRef.current + advance, data.frames.length - 1)

        if (newIdx !== frameIdxRef.current) {
          frameIdxRef.current = newIdx
          onPlaybackChange({ frameIndex: newIdx })
        }
      }

      lastTimeRef.current = timestamp

      const fi = Math.min(Math.floor(frameIdxRef.current), data.frames.length - 1)
      if (fi >= 0 && fi < data.frames.length) {
        drawFrame(ctx, canvasSize.w, canvasSize.h, data.frames[fi])
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [data, playback.isPlaying, playback.speed, canvasSize, drawFrame, onPlaybackChange])

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
      if (e.shiftKey) {
        const sel = playback.selectedDrivers.includes(closestCode)
          ? playback.selectedDrivers.filter(c => c !== closestCode)
          : [...playback.selectedDrivers, closestCode]
        onDriverSelect(sel)
      } else {
        onDriverSelect(playback.selectedDrivers[0] === closestCode && playback.selectedDrivers.length === 1 ? [] : [closestCode])
      }
    } else {
      onDriverSelect([])
    }
  }, [data, playback, canvasSize, getTransform, onDriverSelect])

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
