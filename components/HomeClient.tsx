'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SERIES, MOCK_NOTIFICATIONS, type NotificationItem } from '@/lib/data'
import { Bell, ChevronRight, Zap, Trophy, Clock, AlertTriangle } from 'lucide-react'
import AuthButton from '@/components/AuthButton'
import ApexisLogo from '@/components/ui/ApexisLogo'

export default function HomeClient({ summaries }: { summaries: Record<string, string> }) {
  const [showNotifications, setShowNotifications] = useState(false)

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'race': return <Clock size={14} />
      case 'breaking': return <AlertTriangle size={14} />
      case 'result': return <Trophy size={14} />
      case 'schedule': return <Bell size={14} />
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav sticky top-0 z-50 px-6">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center h-16">
          <div className="flex items-center gap-2.5">
            <ApexisLogo width={24} height={24} />
            <h1 className="text-xl font-extrabold tracking-[-0.01em] text-[var(--text-primary)]">
              Apexis
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AuthButton />
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Toggle notifications"
                className="bg-white/5 border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2 text-[var(--text-secondary)] cursor-pointer flex items-center justify-center transition-all duration-300 relative hover:bg-white/10"
              >
                <Bell size={18} />
                <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-red)] rounded-full border-2 border-[var(--bg-primary)]" />
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="glass animate-slide-down absolute top-[calc(100%+8px)] right-0 w-[360px] rounded-[var(--radius-lg)] p-2 z-[100] max-h-[400px] overflow-y-auto">
                  <div className="px-3 pt-3 pb-2 text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">
                    Priority Notifications
                  </div>
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <Link
                      key={n.id}
                      href={`/dashboard/${n.series}`}
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] no-underline text-inherit transition-colors duration-200 hover:bg-white/5"
                    >
                      <div 
                        className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                        style={{
                          background: n.type === 'breaking'
                            ? 'rgba(239,68,68,0.15)'
                            : n.type === 'race'
                              ? 'rgba(59,130,246,0.15)'
                              : n.type === 'result'
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(245,158,11,0.15)',
                          color: n.type === 'breaking'
                            ? '#f87171'
                            : n.type === 'race'
                              ? '#60a5fa'
                              : n.type === 'result'
                                ? '#34d399'
                                : '#fbbf24',
                        }}
                      >
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[var(--text-primary)] leading-[1.4]">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">
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
      <div className="border-b border-[var(--border-subtle)] bg-white/[0.015] py-2 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker">
            {[...MOCK_NOTIFICATIONS, ...MOCK_NOTIFICATIONS].map((n, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                <Zap size={12} style={{ color: n.type === 'breaking' ? '#f87171' : '#60a5fa' }} />
                {n.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-6 pt-10 pb-20">

        {/* ===== FEATURED HERO (F1) ===== */}
        {(() => {
          const featuredSport = SERIES.find(s => s.id === 'f1') || SERIES[0]
          return (
            <div className="animate-fade-in-up mb-16">
              <Link 
                href={`/dashboard/${featuredSport.id}`}
                className="glass-hover block bg-[var(--bg-card)] rounded-[var(--radius-xl)] overflow-hidden no-underline text-inherit relative border border-[var(--border-subtle)]"
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: featuredSport.color }} />
                
                <div className="flex flex-col px-10 py-12 min-h-[340px] justify-center">
                  <div className="flex items-center gap-6 mb-6">
                    <div 
                      className="w-20 h-20 rounded-[var(--radius-lg)] flex items-center justify-center text-[40px] shrink-0"
                      style={{ background: featuredSport.gradient }}
                    >
                      {featuredSport.icon}
                    </div>
                    <div>
                      <div 
                        className="text-xs font-bold uppercase tracking-[0.1em] mb-1"
                        style={{ color: featuredSport.color }}
                      >
                        Featured Series
                      </div>
                      <h2 className="text-[clamp(32px,5vw,48px)] font-black leading-none">
                        {featuredSport.name}
                      </h2>
                    </div>
                  </div>

                  <p className="text-base text-[var(--text-secondary)] max-w-[600px] mb-8 leading-[1.6]">
                    {featuredSport.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="btn-primary inline-flex px-8 py-3 text-[15px]">
                      Enter Apexis
                    </div>
                    {summaries[featuredSport.id] && (
                      <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] bg-white/5 px-4 py-2.5 rounded-full">
                        <Zap size={14} className="text-blue-400" />
                        AI Briefing Available
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )
        })()}

        {/* ===== HORIZONTAL SCROLLING SERIES ===== */}
        <div className="animate-fade-in-up delay-100">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-extrabold">Explore More Series</h3>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {SERIES.filter(s => s.id !== 'f1').map((sport, index) => (
              <Link
                key={sport.id}
                href={`/dashboard/${sport.id}`}
                className="glass-hover flex-none w-[340px] snap-start bg-[var(--bg-card)] rounded-[var(--radius-xl)] p-8 no-underline text-inherit flex flex-col gap-6 relative border border-[var(--border-subtle)]"
              >
                {/* Top border accent instead of glowing line */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sport.color }} />

                {/* Header */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-[52px] h-[52px] rounded-[var(--radius-lg)] flex items-center justify-center text-2xl shrink-0"
                    style={{ background: sport.gradient }}
                  >
                    {sport.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-[-0.01em] mb-0.5">
                      {sport.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-normal">
                      {sport.description}
                    </p>
                  </div>
                </div>

                {/* AI Summary */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Zap size={10} /> AI Briefing
                  </div>
                  {summaries[sport.id] ? (
                    <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6] line-clamp-3">
                      {summaries[sport.id]}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="skeleton h-3 w-full" />
                      <div className="skeleton h-3 w-[85%]" />
                      <div className="skeleton h-3 w-[60%]" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-auto">
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    Live Dashboard
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: sport.color }}>
                    Enter Apexis <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
