'use client'

import Link from 'next/link'
import { ArrowLeft, Trophy, Flag, Truck } from 'lucide-react'
import AuthButton from '@/components/AuthButton'

const NASCAR_SERIES = [
  {
    id: 'nascar-cup',
    name: 'NASCAR Cup Series',
    shortName: 'CUP',
    description: 'The premier stock car racing series — 36 races, 16-driver playoff, and the crown jewel Daytona 500.',
    icon: <Trophy size={28} />,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    seriesId: 1,
    stats: {
      races: 36,
      drivers: '~40',
      topSpeed: '200 mph',
    }
  },
  {
    id: 'nascar-xfinity',
    name: 'NASCAR Xfinity Series',
    shortName: 'XFN',
    description: 'The proving ground for future Cup stars — where tomorrow\'s champions earn their stripes.',
    icon: <Flag size={28} />,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    seriesId: 2,
    stats: {
      races: 33,
      drivers: '~38',
      topSpeed: '190 mph',
    }
  },
  {
    id: 'nascar-trucks',
    name: 'NASCAR Craftsman Truck Series',
    shortName: 'TRKS',
    description: 'Short-track mayhem with full-size trucks — the most unpredictable racing in NASCAR.',
    icon: <Truck size={28} />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    seriesId: 3,
    stats: {
      races: 23,
      drivers: '~36',
      topSpeed: '180 mph',
    }
  },
]

export default function NascarPickerPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass-nav sticky top-0 z-50 px-6">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center h-[68px]">
          <div className="flex items-center gap-3">
            <Link href="/" className="logo no-underline text-[var(--text-primary)]">
              <span className="dot"></span>
              <span className="hide-mobile">APEXIS</span>
            </Link>
            <span className="text-[var(--text-muted)] text-xl font-extralight">/</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏟️</span>
              <span className="text-base font-semibold text-[var(--text-primary)] tracking-[-0.01em]">
                NASCAR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <AuthButton />
            <Link href="/" className="btn-ghost flex items-center gap-1.5 no-underline">
              <ArrowLeft size={14} />
              <span className="hide-mobile">Back</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Accent bar */}
      <div
        className="h-[2px] opacity-50"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #3b82f6, #10b981)' }}
      />

      <main className="max-w-[1280px] mx-auto px-6 pt-12 pb-20">
        {/* Header */}
        <div className="animate-fade-in-up mb-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--amber)] font-[family-name:var(--font-mono)] mb-3">
            Choose Your Series
          </div>
          <h1 className="font-[family-name:var(--font-disp)] uppercase text-5xl md:text-6xl font-extrabold tracking-[-0.01em] leading-[0.95] mb-4">
            Three series.<br />
            One <span className="text-[var(--amber)]">paddock</span>.
          </h1>
          <p className="text-[16px] text-[var(--text-secondary)] max-w-[560px] leading-[1.65]">
            NASCAR runs three national touring series — each with its own championship, storylines, and live telemetry on this dashboard. Pick your grid.
          </p>
        </div>

        {/* Series Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden animate-fade-in-up delay-150">
          {NASCAR_SERIES.map((series) => (
            <Link
              key={series.id}
              href={`/dashboard/${series.id}`}
              className="group bg-[var(--bg-card)] p-8 flex flex-col gap-6 no-underline transition-colors hover:bg-[var(--bg-card-hover)] relative"
              style={{ borderLeft: `3px solid ${series.color}` }}
            >
              {/* Icon + Title */}
              <div>
                <div
                  className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-4"
                  style={{ background: `${series.color}15`, color: series.color }}
                >
                  {series.icon}
                </div>
                <div
                  className="font-[family-name:var(--font-disp)] text-4xl font-extrabold tracking-[0.01em] mb-1"
                  style={{ color: series.color }}
                >
                  {series.shortName}
                </div>
                <div className="text-[16px] font-semibold text-[var(--text-primary)]">
                  {series.name}
                </div>
                <p className="text-[13px] text-[var(--text-muted)] mt-2 leading-[1.6]">
                  {series.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-6 font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-4 mt-auto">
                <div>
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">{series.stats.races}</div>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">Races</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">{series.stats.drivers}</div>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">Drivers</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">{series.stats.topSpeed}</div>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">Top Speed</div>
                </div>
              </div>

              {/* Enter CTA */}
              <div
                className="text-[13px] font-semibold flex items-center gap-1.5 group-hover:gap-3 transition-all"
                style={{ color: series.color }}
              >
                Enter Dashboard →
              </div>
            </Link>
          ))}
        </div>

        {/* Live Session Banner */}
        <div className="animate-fade-in-up delay-300 mt-8 glass rounded-[var(--radius-xl)] p-6 flex items-center gap-4">
          <div className="live-badge">
            <div className="live-dot" />
            LIVE FEED ACTIVE
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] m-0">
            NASCAR&apos;s Cloudflare CDN updates every second during live sessions. Standings, pit stops, and flag data are pulled directly from timing &amp; scoring.
          </p>
        </div>
      </main>
    </div>
  )
}
