'use client'

import { useState, useEffect } from 'react'
import { PLAYBACK_SPEEDS, REPLAY_FPS } from '@/lib/replayTypes'
import type { PlaybackState, ReplayData } from '@/lib/replayTypes'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, Tag, Eye, ListOrdered, Maximize2, Minimize2 } from 'lucide-react'

interface Props {
  playback: PlaybackState
  data: ReplayData
  onChange: (p: Partial<PlaybackState>) => void
}

export default function ReplayControls({ playback, data, onChange }: Props) {
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
    onChange({ frameIndex: Math.min(v * totalFrames, maxFrameIndex), isPlaying: false })
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
    <div className="w-full bg-[rgba(11,14,19,0.96)] backdrop-blur-xl border-t border-[var(--border-subtle)] flex flex-col shrink-0 z-20">
      {/* ── Top Scrubber Bar ────────────────────────────────────────── */}
      <div className="relative h-2.5 w-full bg-[var(--surface-sunken)] group cursor-pointer border-b border-[var(--border-subtle)]/40 hover:h-3.5 transition-all">
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
          className="absolute top-1/2 -translate-y-1/2 -ml-2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" 
          style={{ left: `${progress * 100}%` }} 
        />

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
        {/* Left: Lap Pill & Time Readout */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono font-bold text-white">
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

        {/* Center: Playback Controls */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {/* Jump to start */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Restart to beginning (R)"
            onClick={() => onChange({ frameIndex: 0, isPlaying: true })}
          >
            <RotateCcw size={14} />
          </button>

          {/* Rewind 10s */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Rewind 10s (←)"
            onClick={() => onChange({ frameIndex: Math.max(0, playback.frameIndex - REPLAY_FPS * 10) })}
          >
            <SkipBack size={16} />
          </button>

          {/* Play / Pause */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--amber)] hover:bg-amber-300 text-black font-extrabold transition-all shadow-[0_0_16px_rgba(255,176,32,0.35)] hover:scale-105 cursor-pointer"
            title="Play / Pause (Space)"
            onClick={() => onChange({ isPlaying: !playback.isPlaying })}
          >
            {playback.isPlaying ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-0.5" />}
          </button>

          {/* Skip Forward 10s */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Skip forward 10s (→)"
            onClick={() => onChange({ frameIndex: Math.min(maxFrameIndex, playback.frameIndex + REPLAY_FPS * 10) })}
          >
            <SkipForward size={16} />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
              playback.showDriverLabels
                ? 'bg-[var(--amber)]/15 border-[var(--amber)]/40 text-[var(--amber)]'
                : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Driver Code Labels (L)"
          >
            <Tag size={12} />
            <span className="hidden md:inline">Labels</span>
          </button>

          {/* DRS Zones Toggle */}
          <button
            onClick={() => onChange({ showDrsZones: !playback.showDrsZones })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
              playback.showDrsZones
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle DRS Zones (D)"
          >
            <Eye size={12} />
            <span className="hidden md:inline">DRS</span>
          </button>

          {/* Leaderboard Dock Toggle */}
          <button
            onClick={() => onChange({ showLeaderboard: !playback.showLeaderboard })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
              playback.showLeaderboard
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Standings Dock"
          >
            <ListOrdered size={12} />
            <span className="hidden md:inline">Standings</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
