'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { BarChart3 } from 'lucide-react'

interface LiveStandingsProps {
  series: string
}

interface RaceData {
  driver_id: string
  position: number
  gap_to_leader: string
  last_lap: string
  tire_compound: string
  drivers?: {
    name: string
    series_id?: string
  }
}

export default function LiveStandings({ series }: LiveStandingsProps) {
  const [raceData, setRaceData] = useState<RaceData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRaceData()

    const channel = supabase
      .channel(`live-race-data-${series}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mock_live_race_data',
        },
        () => {
          fetchRaceData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series])

  const fetchRaceData = async () => {
    try {
      const { data, error } = await supabase
        .from('mock_live_race_data')
        .select('*, drivers(name, series_id)')
        .order('position', { ascending: true })

      if (error) throw error

      // Filter by series
      const filtered = (data || []).filter(
        (d: RaceData) => d.drivers?.series_id === series
      )
      setRaceData(filtered)
    } catch (error) {
      console.error('Error fetching race data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTireColor = (compound: string) => {
    switch (compound?.toLowerCase()) {
      case 'soft': return { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.2)' }
      case 'medium': return { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' }
      case 'hard': return { bg: 'rgba(255,255,255,0.08)', text: '#e2e8f0', border: 'rgba(255,255,255,0.15)' }
      case 'intermediate': return { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.2)' }
      case 'wet': return { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' }
      default: return { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'rgba(255,255,255,0.1)' }
    }
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
        marginBottom: '20px',
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
            background: 'rgba(16,185,129,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
          }}>
            <BarChart3 size={16} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Live Timing</h2>
        </div>

        {raceData.length > 0 && (
          <div className="live-badge">
            <div className="live-dot" />
            LIVE
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{
              height: '44px',
              borderRadius: 'var(--radius-sm)',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            textAlign: 'left',
            borderCollapse: 'collapse',
            tableLayout: 'auto',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Pos', 'Driver', 'Gap', 'Last Lap', 'Tire'].map((header) => (
                  <th key={header} style={{
                    padding: '0 12px 12px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raceData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: '40px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}>
                    Waiting for race session data...
                  </td>
                </tr>
              ) : (
                raceData.map((entry) => {
                  const tireColor = getTireColor(entry.tire_compound)
                  return (
                    <tr key={entry.driver_id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.2s',
                      cursor: 'default',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '14px',
                          color: entry.position <= 3 ? '#fbbf24' : 'var(--text-primary)',
                        }}>
                          {entry.position}
                        </span>
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.drivers?.name || 'Unknown'}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        {entry.gap_to_leader}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        {entry.last_lap}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: tireColor.bg,
                          color: tireColor.text,
                          border: `1px solid ${tireColor.border}`,
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {entry.tire_compound}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
