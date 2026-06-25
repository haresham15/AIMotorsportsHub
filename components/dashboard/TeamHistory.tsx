'use client'

import { useState } from 'react'
import { TEAM_HISTORY, SERIES_MAP } from '@/lib/data'
import { Trophy, ChevronDown, ChevronUp, Medal } from 'lucide-react'

interface TeamHistoryProps {
  series: string
}

export default function TeamHistory({ series }: TeamHistoryProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const teams = TEAM_HISTORY[series] || []
  const seriesInfo = SERIES_MAP[series]

  if (teams.length === 0) {
    return null
  }

  return (
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245,158,11,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fbbf24',
        }}>
          <Trophy size={16} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Team Heritage</h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            Legendary teams in {seriesInfo?.name || series}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {teams.map((team) => {
          const isExpanded = expandedTeam === team.name

          return (
            <div key={team.name} style={{
              background: isExpanded
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isExpanded ? 'var(--border-hover)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}>
              {/* Team Header — Clickable */}
              <button
                onClick={() => setExpandedTeam(isExpanded ? null : team.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background: seriesInfo?.gradient || 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}>
                      {team.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '2px',
                    }}>
                      <span>{team.country}</span>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <span>Est. {team.founded}</span>
                    </div>
                  </div>
                </div>

                <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="animate-fade-in" style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    margin: '16px 0',
                  }}>
                    {team.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <Medal size={10} /> Key Achievements
                    </div>
                    {team.achievements.map((ach, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}>
                        <div style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: seriesInfo?.color || 'var(--accent-blue)',
                          marginTop: '6px',
                          flexShrink: 0,
                        }} />
                        {ach}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
