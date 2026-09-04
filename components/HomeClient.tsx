'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SERIES } from '@/lib/data'
import { Zap, Gauge, Flame, Activity, Radio, ChevronRight, ArrowUpRight } from 'lucide-react'

// Authentic Autodromo Nazionale Monza GPS track outline (5.793 km)
const MONZA_TRACK_PATH =
  "M 137.4,139.6 L 140.8,139.6 L 144.4,139.6 L 148.9,139.6 L 155,139.6 L 159.6,139.6 L 164.1,139.6 L 167.7,139.6 L 170.5,139.6 L 175.1,139.6 L 180.7,139.6 L 186.4,139.6 L 190.5,139.6 L 193.9,139.6 L 197.7,139.6 L 202.7,139.6 L 207.6,139.6 L 212.7,139.7 L 217.7,139.7 L 220.7,139.7 L 223.4,139.7 L 226.3,139.4 L 227.9,138.5 L 228.5,137.4 L 228.7,136.6 L 229,136 L 229.7,135.4 L 230.8,135.2 L 231.4,135.2 L 232.6,135.4 L 233.3,135.6 L 235.4,136.4 L 236.8,136.9 L 239.6,137.8 L 242.5,138.7 L 246.3,139.4 L 249.9,139.8 L 253.7,140 L 257.3,140 L 260.9,139.8 L 264.3,139.4 L 267.6,138.7 L 270.6,137.6 L 275.2,135.4 L 277.8,133.8 L 281.6,130.5 L 284.4,127.3 L 286.3,124.5 L 288.9,119.9 L 290.7,114.9 L 292,110.2 L 293,105.5 L 293.8,100.9 L 294.3,97.8 L 294.9,94.4 L 295.9,87.1 L 296.4,83.2 L 297,78.6 L 297.5,74.9 L 298,72.3 L 298.4,71.3 L 299.5,69.5 L 301.4,68.6 L 302.5,67.9 L 303.6,66.7 L 304.6,64.6 L 305,63.4 L 305.5,61.5 L 306.2,59.3 L 307.4,56 L 308.1,54.4 L 309.6,51.1 L 311.1,48.1 L 312.7,44.4 L 313.5,42.7 L 314.4,40.1 L 314.9,37.1 L 314.3,34 L 313,31.8 L 310.8,29.9 L 306.8,28.4 L 302.9,27.6 L 298.5,26.9 L 294.5,26.2 L 289.7,25.4 L 286.8,25 L 283.1,25.5 L 281.4,26.5 L 279.7,28.3 L 277.5,31.6 L 276,34.1 L 275,35.7 L 273.4,38.1 L 269.8,43.5 L 267.3,47 L 264.6,51 L 261.6,55.3 L 258.4,59.4 L 256,61.9 L 253.4,64.7 L 250.7,67.2 L 247.7,70.2 L 245.2,72.5 L 242,75.7 L 238.6,79 L 235.2,82.3 L 232.4,84.9 L 228.7,88.5 L 225.6,91.5 L 222.5,94.5 L 219.3,97.6 L 216,100.8 L 214.1,102.6 L 211.4,104.8 L 209.3,105.5 L 205.7,105.4 L 202.2,105.3 L 199.8,105.7 L 196.5,107.2 L 193.7,109.3 L 190.8,111 L 186.2,111.9 L 178.8,112 L 175.5,112 L 171.5,112 L 166.3,112 L 159.5,112.1 L 153.1,112.1 L 148.3,112.1 L 143.2,112.2 L 139.6,112.2 L 133.6,112.2 L 130.1,112.2 L 126.2,112.2 L 121.3,112.3 L 116.3,112.3 L 110.7,112.3 L 105.9,112.4 L 102.2,112.4 L 96.7,112.6 L 93.9,113 L 89.5,114.2 L 88.2,115.1 L 86.3,117.2 L 85.1,121 L 85.4,124.4 L 86,126 L 88.1,129.5 L 89.9,131.5 L 93.7,134.3 L 96.1,135.5 L 99.1,136.7 L 102.1,137.5 L 105.2,138.1 L 108,138.5 L 111.4,138.8 L 114.6,139 L 118.8,139.3 L 122.4,139.4 L 127.5,139.5 L 132.1,139.6 L 135,139.6 Z"

