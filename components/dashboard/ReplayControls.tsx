'use client'

import { PLAYBACK_SPEEDS, REPLAY_FPS } from '@/lib/replayTypes'
import type { PlaybackState, ReplayData } from '@/lib/replayTypes'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, Tag, Eye } from 'lucide-react'

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

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    // Show hours only when the race exceeds 60 minutes
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    onChange({ frameIndex: Math.min(v * totalFrames, maxFrameIndex), isPlaying: false })
  }

  return (
    <div className="card glass absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] rounded-[var(--radius-xl)] overflow-hidden z-10 shadow-2xl backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-3 px-5 bg-[var(--bg-card)] shrink-0 gap-4">
        {/* Left: time display */}
        <div className="font-mono text-sm font-bold flex items-center gap-1.5 w-[140px] shrink-0">
          <span className="text-white">{fmtTime(currentTime)}</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-muted)]">{fmtTime(totalTime)}</span>
        </div>

        {/* Center: transport buttons */}
        <div className="flex items-center justify-center gap-2 flex-1">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-highlight)] transition-colors"
            title="Restart (R)"
            onClick={() => onChange({ frameIndex: 0, isPlaying: true })}
          >
            <RotateCcw size={14} />
          </button>

          <button
            className="flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-primary)] hover:text-white hover:bg-[var(--surface-highlight)] transition-colors"
            title="Rewind 10s (←)"
            onClick={() => onChange({ frameIndex: Math.max(0, playback.frameIndex - REPLAY_FPS * 10) })}
          >
            <SkipBack size={16} />
          </button>

          <button
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:scale-105 hover:bg-gray-100 transition-all shadow-md"
            title="Play/Pause (Space)"
            onClick={() => onChange({ isPlaying: !playback.isPlaying })}
          >
            {playback.isPlaying ? <Pause size={20} className="fill-black" /> : <Play size={20} className="fill-black ml-0.5" />}
          </button>

          <button
            className="flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-primary)] hover:text-white hover:bg-[var(--surface-highlight)] transition-colors"
            title="Forward 10s (→)"
            onClick={() => onChange({ frameIndex: Math.min(maxFrameIndex, playback.frameIndex + REPLAY_FPS * 10) })}
          >
            <SkipForward size={16} />
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1.5 bg-[var(--surface-sunken)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
            <Gauge size={12} className="text-[var(--text-muted)]" />
            <select
              value={playback.speed}
              onChange={e => onChange({ speed: parseFloat(e.target.value) })}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              {PLAYBACK_SPEEDS.map(s => (
                <option key={s} value={s} className="bg-[var(--surface-elevated)]">{s}x</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: toggles */}
        <div className="flex items-center gap-1.5 w-[140px] justify-end shrink-0">
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${playback.showDriverLabels ? 'bg-[var(--color-amber)] text-black shadow-[0_0_10px_rgba(255,176,32,0.3)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-highlight)]'}`}
            title="Toggle driver labels (L)"
            onClick={() => onChange({ showDriverLabels: !playback.showDriverLabels })}
          >
            <Tag size={13} />
          </button>
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${playback.showDrsZones ? 'bg-[var(--color-amber)] text-black shadow-[0_0_10px_rgba(255,176,32,0.3)]' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-highlight)]'}`}
            title="Toggle DRS zones (D)"
            onClick={() => onChange({ showDrsZones: !playback.showDrsZones })}
          >
            <Eye size={13} />
          </button>
        </div>
      </div>

      {/* Scrubber bar */}
      <div className="relative h-2 w-full bg-[var(--surface-sunken)] group cursor-pointer border-t border-[var(--border-subtle)]">
        <input
          type="range"
          min="0"
          max="1"
          step="0.0001"
          value={progress}
          onChange={handleScrub}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        {/* Progress fill */}
        <div className="absolute top-0 left-0 h-full bg-[var(--color-amber)] z-10 pointer-events-none group-hover:bg-amber-400 transition-colors" style={{ width: `${progress * 100}%` }} />
        
        {/* Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" 
          style={{ left: `${progress * 100}%` }} 
        />

        {/* Track status markers on scrubber */}
        {data.trackStatuses.map((ts, i) => {
          if (!ts.endTime || totalTime <= 0) return null
          const left = (ts.startTime / totalTime) * 100
          const width = ((ts.endTime - ts.startTime) / totalTime) * 100
          const color = ts.status === '4' ? '#f97316' : ts.status === '2' ? '#eab308' : ts.status === '5' ? '#ef4444' : 'transparent'
          if (color === 'transparent') return null
          return (
            <div
              key={i}
              className="absolute top-0 h-full z-0 pointer-events-none opacity-60"
              style={{ left: `${left}%`, width: `${Math.max(0.3, width)}%`, background: color }}
            />
          )
        })}
      </div>

      {/* Lap indicator */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] border border-[var(--border-subtle)] px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest text-[var(--text-secondary)] shadow-lg backdrop-blur-md">
        LAP <span className="text-white">{currentFrame?.lap ?? 1}</span> / {data.totalLaps}
      </div>
    </div>
  )
}
