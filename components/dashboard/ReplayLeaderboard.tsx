'use client'

import { useMemo } from 'react'
import type { ReplayData, RaceFrame, DriverInfo } from '@/lib/replayTypes'
import { TYRE_COMPOUNDS } from '@/lib/replayTypes'

interface Props {
  data: ReplayData
  frame: RaceFrame | null
  selectedDrivers: string[]
  onSelect: (codes: string[]) => void
}

export default function ReplayLeaderboard({ data, frame, selectedDrivers, onSelect }: Props) {
  const sorted = useMemo(() => {
    if (!frame) return []
    return Object.entries(frame.drivers)
      .sort(([, a], [, b]) => a.position - b.position)
  }, [frame])

  if (!frame) return null

  const leaderDist = sorted[0]?.[1]?.dist ?? 0

  const handleClick = (code: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      const sel = selectedDrivers.includes(code)
        ? selectedDrivers.filter(c => c !== code)
        : [...selectedDrivers, code]
      onSelect(sel)
    } else {
      onSelect(selectedDrivers[0] === code && selectedDrivers.length === 1 ? [] : [code])
    }
  }

  return (
    <div className="card glass absolute top-4 right-4 w-72 max-h-[calc(100vh-2rem)] flex flex-col rounded-[var(--radius-lg)] overflow-hidden z-10 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between p-4 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] shrink-0">
        <span className="text-sm font-extrabold tracking-widest text-white">STANDINGS</span>
        <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface-highlight)] px-2 py-1 rounded-[var(--radius-sm)]">
          LAP {frame.lap}/{data.totalLaps}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {sorted.map(([code, d]) => {
          const driver = data.drivers.find(dr => dr.code === code)
          const color = data.driverColors[code] || 'var(--color-amber)'
          const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM']
          const isSelected = selectedDrivers.includes(code)
          const gap = d.position === 1
            ? 'LEADER'
            : (() => {
                const leaderLap = sorted[0]?.[1]?.lap || 1;
                if (leaderLap - d.lap >= 1) {
                  const lapsBehind = leaderLap - d.lap;
                  return `+${lapsBehind} LAP${lapsBehind > 1 ? 'S' : ''}`;
                }

                const distDelta = leaderDist - d.dist;
                const avgSpeedMs = 200 / 3.6;
                const gapSeconds = distDelta / avgSpeedMs;
                return `+${Math.max(0, gapSeconds).toFixed(1)}s`;
              })()

          return (
            <div
              key={code}
              className={`flex items-center h-10 px-3 cursor-pointer border-b border-[var(--border-subtle)] hover:bg-[var(--surface-highlight)] transition-colors group
                ${isSelected ? 'bg-[var(--surface-elevated)] !border-l-2 !border-l-[var(--color-amber)]' : 'border-l-2 border-l-transparent'}
                ${d.inPit ? 'opacity-70' : ''}
                ${d.retired ? 'opacity-40 grayscale' : ''}
              `}
              onClick={e => handleClick(code, e)}
              style={{ '--driver-color': color } as React.CSSProperties}
            >
              {/* Position */}
              <span className="w-6 text-xs font-bold text-[var(--text-muted)]">{d.position}</span>

              {/* Color bar */}
              <span className="w-1 h-6 rounded-[var(--radius-sm)] mr-3" style={{ background: color }} />

              {/* Driver code */}
              <span className="w-10 text-sm font-bold font-mono text-white tracking-wide">{code}</span>

              {/* Tyre indicator */}
              <span 
                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-black ml-1" 
                style={{ background: tyreInfo.color }} 
                title={`${tyreInfo.label} (${d.tyreLife} laps)`}
              >
                {tyreInfo.abbr}
              </span>

              {/* DRS */}
              {d.drs >= 10 && (
                <span className="ml-2 text-[10px] font-bold text-green-400 bg-green-500/10 px-1 rounded">DRS</span>
              )}

              {/* Status / Gap */}
              <span className="ml-auto text-xs font-mono font-semibold text-[var(--text-secondary)]">
                {d.inPit ? (
                  <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-[var(--radius-sm)]">PIT</span>
                ) : d.retired ? (
                  <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded-[var(--radius-sm)]">FIN</span>
                ) : gap}
              </span>

              {/* Speed */}
              <span className="w-10 ml-3 text-xs font-mono font-bold text-right text-[var(--text-muted)] group-hover:text-white transition-colors">{d.speed}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
