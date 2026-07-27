'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { SERIES, MOCK_NOTIFICATIONS, type NotificationItem } from '@/lib/data'
import { Bell, ChevronRight, Zap, Trophy, Clock, AlertTriangle } from 'lucide-react'

export default function Home() {
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [showNotifications, setShowNotifications] = useState(false)

  const fetchSummaries = useCallback(async () => {
    const summaryPromises = SERIES.map(async (sport) => {
      try {
        const response = await fetch(`/api/ai/summary?series=${sport.id}`)
        const data = await response.json()
        return { id: sport.id, summary: data.summary || 'Loading summary...' }
      } catch {
        return { id: sport.id, summary: 'Unable to load summary at this time.' }
      }
    })

    const results = await Promise.all(summaryPromises)
    const summaryMap: Record<string, string> = {}
    results.forEach(({ id, summary }) => {
      summaryMap[id] = summary
    })
    setSummaries(summaryMap)
  }, [])

  useEffect(() => {
    fetchSummaries()
  }, [fetchSummaries])

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'race': return <Clock size={14} />
      case 'breaking': return <AlertTriangle size={14} />
      case 'result': return <Trophy size={14} />
      case 'schedule': return <Bell size={14} />
    }
  }


  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🏎️</span>
            <h1 className="gradient-text" style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}>
              The Motorsport Hub
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Toggle notifications"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  position: 'relative',
                }}
              >
                <Bell size={18} />
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--accent-red)',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-primary)',
                }} />
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="glass animate-slide-down" style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '360px',
                  borderRadius: 'var(--radius-lg)',
                  padding: '8px',
                  zIndex: 100,
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}>
                  <div style={{
                    padding: '12px 12px 8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Priority Notifications
                  </div>
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <Link
                      key={n.id}
                      href={`/dashboard/${n.series}`}
                      onClick={() => setShowNotifications(false)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background 0.2s',
                        alignItems: 'flex-start',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: n.type === 'breaking'
                          ? 'rgba(239,68,68,0.15)'
                          : n.type === 'race'
                            ? 'rgba(59,130,246,0.15)'
                            : n.type === 'result'
                              ? 'rgba(16,185,129,0.15)'
                              : 'rgba(245,158,11,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: n.type === 'breaking'
                          ? '#f87171'
                          : n.type === 'race'
                            ? '#60a5fa'
                            : n.type === 'result'
                              ? '#34d399'
                              : '#fbbf24',
                      }}>
                        {getNotificationIcon(n.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                        }}>
                          {n.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}>
                          {n.time}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* ===== NOTIFICATION TICKER ===== */}
      <div style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.015)',
        padding: '8px 0',
        overflow: 'hidden',
      }}>
        <div className="ticker-wrap">
          <div className="ticker">
            {[...MOCK_NOTIFICATIONS, ...MOCK_NOTIFICATIONS].map((n, i) => (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}>
                <Zap size={12} style={{
                  color: n.type === 'breaking' ? '#f87171' : '#60a5fa',
                }} />
                {n.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ===== HERO / BACKGROUND INFO ===== */}
        <div className="animate-fade-in-up" style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#60a5fa',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <Zap size={12} /> Live Platform
            </div>

            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}>
              Your Racing{' '}
              <span className="gradient-text">Universe</span>
            </h2>

            <p style={{
              color: 'var(--text-secondary)',
              maxWidth: '540px',
              fontSize: '15px',
              lineHeight: 1.7,
              fontWeight: 400,
            }}>
              Live telemetry, AI-powered insights, and comprehensive coverage across seven
              of the world&apos;s greatest racing series — all in one personalized hub.
            </p>
          </div>
        </div>

        {/* ===== SERIES GRID ===== */}
        <div className="series-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {SERIES.map((sport, index) => (
            <Link
              key={sport.id}
              href={`/dashboard/${sport.id}`}
              className="glass glass-hover card-glow animate-fade-in-up"
              style={{
                ['--series-color' as string]: sport.color,
                borderRadius: 'var(--radius-xl)',
                padding: '28px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'both',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Series accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: sport.gradient,
                opacity: 0.6,
              }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  background: sport.gradient,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: `0 4px 20px -4px ${sport.color}40`,
                  flexShrink: 0,
                }}>
                  {sport.icon}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    marginBottom: '2px',
                  }}>
                    {sport.name}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontWeight: 400,
                  }}>
                    {sport.description}
                  </p>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Zap size={10} /> AI Briefing
                </div>
                {summaries[sport.id] ? (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {summaries[sport.id]}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '100%' }} />
                    <div className="skeleton" style={{ height: '12px', width: '85%' }} />
                    <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  Live Dashboard
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: sport.color,
                }}>
                  Enter Hub <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