export default function HomeClient() {
  const [lightsStatus, setLightsStatus] = useState<string>('LIGHTS OUT IN 3.2S')
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({})
  const [telemetryTick, setTelemetryTick] = useState<number>(0)

  // Live telemetry pulse animation for hero HUD
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick((prev) => (prev + 1) % 100)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const fetchSummary = async (e: React.MouseEvent, seriesId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (loadingSummaries[seriesId] || summaries[seriesId]) return

    setLoadingSummaries((prev) => ({ ...prev, [seriesId]: true }))
    try {
      const res = await fetch(`/api/ai/summary?series=${seriesId}`)
      const data = await res.json()
      setSummaries((prev) => ({ ...prev, [seriesId]: data.summary }))
    } catch {
      setSummaries((prev) => ({
        ...prev,
        [seriesId]: "Telemetry briefing temporarily unavailable. Check telemetry feeds directly.",
      }))
    } finally {
      setLoadingSummaries((prev) => ({ ...prev, [seriesId]: false }))
    }
  }

  useEffect(() => {
    const lights = document.querySelectorAll('.start-light')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeoutIds: ReturnType<typeof setTimeout>[] = []
    const scheduleTimeout = (callback: () => void, delay: number) => {
      const timeoutId = setTimeout(callback, delay)
      timeoutIds.push(timeoutId)
      return timeoutId
    }

    if (reduced) {
      lights.forEach((l) => l.classList.add('start-light-lit'))
      setLightsStatus('GREEN FLAG • SESSION ACTIVE')
      return
    }

    let i = 0
    const step = () => {
      if (i < lights.length) {
        lights[i].classList.add('start-light-lit')
        i++
        scheduleTimeout(step, 240)
      } else {
        scheduleTimeout(() => {
          lights.forEach((l) => {
            l.classList.remove('start-light-lit')
            l.classList.add('start-light-go')
          })
          setLightsStatus('GREEN FLAG • SESSION ACTIVE')
        }, 500)
      }
    }

    lights.forEach((l) => {
      l.classList.remove('start-light-lit', 'start-light-go')
    })

    scheduleTimeout(step, 250)
    return () => timeoutIds.forEach(clearTimeout)
  }, [])

  const seriesMeta: Record<string, { rounds: string; teams: string; engine: string; chassis: string }> = {
    f1: { rounds: '24 GRANDS PRIX', teams: '10 TEAMS', engine: '1.6L TURBO V6 HYBRID', chassis: 'FIA SPEC FORMULA 1' },
    f2: { rounds: '14 ROUNDS', teams: '11 TEAMS', engine: '3.4L TURBO V6 MECACHROME', chassis: 'DALLARA F2 2024 SPEC' },
    f3: { rounds: '10 ROUNDS', teams: '10 TEAMS', engine: '3.4L V6 NATURALLY ASPIRATED', chassis: 'DALLARA F3 SPEC' },
    'formula-e': { rounds: '16 E-PRIX', teams: '11 TEAMS', engine: 'GEN3 EVO 350KW ELECTRIC', chassis: 'SPARK RACING TECH' },
    nascar: { rounds: '36 RACES', teams: '15 TEAMS', engine: '5.86L PUSHROD V8 670HP', chassis: 'NASCAR NEXT GEN SPEC' },
    'gt-world-challenge': { rounds: '10 ROUNDS', teams: '24 TEAMS', engine: 'FIA GT3 HOMOLOGATED', chassis: 'MULTI-CONSTRUCTOR GT3' },
    'top-fuel': { rounds: '20 EVENTS', teams: '16 CARS', engine: '500 CID NITRO HEMI 11,000HP', chassis: 'NHRA TUBULAR CHROMOLY' },
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .start-lights { display: flex; gap: 8px; align-items: center; }
        .start-light { width: 13px; height: 13px; border-radius: 50%; background: #14171d; border: 1px solid #28303d; box-shadow: inset 0 1px 2px rgba(0,0,0,0.6); transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s; }
        .start-light-lit { background: var(--flag-red); border-color: #ff5c5c; box-shadow: 0 0 8px rgba(239, 68, 68, 0.75), inset 0 0 2px #fff; }
        .start-light-go { background: var(--green-flag); border-color: #34d399; box-shadow: 0 0 8px rgba(16, 185, 129, 0.75), inset 0 0 2px #fff; }
        .ticker-track { display: flex; white-space: nowrap; animation: marquee 36s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
      `}} />

      {/* ===== HERO CONSOLE: TELEMETRY HUB ===== */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--canvas-base)] pt-8 pb-14">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          {/* Top Status Ticker Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)] font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="start-lights">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="start-light" />
                ))}
              </div>
              <span className="font-bold text-[var(--amber)] tracking-wider">
                {lightsStatus}
              </span>
            </div>

            <div className="flex items-center gap-5 text-[var(--text-muted)] text-[11px] tabular-nums">
              <span>TRACK <strong className="text-white font-bold ml-1">42.8°C</strong></span>
              <span>AIR <strong className="text-white font-bold ml-1">26.4°C</strong></span>
              <span>SAMPLING <strong className="text-[var(--green-flag)] font-bold ml-1">200 HZ</strong></span>
            </div>
          </div>

          {/* Main Console Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
            
            {/* Left Column: Command & Positioning */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="eyebrow mb-2">TELEMETRY HUB</div>
                <h1 className="font-[family-name:var(--font-disp)] text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.92] text-white">
                  EVERY SERIES.<br />
                  ONE <span className="text-[var(--amber)]">TELEMETRY HUB</span>.
                </h1>
                
                <p className="mt-5 text-[15px] sm:text-base text-[var(--text-secondary)] max-w-xl leading-relaxed font-sans">
                  Real-time timing towers, 200 Hz interpolated replays, and AI strategy debriefs across Formula 1, F2, F3, Formula E, NASCAR, GT World Challenge, and NHRA Top Fuel.
                </p>

                {/* Primary Action Row */}
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <a href="#series" className="btn-primary">
                    <span>EXPLORE CHAMPIONSHIPS</span>
                    <ChevronRight size={14} />
                  </a>
                  <a href="#archive" className="btn-ghost">
                    <span>HISTORICAL ARCHIVE</span>
                    <ArrowUpRight size={14} />
                  </a>
                  <Link href="/dashboard/f1" className="btn-ghost text-[var(--amber)] hover:border-[var(--amber)]">
                    <span>LIVE MONZA REPLAY</span>
                  </Link>
                </div>
              </div>

              {/* Clean Technical Specifications (No box-in-a-box lines) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 pt-6 border-t border-[var(--border-hairline)] font-mono">
                <div>
                  <div className="text-[11px] text-[var(--amber)] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge size={13} /> 200 HZ STREAM
                  </div>
                  <div className="text-sm font-bold text-white mt-1">GPS Spline Replays</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">High-rate continuous telemetry</div>
                </div>

                <div>
                  <div className="text-[11px] text-[var(--flag-red)] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={13} /> TIRE DEGRADATION
                  </div>
                  <div className="text-sm font-bold text-white mt-1">Nonlinear Physics</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Stint &amp; compound wear model</div>
                </div>

                <div>
                  <div className="text-[11px] text-[var(--green-flag)] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Radio size={13} /> RACE ENGINEER AI
                  </div>
                  <div className="text-sm font-bold text-white mt-1">Gemini Intelligence</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Automated telemetry debriefs</div>
                </div>
              </div>
            </div>

            {/* Right Column: Unified Monza Telemetry Console */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-[var(--surface-console)] border border-[var(--border-hairline)] rounded-sm p-4 flex flex-col gap-4">
                
                {/* Console Header */}
                <div className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--green-flag)] shadow-[0_0_6px_var(--green-flag)]" />
                    <span className="font-bold text-white tracking-wider text-xs">
                      MONZA LIVE TELEMETRY
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs tabular-nums text-[var(--text-muted)]">
                    <span>CIRCUIT 5.793 KM</span>
                    <span className="text-[var(--amber)] font-bold">LAP 34/53</span>
                  </div>
                </div>

                {/* Instant Readout (Spaced naturally without vertical border fences) */}
                <div className="grid grid-cols-3 gap-4 py-3 px-3.5 bg-[var(--surface-subtle)] rounded-xs font-mono">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">SPEED</div>
                    <div className="text-2xl font-black tabular-nums text-white mt-0.5">
                      {338 + (telemetryTick % 9)} <span className="text-[10px] text-[var(--text-muted)] font-normal">KM/H</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">GEAR</div>
                    <div className="text-2xl font-black text-[var(--amber)] mt-0.5">8</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">DRS STATUS</div>
                    <div className="text-xs font-bold text-[var(--green-flag)] mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)]" />
                      <span>OPEN</span>
                    </div>
                  </div>
                </div>

                {/* Vector Track Circuit Map */}
                <div className="p-3 bg-[#090b0e] rounded-xs relative h-36 flex items-center justify-center border border-[var(--border-hairline)]">
                  <svg viewBox="0 0 400 160" className="w-full h-full">
                    <path
                      d={MONZA_TRACK_PATH}
                      fill="none"
                      stroke="#222834"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={MONZA_TRACK_PATH}
                      fill="none"
                      stroke="#ffb020"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <path
                      d="M 137.4,139.6 L 220,139.7"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* Animated Telemetry Trackers */}
                    <g>
                      <circle r="3.5" fill="#e10600">
                        <animateMotion
                          path={MONZA_TRACK_PATH}
                          dur="9s"
                          repeatCount="indefinite"
                          rotate="auto"
                        />
                      </circle>
                    </g>
                    <g>
                      <circle r="3" fill="#ff8000">
                        <animateMotion
                          path={MONZA_TRACK_PATH}
                          dur="9s"
                          begin="-1.2s"
                          repeatCount="indefinite"
                          rotate="auto"
                        />
                      </circle>
                    </g>
                  </svg>

                  <div className="absolute top-2 left-3 font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <Activity size={11} className="text-[var(--amber)]" />
                    <span>MONZA RETTIFILO T1</span>
                  </div>
                </div>

                {/* Sector Delta Times */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs tabular-nums">
                  <div className="p-2 rounded-xs bg-[var(--surface-subtle)]">
                    <div className="text-[9px] text-[var(--purple-sector)] font-bold uppercase">SECTOR 1</div>
                    <div className="font-bold text-white mt-0.5">27.412s</div>
                  </div>
                  <div className="p-2 rounded-xs bg-[var(--surface-subtle)]">
                    <div className="text-[9px] text-[var(--green-flag)] font-bold uppercase">SECTOR 2</div>
                    <div className="font-bold text-white mt-0.5">26.884s</div>
                  </div>
                  <div className="p-2 rounded-xs bg-[var(--surface-subtle)]">
                    <div className="text-[9px] text-[var(--amber)] font-bold uppercase">SECTOR 3</div>
                    <div className="font-bold text-white mt-0.5">25.320s</div>
                  </div>
                </div>

                {/* Direct Console Replay CTA */}
                <Link
                  href="/dashboard/f1"
                  className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--surface-elevated)] hover:bg-[var(--surface-pressed)] border border-[var(--border-hairline)] hover:border-[var(--amber)] rounded-xs text-xs font-mono text-white transition-colors no-underline group"
                >
                  <span className="font-bold uppercase tracking-wider text-[var(--amber)]">
                    LAUNCH 2D TIMING REPLAY
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-[var(--amber)]" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== TICKER BAND: LIVE SESSION STATUS ===== */}
      <div className="border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)] overflow-hidden">
        <div className="flex items-center">
          <div className="px-4 py-2 bg-[var(--amber)] text-black font-mono font-bold text-[11px] tracking-wider uppercase shrink-0">
            LIVE FEED
          </div>
          <div className="overflow-hidden w-full">
            <div className="ticker-track font-mono text-xs text-[var(--text-secondary)] py-2">
              {[0, 1].map((set) => (
                <div key={set} className="flex shrink-0">
                  <div className="px-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)]" />
                    <strong className="text-white">F1 Australian GP</strong> &mdash; Race Session Confirmed
                  </div>
                  <div className="px-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
                    <strong className="text-white">NASCAR Bristol 500</strong> &mdash; Next Gen Telemetry Active
                  </div>
                  <div className="px-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)]" />
                    <strong className="text-white">Formula E Tokyo E-Prix</strong> &mdash; Gen3 Evo Results Synced
                  </div>
                  <div className="px-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--flag-red)]" />
                    <strong className="text-white">NHRA Winternationals</strong> &mdash; Nitro Qualifying Friday
                  </div>
                  <div className="px-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
                    <strong className="text-white">F2 Championship</strong> &mdash; Sprint Race Points Updated
                  </div>
                  <div className="px-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)]" />
                    <strong className="text-white">GT World Challenge Spa 24H</strong> &mdash; 65 Car Entry List
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHAMPIONSHIP GRID ===== */}
      <section id="series" className="py-16 border-b border-[var(--border-hairline)] bg-[var(--canvas-base)]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <div className="eyebrow">CHAMPIONSHIPS</div>
              <h2 className="font-[family-name:var(--font-disp)] text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                SELECT DISCIPLINE.
              </h2>
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
              REAL-TIME TELEMETRY &bull; TIMING TOWERS &bull; AI RACE DEBRIEFS
            </p>
          </div>

          {/* Clean, Spaced Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERIES.map((sport) => {
              const meta = seriesMeta[sport.id] || {
                rounds: 'SEASON ACTIVE',
                teams: 'PRO GRID',
                engine: 'RACE HOMOLOGATED',
                chassis: 'SERIES SPEC',
              }
              const isFeatured = sport.id === 'f1'

              return (
                <div
                  key={sport.id}
                  className={`bg-[var(--surface-console)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] rounded-sm transition-all p-6 flex flex-col justify-between group ${
                    isFeatured ? 'md:col-span-2 lg:col-span-3' : ''
                  }`}
                >
                  <div>
                    {/* Top Row: Tag, Spec, and Link */}
                    <div className="flex items-start justify-between gap-4 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: sport.color }} />
                        <span className="font-[family-name:var(--font-disp)] text-3xl font-black text-white tracking-wide">
                          {sport.id === 'gt-world-challenge'
                            ? 'GT WORLD CHALLENGE'
                            : sport.id === 'top-fuel'
                            ? 'NHRA TOP FUEL'
                            : sport.id === 'formula-e'
                            ? 'FORMULA E'
                            : sport.name.toUpperCase()}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-xs bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-white text-[11px] font-bold">
                        {meta.rounds}
                      </span>
                    </div>

                    {/* Description and Technical Homologation */}
                    <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed max-w-2xl font-sans">
                      {sport.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 font-mono text-[11px]">
                      <div>
                        <span className="text-[var(--text-muted)]">POWERTRAIN:</span>{' '}
                        <span className="text-white font-medium">{meta.engine}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">CHASSIS:</span>{' '}
                        <span className="text-white font-medium">{meta.chassis}</span>
                      </div>
                    </div>

                    {/* AI Briefing Segment */}
                    <div className="mt-4">
                      {!summaries[sport.id] && !loadingSummaries[sport.id] && (
                        <button
                          onClick={(e) => fetchSummary(e, sport.id)}
                          className="text-[11px] font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--amber)] flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 transition-colors uppercase tracking-wider"
                        >
                          <Zap size={12} className="text-[var(--amber)]" />
                          <span>AI BRIEFING &rsaquo;</span>
                        </button>
                      )}

                      {loadingSummaries[sport.id] && (
                        <div className="font-mono text-[11px] text-[var(--amber)] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" />
                          <span>SYNTHESIZING TELEMETRY INTEL...</span>
                        </div>
                      )}

                      {summaries[sport.id] && (
                        <div className="font-mono text-xs text-[var(--text-secondary)] p-3 bg-[var(--surface-subtle)] rounded-xs border border-[var(--border-hairline)] mt-2">
                          <div className="text-[10px] text-[var(--amber)] font-bold mb-1 uppercase">
                            AI TELEMETRY BRIEFING
                          </div>
                          {summaries[sport.id]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="flex items-center justify-between pt-4 mt-6 border-t border-[var(--border-hairline)] font-mono text-xs">
                    <span className="text-[var(--text-muted)] text-[11px]">{meta.teams}</span>
                    <Link
                      href={`/dashboard/${sport.id}`}
                      className="font-bold text-white group-hover:text-[var(--amber)] transition-colors flex items-center gap-1.5 no-underline"
                    >
                      <span>ENTER COCKPIT</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ===== HISTORICAL ARCHIVE & ANALYTICAL TOOLS (#archive) ===== */}
      <section id="archive" className="py-16 border-b border-[var(--border-hairline)] bg-[var(--canvas-base)]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <div className="eyebrow">HISTORICAL ARCHIVE</div>
              <h2 className="font-[family-name:var(--font-disp)] text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                ANALYTICAL TOOLS.
              </h2>
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
              70+ YEARS OF GRAND PRIX TELEMETRY &bull; DUAL-ELO &bull; WHAT-IF ENGINE
            </p>
          </div>

          {/* Clean Responsive Tool Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Flagship Hero Tile: What If? Simulator */}
            <Link
              href="/history/what-if"
              className="lg:col-span-8 bg-[var(--surface-console)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] rounded-sm p-6 transition-all no-underline group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-3">
                  <span className="font-bold text-[var(--amber)] tracking-wider">
                    STRATEGY SIMULATOR
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ML TIRE DEGRADATION MODEL
                  </span>
                </div>

                <div className="font-[family-name:var(--font-disp)] text-3xl sm:text-4xl font-black text-white uppercase mt-2 mb-2">
                  &ldquo;WHAT IF?&rdquo; PIT SIMULATOR
                </div>

                <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed font-sans">
                  Query counterfactual race strategy decisions. Our machine-learning physics model resimulates alternate lap delta times, pit traffic windows, and finishing orders grounded in official telemetry.
                </p>

                {/* Example Query Pill */}
                <div className="mt-4 p-3 bg-[var(--surface-subtle)] rounded-xs border border-[var(--border-hairline)] font-mono text-xs text-[var(--text-muted)]">
                  <span className="text-[var(--amber)]">$ simulate</span> &mdash;race &quot;Abu Dhabi 2021&quot; &mdash;event &quot;Hamilton pits on Lap 53 for Soft compound&quot;
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 font-mono text-xs font-bold text-[var(--amber)]">
                <span>LAUNCH SIMULATOR</span>
                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>

            {/* Secondary Tile: GOAT Debate Dual-Elo */}
            <Link
              href="/history/goat"
              className="lg:col-span-4 bg-[var(--surface-console)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] rounded-sm p-6 transition-all no-underline group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-3">
                  <span className="font-bold text-[var(--amber)] tracking-wider">DUAL-ELO MODEL</span>
                  <span className="text-[11px] text-[var(--text-muted)]">1950 &ndash; PRESENT</span>
                </div>

                <div className="font-[family-name:var(--font-disp)] text-2xl sm:text-3xl font-black text-white uppercase mt-2 mb-2">
                  THE GOAT DEBATE
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  A mathematical dual-Elo algorithm isolating pure driver capability from constructor car performance across every Grand Prix season.
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 font-mono text-xs font-bold text-white group-hover:text-[var(--amber)]">
                <span>VIEW RANKINGS</span>
                <ChevronRight size={14} />
              </div>
            </Link>

            {/* Bottom Row: 3 Modular Cards */}
            <Link
              href="/models"
              className="lg:col-span-4 bg-[var(--surface-console)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] rounded-sm p-6 transition-all no-underline group flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs text-[var(--amber)] font-bold mb-2">NEURAL BENCHMARKS</div>
                <div className="font-[family-name:var(--font-disp)] text-2xl font-bold uppercase text-white mb-2">
                  MODEL ACCURACY &amp; LOG LOSS
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  Inspect prediction calibration, test sample sizes, and confusion matrices generated by our race-outcome pipeline.
                </p>
              </div>
              <div className="mt-5 font-mono text-xs text-[var(--text-muted)] group-hover:text-white flex items-center justify-between">
                <span>INSPECT MODELS</span>
                <ChevronRight size={13} />
              </div>
            </Link>

            <Link
              href="/history/seasons"
              className="lg:col-span-4 bg-[var(--surface-console)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] rounded-sm p-6 transition-all no-underline group flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs text-[var(--amber)] font-bold mb-2">SEASON DIRECTORY</div>
                <div className="font-[family-name:var(--font-disp)] text-2xl font-bold uppercase text-white mb-2">
                  ALL SEASONS (1950 &ndash; PRESENT)
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  Standings, points classifications, and round results from every official Formula 1 championship season.
                </p>
              </div>
              <div className="mt-5 font-mono text-xs text-[var(--text-muted)] group-hover:text-white flex items-center justify-between">
                <span>BROWSE SEASONS</span>
                <ChevronRight size={13} />
              </div>
            </Link>

            <Link
              href="/history/tracks"
              className="lg:col-span-4 bg-[var(--surface-console)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] rounded-sm p-6 transition-all no-underline group flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs text-[var(--amber)] font-bold mb-2">CIRCUIT DATABASE</div>
                <div className="font-[family-name:var(--font-disp)] text-2xl font-bold uppercase text-white mb-2">
                  CIRCUITS &amp; LAP RECORDS
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  Corner profiles, elevation gradients, official lap records, and historic race winners for every Grand Prix circuit.
                </p>
              </div>
              <div className="mt-5 font-mono text-xs text-[var(--text-muted)] group-hover:text-white flex items-center justify-between">
                <span>EXPLORE CIRCUITS</span>
                <ChevronRight size={13} />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ===== HERITAGE TIMELINE (#history) ===== */}
      <section id="history" className="py-16 bg-[var(--canvas-base)]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <div className="eyebrow">MOTORSPORT HERITAGE</div>
              <h2 className="font-[family-name:var(--font-disp)] text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
                RACING DIDN&rsquo;T START WITH A STREAM.
              </h2>
            </div>
            <Link
              href="/legacy"
              className="font-mono text-xs font-bold text-[var(--amber)] hover:underline flex items-center gap-1"
            >
              <span>READ HERITAGE ARCHIVE &rsaquo;</span>
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-[var(--surface-console)] border border-[var(--border-hairline)] rounded-sm p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-2 font-mono text-2xl font-black text-[var(--amber)] tabular-nums">
                1894
              </div>
              <div className="md:col-span-3 font-[family-name:var(--font-disp)] text-xl font-bold uppercase text-white">
                Paris &ndash; Rouen
              </div>
              <div className="md:col-span-7 text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                The inaugural organized motoring trial &mdash; 79 miles from Paris to Rouen. No rulebook, steam vs. petrol, and the genesis of competition between horseless carriages.
              </div>
            </div>

            <div className="bg-[var(--surface-console)] border border-[var(--border-hairline)] rounded-sm p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-2 font-mono text-2xl font-black text-[var(--amber)] tabular-nums">
                1911
              </div>
              <div className="md:col-span-3 font-[family-name:var(--font-disp)] text-xl font-bold uppercase text-white">
                Indianapolis 500
              </div>
              <div className="md:col-span-7 text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Ray Harroun wins the inaugural 500-mile sweepstakes in the Marmon Wasp, pioneering the first rearview mirror and establishing oval endurance racing.
              </div>
            </div>

            <div className="bg-[var(--surface-console)] border border-[var(--border-hairline)] rounded-sm p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-2 font-mono text-2xl font-black text-[var(--amber)] tabular-nums">
                1950
              </div>
              <div className="md:col-span-3 font-[family-name:var(--font-disp)] text-xl font-bold uppercase text-white">
                Silverstone F1 Grand Prix
              </div>
              <div className="md:col-span-7 text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                The inaugural FIA Formula One World Championship round. Giuseppe Farina takes victory in an Alfa Romeo 158, inaugurating the modern world championship era.
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
