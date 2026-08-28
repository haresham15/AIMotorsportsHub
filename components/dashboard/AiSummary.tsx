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
    <div className="card glass rounded-[var(--radius-xl)] p-8 relative overflow-hidden">
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

      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-blue-500/12 flex items-center justify-center text-blue-400">
          <Zap size={16} />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em]">
            AI Briefing
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">
            Powered by Gemini
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          <div className="skeleton h-[14px] w-full" />
          <div className="skeleton h-[14px] w-[95%]" />
          <div className="skeleton h-[14px] w-[87%]" />
          <div className="mt-2" />
          <div className="skeleton h-[14px] w-[92%]" />
          <div className="skeleton h-[14px] w-[78%]" />
        </div>
      ) : !hasFetched ? (
        <button 
          onClick={fetchSummary}
          className="hover-lift bg-[var(--accent-blue)] text-white border-none px-5 py-3 rounded-[var(--radius-md)] cursor-pointer text-sm font-semibold flex items-center gap-2"
        >
          <Zap size={16} />
          Generate AI Briefing
        </button>
      ) : (
        <div className="text-[15px] text-[var(--text-secondary)] leading-relaxed font-normal whitespace-pre-wrap">
          {summary}
        </div>
      )}
    </div>
  )
}
