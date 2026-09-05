'use client'

import { useState, useEffect } from 'react'
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
import { RaceData, CVData } from '@/lib/types'
import { isSessionInProgress, findMostRecentSession } from '@/lib/seriesSchedules'
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
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Reset replay state during render on round/session change to avoid stale cross-circuit sync
  const [prevSelectionKey, setPrevSelectionKey] = useState(`${series}-${selectedRound}-${selectedSessionKey}-${selectedYear}`)
  const currentSelectionKey = `${series}-${selectedRound}-${selectedSessionKey}-${selectedYear}`

  if (prevSelectionKey !== currentSelectionKey) {
    setPrevSelectionKey(currentSelectionKey)
    setReplayStandings(null)
    setFocusedDriverCode(null)
  }

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
      <div className="bg-[var(--surface-console)] border-b border-[var(--border-hairline)] px-6 py-2.5 sticky top-[58px] z-40">
        <div className="max-w-[1280px] mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Series Switcher Pill */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[var(--surface-elevated)] hover:bg-[var(--surface-pressed)] border border-[var(--border-hairline)] transition-colors cursor-pointer text-xs font-mono font-bold text-[var(--text-primary)]">
                <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded-xs bg-black/40 text-white uppercase tracking-wider">{seriesInfo.shortName}</span>
                <span>{seriesInfo.name}</span>
                <ChevronDown size={14} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
              </button>

              {/* Series Switcher Dropdown */}
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-[var(--surface-console)] border border-[var(--border-hairline)] rounded-sm shadow-xl p-1.5 hidden group-hover:block z-50">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-2.5 py-1.5 border-b border-[var(--border-hairline)] mb-1">Select Motorsport</div>
                {SERIES.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/${s.id}`}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xs text-xs transition-colors no-underline font-mono ${
                      s.id === series
                        ? 'bg-[var(--surface-elevated)] text-[var(--amber-pit)] font-bold border-l-2 border-l-[var(--amber-pit)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="font-mono font-black text-[10px] px-1 py-0.5 rounded-xs bg-black/40 text-white uppercase">{s.shortName}</span>
                    <span>{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Live/Simulated Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${series === 'f1' || series === 'nascar' || series.startsWith('nascar-') ? 'bg-[var(--flag-green)] shadow-[0_0_6px_var(--flag-green)] animate-pulse' : 'bg-[var(--amber-pit)] shadow-[0_0_6px_var(--amber-pit)]'}`} />
              <span className="text-[var(--text-secondary)] font-medium tracking-wider">
                {series === 'f1' || series === 'nascar' || series.startsWith('nascar-') ? 'LIVE TELEMETRY' : 'SIMULATION ENGINE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="btn-ghost text-xs flex items-center gap-1.5 no-underline py-1.5 px-3 font-mono">
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
        {series !== 'f1' && series !== 'nascar' && !series.startsWith('nascar-') && (
          <div className="console-panel p-4 mb-6 flex items-center justify-between border-l-2 border-l-[var(--amber-pit)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-[var(--amber-pit)]/10 border border-[var(--amber-pit)]/30 flex items-center justify-center text-[var(--amber-pit)]">
                <span className="font-mono font-bold text-xs">i</span>
              </div>
              <div>
                <div className="text-[11px] font-mono font-bold text-[var(--amber-pit)] uppercase tracking-wider">Simulated Data Engine</div>
                <div className="text-[13px] text-[var(--text-secondary)]">Live telemetry streaming in development for this series. Running simulated physics loop.</div>
              </div>
            </div>
          </div>
        )}

        {/* ===== PADDOCK FAN HQ & RACE CHECK-IN BAR ===== */}
        {isLoggedIn && profile ? (
          <div className="console-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-none bg-[var(--surface-elevated)] border border-[var(--amber-pit)]/40 flex items-center justify-center font-mono font-bold text-xs text-[var(--amber-pit)] shrink-0">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[var(--amber-pit)] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={13} />
                    Paddock Fan HQ
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">&bull;</span>
                  <span className="text-xs font-bold text-white">Welcome, {profile.displayName}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2 flex-wrap font-mono">
                  {followedDrivers.length > 0 && (
                    <span className="flex items-center gap-1 text-[var(--text-muted)]">
                      <Star size={12} className="text-[var(--amber-pit)] fill-[var(--amber-pit)]" />
                      Following: {followedDrivers.map(d => d.name).slice(0, 2).join(', ')}
                      {followedDrivers.length > 2 ? ` +${followedDrivers.length - 2}` : ''}
                    </span>
                  )}
                  {profile.checkInStreak > 0 && (
                    <span className="text-[var(--amber-pit)] font-mono text-[11px] font-bold flex items-center gap-0.5 tabular-nums">
                      <Flame size={12} className="fill-[var(--amber-pit)]" />
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
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-[var(--flag-green)]/15 border border-[var(--flag-green)]/40 text-[var(--flag-green)] font-mono text-xs font-bold">
                      <Check size={14} className="text-[var(--flag-green)]" />
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
                    className="flex items-center gap-2 py-1.5 px-3.5 rounded-xs bg-[var(--amber-pit)] hover:bg-[var(--amber-pit-hover)] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Flame size={14} />
                    <span>Check In for this Race</span>
                  </button>
                )
              })()}

              <Link
                href="/profile"
                className="py-1.5 px-3 rounded-xs bg-[var(--surface-elevated)] hover:bg-[var(--surface-pressed)] border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] no-underline transition-colors"
              >
                My Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="console-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-[var(--surface-elevated)] border border-[var(--amber-pit)]/40 flex items-center justify-center text-[var(--amber-pit)] shrink-0">
                <Star size={15} />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">Browsing as Guest</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Sign in with a Paddock Pass to check in to this race, follow your favorite drivers, and track telemetry across sessions.
                </div>
              </div>
            </div>
            <Link
              href="/login"
              className="btn-primary text-xs py-1.5 px-3.5 no-underline flex items-center gap-1.5 rounded-xs font-mono"
            >
              <span>Unlock Paddock Pass</span>
              &rarr;
            </Link>
          </div>
        )}

        {/* ===== HERO MAP ===== */}
        <div className="console-panel overflow-hidden mb-8">
          {(() => {
            const currentRoundData = scheduleData?.rounds.find((r) => r.round === selectedRound)
            const currentSession = currentRoundData?.sessions?.find((s) => s.key === selectedSessionKey) || findMostRecentSession(currentRoundData)
            const sessionType = currentSession?.name || 'Race'
            const sessionStartTime = currentSession?.dateStart || (currentRoundData?.date ? `${currentRoundData.date}T${currentRoundData.time || '00:00:00Z'}` : null)

            const isSessionLive = currentRoundData?.status === 'live' || isSessionInProgress(currentSession)
            const detailedEventName = currentRoundData
              ? `${currentRoundData.name || currentRoundData.circuitName} - ${sessionType}`
              : `${series.toUpperCase()} - ${sessionType}`
            
            return (
              <LiveMap2D 
                series={series} 
                round={selectedRound} 
                year={selectedYear}
                sessionKey={selectedSessionKey} 
                sessionType={sessionType}
                circuitName={currentRoundData?.circuitName}
                eventName={detailedEventName}
                country={currentRoundData?.country}
                driverStandings={standingsData?.driverStandings}
                onStandingsChange={setReplayStandings}
                selectedDriverCode={focusedDriverCode}
                onSelectDriver={setFocusedDriverCode}
                isLiveSession={isSessionLive}
                sessionStartTime={sessionStartTime}
                roundStatus={currentRoundData?.status}
                cvData={cvData}
              />
            )
          })()}
        </div>

        {/* ===== AI SUMMARY & NAVIGATION ===== */}
        <div className="flex flex-col gap-6 mb-8">
          <AiSummary series={series} />
          
          {scheduleData && scheduleData.rounds?.length > 0 && (
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
          
          {/* Missing Live Data Banner (Non-Live Series) */}
          {series !== 'f1' && series !== 'nascar' && !series.startsWith('nascar-') && !isScanningActive && (
            <div className="lg:col-span-3">
              <div className="console-panel px-5 py-3.5 flex justify-between items-center">
                <div>
                  <h3 className="m-0 text-sm font-bold uppercase tracking-wider font-mono">Missing Live Data?</h3>
                  <p className="m-0 text-xs text-[var(--text-muted)]">Use Computer Vision OCR to extract standings directly from a live race broadcast.</p>
                </div>
                <button onClick={() => setIsScanningActive(true)} className="btn-primary px-3.5 py-1.5 text-xs font-mono">
                  Sync via Broadcast
                </button>
              </div>
            </div>
          )}
          {isScanningActive && (
            <BroadcastScanner 
              series={series} 
              onScan={setCvData} 
              onClose={() => { setIsScanningActive(false); setCvData([]); }} 
            />
          )}

          {/* Standings Table (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <LiveStandings 
              series={series} 
              sessionKey={selectedSessionKey}
              dataSource={isScanningActive ? 'cv' : series === 'f1' || series === 'nascar' || series.startsWith('nascar-') ? 'live' : 'mock'} 
              externalData={cvData}
              replayData={replayStandings}
              selectedDriverCode={focusedDriverCode}
              onSelectDriver={setFocusedDriverCode}
              onLiveStandingsUpdate={setLiveRaceData}
            />
          </div>

          {/* Right Column: Championship Standings & Fantasy Game */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            <div className="h-[500px]">
              {series === 'f1' && standingsData && (
                <ChampionshipStandings 
                  drivers={standingsData.driverStandings} 
                  constructors={standingsData.constructorStandings} 
                />
              )}
            </div>

            <div>
              <FantasyGame series={series} round={selectedRound} />
            </div>
          </div>
        </div>

        {/* Secondary Information Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 mt-8 pt-8 border-t border-[var(--border-hairline)]">
            <div>
              <MySupported series={series} />
            </div>
            <div>
              <StrategyPredictor />
            </div>
            {series === 'f1' && <div><PodiumProbability /></div>}
            <div>
              <TeamHistory series={series} />
            </div>
            <div>
              <Link href="/history" className="block console-panel console-panel-interactive p-5 no-underline h-full">
                <div className="text-[10px] font-mono text-[var(--amber-pit)] uppercase tracking-wider mb-1 font-bold">Historical Archive</div>
                <h3 className="m-0 text-base font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 font-[family-name:var(--font-disp)]">Grand Prix History</h3>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-[1.6]">Explore past seasons, historical standings, driver head-to-heads, and track records.</p>
              </Link>
            </div>
            <div>
              <WhereToWatch series={series} />
            </div>
            <div>
              <AlertSettings />
            </div>
          </div>
          {series === 'f1' && <div className="mt-8"><DriverSimilarityMap /></div>}
      </main>

      {/* ===== FLOATING CHATBOT WIDGET ===== */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <Chatbot series={series} contextData={{ standingsData, cvData, liveRaceData: activeTelemetryData }} />
      </div>
    </div>
  )
}
