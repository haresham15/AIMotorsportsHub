"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ranking {
  driverId: number;
  name: string;
  peakElo: number;
  currentElo: number;
  races: number;
  wins: number;
  championships: number;
  era: string;
}

export default function GoatDebatePage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings?active=${filterActive}`);
        const data = await res.json();
        if (data.rankings) {
          setRankings(data.rankings);
        }
      } catch (err) {
        console.error("Failed to load rankings", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRankings();
  }, [filterActive]);

  const getMedalColor = (index: number) => {
    if (index === 0) return "var(--amber)";
    if (index === 1) return "#94a3b8";
    if (index === 2) return "#cd7f32";
    return "var(--text-muted)";
  };

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/history" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to History</Link>

      <div className="eyebrow mt-8">Statistical Analysis</div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 font-[family-name:var(--font-disp)] uppercase flex items-center gap-4 flex-wrap">
        <span>The <span className="text-[var(--amber)]">GOAT</span> Debate</span>
      </h1>
      <p className="text-[var(--text-secondary)] text-lg max-w-[640px] mb-10 leading-[1.65]">
        A mathematically rigorous, dual-Elo rating system evaluating every race since 1950.
        This model isolates driver skill from car dominance by heavily weighting performance against teammates.
      </p>

      {/* Filter Toggle */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setFilterActive(false)}
          className={`px-5 py-2.5 rounded-[6px] text-[13px] font-semibold transition-all ${
            !filterActive 
              ? "bg-[var(--amber)] text-[#1a1200]" 
              : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          All-Time Greats
        </button>
        <button
          onClick={() => setFilterActive(true)}
          className={`px-5 py-2.5 rounded-[6px] text-[13px] font-semibold transition-all ${
            filterActive 
              ? "bg-[var(--amber)] text-[#1a1200]" 
              : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Active Drivers
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--amber)] rounded-full animate-spin mb-4"></div>
          <p className="font-mono text-sm tracking-wider uppercase">Crunching 70+ years of racing data...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((driver, index) => (
            <div
              key={driver.driverId}
              className={`card glass rounded-[var(--radius-lg)] p-5 flex items-center gap-5 transition-all hover:bg-[var(--bg-card-hover)] group ${
                index < 3 ? "border-l-[3px]" : ""
              }`}
              style={index < 3 ? { borderLeftColor: getMedalColor(index) } : undefined}
            >
              {/* Rank */}
              <div className="w-12 text-center shrink-0">
                {index < 3 ? (
                  <div
                    className="font-[family-name:var(--font-disp)] text-3xl font-black"
                    style={{ color: getMedalColor(index) }}
                  >
                    {index + 1}
                  </div>
                ) : (
                  <div className="font-mono text-lg font-bold text-[var(--text-muted)]">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Driver Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold tracking-tight truncate">
                  {driver.name}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  <span>{driver.races} starts</span>
                  <span className="text-[var(--border-hover)]">•</span>
                  <span>{driver.wins} wins ({Math.round(driver.wins / driver.races * 100)}%)</span>
                  <span className="text-[var(--border-hover)]">•</span>
                  <span>{driver.era}</span>
                </div>
              </div>

              {/* Elo Score */}
              <div className="text-right shrink-0">
                <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Peak Rating</div>
                <div
                  className="font-[family-name:var(--font-disp)] text-2xl font-black tabular-nums"
                  style={{ color: index < 3 ? getMedalColor(index) : "var(--text-primary)" }}
                >
                  {driver.peakElo.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
