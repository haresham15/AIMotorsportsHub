'use client';

import { useState } from 'react';
import { Bot, FastForward, Loader2, RefreshCcw, Search, AlertTriangle } from 'lucide-react';
import HistoryNav from '@/components/history/HistoryNav';

const PRESET_SCENARIOS = [
  {
    category: "🏆 Championship Deciders & Epics",
    scenarios: [
      {
        label: "2021 Abu Dhabi GP: Hamilton pits on lap 53 Safety Car",
        query: "What if Lewis Hamilton pitted for soft tires under the Nicholas Latifi safety car on lap 53 at the 2021 Abu Dhabi Grand Prix?",
      },
      {
        label: "2010 Abu Dhabi GP: Ferrari stays out with Alonso",
        query: "What if Ferrari did not pit Fernando Alonso early on lap 15 to cover Mark Webber at the 2010 Abu Dhabi Grand Prix?",
      },
      {
        label: "2008 Brazilian GP: Toyota pits Glock for intermediates",
        query: "What if Toyota pitted Timo Glock for intermediate wet tires on lap 69 at the 2008 Brazilian Grand Prix?",
      },
      {
        label: "1994 Australian GP: Damon Hill waits to pass Schumacher",
        query: "What if Damon Hill did not attempt an immediate inside dive on Michael Schumacher after Schumacher hit the wall at Adelaide in 1994?",
      },
      {
        label: "1989 Japanese GP: Senna and Prost avoid chicane collision",
        query: "What if Ayrton Senna and Alain Prost made it cleanly through the Casio Triangle chicane at the 1989 Japanese Grand Prix?",
      },
    ],
  },
  {
    category: "🌧️ Rain & Weather Chaos",
    scenarios: [
      {
        label: "2021 Russian GP: Lando Norris boxes for inters on lap 49",
        query: "What if Lando Norris pitted for intermediate tires when the rain started on lap 49 at the 2021 Russian Grand Prix in Sochi?",
      },
      {
        label: "2011 Canadian GP: Vettel holds racing line on lap 70",
        query: "What if Sebastian Vettel did not slide wide on Turn 6 on the final lap under pressure from Jenson Button at the 2011 Canadian Grand Prix?",
      },
      {
        label: "1998 Belgian GP: Schumacher avoids Coulthard in spray",
        query: "What if Michael Schumacher had safely passed David Coulthard in the heavy rain spray at the 1998 Belgian Grand Prix at Spa?",
      },
    ],
  },
  {
    category: "🛑 Pit Blunders & Tactical Gambles",
    scenarios: [
      {
        label: "2022 Monaco GP: Ferrari avoids Leclerc double-stack blunder",
        query: "What if Ferrari kept Charles Leclerc out or called him in on the optimal lap instead of double stacking him at the 2022 Monaco Grand Prix?",
      },
      {
        label: "2015 Monaco GP: Mercedes leaves Hamilton out under VSC",
        query: "What if Mercedes did not call Lewis Hamilton into the pits under the late Safety Car while leading at the 2015 Monaco Grand Prix?",
      },
      {
        label: "2005 European GP: McLaren pits Raikkonen for flat-spotted tire",
        query: "What if McLaren pitted Kimi Raikkonen to change his violently vibrating front-right tire at the 2005 European Grand Prix at the Nürburgring?",
      },
    ],
  },
];

