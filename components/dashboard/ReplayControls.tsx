'use client'

import { useState, useEffect } from 'react'
import { PLAYBACK_SPEEDS, REPLAY_FPS } from '@/lib/replayTypes'
import type { PlaybackState, ReplayData } from '@/lib/replayTypes'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, Tag, Eye, ListOrdered, Maximize2, Minimize2 } from 'lucide-react'

interface Props {
  playback: PlaybackState
  data: ReplayData
  onChange: (p: Partial<PlaybackState>) => void
  isLiveSession?: boolean
  isBehindLive?: boolean
  liveLagSeconds?: number
  liveEdgeTime?: number
  onSyncToLive?: () => void
  isRaceDone?: boolean
}

export default function ReplayControls({
  playback,
  data,
  onChange,
  isLiveSession = false,
  isBehindLive = false,
  liveLagSeconds = 0,
  liveEdgeTime,
  onSyncToLive,
  isRaceDone = false,
}: Props) {

  const totalFrames = data.frames.length
  const maxFrameIndex = Math.max(0, totalFrames - 1)
  const progress = totalFrames > 0 ? playback.frameIndex / totalFrames : 0
  const currentFrame = data.frames[Math.min(Math.floor(playback.frameIndex), maxFrameIndex)]
  const currentTime = currentFrame?.t ?? 0
  const totalTime = data.frames[totalFrames - 1]?.t ?? 0

  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    onChange({ frameIndex: Math.min(v * totalFrames, maxFrameIndex), isPlaying: false, isLiveMode: false })
  }

  const toggleFullscreen = () => {
    const wrapper = document.querySelector('.replay-wrapper')
    if (!wrapper) return
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  return (
    <div className="w-full bg-[#0b0e13] border-t border-white/20 flex flex-col shrink-0 z-20">
      {/* ── Top Scrubber Bar ────────────────────────────────────────── */}
      <div className="relative h-2.5 w-full bg-[#1c1f26] group cursor-pointer border-b border-white/20">
        <input
          type="range"
          min="0"
          max="1"
          step="0.0001"
          value={progress}
          onChange={handleScrub}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          aria-label="Replay Timeline Scrubber"
        />

        {/* Progress Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 via-[var(--amber)] to-amber-300 z-10 pointer-events-none transition-all"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Scrubbing Thumb */}
        <div 
          className="absolute top-0 bottom-0 -ml-[1px] w-[2px] bg-white opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" 
          style={{ left: `${progress * 100}%` }} 
        />

        {/* Live Edge Line Indicator */}
        {isLiveSession && !isRaceDone && liveEdgeTime !== undefined && totalTime > 0 && (
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-emerald-400 z-15 pointer-events-none"
            style={{ left: `${Math.min(100, (liveEdgeTime / totalTime) * 100)}%` }}
            title={`Live Race Edge (${fmtTime(liveEdgeTime)})`}
          />
        )}


        {/* Track Status Periods (Safety Car / Yellow / Red Zones) */}
        {data.trackStatuses.map((ts, i) => {
          if (!ts.endTime || totalTime <= 0) return null
          const left = (ts.startTime / totalTime) * 100
          const width = ((ts.endTime - ts.startTime) / totalTime) * 100
          const color = ts.status === '4' ? '#f97316' : ts.status === '2' ? '#eab308' : ts.status === '5' ? '#ef4444' : 'transparent'
          if (color === 'transparent') return null
          return (
            <div
              key={i}
              className="absolute top-0 h-full z-0 pointer-events-none opacity-70"
              style={{ left: `${left}%`, width: `${Math.max(0.4, width)}%`, background: color }}
              title={`Track Condition Flag (${ts.status === '4' ? 'Safety Car' : ts.status === '2' ? 'Yellow Flag' : 'Red Flag'})`}
            />
          )
        })}
      </div>

      {/* ── Transport Deck ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-3">
        {/* Left: Series-Aware Lap & Time Readout */}
        {(() => {
          const seriesId = data.sessionInfo?.seriesId || 'f1';
          const isTopFuel = seriesId === 'top-fuel' || data.trackGeometry?.type === 'drag';
          const isWec = seriesId === 'wec' || seriesId === 'gt-world-challenge';
          const isNascar = seriesId === 'nascar' || seriesId?.startsWith('nascar-');
          const isFormulaE = seriesId === 'formula-e';

          const leaderDriver = currentFrame ? Object.values(currentFrame.drivers).find(d => d.position === 1) : null;

          if (isTopFuel) {
            return (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-amber-500/40 text-xs font-mono font-bold text-amber-300 rounded-none">
                  <span className="text-[10px] text-amber-400 uppercase font-black">1,000 FT</span>
                  <span className="text-white/40">|</span>
                  <span>PASS 1/1</span>
                </div>
                <div className="font-mono text-xs font-semibold flex items-center gap-1 text-[var(--text-muted)]">
                  <span className="text-white font-bold">{currentTime.toFixed(3)}s</span>
                  <span>/</span>
                  <span>{totalTime.toFixed(3)}s ET</span>
                </div>
              </div>
            );
          }

          if (isNascar) {
            const stageNum = leaderDriver?.stageNumber || 1;
            const stageName = stageNum === 3 ? 'FINAL' : `STG ${stageNum}`;
            const toGo = leaderDriver?.stageLapsToGo;
            return (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-white/20 text-xs font-mono font-bold text-white rounded-none">
                  <span className="text-[10px] text-[var(--amber)] uppercase">{stageName}</span>
                  <span className="text-white/20">•</span>
                  <span>L{currentFrame?.lap ?? 1}/{data.totalLaps}</span>
                  {toGo !== undefined && (
                    <span className="text-[10px] text-amber-300 font-normal">({toGo} to go)</span>
                  )}
                </div>
                <div className="font-mono text-xs font-semibold flex items-center gap-1 text-[var(--text-muted)]">
                  <span className="text-white font-bold">{fmtTime(currentTime)}</span>
                  <span>/</span>
                  <span>{fmtTime(totalTime)}</span>
                </div>
              </div>
            );
          }

          if (isWec) {
            const durationSec = data.sessionInfo?.eventName?.includes('24') ? 24 * 3600 : 6 * 3600;
            const remSec = Math.max(0, durationSec - currentTime);
            return (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-white/20 text-xs font-mono font-bold text-white rounded-none">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">STINT {leaderDriver?.stintNumber || 1}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-[var(--amber)]">L{currentFrame?.lap ?? 1}</span>
                  <span className="text-[var(--text-muted)]">/</span>
                  <span>{data.totalLaps}</span>
                </div>
                <div className="font-mono text-xs font-semibold flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="text-white font-bold">{fmtTime(currentTime)}</span>
                  <span>/</span>
                  <span>{fmtTime(totalTime)}</span>
                  <span className="hidden sm:inline text-amber-300 text-[11px]">(REM: {fmtTime(remSec)})</span>
                </div>
              </div>
            );
          }

          if (isFormulaE) {
            return (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-white/20 text-xs font-mono font-bold text-white rounded-none">
                  <span className="text-[10px] text-sky-400 uppercase font-black">E-PRIX</span>
                  <span className="text-white/20">•</span>
                  <span className="text-[var(--amber)]">{currentFrame?.lap ?? 1}</span>
                  <span className="text-[var(--text-muted)]">/</span>
                  <span>{data.totalLaps}</span>
                </div>
                <div className="font-mono text-xs font-semibold flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="text-white font-bold">{fmtTime(currentTime)}</span>
                  <span>/</span>
                  <span>{fmtTime(totalTime)}</span>
                  {leaderDriver?.energyPct !== undefined && (
                    <span className="text-sky-400 text-[11px] font-bold">⚡ {leaderDriver.energyPct.toFixed(1)}%</span>
                  )}
                </div>
              </div>
            );
          }

          // F1 & Standard circuit
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-white/20 text-xs font-mono font-bold text-white rounded-none">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">LAP</span>
                <span className="text-[var(--amber)]">{currentFrame?.lap ?? 1}</span>
                <span className="text-[var(--text-muted)]">/</span>
                <span>{data.totalLaps}</span>
              </div>

              <div className="font-mono text-xs font-semibold flex items-center gap-1 text-[var(--text-muted)]">
                <span className="text-white font-bold">{fmtTime(currentTime)}</span>
                <span>/</span>
                <span>{fmtTime(totalTime)}</span>
              </div>
            </div>
          );
        })()}

        {/* Center: Playback Controls */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {/* Jump to start */}
          <button
            className="flex items-center justify-center w-8 h-8 text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer rounded-none"
            title="Restart to beginning (R)"
            onClick={() => onChange({ frameIndex: 0, isPlaying: true, isLiveMode: false })}
          >
            <RotateCcw size={14} />
          </button>

          {/* Rewind 10s */}
          <button
            className="flex items-center justify-center w-8 h-8 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer rounded-none"
            title="Rewind 10s (←)"
            onClick={() => onChange({ frameIndex: Math.max(0, playback.frameIndex - REPLAY_FPS * 10), isLiveMode: false })}
          >
            <SkipBack size={16} />
          </button>

          {/* Live / Sync to Live Button (only active during live session before race finishes) */}
          {isLiveSession && !isRaceDone && (
            <button
              onClick={() => {
                if (onSyncToLive) {
                  onSyncToLive()
                } else {
                  onChange({ frameIndex: maxFrameIndex, isPlaying: true, speed: 1, isLiveMode: true })
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer border rounded-none ${
                !isBehindLive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              }`}
              title={
                isBehindLive
                  ? `Behind live by ${fmtTime(liveLagSeconds)}. Click to sync to live.`
                  : 'Synchronized with live race time'
              }
            >
              <span className={`w-2 h-2 ${
                !isBehindLive
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`} />
              <span>
                {isBehindLive ? `-${fmtTime(liveLagSeconds)} SYNC` : 'LIVE'}
              </span>
            </button>
          )}


          {/* Play / Pause */}
          <button
            className="flex items-center justify-center w-10 h-10 bg-[var(--amber)] hover:bg-amber-300 text-black font-extrabold transition-all cursor-pointer rounded-none"
            title="Play / Pause (Space)"
            onClick={() => onChange({ isPlaying: !playback.isPlaying })}
          >
            {playback.isPlaying ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-0.5" />}
          </button>

          {/* Skip Forward 10s */}
          <button
            className="flex items-center justify-center w-8 h-8 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer rounded-none"
            title="Skip forward 10s (→)"
            onClick={() => onChange({ frameIndex: Math.min(maxFrameIndex, playback.frameIndex + REPLAY_FPS * 10) })}
          >
            <SkipForward size={16} />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-1 px-2 py-1 bg-transparent border border-white/20 rounded-none">
            <Gauge size={12} className="text-[var(--text-muted)]" />
            <select
              value={playback.speed}
              onChange={e => onChange({ speed: parseFloat(e.target.value) })}
              className="bg-transparent text-xs font-mono font-bold text-white outline-none cursor-pointer"
              aria-label="Playback Speed"
            >
              {PLAYBACK_SPEEDS.map(s => (
                <option key={s} value={s} className="bg-[var(--bg-card)] text-white">{s}x</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View & Overlay Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Driver Labels Toggle */}
          <button
            onClick={() => onChange({ showDriverLabels: !playback.showDriverLabels })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold transition-all cursor-pointer border rounded-none ${
              playback.showDriverLabels
                ? 'bg-[var(--amber)]/15 border-[var(--amber)]/40 text-[var(--amber)]'
                : 'bg-transparent border-white/20 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Driver Code Labels (L)"
          >
            <Tag size={12} />
            <span className="hidden md:inline">Labels</span>
          </button>

          {/* DRS Zones Toggle */}
          <button
            onClick={() => onChange({ showDrsZones: !playback.showDrsZones })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold transition-all cursor-pointer border rounded-none ${
              playback.showDrsZones
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-transparent border-white/20 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle DRS Zones (D)"
          >
            <Eye size={12} />
            <span className="hidden md:inline">DRS</span>
          </button>

          {/* Leaderboard Dock Toggle */}
          <button
            onClick={() => onChange({ showLeaderboard: !playback.showLeaderboard })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold transition-all cursor-pointer border rounded-none ${
              playback.showLeaderboard
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-transparent border-white/20 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Standings Dock"
          >
            <ListOrdered size={12} />
            <span className="hidden md:inline">Standings</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 bg-transparent border border-white/20 text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer rounded-none"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
