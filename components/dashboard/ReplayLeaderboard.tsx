'use client'

import { useMemo } from 'react'
import type { ReplayData, RaceFrame } from '@/lib/replayTypes'
import { TYRE_COMPOUNDS, calculateReplayGap } from '@/lib/replayTypes'
import { X, Trophy } from 'lucide-react'

interface Props {
  data: ReplayData
  frame: RaceFrame | null
  selectedDrivers: string[]
  onSelect: (codes: string[]) => void
  onClose?: () => void
}

export default function ReplayLeaderboard({ data, frame, selectedDrivers, onSelect, onClose }: Props) {
  const sorted = useMemo(() => {
    if (!frame) return []
    return Object.entries(frame.drivers)
      .sort(([, a], [, b]) => a.position - b.position)
  }, [frame])

  if (!frame) return null

  const leaderDist = sorted[0]?.[1]?.dist ?? 0
  const leaderLap = sorted[0]?.[1]?.lap ?? 1
  const leaderRelDist = sorted[0]?.[1]?.relDist ?? 0
  const leaderCode = sorted[0]?.[0] ?? '--'

  const seriesId = data.sessionInfo?.seriesId || 'f1';
  const isTopFuel = seriesId === 'top-fuel' || data.trackGeometry?.type === 'drag';
  const isNascar = seriesId === 'nascar' || seriesId?.startsWith('nascar-');
  const isWec = seriesId === 'wec' || seriesId === 'gt-world-challenge';
  const isFormulaE = seriesId === 'formula-e';
  const isMph = isTopFuel || isNascar;

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
    <div className="h-full w-full flex flex-col overflow-hidden select-none">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-[var(--amber)]" />
          <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
            {isTopFuel ? 'ELIMINATIONS' : isWec ? 'WEC STANDINGS' : isNascar ? 'CUP STANDINGS' : 'STANDINGS'}
          </span>
          <span className="text-[10px] font-bold text-[var(--amber)] font-mono bg-[var(--amber)]/10 px-1.5 py-0.2 rounded border border-[var(--amber)]/25">
            P1 {leaderCode}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Collapse Standings Dock"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Driver Table ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/[0.04]">
        {sorted.map(([code, d]) => {
          const color = data.driverColors[code] || 'var(--color-amber)'
          const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM']
          const isSelected = selectedDrivers.includes(code)

          const gap = calculateReplayGap(
            d.position,
            d.dist,
            d.lap,
            d.relDist,
            leaderDist,
            leaderLap,
            leaderRelDist
          )

          const displaySpeed = isMph ? Math.round(d.speed * 0.621371) : d.speed;

          // Series-specific gap / status text
          let statusText = gap;
          if (isTopFuel) {
            if (d.finished) {
              statusText = d.position === 1 ? 'WINNER' : d.elapsedTime ? `+${(d.elapsedTime - (sorted[0][1].elapsedTime || d.elapsedTime)).toFixed(3)}s` : 'RUNNER-UP';
            } else if (d.elapsedTime !== undefined) {
              statusText = `${d.elapsedTime.toFixed(3)}s ET`;
            } else {
              statusText = `+${(d.reactionTime ?? 0.038).toFixed(3)}s RT`;
            }
          }

          return (
            <div
              key={code}
              className={`row-interactive flex items-center h-8 px-2.5 cursor-pointer hover:bg-white/5 transition-all duration-150 group text-xs
                ${isSelected ? 'bg-white/10 !border-l-2 !border-l-[var(--amber)] shadow-inner' : 'border-l-2 border-l-transparent'}
                ${d.inPit ? 'opacity-70 bg-amber-500/5' : ''}
                ${d.retired ? 'opacity-35 grayscale' : ''}
              `}
              onClick={e => handleClick(code, e)}
              title={`${code} • P${d.position} • Click to focus telemetry (Shift-click for multi)`}
            >
              {/* Position */}
              <span className={`w-5 font-mono font-bold text-[10px] ${
                d.position === 1 ? 'text-[var(--amber)]' : d.position <= 3 ? 'text-white' : 'text-[var(--text-muted)]'
              }`}>
                {isWec && d.carClass && d.classPosition ? `${d.carClass === 'HYPERCAR' ? 'H' : 'G'}${d.classPosition}` : d.position}
              </span>

              {/* Team Color Bar */}
              <span className="w-1 h-4 rounded-full mr-1.5 shrink-0" style={{ background: color }} />

              {/* Driver Code */}
              <span className="w-8 font-black font-mono text-white tracking-wider text-[11px]">{code}</span>

              {/* Multiclass Pill (WEC) */}
              {isWec && d.carClass && (
                <span className={`text-[7px] font-black font-mono px-1 py-0.2 mr-1 rounded ${
                  d.carClass === 'HYPERCAR' ? 'bg-red-500/25 text-red-300 border border-red-500/40' : 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                }`}>
                  {d.carClass === 'HYPERCAR' ? 'HYP' : 'GT3'}
                </span>
              )}

              {/* Tyre Pill */}
              {!isTopFuel && (
                <span 
                  className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-black text-black ml-0.5 shrink-0" 
                  style={{ background: tyreInfo.color }} 
                  title={`${tyreInfo.label} (${d.tyreLife} laps)`}
                >
                  {tyreInfo.abbr}
                </span>
              )}

              {/* Formula E Attack Mode Badge */}
              {isFormulaE && d.attackMode && (
                <span className="ml-1 text-[8px] font-black text-cyan-300 bg-cyan-500/25 px-1 py-0.2 rounded border border-cyan-400/50">
                  ⚡ ATK
                </span>
              )}

              {/* Top Fuel Chute Badge */}
              {isTopFuel && d.chuteDeployed && (
                <span className="ml-1 text-[8px] font-black text-amber-400 bg-amber-500/25 px-1 py-0.2 rounded border border-amber-500/40 animate-pulse">
                  CHUTE
                </span>
              )}

              {/* DRS indicator (F1/F2/F3) */}
              {d.drs >= 10 && ['f1', 'f2', 'f3'].includes(seriesId) && (
                <span className="ml-1 text-[8px] font-black text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/40">
                  DRS
                </span>
              )}

              {/* Status / Gap */}
              <span className="ml-auto font-mono font-semibold text-[var(--text-secondary)] text-[10px]">
                {d.inPit ? (
                  <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded text-[9px]">PIT</span>
                ) : d.retired ? (
                  <span className="text-red-400 font-bold bg-red-500/15 border border-red-500/30 px-1.5 py-0.2 rounded text-[9px]">OUT</span>
                ) : d.finished && d.position === 1 ? (
                  <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded text-[9px]">WINNER</span>
                ) : (
                  statusText
                )}
              </span>

              {/* Speed in mph or km/h */}
              <span className="w-8 ml-1.5 font-mono font-semibold text-right text-[10px] text-[var(--text-muted)] group-hover:text-white transition-colors" title={`${displaySpeed} ${isMph ? 'mph' : 'km/h'}`}>
                {displaySpeed}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