export default function WhatIfPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSelectPreset = (scenarioQuery: string) => {
    setQuery(scenarioQuery);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ai/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to simulate scenario.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 min-h-[calc(100vh-200px)] flex flex-col">
      {/* Historical Sub-Navigation */}
      <HistoryNav activeTab="what-if" />

      <div className="eyebrow mt-6">Strategy Simulator</div>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div className="w-10 h-10 rounded-xs bg-[var(--surface-elevated)] border border-[var(--amber-pit)]/40 flex items-center justify-center">
          <FastForward className="w-5 h-5 text-[var(--amber-pit)]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-[family-name:var(--font-disp)] uppercase">
          &ldquo;What If?&rdquo; Strategy Simulator
        </h1>
      </div>
      
      <p className="text-[var(--text-secondary)] mb-6 text-sm max-w-2xl leading-[1.6]">
        Simulate counterfactual Formula 1 scenarios. The system queries factual telemetry archives, injects parameters into the tire degradation ML model, and simulates alternate outcomes.
      </p>

      {/* Preset Scenarios Dropdown */}
      <div className="mb-4 p-3 bg-[var(--surface-subtle)] border border-[var(--border-hairline)] rounded-sm font-mono text-xs">
        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1.5 font-bold">
          ⚡ Quick-Load Historical Scenario Dropdown
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) handleSelectPreset(e.target.value);
          }}
          defaultValue=""
          className="w-full bg-[var(--surface-console)] border border-[var(--border-hairline)] focus:border-[var(--amber)] px-3 py-2 rounded-none text-white focus:outline-none cursor-pointer"
        >
          <option value="" disabled>
            Select a classic F1 historical scenario or type your own below...
          </option>
          {PRESET_SCENARIOS.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.scenarios.map((s, idx) => (
                <option key={`${group.category}-${idx}`} value={s.query}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What if Hamilton pitted 5 laps earlier at the 2021 Abu Dhabi Grand Prix?"
          className="bg-[var(--surface-elevated)] border border-[var(--border-hairline)] block w-full pl-10 pr-32 py-3 text-xs text-[var(--text-primary)] rounded-xs focus:border-[var(--amber-pit)] focus:outline-none font-mono placeholder:text-[var(--text-muted)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute inset-y-1.5 right-1.5 px-4 bg-[var(--amber-pit)] hover:bg-[var(--amber-pit-hover)] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating</span>
            </>
          ) : (
            'Simulate'
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-8 bg-[var(--flag-red)]/10 border border-[var(--flag-red)]/40 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--flag-red)] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[var(--flag-red)] font-bold text-sm mb-1 font-mono uppercase">Simulation Engine Error</h3>
            <p className="text-[var(--flag-red)]/80 text-xs font-mono m-0">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-2 border-[var(--border-hairline)] rounded-full"></div>
            <div className="absolute inset-0 border-2 border-[var(--amber-pit)] rounded-full border-t-transparent animate-spin"></div>
            <Bot className="absolute inset-0 m-auto w-6 h-6 text-[var(--amber-pit)] animate-pulse" />
          </div>
          <h3 className="text-base font-bold font-mono text-[var(--text-primary)] mb-1 uppercase tracking-wider">Calculating Alternate Timeline...</h3>
          <p className="font-mono text-xs text-[var(--text-muted)]">Querying historical telemetry and running ML inference</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Reality Card */}
            <div className="console-panel p-5 rounded-sm relative border border-[var(--border-hairline)]">
              <div className="absolute top-0 right-0 bg-[var(--surface-elevated)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono border-b border-l border-[var(--border-hairline)] rounded-bl-xs">
                Factual Reality
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">Historical Baseline</div>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-5xl font-bold text-[var(--text-primary)] font-mono tabular-nums">
                  P{result.original.position}
                </div>
                <div className="pb-1 text-xs text-[var(--text-secondary)] font-mono font-medium">
                  {result.driverName}
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--border-hairline)] flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Official Race Time</span>
                <span className="text-[var(--text-primary)] tabular-nums">{result.original.time || 'N/A'}</span>
              </div>
            </div>

            {/* Simulation Card */}
            <div className="console-panel p-5 rounded-sm relative border border-[var(--amber-pit)]/40">
              <div className="absolute top-0 right-0 bg-[var(--amber-pit)]/15 px-2.5 py-1 text-[10px] font-bold text-[var(--amber-pit)] uppercase tracking-wider font-mono border-b border-l border-[var(--amber-pit)]/40 rounded-bl-xs">
                Simulated Reality
              </div>
              
              <div className="text-[10px] font-mono text-[var(--amber-pit)] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                <RefreshCcw className="w-3 h-3" /> ML Physics Inference
              </div>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-5xl font-bold text-[var(--amber-pit)] font-mono tabular-nums">
                  P{result.simulated.position}
                </div>
                <div className="pb-1 flex items-center gap-2">
                  {result.simulated.position < result.original.position ? (
                    <span className="text-[var(--flag-green)] font-bold text-xs bg-[var(--flag-green)]/15 border border-[var(--flag-green)]/30 px-2 py-0.5 rounded-xs font-mono">
                      &uarr; Gained {result.original.position - result.simulated.position} places
                    </span>
                  ) : result.simulated.position > result.original.position ? (
                    <span className="text-[var(--flag-red)] font-bold text-xs bg-[var(--flag-red)]/15 border border-[var(--flag-red)]/30 px-2 py-0.5 rounded-xs font-mono">
                      &darr; Lost {result.simulated.position - result.original.position} places
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] font-bold text-xs bg-[var(--surface-elevated)] px-2 py-0.5 rounded-xs font-mono border border-[var(--border-hairline)]">
                      No position delta
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--border-hairline)] flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Simulated Race Time</span>
                <span className="text-[var(--text-primary)] tabular-nums">
                  {result.simulated.time} 
                  {result.timeDeltaMs && (
                    <span className={`ml-2 ${result.timeDeltaMs < 0 ? 'text-[var(--flag-green)]' : 'text-[var(--flag-red)]'}`}>
                      ({result.timeDeltaMs > 0 ? '+' : ''}{(result.timeDeltaMs / 1000).toFixed(3)}s)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="console-panel p-6 rounded-sm border border-[var(--border-hairline)]">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[var(--amber-pit)]" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white m-0">
                  Telemetry Analysis &amp; Verdict
                </h3>
              </div>
            </div>
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-3 font-mono">
              {result.narrative.split('\n').map((para: string, i: number) => (
                para.trim() && <p key={i} className="m-0 leading-[1.6]">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
