'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

import { Round } from '@/lib/types'

interface Props {
  rounds: Round[]
  selectedRound: number
  onSelectRound: (round: number) => void
  selectedSessionKey: number | null
  onSelectSession: (key: number | null) => void
  year: string
  onYearChange: (year: string) => void
}

export default function RoundNavigator({ 
  rounds, 
  selectedRound, 
  onSelectRound,
  selectedSessionKey,
  onSelectSession,
  year,
  onYearChange
}: Props) {
  const current = rounds.find(r => r.round === selectedRound)

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} className="text-muted" />
          <select 
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="2025">2025 Season</option>
            <option value="2024">2024 Season</option>
            <option value="2023">2023 Season</option>
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

        <div style={{ width: '120px' }}></div> {/* Spacer for balance */}
      </div>

      {/* Session Tabs */}
      {current?.sessions && current.sessions.length > 0 ? (
        <div className="round-nav__sessions" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
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
          {current.status === 'completed' && (
            <a 
              href={`/results/f1/${year}/${current.round}`}
              className="btn-ghost"
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View Full Results
              <ChevronRight size={14} />
            </a>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          No session telemetry available for this round yet.
        </div>
      )}
    </div>
  )
}
