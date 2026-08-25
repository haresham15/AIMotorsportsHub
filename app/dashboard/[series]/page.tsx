'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SERIES_MAP } from '@/lib/data'
import AiSummary from '@/components/dashboard/AiSummary'
import MySupported from '@/components/dashboard/MySupported'
import LiveStandings, { RaceData } from '@/components/dashboard/LiveStandings'
import LiveMap2D from '@/components/dashboard/LiveMap2D'
import Chatbot from '@/components/dashboard/Chatbot'
import StrategyPredictor from '@/components/dashboard/StrategyPredictor'
import WhereToWatch from '@/components/dashboard/WhereToWatch'
import TeamHistory from '@/components/dashboard/TeamHistory'
import FantasyGame from '@/components/dashboard/FantasyGame'
import AlertSettings from '@/components/dashboard/AlertSettings'
import BroadcastScanner, { CVData } from '@/components/dashboard/BroadcastScanner'
import RoundNavigator, { Round } from '@/components/dashboard/RoundNavigator'
import ChampionshipStandings, { DriverStanding, ConstructorStanding } from '@/components/dashboard/ChampionshipStandings'
import { ArrowLeft } from 'lucide-react'

export default function SeriesDashboard() {
  const params = useParams()
  const series = params.series as string
  const seriesInfo = SERIES_MAP[series]

  const [scheduleData, setScheduleData] = useState<{currentRound: number, rounds: Round[]} | null>(null)
  const [standingsData, setStandingsData] = useState<{driverStandings: DriverStanding[], constructorStandings: ConstructorStanding[]} | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null)
  const [isScanningActive, setIsScanningActive] = useState(false)
  const [cvData, setCvData] = useState<CVData[]>([])
  const [liveRaceData, setLiveRaceData] = useState<RaceData[]>([])

  useEffect(() => {
    if (series !== 'f1') return
    
    const fetchData = async () => {
      try {
        const [scheduleRes, standingsRes] = await Promise.all([
          fetch(`/api/f1/schedule?year=${selectedYear}`),
          fetch(`/api/f1/standings?year=${selectedYear}`)
        ])
        
        const schedule = await scheduleRes.json()
        const standings = await standingsRes.json()
        
        setScheduleData(schedule)
        setStandingsData(standings)
        setSelectedRound(schedule.currentRound)
        
        const currentRoundData = schedule.rounds.find((r: Round) => r.round === schedule.currentRound)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raceSession = currentRoundData?.sessions.find((s: any) => s.name === 'Race') || currentRoundData?.sessions[0]
        if (raceSession) setSelectedSessionKey(raceSession.key)
      } catch (err) {
        console.error('Error fetching F1 data:', err)
      }
    }
    
    fetchData()
  }, [series, selectedYear])


  if (!seriesInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ fontSize: '48px' }}>🚫</div>
        <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600 }}>
          Series not found
        </div>
        <Link href="/" className="btn-primary">
          Back to Hub
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}
      className={`series-${series}`}
    >
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{
              fontSize: '18px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)'
            }}>
              <span style={{ fontSize: '20px' }}>🏎️</span>
              <span className="hide-mobile">Motorsport Hub</span>
            </Link>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '20px',
              fontWeight: 200,
            }}>/</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '18px' }}>{seriesInfo.icon}</span>
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}>
                {seriesInfo.name}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" className="btn-ghost" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}>
              <ArrowLeft size={14} />
              <span className="hide-mobile">Back</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Series color accent bar */}
      <div style={{
        height: '2px',
        background: seriesInfo.gradient,
        opacity: 0.5,
      }} />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* ===== HERO MAP ===== */}
        <div className="animate-fade-in-up delay-100" style={{ 
          width: '100%', 
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          marginBottom: '32px',
        }}>
          {(() => {
            const currentRoundData = scheduleData?.rounds.find((r) => r.round === selectedRound)
            
            return (
              <LiveMap2D 
                series={series} 
                round={selectedRound} 
                sessionKey={selectedSessionKey} 
                circuitName={currentRoundData?.circuitName}
                country={currentRoundData?.country}
                driverStandings={standingsData?.driverStandings}
              />
            )
          })()}
        </div>

        {/* ===== AI SUMMARY & NAVIGATION ===== */}
        <div className="animate-fade-in-up" style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AiSummary series={series} />
          
          {series === 'f1' && scheduleData && (
            <RoundNavigator 
              rounds={scheduleData.rounds}
              selectedRound={selectedRound}
              onSelectRound={(r) => setSelectedRound(r)}
              selectedSessionKey={selectedSessionKey}
              onSelectSession={(k) => setSelectedSessionKey(k)}
              year={selectedYear}
              onYearChange={(y) => setSelectedYear(y)}
            />
          )}
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '40px',
        }}>
          
          {/* Missing Live Data Banner (Non-F1) */}
          {series !== 'f1' && !isScanningActive && (
            <div className="animate-fade-in-up delay-100">
              <div className="card glass-hover" style={{ 
                padding: '16px 24px', 
                borderRadius: 'var(--radius-xl)', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Missing Live Data?</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Use Computer Vision to extract standings directly from a race broadcast.</p>
                </div>
                <button onClick={() => setIsScanningActive(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  Sync via Broadcast
                </button>
              </div>
            </div>
          )}
          
          {isScanningActive && (
            <div className="animate-fade-in-up delay-100">
              <BroadcastScanner onScan={setCvData} onClose={() => { setIsScanningActive(false); setCvData([]); }} />
            </div>
          )}

          {/* Standings Table (Borderless integration) */}
          <div className="animate-fade-in-up delay-150">
            <LiveStandings 
              series={series} 
              sessionKey={selectedSessionKey}
              dataSource={series === 'f1' ? 'live' : isScanningActive ? 'cv' : 'mock'} 
              externalData={cvData}
              onLiveStandingsUpdate={setLiveRaceData}
            />
          </div>

          {/* Championship Standings */}
          <div className="animate-fade-in-up delay-200">
            {series === 'f1' && standingsData && (
              <ChampionshipStandings 
                drivers={standingsData.driverStandings} 
                constructors={standingsData.constructorStandings} 
              />
            )}
          </div>

          {/* Secondary Information Grid */}
          <div className="animate-fade-in-up delay-200" style={{ marginBottom: '24px' }}>
            <FantasyGame series={series} round={selectedRound} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '16px',
            paddingTop: '40px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div className="animate-fade-in-up delay-200">
              <MySupported series={series} />
            </div>
            <div className="animate-fade-in-up delay-250">
              <StrategyPredictor />
            </div>
            <div className="animate-fade-in-up delay-300">
              <TeamHistory series={series} />
            </div>
            <div className="animate-fade-in-up delay-400">
              <WhereToWatch series={series} />
            </div>
            <div className="animate-fade-in-up delay-500">
              <AlertSettings />
            </div>
          </div>

        </div>
      </main>

      {/* ===== FLOATING CHATBOT WIDGET ===== */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
      }}>
        <Chatbot series={series} contextData={{ standingsData, cvData, liveRaceData }} />
      </div>
    </div>
  )
}
