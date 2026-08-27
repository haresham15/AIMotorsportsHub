'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import type { ReplayData, PlaybackState, RaceFrame, Point2D, TrackGeometry, DriverInfo } from '@/lib/replayTypes'
import { getTrackForCircuit } from '@/lib/trackData'
import { getDriverColor, SERIES_DRIVERS } from '@/lib/data'
import RaceReplayCanvas from './RaceReplayCanvas'
import ReplayControls from './ReplayControls'
import ReplayLeaderboard from './ReplayLeaderboard'
import DriverTelemetryPanel from './DriverTelemetryPanel'
import { Loader, Radio, AlertTriangle } from 'lucide-react'

// Helper to run simulation — prefers Web Worker for off-main-thread
// generation, but falls back to synchronous if Workers are unavailable
// (e.g., SSR, strict CSP, or certain browser extensions).
const generateReplayDataAsync = async (series: string, track: TrackGeometry, driversList: DriverInfo[], sessionType?: string): Promise<ReplayData> => {
  try {
    return await new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../../workers/simulator.worker.ts', import.meta.url))
      worker.onmessage = (e) => {
        if (e.data.type === 'SUCCESS') resolve(e.data.data)
        else reject(new Error(e.data.error))
        worker.terminate()
      }
      worker.onerror = (err) => {
        reject(err)
        worker.terminate()
      }
      worker.postMessage({ series, track, driversList, sessionType })
    })
  } catch {
    // Fallback: run synchronously on main thread if Worker fails
    console.warn('[LiveMap2D] Web Worker unavailable, running simulation synchronously')
    const { generateReplayData } = await import('@/lib/raceSimulator')
    return generateReplayData(series, track, driversList, sessionType)
  }
}

interface LiveMap2DProps {
  series: string
  round?: number
  sessionKey?: number | null
  circuitName?: string
  country?: string
  driverStandings?: Array<{
    code: string;
    firstName: string;
    lastName: string;
    driverNumber: string;
    constructorName: string;
  }>
  sessionType?: string
}

export default function LiveMap2D({ series, round = 1, sessionKey = null, sessionType = 'Race', circuitName, country, driverStandings }: LiveMap2DProps) {
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
        const driversList = driverStandings ? driverStandings.map(d => ({
          code: d.code || d.lastName.substring(0,3).toUpperCase(),
          name: d.firstName + ' ' + d.lastName,
          number: parseInt(d.driverNumber) || 0,
          team: d.constructorName,
          color: getDriverColor(series, d.code) || '#ffffff'
        })) : (SERIES_DRIVERS[series] || SERIES_DRIVERS['f1'])

        if (series === 'f1' && sessionKey) {
          // Fetch exact circuit layout from a single fast lap trace
          const leaderNumber = driversList[0]?.number || 1
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)
          
          const pathRes = await fetch(`/api/f1/circuit_path/${sessionKey}?driver_number=${leaderNumber}`, {
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          
          const pathData = await pathRes.json()

          if (cancelled) return

          if (pathData && Array.isArray(pathData) && pathData.length > 50) {
            console.log(`[LiveMap2D] Fetched real OpenF1 circuit geometry: ${pathData.length} points`)
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const referenceLine: Point2D[] = pathData.map((p: any) => ({
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

            const baseTrack = getTrackForCircuit(circuitName, series)
            const track = {
              ...baseTrack,
              referenceLine: normalizedLine,
              // Overwrite these to avoid drawing incorrect offset geometry
              innerEdge: [],
              outerEdge: []
            }

            const simData = await generateReplayDataAsync(series, track, driversList, sessionType)
            
            if (cancelled) return
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
          const track = getTrackForCircuit(circuitName, series)
          const simData = await generateReplayDataAsync(series, track, driversList, sessionType)
          if (cancelled) return
          setReplayData(simData)
          setDataSource('simulation')
        } else {
          console.log(`[LiveMap2D] Loaded API data for ${series}: ${json.frames.length} frames`)
          const track = json.trackGeometry ? { ...getTrackForCircuit(circuitName, series), ...json.trackGeometry } : getTrackForCircuit(circuitName, series)
          setReplayData({ ...json, trackGeometry: track })
          setDataSource('api')
        }
      } catch (err) {
        console.warn(`[LiveMap2D] Fetch failed for ${series}, using simulation:`, err)
        if (cancelled) return
        const track = getTrackForCircuit(circuitName, series)
        const fallbackDrivers = driverStandings ? driverStandings.map(d => ({
          code: d.code || d.lastName.substring(0,3).toUpperCase(),
          name: d.firstName + ' ' + d.lastName,
          number: parseInt(d.driverNumber) || 0,
          team: d.constructorName,
          color: getDriverColor(series, d.code) || '#ffffff'
        })) : (SERIES_DRIVERS[series] || SERIES_DRIVERS['f1'])

        const simData = await generateReplayDataAsync(series, track, fallbackDrivers, sessionType)
        if (cancelled) return
        setReplayData(simData)
        setDataSource('simulation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [series, round, sessionKey, circuitName, country, driverStandings])

  // ── Playback state handler ─────────────────────────────────────
  const handlePlaybackChange = useCallback((partial: Partial<PlaybackState>) => {
    setPlayback(prev => ({ ...prev, ...partial }))
  }, [])

  const handleDriverSelect = useCallback((codes: string[]) => {
    setPlayback(prev => ({ ...prev, selectedDrivers: codes }))
  }, [])

  // Reset frame index when replay data changes (e.g., switching circuits/sessions)
  // to prevent the scrubber from being stuck at a stale position.
  useEffect(() => {
    if (replayData) {
      setPlayback(prev => ({ ...prev, frameIndex: 0, isPlaying: false }))
    }
  }, [replayData])

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
