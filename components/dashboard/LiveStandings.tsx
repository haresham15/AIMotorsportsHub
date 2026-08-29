'use client'

import { useEffect, useState, useRef } from 'react'
import { BarChart3 } from 'lucide-react'

import { CVData, RaceData } from '@/lib/types'
import { INITIAL_DATA } from '@/lib/mockData'

interface LiveStandingsProps {
  series: string
  sessionKey?: number | null
  dataSource?: 'live' | 'mock' | 'cv'
  externalData?: CVData[]
  onLiveStandingsUpdate?: (data: RaceData[]) => void
}

function getFallbackData(series: string): RaceData[] {
  return INITIAL_DATA.filter((entry) => {
    const entrySeries = entry.drivers?.series_id
    return entrySeries === series ||
      (series.startsWith('nascar-') && entrySeries === 'nascar') ||
      (series === 'f1' && entrySeries === 'f1')
  })
}

function formatMockLap(series: string): string {
  const baseMs = series.startsWith('nascar-') ? 50_000 : 90_000
  const lapMs = baseMs + (Math.random() * 2000 - 1000)
  const mins = Math.floor(lapMs / 60000)
  const secs = ((lapMs % 60000) / 1000).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

export default function LiveStandings({
  series,
  sessionKey,
  dataSource = 'mock',
  externalData,
  onLiveStandingsUpdate,
}: LiveStandingsProps) {
  const [raceData, setRaceData] = useState<RaceData[]>([])
  const [loading, setLoading] = useState(true)
  const isFetchingRef = useRef(false)
  const hasLiveData = useRef(false)
  const previousLiveKey = useRef(`${series}:${dataSource}:${sessionKey ?? 'latest'}`)

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined
    const liveKey = `${series}:${dataSource}:${sessionKey ?? 'latest'}`

    if (previousLiveKey.current !== liveKey) {
      previousLiveKey.current = liveKey
      hasLiveData.current = false
      setLoading(true)
    }

    const applyFallback = () => {
      if (hasLiveData.current) return
      const fallback = getFallbackData(series)
      setRaceData(fallback)
      onLiveStandingsUpdate?.(fallback)
    }

    if (dataSource === 'live' && series === 'f1') {
      const fetchLiveF1Data = async () => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        try {
          const sessionParam = sessionKey || 'latest'
          const response = await fetch(`/api/f1/live?sessionKey=${sessionParam}`)

          if (!response.ok) {
            applyFallback()
            setLoading(false)
            return
          }

          const nextRaceData: RaceData[] = await response.json()
          const top20 = nextRaceData.slice(0, 20)
          setRaceData(top20)
          onLiveStandingsUpdate?.(top20)
          hasLiveData.current = true
          setLoading(false)
        } catch {
          applyFallback()
          setLoading(false)
        } finally {
          isFetchingRef.current = false
        }
      }

      fetchLiveF1Data()
      intervalId = setInterval(fetchLiveF1Data, 10000)
    } else if (dataSource === 'live' && series.startsWith('nascar-')) {
      const fetchLiveNascarData = async () => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        try {
          const response = await fetch(`/api/nascar/live?series=${encodeURIComponent(series)}`)

          if (!response.ok) {
            applyFallback()
            setLoading(false)
            return
          }

          const payload: { standings?: RaceData[] } = await response.json()
          const top20 = (payload.standings || []).slice(0, 20)
          setRaceData(top20)
          onLiveStandingsUpdate?.(top20)
          hasLiveData.current = top20.length > 0
          setLoading(false)
        } catch {
          applyFallback()
          setLoading(false)
        } finally {
          isFetchingRef.current = false
        }
      }

      fetchLiveNascarData()
      intervalId = setInterval(fetchLiveNascarData, 10000)
    } else if (dataSource === 'cv') {
      if (externalData && externalData.length > 0) {
        const nextRaceData = externalData.map((entry) => ({
          driver_id: entry.driver_id,
          position: entry.position,
          gap_to_leader: entry.gap_to_leader,
          last_lap: 'Live',
          tire_compound: 'Unknown',
          drivers: { name: entry.driver_id, series_id: series },
        }))
        setRaceData(nextRaceData)
        onLiveStandingsUpdate?.(nextRaceData)
      }
      setLoading(false)
    } else {
      const fallback = getFallbackData(series)
      setRaceData(fallback)
      onLiveStandingsUpdate?.(fallback)
      setLoading(false)

      intervalId = setInterval(() => {
        setRaceData((currentData) => {
          const withAbsolute = currentData.map((entry) => {
            const rawGap = entry.gap_to_leader.replace('+', '').replace('s', '')
            const gap = entry.gap_to_leader === 'Interval' || entry.gap_to_leader === 'LEADER'
              ? 0
              : parseFloat(rawGap) || 0
            const change = Math.random() * 0.4 - 0.15
            return { ...entry, _absoluteTime: gap + change }
          })

          if (withAbsolute.length === 0) return []

          withAbsolute.sort((a, b) => a._absoluteTime - b._absoluteTime)
          const leaderTime = withAbsolute[0]._absoluteTime

          const mapped = withAbsolute.map((entry, index) => {
            const position = index + 1
            const nextGap = position === 1
              ? 'Interval'
              : `+${Math.max(0, entry._absoluteTime - leaderTime).toFixed(3)}`
            const { _absoluteTime, ...rest } = entry
            return { ...rest, position, gap_to_leader: nextGap, last_lap: formatMockLap(series) } as RaceData
          })

          onLiveStandingsUpdate?.(mapped)
          return mapped
        })
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [series, dataSource, externalData, sessionKey, onLiveStandingsUpdate])

  const getTireColor = (compound: string) => {
    switch (compound?.toLowerCase()) {
      case 'soft': return { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.2)' }
      case 'medium': return { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' }
      case 'hard': return { bg: 'rgba(255,255,255,0.08)', text: '#e2e8f0', border: 'rgba(255,255,255,0.15)' }
      case 'intermediate': return { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.2)' }
      case 'wet': return { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' }
      default: return { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'rgba(255,255,255,0.1)' }
    }
  }

  const liveLabel = series.startsWith('nascar-') ? 'LIVE (NASCAR)' : 'LIVE (OPENF1)'

  return (
    <div className="px-2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-emerald-500/12 flex items-center justify-center text-emerald-400">
            <BarChart3 size={16} />
          </div>
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em]">Live Timing</h2>
        </div>

        {raceData.length > 0 && (
          <div className="live-badge" style={{
            background: dataSource === 'mock' ? 'rgba(251,191,36,0.12)' : undefined,
            color: dataSource === 'mock' ? '#fbbf24' : dataSource === 'cv' ? '#3b82f6' : undefined,
            border: dataSource === 'mock' ? '1px solid rgba(251,191,36,0.2)' : dataSource === 'cv' ? '1px solid rgba(59,130,246,0.2)' : undefined
          }}>
            <div className="live-dot" style={{
              background: dataSource === 'mock' ? '#fbbf24' : dataSource === 'cv' ? '#3b82f6' : undefined,
              boxShadow: dataSource === 'mock' ? '0 0 8px #fbbf24' : dataSource === 'cv' ? '0 0 8px #3b82f6' : undefined
            }} />
            {dataSource === 'mock' ? 'SIMULATED DATA' : dataSource === 'cv' ? 'LIVE (CV OCR)' : liveLabel}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-11 rounded-[var(--radius-sm)]" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Pos', 'Driver', 'Gap', 'Last Lap', series.startsWith('nascar-') ? 'Mfg' : 'Tire'].map((header) => (
                  <th key={header} className="pb-3 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raceData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-3 text-center text-[var(--text-muted)] text-[13px] italic">
                    Waiting for race session data...
                  </td>
                </tr>
              ) : (
                raceData.map((entry) => {
                  const tireColor = getTireColor(entry.tire_compound)
                  return (
                    <tr key={entry.driver_id} className="border-b border-white/5 transition-colors duration-200 hover:bg-white/5">
                      <td className="p-3">
                        <span className={`font-mono font-extrabold text-[14px] ${entry.position <= 3 ? 'text-[#fbbf24]' : 'text-[var(--text-primary)]'}`}>
                          {entry.position}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[14px] text-[var(--text-primary)] whitespace-nowrap">
                        {entry.drivers?.name || `Car ${entry.driver_id}`}
                      </td>
                      <td className="p-3 font-mono text-[12px] text-[var(--text-muted)]">
                        {entry.gap_to_leader}
                      </td>
                      <td className="p-3 font-mono text-[12px] text-[var(--text-muted)]">
                        {entry.last_lap}
                      </td>
                      <td className="p-3">
                        {series.startsWith('nascar-') && entry.manufacturer ? (
                           <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em] bg-white/10 text-white border border-white/20">
                             {entry.manufacturer}
                           </span>
                        ) : (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em]"
                            style={{
                              background: tireColor.bg,
                              color: tireColor.text,
                              border: `1px solid ${tireColor.border}`,
                            }}
                          >
                            {entry.tire_compound}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
