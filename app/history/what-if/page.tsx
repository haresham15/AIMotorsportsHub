'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, FastForward, Loader2, RefreshCcw, Search, AlertTriangle } from 'lucide-react';

export default function WhatIfPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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
    <main className="max-w-[800px] mx-auto px-6 py-12 min-h-[calc(100vh-200px)] flex flex-col">
      <Link href="/history" className="text-xs font-mono font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit inline-flex items-center gap-1.5">
        &larr; Telemetry Archive
      </Link>
      
      <div className="eyebrow mt-6">Strategy Simulator</div>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div className="w-10 h-10 rounded-xs bg-[var(--surface-elevated)] border border-[var(--amber-pit)]/40 flex items-center justify-center">
          <FastForward className="w-5 h-5 text-[var(--amber-pit)]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-[family-name:var(--font-disp)] uppercase">&ldquo;What If?&rdquo; Simulator</h1>
      </div>
      
      <p className="text-[var(--text-secondary)] mb-8 text-sm max-w-2xl leading-[1.6]">
        Enter a historical scenario. The system queries factual telemetry archives, injects parameters into the tire degradation ML model, and simulates alternate outcomes.
      </p>
      
      <form onSubmit={handleSubmit} className="relative mb-10">
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
