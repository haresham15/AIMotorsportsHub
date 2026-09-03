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
import { ArrowLeft, ChevronDown, AlertCircle, ShieldCheck, Check, Flame, Star } from 'lucide-react'
import { useSeriesData } from '@/lib/hooks/useSeriesData'
import { RaceData, CVData, Round, DriverStanding, ConstructorStanding } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import PodiumProbability from '@/components/dashboard/PodiumProbability'
import DriverSimilarityMap from '@/components/dashboard/DriverSimilarityMap'
import { useUserProfile } from '@/lib/userPreferences'
import { toast } from 'sonner'

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
  const [replayStandings, setReplayStandings] = useState<RaceData[] | null>(null)
  const [focusedDriverCode, setFocusedDriverCode] = useState<string | null>(null)
  const { profile, isLoggedIn, followedDrivers, isCheckedInForRound, checkIn } = useUserProfile()

  // Clear replay state on round/session change to avoid stale cross-circuit sync
  useEffect(() => {
    setReplayStandings(null)
    setFocusedDriverCode(null)
  }, [series, selectedRound, selectedSessionKey, selectedYear])

  // Unified active standings: Replay takes absolute precedence when active
  const activeTelemetryData = (replayStandings && replayStandings.length > 0) ? replayStandings : liveRaceData

  if (!seriesInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-[var(--text-muted)] opacity-60" />
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
                <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/15 uppercase tracking-wider">{seriesInfo.shortName}</span>
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
                    <span className="font-mono font-black text-[10px] px-1 py-0.5 rounded bg-white/10 text-white border border-white/15 uppercase">{s.shortName}</span>
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

        {/* ===== PADDOCK FAN HQ & RACE CHECK-IN BAR ===== */}
        {isLoggedIn && profile ? (
          <div className="animate-fade-in-up w-full bg-gradient-to-r from-[rgba(25,29,36,0.95)] via-[rgba(20,23,28,0.95)] to-[rgba(15,17,21,0.95)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--amber)]/15 border border-[var(--amber)]/30 flex items-center justify-center font-mono font-bold text-sm text-[var(--amber)] shrink-0 shadow-[0_0_12px_rgba(255,176,32,0.2)]">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={13} />
                    Paddock Fan HQ
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">&bull;</span>
                  <span className="text-xs font-bold text-white">Welcome, {profile.displayName}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2 flex-wrap">
                  {followedDrivers.length > 0 && (
                    <span className="flex items-center gap-1 text-[var(--text-muted)]">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      Following: {followedDrivers.map(d => d.name).slice(0, 2).join(', ')}
                      {followedDrivers.length > 2 ? ` +${followedDrivers.length - 2}` : ''}
                    </span>
                  )}
                  {profile.checkInStreak > 0 && (
                    <span className="text-amber-400 font-mono text-[11px] font-bold flex items-center gap-0.5">
                      <Flame size={12} className="fill-amber-400" />
                      {profile.checkInStreak} Race Streak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Check-In Action Button */}
            <div className="flex items-center gap-3">
              {(() => {
                const currentRoundData = scheduleData?.rounds.find((r) => r.round === selectedRound)
                const isCheckedIn = isCheckedInForRound(selectedRound, series)
                const primaryDriver = followedDrivers.find(d => d.series === series) || followedDrivers[0]

                if (isCheckedIn) {
                  return (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow-sm">
                      <Check size={15} className="text-emerald-400" />
                      <span>CHECKED IN &bull; RD {selectedRound}</span>
                    </div>
                  )
                }

                return (
                  <button
                    onClick={() => {
                      checkIn(
                        selectedRound,
                        series,
                        currentRoundData?.name || `Round ${selectedRound}`,
                        currentRoundData?.circuitName || 'Circuit',
                        primaryDriver ? { code: primaryDriver.code, name: primaryDriver.name, team: primaryDriver.team } : undefined
                      )
                      toast.success(`Checked in for ${currentRoundData?.name || `Round ${selectedRound}`}! Fan streak updated.`)
                    }}
                    className="flex items-center gap-2 py-2 px-4 rounded-xl bg-[var(--amber)] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-[0_0_16px_rgba(255,176,32,0.3)]"
                  >
                    <Flame size={15} />
                    <span>Check In for this Race</span>
                  </button>
                )
              })()}

              <Link
                href="/profile"
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white no-underline transition-colors"
              >
                My Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up w-full bg-white/[0.03] border border-white/10 rounded-[var(--radius-xl)] p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Star size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Browsing as Guest</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Sign in with a Paddock Pass to check in to this race, follow your favorite drivers, and track telemetry across sessions.
                </div>
              </div>
            </div>
            <Link
              href="/login"
              className="btn-primary text-xs py-1.5 px-3.5 no-underline flex items-center gap-1.5"
            >
              <span>Unlock Paddock Pass</span>
              &rarr;
            </Link>
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
                onStandingsChange={setReplayStandings}
                selectedDriverCode={focusedDriverCode}
                onSelectDriver={setFocusedDriverCode}
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
              replayData={replayStandings}
              selectedDriverCode={focusedDriverCode}
              onSelectDriver={setFocusedDriverCode}
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
        <Chatbot series={series} contextData={{ standingsData, cvData, liveRaceData: activeTelemetryData }} />
      </div>
    </div>
  )
}
