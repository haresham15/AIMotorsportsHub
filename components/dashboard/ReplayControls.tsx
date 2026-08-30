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
    <div className="replay-controls">
      {/* Left: time display */}
      <div className="replay-controls__time">
        <span className="replay-controls__current">{fmtTime(currentTime)}</span>
        <span className="replay-controls__separator">/</span>
        <span className="replay-controls__total">{fmtTime(totalTime)}</span>
      </div>

      {/* Center: transport buttons */}
      <div className="replay-controls__transport">
        <button
          className="replay-controls__btn"
          title="Restart (R)"
          onClick={() => onChange({ frameIndex: 0, isPlaying: true })}
        >
          <RotateCcw size={14} />
        </button>

        <button
          className="replay-controls__btn"
          title="Rewind 10s (←)"
          onClick={() => onChange({ frameIndex: Math.max(0, playback.frameIndex - REPLAY_FPS * 10) })}
        >
          <SkipBack size={16} />
        </button>

        <button
          className="replay-controls__btn replay-controls__btn--play"
          title="Play/Pause (Space)"
          onClick={() => onChange({ isPlaying: !playback.isPlaying })}
        >
          {playback.isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          className="replay-controls__btn"
          title="Forward 10s (→)"
          onClick={() => onChange({ frameIndex: Math.min(maxFrameIndex, playback.frameIndex + REPLAY_FPS * 10) })}
        >
          <SkipForward size={16} />
        </button>

        {/* Speed selector */}
        <div className="replay-controls__speed">
          <Gauge size={12} />
          <select
            value={playback.speed}
            onChange={e => onChange({ speed: parseFloat(e.target.value) })}
            className="replay-controls__speed-select"
          >
            {PLAYBACK_SPEEDS.map(s => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: toggles */}
      <div className="replay-controls__toggles">
        <button
          className={`replay-controls__toggle ${playback.showDriverLabels ? 'active' : ''}`}
          title="Toggle driver labels (L)"
          onClick={() => onChange({ showDriverLabels: !playback.showDriverLabels })}
        >
          <Tag size={13} />
        </button>
        <button
          className={`replay-controls__toggle ${playback.showDrsZones ? 'active' : ''}`}
          title="Toggle DRS zones (D)"
          onClick={() => onChange({ showDrsZones: !playback.showDrsZones })}
        >
          <Eye size={13} />
        </button>
      </div>

      {/* Scrubber bar (full width below) */}
      <div className="replay-controls__scrubber">
        <input
          type="range"
          min="0"
          max="1"
          step="0.0001"
          value={progress}
          onChange={handleScrub}
          className="replay-controls__range"
        />
        <div className="replay-controls__progress" style={{ width: `${progress * 100}%` }} />

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
              className="replay-controls__marker"
              style={{ left: `${left}%`, width: `${Math.max(0.3, width)}%`, background: color }}
            />
          )
        })}
      </div>

      {/* Lap indicator */}
      <div className="replay-controls__lap">
        LAP {currentFrame?.lap ?? 1} / {data.totalLaps}
      </div>
    </div>
  )
}
