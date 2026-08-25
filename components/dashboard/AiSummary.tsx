'use client'

import { useEffect, useState } from 'react'
import { SERIES_MAP } from '@/lib/data'
import { Zap } from 'lucide-react'

interface AiSummaryProps {
  series: string
}

export default function AiSummary({ series }: AiSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const seriesInfo = SERIES_MAP[series]

  const fetchSummary = async () => {
    setLoading(true)
    setHasFetched(true)
    try {
      const response = await fetch(`/api/ai/summary?series=${series}`)
      const data = await response.json()
      setSummary(data.summary || 'Unable to load summary.')
    } catch {
      setSummary('Error loading summary. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: seriesInfo?.gradient || 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
        opacity: 0.6,
      }} />

      {/* Background watermark */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '20px',
        fontSize: '120px',
        fontWeight: 900,
        fontStyle: 'italic',
        opacity: 0.02,
        pointerEvents: 'none',
        userSelect: 'none',
        letterSpacing: '-0.05em',
        lineHeight: 1,
      }}>
        AI
      </div>

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
          background: 'rgba(59,130,246,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#60a5fa',
        }}>
          <Zap size={16} />
        </div>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}>
            AI Briefing
          </h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            Powered by Gemini
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ height: '14px', width: '100%' }} />
          <div className="skeleton" style={{ height: '14px', width: '95%' }} />
          <div className="skeleton" style={{ height: '14px', width: '87%' }} />
          <div style={{ marginTop: '8px' }} />
          <div className="skeleton" style={{ height: '14px', width: '92%' }} />
          <div className="skeleton" style={{ height: '14px', width: '78%' }} />
        </div>
      ) : !hasFetched ? (
        <button 
          onClick={fetchSummary}
          className="hover-lift"
          style={{
            background: 'var(--accent-blue)',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Zap size={16} />
          Generate AI Briefing
        </button>
      ) : (
        <div style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          fontWeight: 400,
          whiteSpace: 'pre-wrap',
        }}>
          {summary}
        </div>
      )}
    </div>
  )
}
