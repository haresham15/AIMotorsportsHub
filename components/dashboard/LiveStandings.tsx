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
      ((series === 'nascar' || series.startsWith('nascar-')) && entrySeries === 'nascar') ||
      (series === 'f1' && entrySeries === 'f1')
  })
}

function formatMockLap(series: string): string {
  const isNascar = series === 'nascar' || series.startsWith('nascar-')
  const baseMs = isNascar ? 50_000 : 90_000
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

  const onLiveStandingsUpdateRef = useRef(onLiveStandingsUpdate)
  useEffect(() => {
    onLiveStandingsUpdateRef.current = onLiveStandingsUpdate
  }, [onLiveStandingsUpdate])

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
      onLiveStandingsUpdateRef.current?.(activeRaceData)
    }
  }, [activeRaceData])

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

          const json = await response.json()
          const nextRaceData: RaceData[] = Array.isArray(json) ? json : (json.standings || [])
          const top20 = nextRaceData.slice(0, 20)
          if (!isReplayActiveRef.current) {
            setRaceData(top20)
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
    } else if (dataSource === 'live' && (series === 'nascar' || series.startsWith('nascar-'))) {
      const fetchLiveNascarData = async () => {
        if (isFetchingRef.current || isReplayActiveRef.current) return
        isFetchingRef.current = true

        try {
          const nascarParam = series === 'nascar' ? 'nascar-cup' : series
          const response = await fetch(`/api/nascar/live?series=${encodeURIComponent(nascarParam)}`)

          if (!response.ok) {
            applyFallback()
            setLoading(false)
            return
          }

          if (isReplayActiveRef.current) return

          const payload: { standings?: RaceData[] } = await response.json()
          const top20 = (payload.standings || []).slice(0, 20)
          if (!isReplayActiveRef.current) {
            setRaceData(top20)
            hasLiveData.current = top20.length > 0
            setLoading(false)
          }
        } catch {
          applyFallback()
          setLoading(false)
        } finally {
          isFetchingRef.current = false
        }
      }

      fetchLiveNascarData()
      intervalId = setInterval(fetchLiveNascarData, 10000)
    } else if (dataSource === 'live' && ['wec', 'formula-e', 'gt-world-challenge', 'imsa', 'elms'].includes(series)) {
      const fetchLiveAlKamelData = async () => {
        if (isFetchingRef.current || isReplayActiveRef.current) return
        isFetchingRef.current = true

        try {
          const response = await fetch(`/api/alkamel/live?series=${encodeURIComponent(series)}`)
          if (!response.ok) {
            applyFallback()
            setLoading(false)
            return
          }
          if (isReplayActiveRef.current) return
          const payload: { standings?: RaceData[] } = await response.json()
          const top20 = (payload.standings || []).slice(0, 20)
          if (!isReplayActiveRef.current && top20.length > 0) {
            setRaceData(top20)
            hasLiveData.current = true
            setLoading(false)
          } else {
            applyFallback()
            setLoading(false)
          }
        } catch {
          applyFallback()
          setLoading(false)
        } finally {
          isFetchingRef.current = false
        }
      }

      fetchLiveAlKamelData()
      intervalId = setInterval(fetchLiveAlKamelData, 10000)
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
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    } else {
      const fallback = getFallbackData(series)
      setRaceData(fallback)
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

          return mapped
        })
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [series, dataSource, externalData, sessionKey, isReplayActive])

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

  const liveLabel = (series === 'nascar' || series.startsWith('nascar-')) ? 'LIVE (NASCAR)' : 'LIVE (OPENF1)'

  return (
    <div className="console-panel p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-hairline)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xs bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-[var(--text-secondary)] flex items-center justify-center">
            <BarChart3 size={14} />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Timing Tower</h2>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Live Timing &amp; Deltas</div>
          </div>
        </div>

        {activeRaceData.length > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs text-xs font-mono font-bold tracking-wider uppercase border" style={{
            background: isReplayActive ? 'rgba(34,197,94,0.12)' : dataSource === 'mock' ? 'rgba(251,191,36,0.12)' : 'rgba(59,130,246,0.12)',
            color: isReplayActive ? '#4ade80' : dataSource === 'mock' ? '#fbbf24' : '#60a5fa',
            borderColor: isReplayActive ? 'rgba(34,197,94,0.3)' : dataSource === 'mock' ? 'rgba(251,191,36,0.25)' : 'rgba(59,130,246,0.25)'
          }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{
              background: isReplayActive ? '#4ade80' : dataSource === 'mock' ? '#fbbf24' : '#60a5fa',
              boxShadow: isReplayActive ? '0 0 6px #4ade80' : dataSource === 'mock' ? '0 0 6px #fbbf24' : '0 0 6px #60a5fa'
            }} />
            {isReplayActive ? (
              <span>
                {dataSource === 'cv' ? 'HYBRID (SIM + OCR)' : 'REPLAY SYNCED'}
                {activeRaceData[0]?.laps_completed && (
                  <span className="font-mono text-[10px] text-emerald-300 font-bold ml-1.5 tabular-nums">
                    &bull; LAP {activeRaceData[0].laps_completed}
                  </span>
                )}
              </span>
            ) : dataSource === 'mock' ? 'SIMULATED DATA' : dataSource === 'cv' ? 'LIVE (CV OCR)' : liveLabel}
          </div>
        )}
      </div>

      {loading && activeRaceData.length === 0 ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-9 rounded-none" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--surface-elevated)]/40">
                {['Pos', 'Driver', 'Gap', 'Speed / Status', (series === 'nascar' || series.startsWith('nascar-')) ? 'Mfg' : 'Tire'].map((header) => (
                  <th key={header} className="py-2 px-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRaceData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-3 text-center text-[var(--text-muted)] font-mono text-xs italic">
                    Waiting for race session telemetry...
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
                      className={`row-interactive border-b border-[var(--border-hairline)] transition-colors duration-100 cursor-pointer text-xs ${
                        isSelected 
                          ? 'bg-[var(--surface-pressed)] !border-l-2 !border-l-[var(--amber-pit)]' 
                          : isFollowed 
                          ? 'bg-[var(--amber-pit)]/[0.04] !border-l-2 !border-l-[var(--amber-pit)]/60 hover:bg-[var(--surface-elevated)]'
                          : 'hover:bg-[var(--surface-elevated)]'
                      }`}
                      title={`${entry.drivers?.name || entry.driver_id} ${isFollowed ? '(Followed Driver) ' : ''}- Click to focus in Race Replay`}
                    >
                      <td className="py-2 px-2.5">
                        <span className={`font-mono font-bold text-xs tabular-nums ${entry.position === 1 ? 'text-[var(--amber-pit)]' : entry.position <= 3 ? 'text-white' : 'text-[var(--text-muted)]'}`}>
                          {entry.position < 10 ? `0${entry.position}` : entry.position}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-medium text-[13px] text-[var(--text-primary)] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {entry.team_color && (
                            <span 
                              className="w-1 h-3.5 rounded-none shrink-0" 
                              style={{ background: entry.team_color }} 
                            />
                          )}
                          <span className="font-mono font-bold text-xs text-white tracking-wider px-1.5 py-0.2 rounded-none bg-[var(--surface-elevated)] border border-[var(--border-hairline)] shrink-0">
                            {entry.driver_id}
                          </span>
                          {entry.car_number && (
                            <span className="font-mono text-xs px-1 py-0.2 rounded-none text-[var(--text-muted)] shrink-0 tabular-nums">
                              #{entry.car_number}
                            </span>
                          )}
                          <span className="font-mono">{entry.drivers?.name || `Car ${entry.driver_id}`}</span>
                          {entry.team_name && (
                            <span className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:inline">
                              &bull; {entry.team_name}
                            </span>
                          )}
                          {isFollowed && (
                            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-[var(--amber-pit)] bg-[var(--amber-pit)]/15 border border-[var(--amber-pit)]/30 px-1 py-0.2 rounded-none shrink-0">
                              <Star size={9} className="fill-[var(--amber-pit)] text-[var(--amber-pit)]" />
                              FAV
                            </span>
                          )}
                          {entry.drs_active && (
                            <span className="text-[9px] font-mono font-bold text-[var(--flag-green)] bg-[var(--flag-green)]/15 px-1 py-0.2 rounded-none border border-[var(--flag-green)]/40 shrink-0">
                              DRS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-xs tabular-nums">
                        {entry.gap_to_leader === 'PIT' ? (
                          <span className="text-[var(--amber-pit)] font-bold bg-[var(--amber-pit)]/15 border border-[var(--amber-pit)]/30 px-1.5 py-0.2 rounded-none text-[10px] tracking-wider">
                            PIT
                          </span>
                        ) : entry.gap_to_leader === 'OUT' ? (
                          <span className="text-[var(--flag-red)] font-bold bg-[var(--flag-red)]/15 border border-[var(--flag-red)]/30 px-1.5 py-0.2 rounded-none text-[10px] tracking-wider">
                            OUT
                          </span>
                        ) : entry.position === 1 ? (
                          <span className="text-[var(--amber-pit)] font-bold text-[10px] tracking-wider bg-[var(--surface-elevated)] px-1.5 py-0.2 rounded-none border border-[var(--amber-pit)]/30">
                            LEADER
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-medium">
                            {entry.gap_to_leader}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {entry.last_lap}
                      </td>
                      <td className="py-2 px-2.5">
                        {(series === 'nascar' || series.startsWith('nascar-')) && entry.manufacturer ? (
                           <span className="inline-block px-1.5 py-0.2 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--surface-elevated)] text-white border border-[var(--border-hairline)]">
                             {entry.manufacturer}
                           </span>
                        ) : (
                          <span
                            className="inline-block px-1.5 py-0.2 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider"
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
