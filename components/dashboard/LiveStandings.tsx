'use client'

import { useEffect, useState, useRef } from 'react'
import { BarChart3 } from 'lucide-react'

interface LiveStandingsProps {
  series: string
  sessionKey?: number | null
  dataSource?: "live" | "mock" | "cv"
  externalData?: CVData[]
  onLiveStandingsUpdate?: (data: RaceData[]) => void
}

export interface CVData {
  driver_id: string;
  position: number;
  gap_to_leader: string;
}

export interface RaceData {
  driver_id: string
  position: number
  gap_to_leader: string
  last_lap: string
  tire_compound: string
  drivers?: {
    name: string
    series_id?: string
  }
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (dataSource === 'live' && series === 'f1') {
      // If sessionKey changes, show loading state immediately
      if (sessionKey !== previousSessionKey.current) {
        setLoading(true)
        previousSessionKey.current = sessionKey
      }

      const fetchLiveF1Data = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
          const sessionParam = sessionKey || 'latest';
          // Fetch data from OpenF1
          const [posRes, stintRes, driverRes, intervalRes] = await Promise.all([
            fetch(`https://api.openf1.org/v1/position?session_key=${sessionParam}`),
            fetch(`https://api.openf1.org/v1/stints?session_key=${sessionParam}`),
            fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionParam}`),
            fetch(`https://api.openf1.org/v1/intervals?session_key=${sessionParam}`)
          ]);

          const [posData, stintData, driverData, intervalData] = await Promise.all([
            posRes.json(), stintRes.json(), driverRes.json(), intervalRes.json()
          ]);

          if (!Array.isArray(posData) || !Array.isArray(driverData)) {
            console.warn("OpenF1 API Rate Limited or invalid data. Falling back to mock data.");
            throw new Error("Invalid API Response");
          }

          // Process positions (get latest for each driver)
          const latestPositions = new Map<number, number>();
          for (const p of posData) {
            latestPositions.set(p.driver_number, p.position);
          }

          // Process stints (get latest for each driver)
          const latestStints = new Map<number, string>();
          for (const s of stintData) {
            latestStints.set(s.driver_number, s.compound || 'Unknown');
          }
          
          // Process intervals
          const latestIntervals = new Map<number, number>();
          for (const i of intervalData) {
            if (i.gap_to_leader !== null && i.gap_to_leader !== undefined) {
              latestIntervals.set(i.driver_number, i.gap_to_leader);
            }
          }

          // Build race data array
          const newRaceData: RaceData[] = [];
          for (const d of driverData) {
            const pos = latestPositions.get(d.driver_number);
            if (pos !== undefined) {
              const gap = latestIntervals.get(d.driver_number);
              newRaceData.push({
                driver_id: d.driver_number.toString(),
                position: pos,
                gap_to_leader: gap === 0 || gap === undefined ? 'Interval' : `+${gap.toFixed(3)}`,
                last_lap: 'Live',
                tire_compound: latestStints.get(d.driver_number) || 'Unknown',
                drivers: {
                  name: d.full_name,
                  series_id: 'f1'
                }
              });
            }
          }

          // Sort by position
          newRaceData.sort((a, b) => a.position - b.position);
          const top20 = newRaceData.slice(0, 20)
          setRaceData(top20); // Top 20
          if (onLiveStandingsUpdate) onLiveStandingsUpdate(top20)
          setLoading(false);
        } catch (err) {
          console.error("Error fetching live F1 data", err);
          if (raceData.length === 0) {
            // Fall back to mock data
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
          const mapped = currentData.map(d => {
            if (d.position === 1) return d;
            let currentGap = parseFloat(d.gap_to_leader.replace('+', ''))
            if (isNaN(currentGap)) currentGap = 0;
            const change = (Math.random() * 0.4 - 0.2)
            const newGap = Math.max(0, currentGap + change).toFixed(3)
            
            const lapMs = 90000 + (Math.random() * 2000 - 1000)
            const mins = Math.floor(lapMs / 60000)
            const secs = ((lapMs % 60000) / 1000).toFixed(3)
            const newLap = `${mins}:${secs.padStart(6, '0')}`

            return { ...d, gap_to_leader: `+${newGap}`, last_lap: newLap }
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
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16,185,129,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
          }}>
            <BarChart3 size={16} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Live Timing</h2>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{
              height: '44px',
              borderRadius: 'var(--radius-sm)',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            textAlign: 'left',
            borderCollapse: 'collapse',
            tableLayout: 'auto',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Pos', 'Driver', 'Gap', 'Last Lap', 'Tire'].map((header) => (
                  <th key={header} style={{
                    padding: '0 12px 12px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {raceData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: '40px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}>
                    Waiting for race session data...
                  </td>
                </tr>
              ) : (
                raceData.map((entry) => {
                  const tireColor = getTireColor(entry.tire_compound)
                  return (
                    <tr key={entry.driver_id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.2s',
                      cursor: 'default',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '14px',
                          color: entry.position <= 3 ? '#fbbf24' : 'var(--text-primary)',
                        }}>
                          {entry.position}
                        </span>
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.drivers?.name || 'Unknown'}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        {entry.gap_to_leader}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        {entry.last_lap}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: tireColor.bg,
                          color: tireColor.text,
                          border: `1px solid ${tireColor.border}`,
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
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
