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
    <main className="max-w-[1000px] mx-auto px-6 py-12 min-h-[calc(100vh-200px)] flex flex-col">
      <Link href="/history" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit">← Back to History</Link>
      
      <div className="eyebrow mt-8">AI + Machine Learning</div>
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-[var(--amber)]/15 flex items-center justify-center border border-[var(--amber)]/25">
          <FastForward className="w-6 h-6 text-[var(--amber)]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-disp)] uppercase">&ldquo;What If?&rdquo; Simulator</h1>
      </div>
      
      <p className="text-[var(--text-secondary)] mb-8 text-lg max-w-2xl leading-[1.65]">
        Enter a historical scenario. Our AI retrieves the factual race data, applies our machine learning tire model to calculate a new timeline, and narrates the alternate reality.
      </p>
      
      <form onSubmit={handleSubmit} className="relative mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-[var(--text-muted)]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What if Hamilton pitted 5 laps earlier at the 2021 Abu Dhabi Grand Prix?"
          className="glass-input block w-full pl-12 pr-36 py-5 text-lg rounded-[var(--radius-xl)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute inset-y-2 right-2 px-6 bg-[var(--amber)] text-[#1a1200] font-bold rounded-[var(--radius-lg)] hover:shadow-[0_8px_24px_rgba(255,176,32,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Simulating
            </>
          ) : (
            'Simulate'
          )}
        </button>
      </form>

      {error && (
        <div className="p-6 mb-8 bg-[var(--flag-red)]/10 border border-[var(--flag-red)]/30 rounded-[var(--radius-xl)] flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-[var(--flag-red)] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[var(--flag-red)] font-bold text-lg mb-1">Simulation Failed</h3>
            <p className="text-[var(--flag-red)]/80">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-[var(--border-subtle)] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[var(--amber)] rounded-full border-t-transparent animate-spin"></div>
            <Bot className="absolute inset-0 m-auto w-10 h-10 text-[var(--amber)] animate-pulse" />
          </div>
          <h3 className="text-xl font-bold font-[family-name:var(--font-disp)] text-[var(--text-primary)] mb-2 uppercase">Calculating Alternate Timeline...</h3>
          <p className="animate-pulse font-mono text-sm">Retrieving historical data and running ML inference</p>
        </div>
      )}

      {result && !loading && (
        <div className="animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Reality Card */}
            <div className="card glass rounded-[var(--radius-xl)] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--bg-card-hover)] px-3 py-1 rounded-bl-lg text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                Original Reality
              </div>
              <h3 className="text-sm text-[var(--text-muted)] uppercase font-bold tracking-wider mb-4 font-mono">Historical Fact</h3>
              <div className="flex items-end gap-4">
                <div className="text-6xl font-black text-[var(--text-primary)] font-mono">
                  P{result.original.position}
                </div>
                <div className="pb-2 text-[var(--text-secondary)] font-medium">
                  {result.driverName}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Race Time</span>
                <span className="font-mono text-[var(--text-primary)]">{result.original.time || 'N/A'}</span>
              </div>
            </div>

            {/* Simulation Card */}
            <div className="card glass rounded-[var(--radius-xl)] p-6 relative overflow-hidden border-[var(--amber)]/30">
              <div className="absolute top-0 right-0 bg-[var(--amber)]/15 px-3 py-1 rounded-bl-lg text-xs font-bold text-[var(--amber)] uppercase tracking-wider font-mono">
                Simulated Reality
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[var(--amber)]/10 rounded-full blur-3xl pointer-events-none" />
              
              <h3 className="text-sm text-[var(--amber)] uppercase font-bold tracking-wider mb-4 flex items-center gap-2 font-mono">
                <RefreshCcw className="w-4 h-4" /> ML Inference
              </h3>
              <div className="flex items-end gap-4">
                <div className="text-6xl font-black text-[var(--amber)] font-mono">
                  P{result.simulated.position}
                </div>
                <div className="pb-2 flex items-center gap-2">
                  {result.simulated.position < result.original.position ? (
                    <span className="text-[var(--green-flag)] font-bold text-sm bg-[var(--green-flag)]/10 px-2 py-0.5 rounded font-mono">
                      Gained {result.original.position - result.simulated.position} places
                    </span>
                  ) : result.simulated.position > result.original.position ? (
                    <span className="text-[var(--flag-red)] font-bold text-sm bg-[var(--flag-red)]/10 px-2 py-0.5 rounded font-mono">
                      Lost {result.simulated.position - result.original.position} places
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] font-bold text-sm bg-[var(--bg-card-hover)] px-2 py-0.5 rounded font-mono">
                      No position change
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex justify-between text-sm relative z-10">
                <span className="text-[var(--text-muted)]">New Race Time</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {result.simulated.time} 
                  {result.timeDeltaMs && (
                    <span className={`ml-2 ${result.timeDeltaMs < 0 ? 'text-[var(--green-flag)]' : 'text-[var(--flag-red)]'}`}>
                      ({result.timeDeltaMs > 0 ? '+' : ''}{(result.timeDeltaMs / 1000).toFixed(3)}s)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="card glass rounded-[var(--radius-xl)] p-8">
            <h3 className="text-xl font-bold mb-6 font-[family-name:var(--font-disp)] uppercase flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
              <Bot className="w-6 h-6 text-[var(--amber)]" />
              The Verdict
            </h3>
            <div className="max-w-none text-[var(--text-secondary)] leading-relaxed">
              {result.narrative.split('\n').map((para: string, i: number) => (
                para.trim() && <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
