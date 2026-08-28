'use client'

import { useEffect, useState, useRef } from 'react'
import { BarChart3 } from 'lucide-react'

import { CVData, RaceData } from '@/lib/types'

interface LiveStandingsProps {
  series: string
  sessionKey?: number | null
  dataSource?: "live" | "mock" | "cv"
  externalData?: CVData[]
  onLiveStandingsUpdate?: (data: RaceData[]) => void
}

const INITIAL_DATA: RaceData[] = [
  { driver_id: '1', position: 1, gap_to_leader: 'Interval', last_lap: '1:30.231', tire_compound: 'Medium', drivers: { name: 'Max Verstappen', series_id: 'f1' } },
  { driver_id: '2', position: 2, gap_to_leader: '+2.145', last_lap: '1:30.412', tire_compound: 'Hard', drivers: { name: 'Lando Norris', series_id: 'f1' } },
  { driver_id: '3', position: 3, gap_to_leader: '+5.321', last_lap: '1:30.655', tire_compound: 'Medium', drivers: { name: 'Charles Leclerc', series_id: 'f1' } },
  { driver_id: '4', position: 4, gap_to_leader: '+12.433', last_lap: '1:31.002', tire_compound: 'Hard', drivers: { name: 'Lewis Hamilton', series_id: 'f1' } },
  { driver_id: '5', position: 5, gap_to_leader: '+18.991', last_lap: '1:31.123', tire_compound: 'Soft', drivers: { name: 'Oscar Piastri', series_id: 'f1' } },
]

export default function LiveStandings({ series, sessionKey, dataSource = "mock", externalData, onLiveStandingsUpdate }: LiveStandingsProps) {
  const [raceData, setRaceData] = useState<RaceData[]>([])
  const [loading, setLoading] = useState(true)
  const isFetchingRef = useRef(false)
  const previousSessionKey = useRef(sessionKey)
  const hasLiveData = useRef(false)
  const lastAlertedEventRef = useRef<string | null>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (dataSource === 'live' && series === 'f1') {
      // If sessionKey changes, show loading state immediately
      if (previousSessionKey.current !== sessionKey) {
        setLoading(true)
        previousSessionKey.current = sessionKey
        hasLiveData.current = false // reset on session change
      }

      const fetchLiveF1Data = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
          const sessionParam = sessionKey || 'latest';
          
          const response = await fetch(`/api/f1/live?sessionKey=${sessionParam}`);
          if (!response.ok) {
            console.warn("OpenF1 Proxy failed or is rate limited. Falling back to mock data.");
            if (!hasLiveData.current) {
              const filtered = INITIAL_DATA.filter(d => d.drivers?.series_id === series || series === 'f1')
              setRaceData(filtered)
              if (onLiveStandingsUpdate) onLiveStandingsUpdate(filtered)
            }
            setLoading(false);
            return;
          }

          const raceData: RaceData[] = await response.json();

          // We omitted Race Control alerts from the proxy for simplicity, but could add it back.
          // For now, we will just set the new race data.

          const top20 = raceData.slice(0, 20);
          setRaceData(top20);
          if (onLiveStandingsUpdate) onLiveStandingsUpdate(top20);
          setLoading(false);
          hasLiveData.current = true;
        } catch (err) {
          // Silent fallback instead of loud console.error
          if (!hasLiveData.current) {
            const filtered = INITIAL_DATA.filter(d => d.drivers?.series_id === series || series === 'f1')
            setRaceData(filtered)
            if (onLiveStandingsUpdate) onLiveStandingsUpdate(filtered)
          }
          setLoading(false);
        } finally {
          isFetchingRef.current = false;
        }
      };

      fetchLiveF1Data();
      intervalId = setInterval(fetchLiveF1Data, 10000); // Poll every 10 seconds

    } else if (dataSource === 'cv') {
      if (externalData && externalData.length > 0) {
        // Map CVData to RaceData
        const newData = externalData.map(d => ({
          driver_id: d.driver_id,
          position: d.position,
          gap_to_leader: d.gap_to_leader,
          last_lap: 'Live',
          tire_compound: 'Unknown',
          drivers: { name: d.driver_id, series_id: series }
        }));
        setRaceData(newData);
        if (onLiveStandingsUpdate) onLiveStandingsUpdate(newData)
        setLoading(false);
      } else if (raceData.length === 0) {
        setLoading(false); // Waiting for CV scan
      }
    } else {
      // Mock logic
      const filtered = INITIAL_DATA.filter(d => d.drivers?.series_id === series || series === 'f1')
      setRaceData(filtered)
      if (onLiveStandingsUpdate) onLiveStandingsUpdate(filtered)
      setLoading(false)

      intervalId = setInterval(() => {
        setRaceData(currentData => {
          const withAbsolute = currentData.map(d => {
            let gap = 0
            if (d.gap_to_leader !== 'Interval' && d.gap_to_leader !== 'LEADER') {
               gap = parseFloat(d.gap_to_leader.replace('+', '')) || 0
            }
            const change = (Math.random() * 0.4 - 0.15) // slight bias to spread out
            return { ...d, _absoluteTime: gap + change }
          })

          if (withAbsolute.length === 0) return []

          withAbsolute.sort((a, b) => a._absoluteTime - b._absoluteTime)
          const leaderTime = withAbsolute[0]._absoluteTime

          const mapped = withAbsolute.map((d, index) => {
            const position = index + 1
            let newGapStr = 'Interval'
            
            if (position > 1) {
              const newGap = Math.max(0, d._absoluteTime - leaderTime).toFixed(3)
              newGapStr = `+${newGap}`
            }

            const lapMs = 90000 + (Math.random() * 2000 - 1000)
            const mins = Math.floor(lapMs / 60000)
            const secs = ((lapMs % 60000) / 1000).toFixed(3)
            const newLap = `${mins}:${secs.padStart(6, '0')}`

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _absoluteTime, ...rest } = d
            return { ...rest, position, gap_to_leader: newGapStr, last_lap: newLap } as RaceData
          })

          if (onLiveStandingsUpdate) onLiveStandingsUpdate(mapped)
          return mapped
        })
      }, 3000)
    }

    return () => clearInterval(intervalId)
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
            {dataSource === 'mock' ? 'SIMULATED DATA' : dataSource === 'cv' ? 'LIVE (CV OCR)' : 'LIVE (OPENF1)'}
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
                {['Pos', 'Driver', 'Gap', 'Last Lap', 'Tire'].map((header) => (
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
                        <span 
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em]"
                          style={{
                            background: tireColor.bg,
                            color: tireColor.text,
                            border: `1px solid ${tireColor.border}`
                          }}
                        >
                          {entry.tire_compound}
                        </span>
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
