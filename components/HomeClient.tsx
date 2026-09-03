'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SERIES } from '@/lib/data'
import { Zap, Gauge, Flame, Flag, Trophy, Activity, Radio, ChevronRight } from 'lucide-react'

export default function HomeClient() {
  const [lightsStatus, setLightsStatus] = useState<string>('LIGHTS OUT IN <span class="text-[var(--amber)] font-semibold">3.2s</span>')
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({})
  const [telemetryTick, setTelemetryTick] = useState<number>(0)

  // Subtle live telemetry pulse animation for the hero HUD
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick((prev) => (prev + 1) % 100)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const fetchSummary = async (e: React.MouseEvent, seriesId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingSummaries[seriesId] || summaries[seriesId]) return;

    setLoadingSummaries(prev => ({ ...prev, [seriesId]: true }))
    try {
      const res = await fetch(`/api/ai/summary?series=${seriesId}`)
      const data = await res.json()
      setSummaries(prev => ({ ...prev, [seriesId]: data.summary }))
    } catch {
      setSummaries(prev => ({ ...prev, [seriesId]: "Briefing not available right now. Check back shortly." }))
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [seriesId]: false }))
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
      lights.forEach(l => l.classList.add('start-light-lit'))
      setLightsStatus('<span class="text-[var(--green-flag)] font-semibold">SESSION LIVE</span>')
      return
    }

    let i = 0
    const step = () => {
      if (i < lights.length) {
        lights[i].classList.add('start-light-lit')
        i++
        scheduleTimeout(step, 260)
      } else {
        scheduleTimeout(() => {
          lights.forEach(l => {
            l.classList.remove('start-light-lit')
            l.classList.add('start-light-go')
          })
          setLightsStatus('<span class="text-[var(--green-flag)] font-semibold">SESSION LIVE</span>')
        }, 550)
      }
    }
    
    lights.forEach(l => {
      l.classList.remove('start-light-lit', 'start-light-go')
    })
    
    scheduleTimeout(step, 300)
    return () => timeoutIds.forEach(clearTimeout)
  }, [])

  const seriesMeta: Record<string, { rounds: string; teams: string; highlight: string }> = {
    'f1': { rounds: '24 Grands Prix', teams: '10 Teams', highlight: 'Hybrid Turbo V6' },
    'f2': { rounds: '14 Rounds', teams: '11 Teams', highlight: 'Spec Chassis' },
    'f3': { rounds: '10 Rounds', teams: '10 Teams', highlight: 'Junior Ladder' },
    'formula-e': { rounds: '16 E-Prix', teams: '11 Teams', highlight: 'Gen3 Evo Electric' },
    'nascar': { rounds: '36 Races', teams: '15 Teams', highlight: 'Next Gen V8' },
    'gt-world-challenge': { rounds: '10 Rounds', teams: '24 Teams', highlight: 'GT3 Pro-Am' },
    'top-fuel': { rounds: '20 Events', teams: '16 Drivers', highlight: '11,000 HP Nitro' },
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hero { position: relative; z-index: 1; padding: var(--sp-8) 0 var(--sp-7); overflow: hidden; }
        .start-lights { display: flex; gap: 14px; margin-bottom: var(--sp-5); }
        .start-light { width: 22px; height: 22px; border-radius: 50%; background: #2a1210; border: 2px solid #4a2018; transition: background .15s, box-shadow .15s, border-color .15s; }
        .start-light-lit { background: var(--flag-red); border-color: #ff3b30; box-shadow: 0 0 16px rgba(225,6,0,0.85), 0 0 40px rgba(225,6,0,0.35); }
        .start-light-go { background: var(--green-flag); border-color: #2ed573; box-shadow: 0 0 16px rgba(31,163,74,0.85), 0 0 40px rgba(31,163,74,0.3); }
        .lights-label { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 8px; }
        .hero h1 { font-family: var(--font-disp); font-weight: 800; font-size: clamp(44px, 6.5vw, 84px); line-height: 0.94; letter-spacing: -0.01em; text-transform: uppercase; }
        .hero h1 em { font-style: normal; color: var(--amber); }
        .btn-primary-amber { background: var(--amber); color: #1a1200; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; font-family: var(--font-sans); transition: transform .15s, box-shadow .15s; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
        .btn-primary-amber:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,176,32,0.3); }
        .ticker-band { border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); background: repeating-linear-gradient(180deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px), var(--bg-card); overflow: hidden; position: relative; z-index: 1; margin-bottom: var(--sp-7); }
        .ticker-band::before { content: 'LIVE TIMING'; position: absolute; left: 0; top: 0; bottom: 0; z-index: 2; display: flex; align-items: center; padding: 0 16px; font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #0a0a0a; background: var(--amber); }
        .ticker-track { display: flex; white-space: nowrap; animation: scroll-left 42s linear infinite; padding-left: 180px; }
        @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-item { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); padding: 14px 28px; border-right: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 10px; }
        .ticker-item .flag { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none; } }
        .eyebrow { font-family: var(--font-mono); font-size: 12px; color: var(--amber); font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: var(--sp-3); }
        .section-head h2 { font-family: var(--font-disp); font-weight: 800; font-size: clamp(30px,4vw,48px); letter-spacing: -0.005em; text-transform: uppercase; max-width: 640px; }
        .series-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1px; background: var(--border-subtle); border: 1px solid var(--border-subtle); margin-top: var(--sp-7); }
        .series-card { background: var(--bg-card); padding: var(--sp-6); display: flex; flex-direction: column; justify-content: space-between; position: relative; border-left: 4px solid var(--s-color); transition: all .2s; }
        .series-card:hover { background: var(--bg-card-hover); }
        .series-mark { font-family: var(--font-disp); font-size: 38px; font-weight: 800; letter-spacing: 0.01em; color: var(--s-color); }
        .series-card.featured { grid-column: 1 / -1; }
        .series-card.featured .series-mark { font-size: 68px; }
        .history { background: var(--bg-card); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); }
        .tl-row { display: grid; grid-template-columns: 110px 1fr 2fr; gap: var(--sp-5); padding: var(--sp-5) 0; border-top: 1px solid var(--border-subtle); align-items: baseline; }
        .tl-row:last-child { border-bottom: 1px solid var(--border-subtle); }
        .tl-year { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--amber); }
        .tl-event { font-family: var(--font-disp); font-size: 19px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); }
        @media (max-width: 760px) { .series-grid { grid-template-columns: 1fr; } .tl-row { grid-template-columns: 1fr; gap: 6px; } }
      `}} />

      {/* ===== HERO SECTION ===== */}
      <header className="hero">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7">
            <div className="start-lights">
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="start-light" />)}
            </div>
            <div className="lights-label" dangerouslySetInnerHTML={{ __html: lightsStatus }} />

            <h1 className="mt-6">Every series.<br/>One <em>race&nbsp;wall</em>.</h1>
            <p className="mt-5 text-[17px] sm:text-[18px] text-[var(--text-secondary)] max-w-[560px] leading-[1.65]">
              Live telemetry, AI-written race briefings, and 2D deterministic replays for F1, F2, F3, Formula&nbsp;E, NASCAR, GT&nbsp;World&nbsp;Challenge, and NHRA Top Fuel — all in one unified cockpit.
            </p>

            <div className="flex flex-wrap gap-4 mt-8 items-center">
              <a href="#series" className="btn-primary-amber">
                <span>Enter the paddock</span>
                <ChevronRight size={16} />
              </a>
              <a href="#archive" className="border border-[var(--border-subtle)] px-6 py-3.5 rounded-lg text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline">
                Explore historical models
              </a>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-[var(--border-subtle)]">
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] bg-white/5 border border-[var(--border-subtle)] px-3 py-1.5 rounded-full">
                <Gauge size={13} className="text-[var(--amber)]" /> 200 Hz Telemetry Interpolation
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] bg-white/5 border border-[var(--border-subtle)] px-3 py-1.5 rounded-full">
                <Flame size={13} className="text-[var(--flag-red)]" /> ML Tire Degradation
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] bg-white/5 border border-[var(--border-subtle)] px-3 py-1.5 rounded-full">
                <Radio size={13} className="text-[var(--green-flag)]" /> Gemini Race Engineer AI
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Hero Telemetry HUD */}
          <div className="lg:col-span-5 w-full">
            <div className="card glass rounded-2xl p-5 border border-[var(--border-subtle)] bg-[rgba(20,23,28,0.85)] shadow-2xl relative overflow-hidden backdrop-blur-xl group hover:border-[var(--amber)]/40 transition-colors">
              
              {/* HUD Header */}
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-[var(--border-subtle)] text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--green-flag)] shadow-[0_0_8px_var(--green-flag)] animate-pulse" />
                  <span className="font-bold text-white tracking-wider">LIVE TELEMETRY // MONZA</span>
                </div>
                <span className="text-[var(--amber)] font-bold">LAP 34/53</span>
              </div>

              {/* Speed & Gear Gauge */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Speed</div>
                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    {338 + (telemetryTick % 9)} <span className="text-xs text-[var(--text-muted)] font-normal">km/h</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Gear</div>
                  <div className="text-2xl font-black font-mono text-[var(--amber)]">8</div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">DRS</div>
                  <div className="text-sm font-bold font-mono text-[var(--green-flag)] mt-1.5 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)]" /> ACTIVE
                  </div>
                </div>
              </div>

              {/* Animated Track Circuit Wireframe */}
              <div className="relative h-36 bg-black/60 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden mb-4">
                <svg viewBox="0 0 400 160" className="w-full h-full p-2">
                  {/* Track Outline */}
                  <path
                    d="M 50,110 L 280,110 Q 350,110 350,70 Q 350,30 290,30 L 130,30 Q 80,30 60,60 Q 40,90 50,110 Z"
                    fill="none"
                    stroke="#2A2F38"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 50,110 L 280,110 Q 350,110 350,70 Q 350,30 290,30 L 130,30 Q 80,30 60,60 Q 40,90 50,110 Z"
                    fill="none"
                    stroke="#FFB020"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Pulsing Car Marker */}
                  <circle cx="210" cy="110" r="6" fill="#e10600" className="shadow-[0_0_12px_#e10600]">
                    <animate attributeName="cx" values="50;280;340;300;130;60;50" dur="8s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="110;110;80;30;30;70;110" dur="8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="180" cy="110" r="5" fill="#FF8000">
                    <animate attributeName="cx" values="30;260;330;290;120;50;30" dur="8s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="110;110;85;30;30;75;110" dur="8s" repeatCount="indefinite" />
                  </circle>
                </svg>

                <div className="absolute top-2 left-3 text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                  <Activity size={12} className="text-[var(--amber)]" />
                  <span>AUTODROMO NAZIONALE DI MONZA</span>
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] font-mono text-[var(--text-muted)]">
                  LENGTH: 5.793 KM
                </div>
              </div>

              {/* Micro Sector Times */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-purple-950/40 border border-purple-500/30 text-purple-300 py-1.5 px-2 rounded-lg">
                  <div className="text-[9px] text-purple-400">SECTOR 1</div>
                  <div className="font-bold">27.412s 🟣</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 py-1.5 px-2 rounded-lg">
                  <div className="text-[9px] text-emerald-400">SECTOR 2</div>
                  <div className="font-bold">26.884s 🟢</div>
                </div>
                <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 py-1.5 px-2 rounded-lg">
                  <div className="text-[9px] text-amber-400">SECTOR 3</div>
                  <div className="font-bold">25.320s 🟡</div>
                </div>
              </div>

              {/* Action Banner inside HUD */}
              <Link 
                href="/dashboard/f1"
                className="mt-4 w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-[var(--amber)] hover:text-black border border-white/10 text-xs font-semibold text-[var(--text-primary)] transition-all no-underline group/hud"
              >
                <span>Launch Live 2D Track Replay</span>
                <ChevronRight size={14} className="group-hover/hud:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </header>

      {/* ===== TICKER BAND ===== */}
      <div className="ticker-band">
        <div className="ticker-track">
          {[0, 1].map((set) => (
            <div key={set} className="flex">
              <div className="ticker-item"><span className="flag bg-[var(--green-flag)]"></span><b>F1 Australian GP</b>&nbsp;- Race Day Sunday</div>
              <div className="ticker-item"><span className="flag bg-[var(--amber)]"></span><b>NASCAR Bristol Night Race</b>&nbsp;- Flag-to-flag action expected</div>
              <div className="ticker-item"><span className="flag bg-[var(--green-flag)]"></span><b>Formula E Tokyo E-Prix</b>&nbsp;- Final results confirmed</div>
              <div className="ticker-item"><span className="flag bg-[var(--flag-red)]"></span><b>NHRA Winternationals</b>&nbsp;- Qualifying begins Friday</div>
              <div className="ticker-item"><span className="flag bg-[var(--amber)]"></span><b>F2 Championship</b>&nbsp;- Title fight intensifies in Bahrain</div>
              <div className="ticker-item"><span className="flag bg-[var(--green-flag)]"></span><b>GT World Challenge Spa 24H</b>&nbsp;- Entry list released</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SERIES GRID ===== */}
      <section id="series" className="py-[var(--sp-9)] relative z-10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6">
          <div className="section-head flex flex-wrap justify-between items-end gap-4 mb-2">
            <div>
              <div className="eyebrow">Seven Series, One Pass</div>
              <h2>Pick your grid.</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-mono">Select any category to open real-time telemetry &amp; replays</p>
          </div>

          <div className="series-grid rounded-2xl overflow-hidden shadow-2xl">
            {SERIES.map((sport) => {
              const isFeatured = sport.id === 'f1';
              const meta = seriesMeta[sport.id] || { rounds: 'Season Active', teams: 'Pro Teams', highlight: 'Telemetry' };

              return (
                <Link
                  key={sport.id}
                  href={`/dashboard/${sport.id}`}
                  className={`series-card no-underline ${isFeatured ? 'featured' : ''}`}
                  style={{ '--s-color': sport.color } as React.CSSProperties}
                >
                  <div className="w-full">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <div className="series-mark flex items-center gap-2">
                          <span>{sport.id === 'gt-world-challenge' ? 'GTC' : sport.id === 'top-fuel' ? 'NHRA' : sport.id === 'formula-e' ? 'FE' : sport.id.toUpperCase()}</span>
                          <span className="text-xl">{sport.icon}</span>
                        </div>
                        <div className="text-[17px] font-bold text-[var(--text-primary)] mt-1">{sport.name}</div>
                        <div className="text-[13px] text-[var(--text-muted)] mt-[2px]">{sport.description}</div>
                      </div>

                      <div className="hidden sm:flex flex-col items-end gap-1 font-mono text-xs text-[var(--text-muted)]">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {meta.rounds}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">{meta.highlight}</span>
                      </div>
                    </div>

                    {/* AI Briefing Trigger */}
                    <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                        <Zap size={11} className="text-[var(--amber)]" /> AI Race Weekend Briefing
                      </div>
                      
                      {!summaries[sport.id] && !loadingSummaries[sport.id] && (
                        <button 
                          onClick={(e) => fetchSummary(e, sport.id)}
                          className="mt-1 text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--border-subtle)] hover:border-[var(--amber)] text-[var(--text-primary)] bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Zap size={12} className="text-[var(--amber)]" />
                          <span>Generate Intelligence Briefing</span>
                        </button>
                      )}
                      
                      {loadingSummaries[sport.id] && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="skeleton h-3 w-full" />
                          <div className="skeleton h-3 w-[85%]" />
                          <div className="skeleton h-3 w-[60%]" />
                        </div>
                      )}

                      {summaries[sport.id] && (
                        <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6] line-clamp-3 bg-white/5 p-3 rounded-lg border border-white/5">
                          {summaries[sport.id]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-subtle)] text-xs font-semibold" style={{ color: sport.color }}>
                    <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">{meta.teams}</span>
                    <span className="flex items-center gap-1 hover:translate-x-1 transition-transform">
                      Open Dashboard &rarr;
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== HISTORICAL & AI TOOLS ===== */}
      <section id="archive" className="py-[var(--sp-9)] relative z-10 border-t border-[var(--border-subtle)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6">
          <div className="section-head">
            <div className="eyebrow">The Archive &amp; AI Tools</div>
            <h2>Dig into the data.</h2>
            <p className="text-[var(--text-secondary)] text-[15px] max-w-[560px] mt-[var(--sp-3)] leading-[1.65]">
              70+ years of race results, AI-powered counterfactual simulators, and mathematical driver Elo ratings — all grounded in real telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[var(--border-subtle)] border border-[var(--border-subtle)] mt-[var(--sp-7)] rounded-xl overflow-hidden shadow-2xl">
            <Link href="/history/what-if" className="bg-[var(--bg-card)] p-6 no-underline group hover:bg-[var(--bg-card-hover)] transition-colors relative">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25">AI + ML</span>
              </div>
              <div className="font-[family-name:var(--font-disp)] text-2xl font-black text-[var(--amber)] uppercase mb-2">&ldquo;What If?&rdquo;</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Counterfactual Simulator</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">Ask counterfactual pit strategy questions. Our ML tire model and Gemini AI simulate alternate race outcomes grounded in historical telemetry.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Launch Simulator &rarr;</div>
            </Link>

            <Link href="/history/goat" className="bg-[var(--bg-card)] p-6 no-underline group hover:bg-[var(--bg-card-hover)] transition-colors relative">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25">Dual-Elo</span>
              </div>
              <div className="font-[family-name:var(--font-disp)] text-2xl font-black text-[var(--amber)] uppercase mb-2">GOAT Debate</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Era-Adjusted Ratings</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">A dual-Elo mathematical rating model that isolates driver skill from car dominance across every Grand Prix since 1950.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">View rankings &rarr;</div>
            </Link>

            <Link href="/models" className="bg-[var(--bg-card)] p-6 no-underline group hover:bg-[var(--bg-card-hover)] transition-colors relative">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25">ML Ops</span>
              </div>
              <div className="font-[family-name:var(--font-disp)] text-2xl font-black text-[var(--amber)] uppercase mb-2">AI Models</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Predictive Performance</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">See how our trained neural network models perform — log loss, calibration curves, and confusion matrices.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Explore &rarr;</div>
            </Link>

            <Link href="/history/seasons" className="bg-[var(--bg-card)] p-6 no-underline group hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="font-[family-name:var(--font-disp)] text-2xl font-black text-[var(--text-primary)] uppercase mb-2">Seasons</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">1950 — Present</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">Final standings and race results from every championship season in Formula 1 history.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Browse archive &rarr;</div>
            </Link>

            <Link href="/history/head-to-head" className="bg-[var(--bg-card)] p-6 no-underline group hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="font-[family-name:var(--font-disp)] text-2xl font-black text-[var(--text-primary)] uppercase mb-2">Head-to-Head</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Driver Comparison</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">Compare any two drivers who raced in the same Grand Prix — qualifying deltas and head-to-head race finishes.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Compare &rarr;</div>
            </Link>

            <Link href="/history/tracks" className="bg-[var(--bg-card)] p-6 no-underline group hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="font-[family-name:var(--font-disp)] text-2xl font-black text-[var(--text-primary)] uppercase mb-2">Circuits</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Track Records</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">View statistics for every circuit that has hosted a Grand Prix — lap records, past winners, and corner layouts.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Explore circuits &rarr;</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== LEGACY TIMELINE SECTION ===== */}
      <section id="history" className="history py-[var(--sp-9)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6">
          <div className="section-head">
            <div className="eyebrow">The Heritage</div>
            <h2>Racing didn't start with a livestream.</h2>
            <p className="text-[var(--text-secondary)] text-[15px] max-w-[560px] mt-[var(--sp-3)] leading-[1.65]">
              Every series on this dashboard traces back to someone deciding two vehicles should settle it on a track.
            </p>
          </div>

          <div className="mt-[var(--sp-7)]">
            <div className="tl-row">
              <div className="tl-year">1894</div>
              <div className="tl-event">Paris-Rouen</div>
              <div className="text-[13.5px] text-[var(--text-secondary)] leading-[1.6]">The first organized motoring competition - 79 miles, no rulebook, and the birth of the idea that cars could race.</div>
            </div>
            <div className="tl-row">
              <div className="tl-year">1911</div>
              <div className="tl-event">Indianapolis 500</div>
              <div className="text-[13.5px] text-[var(--text-secondary)] leading-[1.6]">The first running of what's now the oldest surviving major race in the world.</div>
            </div>
            <div className="tl-row">
              <div className="tl-year">1950</div>
              <div className="tl-event">Silverstone F1</div>
              <div className="text-[13.5px] text-[var(--text-secondary)] leading-[1.6]">The inaugural FIA Formula One World Championship round, won by Giuseppe Farina in an Alfa Romeo.</div>
            </div>
          </div>
          
          <div className="mt-[var(--sp-7)] flex justify-start">
            <Link href="/legacy" className="border border-[var(--border-subtle)] px-6 py-3.5 rounded-lg text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline">
              Read the full heritage story &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
