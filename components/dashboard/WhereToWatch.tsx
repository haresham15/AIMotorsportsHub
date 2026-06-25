'use client'

import { WATCH_LINKS, SERIES_MAP } from '@/lib/data'
import { Tv, ExternalLink } from 'lucide-react'

interface WhereToWatchProps {
  series: string
}

export default function WhereToWatch({ series }: WhereToWatchProps) {
  const links = WATCH_LINKS[series] || []
  const seriesInfo = SERIES_MAP[series]

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
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f87171',
        }}>
          <Tv size={16} />
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Where to Watch</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: seriesInfo?.color || 'var(--accent-blue)',
                opacity: 0.6,
                flexShrink: 0,
              }} />
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  {link.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '2px',
                }}>
                  {link.platform}
                </div>
              </div>
            </div>
            <ExternalLink size={14} style={{
              color: 'var(--text-muted)',
              flexShrink: 0,
            }} />
          </a>
        ))}
      </div>
    </div>
  )
}
