'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import type { ReplayData, PlaybackState, RaceFrame, Point2D, TrackGeometry, DriverInfo } from '@/lib/replayTypes'
import { getTrackForCircuit } from '@/lib/trackData'
import { getDriverColor, SERIES_DRIVERS } from '@/lib/data'
import RaceReplayCanvas from './RaceReplayCanvas'
import ReplayControls from './ReplayControls'
import ReplayLeaderboard from './ReplayLeaderboard'
import DriverTelemetryPanel from './DriverTelemetryPanel'
import DriverProfileModal from './DriverProfileModal'
import TrackDetailsModal from './TrackDetailsModal'
import RaceControlModal from './RaceControlModal'
import { Radio, AlertTriangle, Flag, ListOrdered, Tag, Eye } from 'lucide-react'
import Loader from '@/components/ui/Loader'

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

import { frameToRaceData, findFrameIndexForTime } from '@/lib/replayTypes'
import type { RaceData } from '@/lib/types'

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
  onStandingsChange?: (standings: RaceData[]) => void
  selectedDriverCode?: string | null
  onSelectDriver?: (code: string | null) => void
  isLiveSession?: boolean
  sessionStartTime?: string | null
  roundStatus?: string
}

export default function LiveMap2D({
  series,
  round = 1,
  sessionKey = null,
  sessionType = 'Race',
  circuitName,
  country,
  driverStandings,
  onStandingsChange,
  selectedDriverCode,
  onSelectDriver,
  isLiveSession = false,
  sessionStartTime = null,
  roundStatus,
}: LiveMap2DProps) {
  const [replayData, setReplayData] = useState<ReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'api' | 'simulation' | 'openf1'>('simulation')
  const [inspectDriverCode, setInspectDriverCode] = useState<string | null>(null)
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false)
  const [isRaceControlModalOpen, setIsRaceControlModalOpen] = useState(false)
  const [customTrackName, setCustomTrackName] = useState<string | null>(null)

  const [playback, setPlayback] = useState<PlaybackState>({
    frameIndex: 0,
    isPlaying: false,
    speed: 1,
    selectedDrivers: [],
    showLeaderboard: true,
    showWeather: false,
    showDriverLabels: true,
    showDrsZones: true,
  })

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadData = async () => {
      try {
        const driversList = driverStandings && driverStandings.length > 0 ? driverStandings.map(d => ({
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
        const sessionParam = encodeURIComponent(sessionType?.toLowerCase() || 'race')
        const res = await fetch(`/api/replay/${series}?year=2024&round=${round}&session=${sessionParam}`)
        const json = await res.json()

        if (cancelled) return

        const effectiveCircuitName = customTrackName || circuitName;

        if (json.source === 'simulation' || !json.frames || customTrackName) {
          console.log(`[LiveMap2D] Loading simulation for ${series} on ${effectiveCircuitName}`)
          const track = getTrackForCircuit(effectiveCircuitName, series)
          const simData = await generateReplayDataAsync(series, track, driversList, sessionType)
          if (cancelled) return
          setReplayData(simData)
          setDataSource('simulation')
          if (simData.frames.length > 0) {
            onStandingsChange?.(frameToRaceData(simData.frames[0], simData, series))
          }
        } else {
          console.log(`[LiveMap2D] Loaded API data for ${series}: ${json.frames.length} frames`)
          const track = json.trackGeometry ? { ...getTrackForCircuit(effectiveCircuitName, series), ...json.trackGeometry } : getTrackForCircuit(effectiveCircuitName, series)
          const loadedData = { ...json, trackGeometry: track }
          setReplayData(loadedData)
          setDataSource('api')
          if (loadedData.frames?.length > 0) {
            onStandingsChange?.(frameToRaceData(loadedData.frames[0], loadedData, series))
          }
        }
      } catch (err) {
        const effectiveCircuitName = customTrackName || circuitName;
        console.warn(`[LiveMap2D] Fetch failed for ${series}, using simulation on ${effectiveCircuitName}:`, err)
        if (cancelled) return
        const track = getTrackForCircuit(effectiveCircuitName, series)
        const fallbackDrivers = driverStandings && driverStandings.length > 0 ? driverStandings.map(d => ({
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
        if (simData.frames.length > 0) {
          onStandingsChange?.(frameToRaceData(simData.frames[0], simData, series))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [series, round, sessionKey, circuitName, country, driverStandings, sessionType, customTrackName])

  // ── Playback state handler ─────────────────────────────────────
  const lastSyncTimeRef = useRef(0)
  const lastFrameIdxRef = useRef(-1)

  // Synchronize external selection
  useEffect(() => {
    if (selectedDriverCode !== undefined) {
      setPlayback(prev => ({
        ...prev,
        selectedDrivers: selectedDriverCode ? [selectedDriverCode] : []
      }))
    }
  }, [selectedDriverCode])

  const handlePlaybackChange = useCallback((partial: Partial<PlaybackState>) => {
    setPlayback(prev => ({ ...prev, ...partial }))
  }, [])

  const handleDriverSelect = useCallback((codes: string[]) => {
    setPlayback(prev => ({ ...prev, selectedDrivers: codes }))
    onSelectDriver?.(codes.length === 1 ? codes[0] : null)
  }, [onSelectDriver])

  // Compute live edge time in seconds from session start
  const liveEdgeTimeSec = useMemo(() => {
    if (isLiveSession && sessionStartTime) {
      const startMs = new Date(sessionStartTime).getTime()
      if (!isNaN(startMs)) {
        const nowMs = Date.now()
        return Math.max(0, (nowMs - startMs) / 1000)
      }
    }
    if (!replayData || replayData.frames.length === 0) return 0
    return replayData.frames[replayData.frames.length - 1]?.t ?? 0
  }, [isLiveSession, sessionStartTime, replayData])

  // Set initial frame index and playback state when replay data changes
  useEffect(() => {
    if (!replayData || replayData.frames.length === 0) return

    if (isLiveSession) {
      let targetFrame = 0
      if (sessionStartTime) {
        const startMs = new Date(sessionStartTime).getTime()
        if (!isNaN(startMs)) {
          const nowMs = Date.now()
          const elapsedSec = Math.max(0, (nowMs - startMs) / 1000)
          targetFrame = findFrameIndexForTime(replayData.frames, elapsedSec)
        }
      } else {
        // Session is live without specific timestamp: snap to latest generated frame
        targetFrame = Math.max(0, replayData.frames.length - 1)
      }

      setPlayback(prev => ({
        ...prev,
        frameIndex: targetFrame,
        isPlaying: true, // Auto-play live action
        speed: 1, // Real-time 1x
        isLiveMode: true,
      }))
    } else {
      setPlayback(prev => ({ ...prev, frameIndex: 0, isPlaying: false, isLiveMode: false }))
    }
  }, [replayData, isLiveSession, sessionStartTime])

  // Jump/Sync directly to the current live moment
  const handleSyncToLive = useCallback(() => {
    if (!replayData || replayData.frames.length === 0) return
    const targetIdx = findFrameIndexForTime(replayData.frames, liveEdgeTimeSec)
    setPlayback(prev => ({
      ...prev,
      frameIndex: targetIdx,
      isPlaying: true,
      speed: 1,
      isLiveMode: true,
    }))
  }, [replayData, liveEdgeTimeSec])

  // Continuous wall-clock synchronization while in live mode
  useEffect(() => {
    if (!playback.isLiveMode || !isLiveSession || !sessionStartTime || !replayData || replayData.frames.length === 0) return

    const syncWithWallClock = () => {
      const startMs = new Date(sessionStartTime).getTime()
      if (isNaN(startMs)) return
      const nowMs = Date.now()
      const elapsedSec = Math.max(0, (nowMs - startMs) / 1000)
      const targetIdx = findFrameIndexForTime(replayData.frames, elapsedSec)
      
      // If playback has drifted by more than 2 seconds (50 frames at 25 FPS) from real time
      setPlayback(prev => {
        if (Math.abs(prev.frameIndex - targetIdx) > 50) {
          return { ...prev, frameIndex: targetIdx, isPlaying: true, speed: 1 }
        }
        return prev
      })
    }

    const interval = setInterval(syncWithWallClock, 2000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithWallClock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [playback.isLiveMode, isLiveSession, sessionStartTime, replayData])

  // Poll real-time live standings for live races (F1 & NASCAR)
  useEffect(() => {
    if (!isLiveSession) return
    let isCancelled = false

    const pollLiveData = async () => {
      try {
        if (series === 'f1') {
          const sessionParam = sessionKey || 'latest'
          const res = await fetch(`/api/f1/live?sessionKey=${sessionParam}`)
          if (!res.ok || isCancelled) return
          const liveStandings: RaceData[] = await res.json()
          if (Array.isArray(liveStandings) && liveStandings.length > 0 && !isCancelled) {
            if (playback.isLiveMode && onStandingsChange) {
              onStandingsChange(liveStandings)
            }
          }
        } else if (series === 'nascar' || series.startsWith('nascar-')) {
          const nascarParam = series === 'nascar' ? 'nascar-cup' : series
          const res = await fetch(`/api/nascar/live?series=${encodeURIComponent(nascarParam)}`)
          if (!res.ok || isCancelled) return
          const data = await res.json()
          if (data.standings && Array.isArray(data.standings) && data.standings.length > 0 && !isCancelled) {
            if (playback.isLiveMode && onStandingsChange) {
              onStandingsChange(data.standings)
            }
          }
        }
      } catch (err) {
        console.warn('[LiveMap2D] Live telemetry poll failed:', err)
      }
    }

    const pollInterval = setInterval(pollLiveData, 8000)
    return () => {
      isCancelled = true
      clearInterval(pollInterval)
    }
  }, [isLiveSession, series, sessionKey, playback.isLiveMode, onStandingsChange])

  // Keyboard navigation for playback controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setPlayback(prev => ({ ...prev, frameIndex: Math.max(0, prev.frameIndex - 200) }));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setPlayback(prev => ({
          ...prev,
          frameIndex: prev.frameIndex + 200
        }));
      } else if (e.key === 'l' || e.key === 'L') {
        setPlayback(prev => ({ ...prev, showDriverLabels: !prev.showDriverLabels }));
      } else if (e.key === 's' || e.key === 'S') {
        setPlayback(prev => ({ ...prev, showLeaderboard: !prev.showLeaderboard }));
      } else if (e.key === 'f' || e.key === 'F') {
        const container = document.querySelector('.replay-wrapper');
        if (container) {
          if (!document.fullscreenElement) {
            container.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Current frame ──────────────────────────────────────────────
  const currentFrame: RaceFrame | null = useMemo(() => {
    if (!replayData || replayData.frames.length === 0) return null
    const idx = Math.min(Math.floor(playback.frameIndex), replayData.frames.length - 1)
    return replayData.frames[idx] ?? null
  }, [replayData, playback.frameIndex])

  // Throttle live standings sync to ~10 FPS (100ms) during playback, instant when paused/seeking
  useEffect(() => {
    if (!currentFrame || !replayData || !onStandingsChange) return

    const now = performance.now()
    const frameDiff = Math.abs(playback.frameIndex - lastFrameIdxRef.current)
    const shouldSync = !playback.isPlaying || (now - lastSyncTimeRef.current >= 100) || frameDiff > 5

    if (shouldSync) {
      lastSyncTimeRef.current = now
      lastFrameIdxRef.current = playback.frameIndex
      const synced = frameToRaceData(currentFrame, replayData, series)
      onStandingsChange(synced)
    }
  }, [currentFrame, replayData, onStandingsChange, series, playback.frameIndex, playback.isPlaying])

  const selectedDriver = playback.selectedDrivers.length === 1 ? playback.selectedDrivers[0] : null

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="replay-wrapper flex items-center justify-center min-h-[500px]">
        <Loader text="Initializing Race Replay…" subtext="Loading circuit geometry & telemetry…" />
      </div>
    )
  }

  if (error || !replayData) {
    return (
      <div className="replay-wrapper flex items-center justify-center min-h-[500px]">
        <div className="replay-error text-center p-6">
          <AlertTriangle size={32} className="mx-auto mb-2 text-[var(--flag-red)]" />
          <span className="font-semibold text-sm">{error || 'Failed to load replay data'}</span>
        </div>
      </div>
    )
  }

  // Track status indicator details
  const trackStatus = currentFrame?.trackStatus || '1'
  const flagDetails = (() => {
    switch (trackStatus) {
      case '2':
        return { label: 'YELLOW FLAG', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' }
      case '4':
        return { label: 'SAFETY CAR', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', dot: 'bg-orange-400' }
      case '5':
        return { label: 'RED FLAG', color: 'bg-red-500/20 text-red-300 border-red-500/40', dot: 'bg-red-500' }
      case '6':
        return { label: 'VSC ACTIVE', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', dot: 'bg-yellow-400' }
      default:
        return { label: 'TRACK CLEAR', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' }
    }
  })()

  const currentSec = currentFrame?.t ?? 0
  const isBehindLive = Boolean(isLiveSession && (liveEdgeTimeSec - currentSec > 4))
  const liveLagSeconds = Math.max(0, Math.floor(liveEdgeTimeSec - currentSec))

  const formatLag = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="replay-wrapper">
      {/* ── Header: Paddock Bar ──────────────────────────────────────── */}
      <div className="replay-header">
        <div className="replay-header__left flex items-center gap-3">
          <button
            onClick={() => setIsTrackModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-left transition-all cursor-pointer group"
            title="View Circuit Dossier & Switch Track"
          >
            <Radio size={14} className="replay-header__icon text-[var(--amber)] group-hover:scale-110 transition-transform" />
            <span className="font-mono font-bold text-sm tracking-wide text-white uppercase group-hover:text-amber-300">
              {replayData.sessionInfo.circuitName}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-white/80">
              {replayData.sessionInfo.country} • {replayData.sessionInfo.sessionType}
            </span>
          </button>
        </div>

        {/* Center: Track Condition Flag & Live Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          {isLiveSession && (
            isBehindLive ? (
              <button
                onClick={handleSyncToLive}
                className="px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-amber-500/25 transition-all animate-pulse"
                title="Behind live race time. Click to jump to current live action."
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DVR (-{formatLag(liveLagSeconds)}) • JUMP TO LIVE</span>
              </button>
            ) : (
              <div 
                className="px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                title="Synchronized with exact live race time"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" />
                <span>LIVE FEED</span>
              </div>
            )
          )}

          <button
            onClick={() => setIsRaceControlModalOpen(true)}
            className={`px-3 py-1 rounded-full border text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105 transition-all ${flagDetails.color}`}
            title="View FIA Race Control Directives"
          >
            <span className={`w-2 h-2 rounded-full ${flagDetails.dot} shadow-[0_0_8px_currentColor] live-beacon-active`} />
            <span>{flagDetails.label}</span>
          </button>
        </div>

        {/* Right: Quick Source Tag & Shortcut Hints */}
        <div className="replay-header__right flex items-center gap-3">
          <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
            <kbd className="px-1 py-0.2 bg-black/40 rounded border border-white/10 text-white font-bold">Space</kbd> Play
            <span className="text-white/20">•</span>
            <kbd className="px-1 py-0.2 bg-black/40 rounded border border-white/10 text-white font-bold">S</kbd> Standings
          </span>

          <span className={`replay-header__source replay-header__source--${dataSource}`}>
            {dataSource === 'api' ? 'HISTORICAL TELEMETRY' : dataSource === 'openf1' ? 'REAL CIRCUIT SIM' : 'SIMULATION ENGINE'}
          </span>
        </div>
      </div>

      {/* ── Center Stage: Canvas & Right Dock ────────────────────────── */}
      <div className="replay-body flex-1 relative flex min-h-0 overflow-hidden">
        {/* Canvas Area (100% focused) */}
        <div className="replay-canvas-container flex-1 relative min-w-0 h-full overflow-hidden bg-black/40">
          <RaceReplayCanvas
            data={replayData}
            playback={playback}
            onPlaybackChange={handlePlaybackChange}
            onDriverSelect={handleDriverSelect}
          />

          {/* Compact Driver Telemetry HUD (docked bottom-left when focused) */}
          {selectedDriver && (
            <DriverTelemetryPanel
              data={replayData}
              frame={currentFrame}
              driverCode={selectedDriver}
              onClose={() => handleDriverSelect([])}
              onInspect={(code) => setInspectDriverCode(code)}
            />
          )}

          {/* Collapsed Standings Pill (if user collapsed the right dock) */}
          {!playback.showLeaderboard && (
            <button
              onClick={() => handlePlaybackChange({ showLeaderboard: true })}
              className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black border border-white/10 hover:border-[var(--amber)] text-xs font-mono text-white shadow-xl backdrop-blur-md cursor-pointer transition-all"
              title="Expand Standings Dock (S)"
            >
              <ListOrdered size={14} className="text-[var(--amber)]" />
              <span>Show Standings</span>
            </button>
          )}
        </div>

        {/* Right Dock: Dedicated Leaderboard Sidebar */}
        {playback.showLeaderboard && (
          <aside className="w-68 sm:w-76 h-full border-l border-[var(--border-subtle)] bg-[rgba(11,14,19,0.95)] backdrop-blur-xl flex flex-col shrink-0 z-10 animate-fade-in transition-all">
            <ReplayLeaderboard
              data={replayData}
              frame={currentFrame}
              selectedDrivers={playback.selectedDrivers}
              onSelect={handleDriverSelect}
              onClose={() => handlePlaybackChange({ showLeaderboard: false })}
            />
          </aside>
        )}
      </div>

      {/* ── Bottom Deck: Docked Transport Controls ───────────────────── */}
      <ReplayControls
        playback={playback}
        data={replayData}
        onChange={handlePlaybackChange}
        isLiveSession={isLiveSession}
        isBehindLive={isBehindLive}
        liveLagSeconds={liveLagSeconds}
        liveEdgeTime={liveEdgeTimeSec}
        onSyncToLive={handleSyncToLive}
      />

      {/* ── Specialized Pop-up Modals ───────────────────────────────── */}
      <DriverProfileModal
        driverCode={inspectDriverCode}
        isOpen={!!inspectDriverCode}
        onClose={() => setInspectDriverCode(null)}
        telemetry={
          inspectDriverCode && currentFrame?.drivers[inspectDriverCode]
            ? {
                speed: currentFrame.drivers[inspectDriverCode].speed,
                gear: currentFrame.drivers[inspectDriverCode].gear,
                throttle: currentFrame.drivers[inspectDriverCode].throttle,
                brake: currentFrame.drivers[inspectDriverCode].brake,
                tyre: currentFrame.drivers[inspectDriverCode].tyre,
                tyreLife: currentFrame.drivers[inspectDriverCode].tyreLife,
                drs: currentFrame.drivers[inspectDriverCode].drs >= 10,
                position: currentFrame.drivers[inspectDriverCode].position,
              }
            : undefined
        }
      />

      <TrackDetailsModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        circuitName={replayData.sessionInfo.circuitName}
        country={replayData.sessionInfo.country}
        onSelectTrack={(trackName) => setCustomTrackName(trackName)}
      />

      <RaceControlModal
        isOpen={isRaceControlModalOpen}
        onClose={() => setIsRaceControlModalOpen(false)}
        trackStatus={currentFrame?.trackStatus || '1'}
      />
    </div>
  )
}
