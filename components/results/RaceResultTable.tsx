import React from 'react'
import { getDriverColor } from '@/lib/data'

interface RaceResult {
  position: string
  points: string
  Driver: {
    givenName: string
    familyName: string
    code: string
    permanentNumber?: string
    nationality: string
  }
  Constructor: {
    name: string
    nationality: string
  }
  grid: string
  laps: string
  status: string
  Time?: {
    millis: string
    time: string
  }
  FastestLap?: {
    rank: string
    lap: string
    Time: {
      time: string
    }
    AverageSpeed: {
      units: string
      speed: string
    }
  }
}

interface RaceResultTableProps {
  series: string
  results: RaceResult[]
}

export default function RaceResultTable({ series, results }: RaceResultTableProps) {
  return (
    <div className="glass p-6 rounded-[var(--radius-xl)] overflow-x-auto">
      <table className="w-full min-w-[800px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[var(--text-muted)] text-[11px] uppercase tracking-wider text-left">
            <th className="px-4 pb-2 font-medium">Pos</th>
            <th className="px-4 pb-2 font-medium">Driver</th>
            <th className="px-4 pb-2 font-medium">Team</th>
            <th className="px-4 pb-2 font-medium">Grid</th>
            <th className="px-4 pb-2 font-medium">Time/Status</th>
            <th className="px-4 pb-2 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const driverColor = getDriverColor(series, result.Driver.code) || 'var(--text-muted)'
            
            return (
              <tr key={result.position} className="bg-white/5 transition-colors hover:bg-white/10">
                <td className={`p-4 rounded-l-[var(--radius-md)] font-extrabold text-lg font-mono ${
                  result.position === '1' ? 'text-[#fbbf24]' : 
                  result.position === '2' ? 'text-[#e2e8f0]' : 
                  result.position === '3' ? 'text-[#b45309]' : 'text-[var(--text-primary)]'
                }`}>
                  {result.position}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-6 rounded-sm"
                      style={{ background: driverColor }}
                    />
                    <div>
                      <div className="text-[15px] font-semibold">
                        {result.Driver.givenName} <span className="uppercase">{result.Driver.familyName}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {result.Driver.code} {result.Driver.permanentNumber ? `• #${result.Driver.permanentNumber}` : ''} • {result.Driver.nationality}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium">{result.Constructor.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{result.Constructor.nationality}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium font-mono">
                    P{result.grid}
                  </div>
                  {parseInt(result.grid) > parseInt(result.position) && parseInt(result.grid) > 0 && (
                    <div className="text-[11px] text-[var(--green-flag)] mt-0.5 font-semibold">
                      ▲ {parseInt(result.grid) - parseInt(result.position)}
                    </div>
                  )}
                  {parseInt(result.grid) < parseInt(result.position) && parseInt(result.grid) > 0 && (
                    <div className="text-[11px] text-[var(--flag-red)] mt-0.5 font-semibold">
                      ▼ {parseInt(result.position) - parseInt(result.grid)}
                    </div>
                  )}
                </td>
                <td className="p-4 text-sm font-mono">
                  {result.Time ? result.Time.time : result.status}
                  {result.FastestLap?.rank === '1' && (
                    <div className="text-[10px] text-purple-500 mt-1 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-xs">⏱️</span> Fastest Lap
                    </div>
                  )}
                </td>
                <td className={`p-4 rounded-r-[var(--radius-md)] font-bold text-base ${parseInt(result.points) > 0 ? 'text-[var(--green-flag)]' : 'text-[var(--text-muted)]'}`}>
                  {result.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
