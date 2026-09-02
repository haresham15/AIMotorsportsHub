'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SERIES } from '@/lib/data'
import AuthButton from '@/components/AuthButton'
import { Zap } from 'lucide-react'

export default function HomeClient() {
  const [lightsStatus, setLightsStatus] = useState<string>('LIGHTS OUT IN <span class="text-[var(--amber)] font-semibold">3.2s</span>')
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({})

  const fetchSummary = async (e: React.MouseEvent, seriesId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingSummaries[seriesId] || summaries[seriesId]) return;

    setLoadingSummaries(prev => ({ ...prev, [seriesId]: true }))
    try {
      const res = await fetch(`/api/ai/summary?series=${seriesId}`)
      const data = await res.json()
      setSummaries(prev => ({ ...prev, [seriesId]: data.summary }))
    } catch (err) {
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
    
    if(reduced) {
      lights.forEach(l => l.classList.add('start-light-lit'))
      setLightsStatus('<span class="text-[var(--green-flag)] font-semibold">SESSION LIVE</span>')
      return
    }

    let i = 0
    const step = () => {
      if(i < lights.length) {
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
    
    // Clean up previous classes if re-rendering
    lights.forEach(l => {
      l.classList.remove('start-light-lit', 'start-light-go')
    })
    
    scheduleTimeout(step, 300)
    return () => timeoutIds.forEach(clearTimeout)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hero { position: relative; z-index: 1; padding: var(--sp-9) 0 var(--sp-7); overflow: hidden; }
        .start-lights { display: flex; gap: 14px; margin-bottom: var(--sp-6); }
        .start-light { width: 22px; height: 22px; border-radius: 50%; background: #2a1210; border: 2px solid #4a2018; transition: background .15s, box-shadow .15s, border-color .15s; }
        .start-light-lit { background: var(--flag-red); border-color: #ff3b30; box-shadow: 0 0 16px rgba(225,6,0,0.85), 0 0 40px rgba(225,6,0,0.35); }
        .start-light-go { background: var(--green-flag); border-color: #2ed573; box-shadow: 0 0 16px rgba(31,163,74,0.85), 0 0 40px rgba(31,163,74,0.3); }
        .lights-label { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 10px; }
        .hero h1 { font-family: var(--font-disp); font-weight: 800; font-size: clamp(48px, 8vw, 92px); line-height: 0.92; letter-spacing: -0.01em; max-width: 820px; text-transform: uppercase; }
        .hero h1 em { font-style: normal; color: var(--amber); }
        .btn-primary-amber { background: var(--amber); color: #1a1200; font-weight: 700; font-size: 15px; padding: 14px 30px; border-radius: 6px; font-family: var(--font-sans); transition: transform .15s, box-shadow .15s; }
        .btn-primary-amber:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,176,32,0.25); }
        .ticker-band { border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); background: repeating-linear-gradient(180deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px), var(--bg-card); overflow: hidden; position: relative; z-index: 1; margin-bottom: var(--sp-7); }
        .ticker-band::before { content: 'LIVE TIMING'; position: absolute; left: 0; top: 0; bottom: 0; z-index: 2; display: flex; align-items: center; padding: 0 16px; font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #0a0a0a; background: var(--amber); }
        .ticker-track { display: flex; white-space: nowrap; animation: scroll-left 42s linear infinite; padding-left: 200px; }
        @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-item { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); padding: 14px 32px; border-right: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 10px; }
        .ticker-item .flag { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none; } }
        .eyebrow { font-family: var(--font-mono); font-size: 12px; color: var(--amber); font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: var(--sp-3); }
        .section-head h2 { font-family: var(--font-disp); font-weight: 800; font-size: clamp(30px,4vw,44px); letter-spacing: -0.005em; text-transform: uppercase; max-width: 640px; }
        .how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: var(--sp-5); margin-top: var(--sp-7); border-top: 1px solid var(--border-subtle); }
        .how-step { padding: var(--sp-6) var(--sp-2) 0; border-right: 1px solid var(--border-subtle); }
        .how-step:last-child { border-right: none; }
        .how-num { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); font-weight: 600; margin-bottom: var(--sp-4); }
        .how-step h3 { font-family: var(--font-disp); font-size: 24px; font-weight: 700; text-transform: uppercase; margin-bottom: var(--sp-3); }
        .series-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1px; background: var(--border-subtle); border: 1px solid var(--border-subtle); margin-top: var(--sp-7); }
        .series-card { background: var(--bg-card); padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-5); position: relative; border-left: 3px solid var(--s-color); transition: background .15s; }
        .series-card:hover { background: var(--bg-card-hover); }
        .series-mark { font-family: var(--font-disp); font-size: 34px; font-weight: 800; letter-spacing: 0.01em; color: var(--s-color); }
        .series-stats { display: flex; gap: var(--sp-5); font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border-subtle); padding-top: var(--sp-4); }
        .series-stats .stat b { display: block; color: var(--text-primary); font-size: 14px; font-weight: 600; }
        .series-stats .stat span { color: var(--text-muted); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }
        .series-enter { font-size: 13px; font-weight: 600; color: var(--s-color); display: flex; align-items: center; gap: 6px; margin-top: auto; }
        .series-card.featured { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: var(--sp-7); padding: var(--sp-7); }
        .series-card.featured .series-enter { margin-top: 0; margin-left: auto; flex-shrink: 0; }
        .series-card.featured .series-mark { font-size: 64px; }
        .history { background: var(--bg-card); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); }
        .tl-row { display: grid; grid-template-columns: 110px 1fr 2fr; gap: var(--sp-5); padding: var(--sp-5) 0; border-top: 1px solid var(--border-subtle); align-items: baseline; }
        .tl-row:last-child { border-bottom: 1px solid var(--border-subtle); }
        .tl-year { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--amber); }
        .tl-event { font-family: var(--font-disp); font-size: 19px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); }
        .foot-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: var(--sp-6); padding-bottom: var(--sp-7); }
        .foot-col h4 { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: var(--sp-4); }
        .foot-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--sp-3); border-top: 1px solid var(--border-subtle); padding-top: var(--sp-5); font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
        @media (max-width: 760px) { .series-grid { grid-template-columns: 1fr; } .series-card.featured { grid-column: span 1; flex-direction: column; align-items: flex-start; } .how-grid { grid-template-columns: 1fr; } .how-step { border-right: none; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--sp-6); } .tl-row { grid-template-columns: 1fr; gap: 6px; } .foot-grid { grid-template-columns: 1fr 1fr; } }
      `}} />

      <header className="hero">
        <div className="max-w-[1180px] mx-auto px-[var(--sp-5)] relative">
          <div className="start-lights">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="start-light" />)}
          </div>
          <div className="lights-label" dangerouslySetInnerHTML={{ __html: lightsStatus }} />

          <h1 className="mt-8">Every series.<br/>One <em>race&nbsp;wall</em>.</h1>
          <p className="mt-[var(--sp-5)] text-[18px] text-[var(--text-secondary)] max-w-[560px] leading-[1.65]">
            Live timing, AI-written race briefings, and full circuit replays for F1, F2, F3, Formula&nbsp;E, NASCAR, GT&nbsp;World&nbsp;Challenge, and NHRA Top Fuel - in one dashboard built for people who watch every session.
          </p>

          <div className="flex flex-wrap gap-[var(--sp-4)] mt-[var(--sp-7)]">
            <a href="#series" className="btn-primary-amber">Enter the paddock &rarr;</a>
            <a href="#how" className="border border-[var(--border-subtle)] px-[26px] py-[14px] rounded-[6px] text-[15px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]">See how it works</a>
          </div>
        </div>
      </header>

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

      <section id="how" className="py-[var(--sp-9)] relative z-10">
        <div className="max-w-[1180px] mx-auto px-[var(--sp-5)]">
          <div className="section-head">
            <div className="eyebrow">Race Weekend, Simplified</div>
            <h2>Three screens become one.</h2>
            <p className="text-[var(--text-secondary)] text-[15px] max-w-[520px] mt-[var(--sp-3)] leading-[1.65]">
              You used to need a timing app, a strategist's Twitter feed, and last week's highlights reel. Apexis puts the whole weekend on one wall.
            </p>
          </div>
          <div className="mt-[var(--sp-6)]">
            <Link href="/about" className="btn-primary-amber flex inline-flex items-center gap-2">
              Learn more &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section id="series" className="py-[var(--sp-9)] relative z-10">
        <div className="max-w-[1180px] mx-auto px-[var(--sp-5)]">
          <div className="section-head">
            <div className="eyebrow">Seven Series, One Pass</div>
            <h2>Pick your grid.</h2>
          </div>

          <div className="series-grid">
            {SERIES.map((sport, index) => {
              const isFeatured = sport.id === 'f1';
              return (
                <Link
                  key={sport.id}
                  href={`/dashboard/${sport.id}`}
                  className={`series-card no-underline ${isFeatured ? 'featured' : ''}`}
                  style={{ '--s-color': sport.color } as React.CSSProperties}
                >
                  <div className="flex-1 max-w-[600px]">
                    <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
                      <div>
                        <div className="series-mark">{sport.id === 'gt-world-challenge' ? 'GTC' : sport.id === 'top-fuel' ? 'NHRA' : sport.id === 'formula-e' ? 'FE' : sport.id.toUpperCase()}</div>
                        <div className="text-[15px] font-semibold text-[var(--text-primary)]">{sport.name}</div>
                        <div className="text-[13px] text-[var(--text-muted)] mt-[2px]">{sport.description}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                        <Zap size={10} /> AI Briefing
                      </div>
                      {!summaries[sport.id] && !loadingSummaries[sport.id] && (
                        <button 
                          onClick={(e) => fetchSummary(e, sport.id)}
                          className="mt-1 text-[12px] font-semibold text-[var(--bg-card)] bg-[var(--amber)] hover:opacity-90 transition-opacity px-3 py-1.5 rounded-[4px] self-start"
                        >
                          Generate AI Briefing
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
                        <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6] line-clamp-3">
                          {summaries[sport.id]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="series-enter">Enter Apexis &rarr;</div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section id="archive" className="py-[var(--sp-9)] relative z-10">
        <div className="max-w-[1180px] mx-auto px-[var(--sp-5)]">
          <div className="section-head">
            <div className="eyebrow">The Archive &amp; AI Tools</div>
            <h2>Dig into the data.</h2>
            <p className="text-[var(--text-secondary)] text-[15px] max-w-[520px] mt-[var(--sp-3)] leading-[1.65]">
              70+ years of race results, AI-powered simulators, and mathematical driver ratings — all grounded in real data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[var(--border-subtle)] border border-[var(--border-subtle)] mt-[var(--sp-7)]">
            <Link href="/history/what-if" className="bg-[var(--bg-card)] p-[var(--sp-6)] no-underline group hover:bg-[var(--bg-card-hover)] transition-colors relative">
              <div className="absolute top-[var(--sp-4)] right-[var(--sp-4)]">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25">AI + ML</span>
              </div>
              <div className="font-[family-name:var(--font-disp)] text-[28px] font-800 text-[var(--amber)] uppercase mb-2">&ldquo;What If?&rdquo;</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Historical Simulator</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">Ask counterfactuals. Our ML tire model and Gemini AI simulate alternate race outcomes grounded in real data.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Try it &rarr;</div>
            </Link>

            <Link href="/history/goat" className="bg-[var(--bg-card)] p-[var(--sp-6)] no-underline group hover:bg-[var(--bg-card-hover)] transition-colors relative">
              <div className="absolute top-[var(--sp-4)] right-[var(--sp-4)]">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25">Elo Model</span>
              </div>
              <div className="font-[family-name:var(--font-disp)] text-[28px] font-800 text-[var(--amber)] uppercase mb-2">GOAT Debate</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Era-Adjusted Ratings</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">A dual-Elo system that isolates driver skill from car dominance across every race since 1950.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">View rankings &rarr;</div>
            </Link>

            <Link href="/models" className="bg-[var(--bg-card)] p-[var(--sp-6)] no-underline group hover:bg-[var(--bg-card-hover)] transition-colors relative">
              <div className="absolute top-[var(--sp-4)] right-[var(--sp-4)]">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25">ML</span>
              </div>
              <div className="font-[family-name:var(--font-disp)] text-[28px] font-800 text-[var(--amber)] uppercase mb-2">AI Models</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Predictive Performance</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">See how our trained race-outcome models perform — log loss, calibration curves, and confusion matrices.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Explore &rarr;</div>
            </Link>

            <Link href="/history/seasons" className="bg-[var(--bg-card)] p-[var(--sp-6)] no-underline group hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="font-[family-name:var(--font-disp)] text-[28px] font-800 text-[var(--text-primary)] uppercase mb-2">Seasons</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">1950 — Present</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">Final standings and race results from every championship season in F1 history.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Browse &rarr;</div>
            </Link>

            <Link href="/history/head-to-head" className="bg-[var(--bg-card)] p-[var(--sp-6)] no-underline group hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="font-[family-name:var(--font-disp)] text-[28px] font-800 text-[var(--text-primary)] uppercase mb-2">Head-to-Head</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Driver Comparison</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">Compare any two drivers who raced in the same Grand Prix — side by side performance data.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Compare &rarr;</div>
            </Link>

            <Link href="/history/tracks" className="bg-[var(--bg-card)] p-[var(--sp-6)] no-underline group hover:bg-[var(--bg-card-hover)] transition-colors">
              <div className="font-[family-name:var(--font-disp)] text-[28px] font-800 text-[var(--text-primary)] uppercase mb-2">Circuits</div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Track Records</div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">View statistics for every circuit that has hosted a Grand Prix — lap records, winners, and history.</p>
              <div className="text-[13px] font-semibold text-[var(--amber)] mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Explore &rarr;</div>
            </Link>
          </div>
        </div>
      </section>

      <section id="history" className="history py-[var(--sp-9)]">
        <div className="max-w-[1180px] mx-auto px-[var(--sp-5)]">
          <div className="section-head">
            <div className="eyebrow">The Sport Before The Screen</div>
            <h2>Racing didn't start with a livestream.</h2>
            <p className="text-[var(--text-secondary)] text-[15px] max-w-[520px] mt-[var(--sp-3)] leading-[1.65]">
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
          </div>
          
          <div className="mt-[var(--sp-7)] flex justify-start">
            <Link href="/legacy" className="border border-[var(--border-subtle)] px-[26px] py-[14px] rounded-[6px] text-[15px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              See the full story &rarr;
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
