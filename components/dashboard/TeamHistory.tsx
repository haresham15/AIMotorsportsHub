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
    <div className="glass p-6 rounded-[var(--radius-xl)]">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-amber-500/12 flex items-center justify-center text-amber-500">
          <Trophy size={16} />
        </div>
        <div>
          <h2 className="text-base font-bold m-0">Team Heritage</h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium m-0">
            Legendary teams in {seriesInfo?.name || series}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {teams.map((team) => {
          const isExpanded = expandedTeam === team.name

          return (
            <div 
              key={team.name} 
              className={`rounded-[var(--radius-lg)] overflow-hidden transition-all duration-300 ease-in-out border ${
                isExpanded 
                  ? 'bg-white/5 border-[var(--border-hover)]' 
                  : 'bg-white/[0.02] border-[var(--border-subtle)]'
              }`}
            >
              {/* Team Header — Clickable */}
              <button
                onClick={() => setExpandedTeam(isExpanded ? null : team.name)}
                className="w-full flex items-center justify-between p-4 bg-transparent border-none text-inherit cursor-pointer font-sans text-left"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center text-base font-extrabold text-white shrink-0"
                    style={{ background: seriesInfo?.gradient || 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {team.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                      <span>{team.country}</span>
                      <span className="opacity-30">•</span>
                      <span>Est. {team.founded}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[var(--text-muted)] shrink-0">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="animate-fade-in px-4 pb-4 border-t border-[var(--border-subtle)]">
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed my-4">
                    {team.description}
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                      <Medal size={10} /> Key Achievements
                    </div>
                    {team.achievements.map((ach, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                        <div 
                          className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                          style={{ background: seriesInfo?.color || 'var(--accent-blue)' }} 
                        />
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
