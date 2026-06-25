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
  if (!frame) return null

  const sorted = useMemo(() => {
    return Object.entries(frame.drivers)
      .sort(([, a], [, b]) => a.position - b.position)
  }, [frame])

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
    <div className="replay-leaderboard">
      <div className="replay-leaderboard__header">
        <span className="replay-leaderboard__title">STANDINGS</span>
        <span className="replay-leaderboard__subtitle">
          LAP {frame.lap}/{data.totalLaps}
        </span>
      </div>

      <div className="replay-leaderboard__list">
        {sorted.map(([code, d]) => {
          const driver = data.drivers.find(dr => dr.code === code)
          const color = data.driverColors[code] || '#3b82f6'
          const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM']
          const isSelected = selectedDrivers.includes(code)
          const gap = d.position === 1
            ? 'LEADER'
            : `+${((leaderDist - d.dist) / 10).toFixed(1)}s`

          return (
            <div
              key={code}
              className={`replay-leaderboard__entry ${isSelected ? 'replay-leaderboard__entry--selected' : ''} ${d.inPit ? 'replay-leaderboard__entry--pit' : ''} ${d.retired ? 'replay-leaderboard__entry--retired' : ''}`}
              onClick={e => handleClick(code, e)}
              style={{ '--driver-color': color } as React.CSSProperties}
            >
              {/* Position */}
              <span className="replay-leaderboard__pos">{d.position}</span>

              {/* Color bar */}
              <span className="replay-leaderboard__color-bar" style={{ background: color }} />

              {/* Driver code */}
              <span className="replay-leaderboard__code">{code}</span>

              {/* Tyre indicator */}
              <span className="replay-leaderboard__tyre" style={{ background: tyreInfo.color }} title={`${tyreInfo.label} (${d.tyreLife} laps)`}>
                {tyreInfo.abbr}
              </span>

              {/* DRS */}
              {d.drs >= 10 && (
                <span className="replay-leaderboard__drs">DRS</span>
              )}

              {/* Status / Gap */}
              <span className="replay-leaderboard__gap">
                {d.inPit ? (
                  <span className="replay-leaderboard__pit-badge">PIT</span>
                ) : d.retired ? (
                  <span className="replay-leaderboard__out-badge">FIN</span>
                ) : gap}
              </span>

              {/* Speed */}
              <span className="replay-leaderboard__speed">{d.speed}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
