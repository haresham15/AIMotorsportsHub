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
    <div className="card glass p-6 rounded-[var(--radius-xl)]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-red-500/12 flex items-center justify-center text-red-400">
          <Tv size={16} />
        </div>
        <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em] m-0">Where to Watch</h2>
      </div>

      <div className="flex flex-col gap-2">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 bg-white/[0.03] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-4 py-3.5 no-underline text-inherit transition-all duration-300 hover:bg-white/5 hover:border-[var(--border-hover)] hover:translate-x-1"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-2 h-2 rounded-full opacity-60 shrink-0"
                style={{ background: seriesInfo?.color || 'var(--accent-blue)' }} 
              />
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  {link.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mt-0.5">
                  {link.platform}
                </div>
              </div>
            </div>
            <ExternalLink size={14} className="text-[var(--text-muted)] shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}
