'use client'

import { useEffect, useState, useRef } from 'react'
import { BarChart3, Star } from 'lucide-react'

import { CVData, RaceData } from '@/lib/types'
import { INITIAL_DATA } from '@/lib/mockData'
import { useUserProfile } from '@/lib/userPreferences'

interface LiveStandingsProps {
  series: string
  sessionKey?: number | null
  dataSource?: 'live' | 'mock' | 'cv'
  externalData?: CVData[]
  replayData?: RaceData[] | null
  selectedDriverCode?: string | null
  onSelectDriver?: (code: string | null) => void
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
  replayData,
  selectedDriverCode,
  onSelectDriver,
  onLiveStandingsUpdate,
}: LiveStandingsProps) {
  const [raceData, setRaceData] = useState<RaceData[]>([])
  const [loading, setLoading] = useState(true)
  const { isDriverFollowed } = useUserProfile()
  const isFetchingRef = useRef(false)
  const hasLiveData = useRef(false)
  const previousLiveKey = useRef(`${series}:${dataSource}:${sessionKey ?? 'latest'}`)

  // Active standings: if replayData is available, it takes absolute precedence
  const isReplayActive = Boolean(replayData && replayData.length > 0)
  const isReplayActiveRef = useRef(isReplayActive)
  useEffect(() => {
    isReplayActiveRef.current = isReplayActive
  }, [isReplayActive])

  const activeRaceData = isReplayActive ? replayData! : raceData

  // Forward updates to parent (e.g. Chatbot, Fantasy)
  useEffect(() => {
    if (activeRaceData && activeRaceData.length > 0) {
      onLiveStandingsUpdate?.(activeRaceData)
    }
  }, [activeRaceData, onLiveStandingsUpdate])

  useEffect(() => {
    // If replayData is actively driving the standings, do not poll background APIs
    if (isReplayActive) {
      setLoading(false)
      return
    }

    let intervalId: ReturnType<typeof setInterval> | undefined
    const liveKey = `${series}:${dataSource}:${sessionKey ?? 'latest'}`

    if (previousLiveKey.current !== liveKey) {
      previousLiveKey.current = liveKey
      hasLiveData.current = false
      setLoading(true)
    }

    const applyFallback = () => {
      if (hasLiveData.current || isReplayActiveRef.current) return
      const fallback = getFallbackData(series)
      setRaceData(fallback)
      onLiveStandingsUpdate?.(fallback)
    }

    if (dataSource === 'live' && series === 'f1') {
      const fetchLiveF1Data = async () => {
        if (isFetchingRef.current || isReplayActiveRef.current) return
        isFetchingRef.current = true

        try {
          const sessionParam = sessionKey || 'latest'
          const response = await fetch(`/api/f1/live?sessionKey=${sessionParam}`)

          if (!response.ok) {
            applyFallback()
            setLoading(false)
            return
          }

          if (isReplayActiveRef.current) return

          const nextRaceData: RaceData[] = await response.json()
          const top20 = nextRaceData.slice(0, 20)
          if (!isReplayActiveRef.current) {
            setRaceData(top20)
            onLiveStandingsUpdate?.(top20)
            hasLiveData.current = true
            setLoading(false)
          }
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
        queueMicrotask(() => {
          setRaceData(nextRaceData)
          onLiveStandingsUpdate?.(nextRaceData)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
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
            const rest = { ...entry }
            delete (rest as { _absoluteTime?: number })._absoluteTime
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
  }, [series, dataSource, externalData, sessionKey, onLiveStandingsUpdate, isReplayActive])

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
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm flex items-center justify-center">
            <BarChart3 size={16} />
          </div>
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em]">Live Timing</h2>
        </div>

        {activeRaceData.length > 0 && (
          <div className="live-badge" style={{
            background: isReplayActive ? 'rgba(34,197,94,0.12)' : dataSource === 'mock' ? 'rgba(251,191,36,0.12)' : undefined,
            color: isReplayActive ? '#4ade80' : dataSource === 'mock' ? '#fbbf24' : dataSource === 'cv' ? '#3b82f6' : undefined,
            border: isReplayActive ? '1px solid rgba(34,197,94,0.25)' : dataSource === 'mock' ? '1px solid rgba(251,191,36,0.2)' : dataSource === 'cv' ? '1px solid rgba(59,130,246,0.2)' : undefined
          }}>
            <div className="live-dot" style={{
              background: isReplayActive ? '#4ade80' : dataSource === 'mock' ? '#fbbf24' : dataSource === 'cv' ? '#3b82f6' : undefined,
              boxShadow: isReplayActive ? '0 0 8px #4ade80' : dataSource === 'mock' ? '0 0 8px #fbbf24' : dataSource === 'cv' ? '0 0 8px #3b82f6' : undefined
            }} />
            {isReplayActive ? (
              <span>
                REPLAY SYNCED
                {activeRaceData[0]?.laps_completed && (
                  <span className="font-mono text-[10px] text-emerald-300/80 font-bold ml-1.5">
                    • LAP {activeRaceData[0].laps_completed}
                  </span>
                )}
              </span>
            ) : dataSource === 'mock' ? 'SIMULATED DATA' : dataSource === 'cv' ? 'LIVE (CV OCR)' : liveLabel}
          </div>
        )}
      </div>

      {loading && activeRaceData.length === 0 ? (
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
                {['Pos', 'Driver', 'Gap', 'Speed / Status', series.startsWith('nascar-') ? 'Mfg' : 'Tire'].map((header) => (
                  <th key={header} className="pb-3 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRaceData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-3 text-center text-[var(--text-muted)] text-[13px] italic">
                    Waiting for race session data...
                  </td>
                </tr>
              ) : (
                activeRaceData.map((entry) => {
                  const tireColor = getTireColor(entry.tire_compound)
                  const isSelected = selectedDriverCode === entry.driver_id
                  const isFollowed = isDriverFollowed(entry.driver_id, series)
                  return (
                    <tr 
                      key={entry.driver_id} 
                      onClick={() => onSelectDriver?.(isSelected ? null : entry.driver_id)}
                      className={`border-b border-white/5 transition-colors duration-200 cursor-pointer ${
                        isSelected 
                          ? 'bg-white/10 !border-l-2 !border-l-[var(--amber)]' 
                          : isFollowed 
                          ? 'bg-amber-500/[0.04] !border-l-2 !border-l-amber-400/60 hover:bg-amber-500/[0.08]'
                          : 'hover:bg-white/5'
                      }`}
                      title={`${entry.drivers?.name || entry.driver_id} ${isFollowed ? '(Followed Driver) ' : ''}- Click to focus in Race Replay`}
                    >
                      <td className="p-3">
                        <span className={`font-mono font-extrabold text-[14px] ${entry.position <= 3 ? 'text-[#fbbf24]' : 'text-[var(--text-primary)]'}`}>
                          {entry.position}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[14px] text-[var(--text-primary)] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {entry.team_color && (
                            <span 
                              className="w-1 h-4.5 rounded-full shrink-0" 
                              style={{ background: entry.team_color }} 
                            />
                          )}
                          <span className="font-mono font-black text-xs text-white tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 shrink-0">
                            {entry.driver_id}
                          </span>
                          {entry.car_number && (
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--text-muted)] shrink-0">
                              #{entry.car_number}
                            </span>
                          )}
                          <span>{entry.drivers?.name || `Car ${entry.driver_id}`}</span>
                          {entry.team_name && (
                            <span className="text-xs text-[var(--text-muted)] font-normal hidden sm:inline">
                              • {entry.team_name}
                            </span>
                          )}
                          {isFollowed && (
                            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                              <Star size={9} className="fill-amber-400 text-amber-400" />
                              FAV
                            </span>
                          )}
                          {entry.drs_active && (
                            <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/40 shrink-0">
                              DRS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[12px]">
                        {entry.gap_to_leader === 'PIT' ? (
                          <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-[10px]">
                            PIT
                          </span>
                        ) : entry.gap_to_leader === 'OUT' ? (
                          <span className="text-red-400 font-bold bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded text-[10px]">
                            OUT
                          </span>
                        ) : entry.position === 1 ? (
                          <span className="text-[var(--amber)] font-bold text-xs bg-[var(--amber)]/10 px-2 py-0.5 rounded border border-[var(--amber)]/20">
                            LEADER
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-semibold">
                            {entry.gap_to_leader}
                          </span>
                        )}
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
