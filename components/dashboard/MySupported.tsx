'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Star, UserPlus } from 'lucide-react'
import { SERIES_DRIVERS } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'

export default function MySupported({ series }: { series: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const drivers = SERIES_DRIVERS[series] || []

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      const id = data.user?.id ?? null
      setUserId(id)
      if (id) {
        const { data: rows } = await supabase.from('followed_drivers').select('driver_id').eq('user_id', id).eq('series', series)
        if (active) setFollowed(new Set((rows || []).map(row => row.driver_id)))
      }
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [series, supabase])

  async function toggle(driverId: string) {
    if (!userId) return
    const isFollowed = followed.has(driverId)
    setFollowed(current => {
      const next = new Set(current)
      if (isFollowed) next.delete(driverId)
      else next.add(driverId)
      return next
    })
    const query = supabase.from('followed_drivers')
    const { error } = isFollowed
      ? await query.delete().eq('user_id', userId).eq('series', series).eq('driver_id', driverId)
      : await query.insert({ user_id: userId, series, driver_id: driverId })
    if (error) setFollowed(current => {
      const next = new Set(current)
      if (isFollowed) next.add(driverId)
      else next.delete(driverId)
      return next
    })
  }

  return <div className="card glass rounded-[var(--radius-xl)] p-6">
    <div className="flex items-center gap-2.5 mb-4"><Star size={18} className="text-amber-400" /><h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold">My Supported</h2></div>
    {loading ? <p className="text-[13px] text-[var(--text-muted)]">Loading supported drivers...</p> : !userId ? (
      <div className="text-center py-8 px-4 bg-white/5 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)]">
        <UserPlus size={28} className="text-[var(--text-muted)] mb-3 mx-auto" />
        <p className="text-[13px] text-[var(--text-muted)] mb-3">Sign in to follow drivers and keep the list across devices.</p>
        <Link href="/login" className="btn-primary text-xs px-4 py-2">Sign In</Link>
      </div>
    ) : drivers.length === 0 ? <p className="text-[13px] text-[var(--text-muted)]">No driver roster is available for this series.</p> : (
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {drivers.map(driver => <button key={driver.code} onClick={() => toggle(driver.code)} className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-white/5 border border-[var(--border-subtle)] text-left cursor-pointer">
          <span><span className="font-semibold text-sm">{driver.name}</span><span className="block text-[11px] text-[var(--text-muted)]">{driver.team}</span></span>
          <Star size={16} className={followed.has(driver.code) ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'} />
        </button>)}
      </div>
    )}
  </div>
}
