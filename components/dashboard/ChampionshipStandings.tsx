'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { getDriverColor } from '@/lib/data'

import { DriverStanding, ConstructorStanding } from '@/lib/types'

interface Props {
  drivers?: DriverStanding[]
  constructors?: ConstructorStanding[]
  loading?: boolean
}

export default function ChampionshipStandings({ drivers = [], constructors = [], loading }: Props) {
  const [tab, setTab] = useState<'drivers' | 'constructors'>('drivers')

  if (loading) {
    return (
      <div className="card glass rounded-[var(--radius-xl)] overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between p-6 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] shrink-0">
          <div className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em] flex items-center gap-2 text-white">
            <div className="text-[var(--color-amber)]"><Trophy size={16} /></div>
            Championship Standings
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-2">
          <div className="w-full h-10 bg-[var(--surface-elevated)] animate-pulse rounded-[var(--radius-md)]" />
          <div className="w-full h-10 bg-[var(--surface-elevated)] animate-pulse rounded-[var(--radius-md)]" />
          <div className="w-full h-10 bg-[var(--surface-elevated)] animate-pulse rounded-[var(--radius-md)]" />
        </div>
      </div>
    )
  }

  const safeDrivers = drivers || []
  const safeConstructors = constructors || []
  const maxDriverPoints = safeDrivers[0]?.points || 1
  const maxConstructorPoints = safeConstructors[0]?.points || 1

  return (
    <div className="card glass rounded-[var(--radius-xl)] overflow-hidden flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] shrink-0 gap-4">
        <div className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em] flex items-center gap-2 text-white">
          <div className="text-[var(--color-amber)]"><Trophy size={16} /></div>
          Standings
        </div>
        <div className="flex items-center bg-[var(--bg-card)] p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] self-start sm:self-auto">
          <button 
            className={`px-4 py-1.5 text-sm font-semibold rounded-[var(--radius-sm)] transition-colors ${tab === 'drivers' ? 'bg-[var(--surface-elevated)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
            onClick={() => setTab('drivers')}
          >
            Drivers
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-semibold rounded-[var(--radius-sm)] transition-colors ${tab === 'constructors' ? 'bg-[var(--surface-elevated)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
            onClick={() => setTab('constructors')}
          >
            Constructors
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {tab === 'drivers' && safeDrivers.length === 0 && (
          <div className="py-8 text-center text-[var(--text-muted)] text-sm">
            No driver standings available for this season.
          </div>
        )}
        {tab === 'constructors' && safeConstructors.length === 0 && (
          <div className="py-8 text-center text-[var(--text-muted)] text-sm">
            No constructor standings available for this series.
          </div>
        )}
        {tab === 'drivers' && safeDrivers.map((d, index) => {
          const color = getDriverColor('f1', d.code) || 'var(--text-secondary)'
          const posColor = index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-[var(--text-muted)]'
          
          return (
            <div key={d.driverId} className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-highlight)] transition-colors group">
              <span className={`w-6 text-sm font-bold font-mono text-center ${posColor}`}>{d.position}</span>
              <div className="w-1 h-8 rounded-[var(--radius-sm)] shrink-0" style={{ background: color }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-base font-bold text-white truncate">{d.firstName} {d.lastName}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider truncate">{d.constructorName}</span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono text-lg font-bold text-[var(--color-amber)] group-hover:text-amber-400 transition-colors">{d.points}</span>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">PTS</span>
              </div>
            </div>
          )
        })}

        {tab === 'constructors' && safeConstructors.map((c, index) => {
          const driverOnTeam = safeDrivers.find(d => d.constructorId === c.constructorId)
          const color = driverOnTeam ? getDriverColor('f1', driverOnTeam.code) : 'var(--text-secondary)'
          const posColor = index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-[var(--text-muted)]'
          
          return (
            <div key={c.constructorId} className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] hover:bg-[var(--surface-highlight)] transition-colors group">
              <span className={`w-6 text-sm font-bold font-mono text-center ${posColor}`}>{c.position}</span>
              <div className="w-1 h-8 rounded-[var(--radius-sm)] shrink-0" style={{ background: color }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-base font-bold text-white truncate">{c.constructorName}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider truncate">{c.wins} Wins</span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono text-lg font-bold text-[var(--color-amber)] group-hover:text-amber-400 transition-colors">{c.points}</span>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">PTS</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
