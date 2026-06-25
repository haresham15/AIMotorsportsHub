'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import type { ReplayData, PlaybackState, RaceFrame, Point2D } from '@/lib/replayTypes'
import { getTrackForSeries } from '@/lib/trackData'
import { generateReplayData } from '@/lib/raceSimulator'
import { SERIES_DRIVERS } from '@/lib/data'
import RaceReplayCanvas from './RaceReplayCanvas'
import ReplayControls from './ReplayControls'
import ReplayLeaderboard from './ReplayLeaderboard'
import DriverTelemetryPanel from './DriverTelemetryPanel'
import { Loader, Radio, AlertTriangle } from 'lucide-react'

interface LiveMap2DProps {
  series: string
  round?: number
  sessionKey?: number | null
}

export default function LiveMap2D({ series, round = 1, sessionKey = null }: LiveMap2DProps) {
  const [replayData, setReplayData] = useState<ReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'api' | 'simulation' | 'openf1'>('simulation')

  const [playback, setPlayback] = useState<PlaybackState>({
    frameIndex: 0,
    isPlaying: false,
    speed: 1,
    selectedDrivers: [],
    showLeaderboard: true,
    showWeather: true,
    showDriverLabels: false,
    showDrsZones: true,
  })

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadData = async () => {
      try {
        if (series === 'f1' && sessionKey) {
          // Attempt to fetch real track geometry from OpenF1
          // We fetch 1 driver's data downsampled to create a clean reference line
          const posRes = await fetch(`/api/f1/positions/${sessionKey}?driver_number=1&downsample=10`)
          const posData = await posRes.json()

          if (cancelled) return

          if (posData && Array.isArray(posData) && posData.length > 100) {
            console.log(`[LiveMap2D] Fetched real OpenF1 circuit geometry: ${posData.length} points`)
            
            // Extract a single lap roughly (assuming ~90 seconds lap time at 10 downsample)
            // OpenF1 location frequency is ~30Hz, so 30 * 90 = 2700 points, downsampled by 10 = 270 points
            // For simplicity, we just take the first 1000 points to form a closed loop approximation
            const pointsToTake = Math.min(posData.length, 1200)
            const referenceLine: Point2D[] = posData.slice(0, pointsToTake).map((p: any) => ({
              // OpenF1 uses a 3D coordinate system where X and Y are in metres.
              // Depending on the circuit, we might need to flip or scale, but we'll try raw first.
              x: p.x,
              y: p.y
            }))

            // Calculate bounding box to normalize coordinates
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
            referenceLine.forEach(p => {
              if (p.x < minX) minX = p.x
              if (p.x > maxX) maxX = p.x
              if (p.y < minY) minY = p.y
              if (p.y > maxY) maxY = p.y
            })

            const width = maxX - minX
            const height = maxY - minY
            
            // Normalize to a roughly 800x600 canvas coordinate space
            const scale = Math.min(800 / (width || 1), 600 / (height || 1)) * 0.8
            
            const normalizedLine = referenceLine.map(p => ({
              x: (p.x - minX - width/2) * scale,
              y: (p.y - minY - height/2) * scale
            }))

            const baseTrack = getTrackForSeries(series)
            const track = {
              ...baseTrack,
              referenceLine: normalizedLine,
              // Overwrite these to avoid drawing incorrect offset geometry
              innerEdge: [],
              outerEdge: []
            }

            const drivers = SERIES_DRIVERS[series] || SERIES_DRIVERS['f1']
            const simData = generateReplayData(series, track, drivers)
            
            setReplayData(simData)
            setDataSource('openf1')
            setLoading(false)
            return
          }
        }

        // Fallback: try fetching pre-computed Python data
        const res = await fetch(`/api/replay/${series}?year=2024&round=${round}&session=race`)
        const json = await res.json()

        if (cancelled) return

        if (json.source === 'simulation' || !json.frames) {
          console.log(`[LiveMap2D] No API data for ${series}, using fallback simulation`)
          const track = getTrackForSeries(series)
          const drivers = SERIES_DRIVERS[series] || SERIES_DRIVERS['f1']
          const simData = generateReplayData(series, track, drivers)
          setReplayData(simData)
          setDataSource('simulation')
        } else {
          console.log(`[LiveMap2D] Loaded API data for ${series}: ${json.frames.length} frames`)
          const track = json.trackGeometry ? { ...getTrackForSeries(series), ...json.trackGeometry } : getTrackForSeries(series)
          setReplayData({ ...json, trackGeometry: track })
          setDataSource('api')
        }
      } catch (err) {
        console.warn(`[LiveMap2D] Fetch failed for ${series}, using simulation:`, err)
        if (cancelled) return
        const track = getTrackForSeries(series)
        const drivers = SERIES_DRIVERS[series] || SERIES_DRIVERS['f1']
        const simData = generateReplayData(series, track, drivers)
        setReplayData(simData)
        setDataSource('simulation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [series, round, sessionKey])

  // ── Playback state handler ─────────────────────────────────────
  const handlePlaybackChange = useCallback((partial: Partial<PlaybackState>) => {
    setPlayback(prev => ({ ...prev, ...partial }))
  }, [])

  const handleDriverSelect = useCallback((codes: string[]) => {
    setPlayback(prev => ({ ...prev, selectedDrivers: codes }))
  }, [])

  // ── Current frame ──────────────────────────────────────────────
  const currentFrame: RaceFrame | null = useMemo(() => {
    if (!replayData || replayData.frames.length === 0) return null
    const idx = Math.min(Math.floor(playback.frameIndex), replayData.frames.length - 1)
    return replayData.frames[idx] ?? null
  }, [replayData, playback.frameIndex])

  const selectedDriver = playback.selectedDrivers.length === 1 ? playback.selectedDrivers[0] : null

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="replay-wrapper">
        <div className="replay-loading">
          <Loader size={32} className="replay-loading__spinner" />
          <span className="replay-loading__text">Initializing Race Replay…</span>
          <span className="replay-loading__sub">Loading real circuit telemetry…</span>
        </div>
      </div>
    )
  }

  if (error || !replayData) {
    return (
      <div className="replay-wrapper">
        <div className="replay-error">
          <AlertTriangle size={28} />
          <span>{error || 'Failed to load replay data'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="replay-wrapper">
      {/* Header */}
      <div className="replay-header">
        <div className="replay-header__left">
          <Radio size={14} className="replay-header__icon" />
          <span className="replay-header__title">
            {replayData.sessionInfo.circuitName}
          </span>
          <span className="replay-header__meta">
            {replayData.sessionInfo.country} • {replayData.sessionInfo.sessionType}
          </span>
        </div>
        <div className="replay-header__right">
          <span className={`replay-header__source replay-header__source--${dataSource}`}>
            {dataSource === 'api' ? 'HISTORICAL DATA' : dataSource === 'openf1' ? 'REAL CIRCUIT SIM' : 'SIMULATION'}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="replay-body">
        {/* Canvas */}
        <div className="replay-canvas-container">
          <RaceReplayCanvas
            data={replayData}
            playback={playback}
            onPlaybackChange={handlePlaybackChange}
            onDriverSelect={handleDriverSelect}
          />

          {/* Telemetry panel (floats over canvas) */}
          {selectedDriver && (
            <DriverTelemetryPanel
              data={replayData}
              frame={currentFrame}
              driverCode={selectedDriver}
              onClose={() => handleDriverSelect([])}
            />
          )}
        </div>

        {/* Leaderboard */}
        {playback.showLeaderboard && (
          <ReplayLeaderboard
            data={replayData}
            frame={currentFrame}
            selectedDrivers={playback.selectedDrivers}
            onSelect={handleDriverSelect}
          />
        )}
      </div>

      {/* Controls */}
      <ReplayControls
        playback={playback}
        data={replayData}
        onChange={handlePlaybackChange}
      />
    </div>
  )
}
