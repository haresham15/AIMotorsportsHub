'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Round } from '@/lib/types'
import { findMostRecentSession, isSessionInProgress } from '@/lib/seriesSchedules'

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
      const prevRoundNum = selectedRound - 1
      const prevRound = rounds.find(r => r.round === prevRoundNum)
      const recentSession = findMostRecentSession(prevRound)
      onSelectRound(prevRoundNum)
      onSelectSession(recentSession ? recentSession.key : null)
    }
  }

  const handleNext = () => {
    if (selectedRound < rounds.length) {
      const nextRoundNum = selectedRound + 1
      const nextRound = rounds.find(r => r.round === nextRoundNum)
      const recentSession = findMostRecentSession(nextRound)
      onSelectRound(nextRoundNum)
      onSelectSession(recentSession ? recentSession.key : null)
    }
  }

  if (!rounds || rounds.length === 0) return null

  const formattedDate = (() => {
    if (!current?.date) return null
    const d = new Date(current.date)
    return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })()

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
              {formattedDate && (
                <>
                  <span>|</span>
                  <span>{formattedDate}</span>
                </>
              )}
              {current?.status && (
                <span className={`round-nav__status round-nav__status--${current.status}`}>
                  {current.status}
                </span>
              )}
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
            {current.sessions.map(s => {
              const isLive = isSessionInProgress(s)
              return (
                <button
                  key={s.key}
                  className={`round-nav__session-btn ${selectedSessionKey === s.key ? 'active' : ''} inline-flex items-center gap-1.5`}
                  onClick={() => onSelectSession(s.key)}
                >
                  {isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                  )}
                  <span>{s.name}</span>
                  {isLive && (
                    <span className="text-[9px] font-mono font-black uppercase px-1 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xs leading-none">
                      LIVE
                    </span>
                  )}
                </button>
              )
            })}
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
