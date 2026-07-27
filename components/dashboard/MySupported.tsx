'use client'

import { useState } from 'react'
import { Star, UserPlus } from 'lucide-react'

interface MySupportedProps {
  series: string
}

interface FollowedDriver {
  driver_id: string
  drivers: {
    name: string
    team_id: string
    teams?: {
      name: string
    }
  }
}

const MOCK_FOLLOWED = [
  {
    driver_id: 'd1',
    drivers: {
      name: 'Max Verstappen',
      team_id: 't1',
      teams: { name: 'Red Bull Racing' }
    }
  },
  {
    driver_id: 'd2',
    drivers: {
      name: 'Lando Norris',
      team_id: 't2',
      teams: { name: 'McLaren' }
    }
  }
]

export default function MySupported({ series }: MySupportedProps) {
  // Using mock data for portfolio showcase
  const [followed] = useState<FollowedDriver[]>(series === 'f1' ? MOCK_FOLLOWED : [])
  const loading = false

  if (loading) {
    return (
      <div className="glass" style={{
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <Star size={16} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: '16px', fontWeight: 700 }}>My Supported</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(251,191,36,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
          }}>
            <Star size={16} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>My Supported</h2>
        </div>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {followed.length} following
        </span>
      </div>

      {followed.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
        }}>
          <UserPlus size={28} style={{
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }} />
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            lineHeight: 1.5,
          }}>
            No drivers followed yet for this series.
          </p>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
            marginTop: '4px',
            opacity: 0.7,
          }}>
            Follow drivers via the database to see them here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {followed.map((item, index) => (
            <div key={item.driver_id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              cursor: 'default',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.borderColor = 'var(--border-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: `linear-gradient(135deg, hsl(${(index * 60) % 360}, 70%, 50%), hsl(${(index * 60 + 30) % 360}, 70%, 60%))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'white',
                }}>
                  {item.drivers.name.charAt(0)}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {item.drivers.name}
                  </div>
                  {item.drivers.teams && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginTop: '2px',
                    }}>
                      {item.drivers.teams.name}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                textAlign: 'right',
              }}>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>POS</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#60a5fa',
                  fontFamily: 'var(--font-mono)',
                }}>P{index + 1}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
