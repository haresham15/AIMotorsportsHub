'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { Star, UserPlus, ExternalLink } from 'lucide-react'
import { SERIES_DRIVERS } from '@/lib/data'
import { useUserProfile } from '@/lib/userPreferences'

export default function MySupported({ series }: { series: string }) {
  const { isLoggedIn, followedDrivers, toggleDriver } = useUserProfile()
  const drivers = SERIES_DRIVERS[series] || []

  const isDriverSelected = (code: string) => {
    return followedDrivers.some(d => d.code === code && d.series === series)
  }

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      const aFollowed = followedDrivers.some(d => d.code === a.code && d.series === series) ? 1 : 0
      const bFollowed = followedDrivers.some(d => d.code === b.code && d.series === series) ? 1 : 0
      return bFollowed - aFollowed
    })
  }, [drivers, followedDrivers, series])

  return (
    <div className="card glass rounded-[var(--radius-xl)] p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Star size={18} className="text-amber-400 fill-amber-400" />
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-xl font-extrabold text-white m-0">
            My Supported
          </h2>
        </div>
        {isLoggedIn && (
          <Link
            href="/profile"
            className="text-[11px] font-mono text-[var(--text-muted)] hover:text-white flex items-center gap-1 no-underline transition-colors"
          >
            <span>Garage</span>
            <ExternalLink size={12} />
          </Link>
        )}
      </div>

      {!isLoggedIn ? (
        <div className="text-center py-6 px-4 bg-white/[0.02] rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)]">
          <UserPlus size={24} className="text-[var(--text-muted)] mb-2.5 mx-auto" />
          <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
            Sign in with a Paddock Pass to follow drivers, prioritize telemetry, and track attendance.
          </p>
          <Link href="/login" className="btn-primary text-xs px-4 py-2 inline-block no-underline">
            Sign In to Pass
          </Link>
        </div>
      ) : drivers.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No driver roster is available for this series.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {sortedDrivers.map(driver => {
            const active = isDriverSelected(driver.code)
            return (
              <button
                key={driver.code}
                onClick={() => toggleDriver({ ...driver, series })}
                className={`flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] border text-left cursor-pointer transition-colors ${
                  active
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-[var(--border-subtle)] hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-1 h-5 rounded-full shrink-0"
                    style={{ background: driver.color || 'var(--amber)' }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-white">{driver.code}</span>
                      <span className="font-semibold text-xs text-white">{driver.name}</span>
                    </div>
                    <span className="block text-[11px] text-[var(--text-muted)]">{driver.team}</span>
                  </div>
                </div>
                <Star
                  size={16}
                  className={active ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
