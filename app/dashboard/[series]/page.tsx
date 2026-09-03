'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SERIES, SERIES_MAP } from '@/lib/data'
import AiSummary from '@/components/dashboard/AiSummary'
import MySupported from '@/components/dashboard/MySupported'
import LiveStandings from '@/components/dashboard/LiveStandings'
import LiveMap2D from '@/components/dashboard/LiveMap2D'
import Chatbot from '@/components/dashboard/Chatbot'
import StrategyPredictor from '@/components/dashboard/StrategyPredictor'
import WhereToWatch from '@/components/dashboard/WhereToWatch'
import TeamHistory from '@/components/dashboard/TeamHistory'
import FantasyGame from '@/components/dashboard/FantasyGame'
import AlertSettings from '@/components/dashboard/AlertSettings'
import BroadcastScanner from '@/components/dashboard/BroadcastScanner'
import RoundNavigator from '@/components/dashboard/RoundNavigator'
import ChampionshipStandings from '@/components/dashboard/ChampionshipStandings'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useSeriesData } from '@/lib/hooks/useSeriesData'
import { RaceData, CVData, Round, DriverStanding, ConstructorStanding } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import PodiumProbability from '@/components/dashboard/PodiumProbability'
import DriverSimilarityMap from '@/components/dashboard/DriverSimilarityMap'

