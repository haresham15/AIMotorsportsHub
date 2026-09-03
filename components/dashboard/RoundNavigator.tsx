'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Round } from '@/lib/types'

interface Props {
  rounds: Round[]
  series: string
  selectedRound: number
  onSelectRound: (round: number) => void
  selectedSessionKey: number | null
  onSelectSession: (key: number | null) => void
  year: string
  onYearChange: (year: string) => void
  availableYears?: string[]
}

export default function RoundNavigator({ 
  rounds, 
  series,
  selectedRound, 
  onSelectRound,
  selectedSessionKey,
  onSelectSession,
  year,
  onYearChange,
  availableYears
}: Props) {
  const current = rounds.find(r => r.round === selectedRound)
  const years = availableYears?.length ? availableYears : ['2025', '2024', '2023']

  const handlePrev = () => {
    if (selectedRound > 1) {
      onSelectRound(selectedRound - 1)
      onSelectSession(null)
    }
  }

  const handleNext = () => {
    if (selectedRound < rounds.length) {
      onSelectRound(selectedRound + 1)
      onSelectSession(null)
    }
  }

  if (!rounds || rounds.length === 0) return null

  return (
    <div className="round-nav">
      <div className="round-nav__header">
        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--text-muted)]" />
          <select 
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-white/5 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md px-2 py-1 text-xs font-semibold cursor-pointer outline-none focus:border-[var(--accent-blue)]"
          >
            {years.map((seasonYear) => (
              <option key={seasonYear} value={seasonYear}>{seasonYear} Season</option>
            ))}
          </select>
        </div>

        {/* Round Navigation */}
        <div className="round-nav__controls">
          <button 
            className="round-nav__btn" 
            onClick={handlePrev} 
            disabled={selectedRound <= 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="round-nav__info">
            <div className="round-nav__title">Round {current?.round}: {current?.name}</div>
            <div className="round-nav__meta">
              <span>{current?.circuitName} • {current?.country}</span>
              <span>|</span>
              <span>{new Date(current?.date || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <span className={`round-nav__status round-nav__status--${current?.status}`}>
                {current?.status}
              </span>
            </div>
          </div>

          <button 
            className="round-nav__btn" 
            onClick={handleNext} 
            disabled={selectedRound >= rounds.length}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-[120px]"></div> {/* Spacer for balance */}
      </div>

      {/* Session Tabs */}
      {current?.sessions && current.sessions.length > 0 ? (
        <div className="round-nav__sessions relative">
          <div className="flex gap-2 overflow-x-auto">
            {current.sessions.map(s => (
              <button
                key={s.key}
                className={`round-nav__session-btn ${selectedSessionKey === s.key ? 'active' : ''}`}
                onClick={() => onSelectSession(s.key)}
              >
                {s.name}
              </button>
            ))}
          </div>
          {series === 'f1' && current.status === 'completed' && (
            <a 
              href={`/results/${series}/${year}/${current.round}`}
              className="btn-ghost absolute right-0 top-1/2 -translate-y-1/2 text-xs no-underline flex items-center gap-1"
            >
              View Full Results
              <ChevronRight size={14} />
            </a>
          )}
        </div>
      ) : (
        <div className="text-center text-[11px] text-[var(--text-muted)] mt-2">
          No session telemetry available for this round yet.
        </div>
      )}
    </div>
  )
}