export default function SeriesDashboard() {
  const params = useParams()
  const series = params.series as string
  const seriesInfo = SERIES_MAP[series]

  const {
    scheduleData,
    standingsData,
    selectedRound,
    setSelectedRound,
    selectedSessionKey,
    setSelectedSessionKey,
    selectedYear,
    setSelectedYear
  } = useSeriesData(series)

  const [isScanningActive, setIsScanningActive] = useState(false)
  const [cvData, setCvData] = useState<CVData[]>([])
  const [liveRaceData, setLiveRaceData] = useState<RaceData[]>([])

  if (!seriesInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🚫</div>
        <div className="text-[var(--text-primary)] text-xl font-semibold">
          Series not found
        </div>
        <Link href="/" className="btn-primary">
          Back to Hub
        </Link>
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative series-${series}`}>
      {/* ===== RACE CONTROL SUB-BAR ===== */}
      <div className="bg-[rgba(20,23,28,0.75)] backdrop-blur-md border-b border-[var(--border-subtle)] px-6 py-3 sticky top-[68px] z-40">
        <div className="max-w-[1280px] mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Series Switcher Pill */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-subtle)] transition-colors cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                <span className="text-base">{seriesInfo.icon}</span>
                <span>{seriesInfo.name}</span>
                <ChevronDown size={14} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
              </button>

              {/* Series Switcher Dropdown */}
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-fade-in-up">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-3 py-1">Select Motorsport</div>
                {SERIES.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/${s.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors no-underline ${
                      s.id === series
                        ? 'bg-[var(--surface-elevated)] text-[var(--amber)] font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Live/Simulated Status Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-[var(--border-subtle)] text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${series === 'f1' || series.startsWith('nascar-') ? 'bg-[var(--green-flag)] shadow-[0_0_8px_var(--green-flag)] animate-pulse' : 'bg-[var(--amber)] shadow-[0_0_8px_var(--amber)]'}`} />
              <span className="text-[var(--text-secondary)] font-medium">
                {series === 'f1' || series.startsWith('nascar-') ? 'LIVE TELEMETRY' : 'SIMULATION ENGINE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="btn-ghost text-xs flex items-center gap-1.5 no-underline py-1.5 px-3">
              <ArrowLeft size={13} />
              <span>Paddock Hub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Series color accent bar */}
      <div 
        className="h-[2px] opacity-70"
        style={{ background: seriesInfo.gradient }} 
      />

      <main className="max-w-[1280px] mx-auto px-6 pt-8 pb-20">
        
        {/* Roadmap Indicator for Non-Live Series */}
        {series !== 'f1' && !series.startsWith('nascar-') && (
          <div className="animate-fade-in-up w-full bg-[var(--graphite-900)] border border-[var(--amber-dim)] rounded-[var(--radius-lg)] p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[rgba(255,176,32,0.1)] flex items-center justify-center text-[var(--amber)]">
                <span className="font-[family-name:var(--font-mono)] font-bold">i</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--amber)] uppercase tracking-[0.05em]">Simulated Data</div>
                <div className="text-[14px] text-[var(--text-secondary)]">Live telemetry coming soon for this series. Using simulation engine.</div>
              </div>
            </div>
          </div>
        )}

        {/* ===== HERO MAP ===== */}
        <div className="animate-fade-in-up delay-100 w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden mb-8">
          {(() => {
            const currentRoundData = scheduleData?.rounds.find((r) => r.round === selectedRound)
            const currentSession = currentRoundData?.sessions.find((s) => s.key === selectedSessionKey)
            const sessionType = currentSession?.name || 'Race'
            
            return (
              <LiveMap2D 
                series={series} 
                round={selectedRound} 
                sessionKey={selectedSessionKey} 
                sessionType={sessionType}
                circuitName={currentRoundData?.circuitName}
                country={currentRoundData?.country}
                driverStandings={standingsData?.driverStandings}
              />
            )
          })()}
        </div>

        {/* ===== AI SUMMARY & NAVIGATION ===== */}
        <div className="animate-fade-in-up flex flex-col gap-6 mb-8">
          <AiSummary series={series} />
          
          {(series === 'f1' || series.startsWith('nascar-')) && scheduleData && (
            <RoundNavigator 
              rounds={scheduleData.rounds}
              series={series}
              selectedRound={selectedRound}
              onSelectRound={(r) => setSelectedRound(r)}
              selectedSessionKey={selectedSessionKey}
              onSelectSession={(k) => setSelectedSessionKey(k)}
              year={selectedYear}
              onYearChange={(y) => setSelectedYear(y)}
              availableYears={scheduleData.availableYears}
            />
          )}
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Missing Live Data Banner (Non-F1) */}
          {series !== 'f1' && !isScanningActive && (
            <div className="animate-fade-in-up delay-100 lg:col-span-3">
              <div className="card glass-hover px-6 py-4 rounded-[var(--radius-xl)] flex justify-between items-center bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div>
                  <h3 className="m-0 text-sm font-semibold">Missing Live Data?</h3>
                  <p className="m-0 text-xs text-[var(--text-muted)]">Use Computer Vision to extract standings directly from a race broadcast.</p>
                </div>
                <button onClick={() => setIsScanningActive(true)} className="btn-primary px-4 py-2 text-xs">
                  Sync via Broadcast
                </button>
              </div>
            </div>
          )}
          
          <Modal isOpen={isScanningActive} onClose={() => { setIsScanningActive(false); setCvData([]); }} title="Broadcast Scanner">
            <BroadcastScanner onScan={setCvData} onClose={() => { setIsScanningActive(false); setCvData([]); }} />
          </Modal>

          {/* Standings Table (Spans 2 columns on large screens) */}
          <div className="animate-fade-in-up delay-150 lg:col-span-2">
            <LiveStandings 
              series={series} 
              sessionKey={selectedSessionKey}
              dataSource={isScanningActive ? 'cv' : series === 'f1' || series.startsWith('nascar-') ? 'live' : 'mock'} 
              externalData={cvData}
              onLiveStandingsUpdate={setLiveRaceData}
            />
          </div>

          {/* Right Column: Championship Standings & Fantasy Game */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            <div className="animate-fade-in-up delay-200 h-[500px]">
              {series === 'f1' && standingsData && (
                <ChampionshipStandings 
                  drivers={standingsData.driverStandings} 
                  constructors={standingsData.constructorStandings} 
                />
              )}
            </div>

            <div className="animate-fade-in-up delay-200">
              <FantasyGame series={series} round={selectedRound} />
            </div>
          </div>
        </div>

        {/* Secondary Information Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 mt-8 pt-10 border-t border-[var(--border-subtle)]">
            <div className="animate-fade-in-up delay-200">
              <MySupported series={series} />
            </div>
            <div className="animate-fade-in-up delay-250">
              <StrategyPredictor />
            </div>
            {series === 'f1' && <div className="animate-fade-in-up delay-250"><PodiumProbability /></div>}
            <div className="animate-fade-in-up delay-300">
              <TeamHistory series={series} />
            </div>
            <div className="animate-fade-in-up delay-350">
              <Link href="/history" className="block card glass-hover p-6 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)] no-underline h-full">
                <h3 className="m-0 text-lg font-semibold text-[var(--amber)] mb-2">Historical Archive</h3>
                <p className="text-sm text-[var(--text-secondary)] m-0 leading-[1.5]">Explore past seasons, historical standings, driver head-to-heads, and track records.</p>
              </Link>
            </div>
            <div className="animate-fade-in-up delay-400">
              <WhereToWatch series={series} />
            </div>
            <div className="animate-fade-in-up delay-500">
              <AlertSettings />
            </div>
          </div>
          {series === 'f1' && <div className="animate-fade-in-up"><DriverSimilarityMap /></div>}
      </main>

      {/* ===== FLOATING CHATBOT WIDGET ===== */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <Chatbot series={series} contextData={{ standingsData, cvData, liveRaceData }} />
      </div>
    </div>
  )
}
