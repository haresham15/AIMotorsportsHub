"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import HistoryNav from "@/components/history/HistoryNav";
import { 
  Trophy, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  HelpCircle,
  ChevronRight,
  RotateCcw
} from "lucide-react";

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
  const [allRankings, setAllRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown filter states
  const [selectedEra, setSelectedEra] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"peakElo" | "currentElo" | "wins" | "winRate" | "races">("peakElo");
  const [eligibility, setEligibility] = useState<"all" | "active" | "winners" | "legends" | "titans">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings?minRaces=15`);
        const data = await res.json();
        if (data.rankings) {
          setAllRankings(data.rankings);
        }
      } catch (err) {
        console.error("Failed to load rankings", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRankings();
  }, []);

  // Filter and sort the rankings based on dropdown states
  const filteredAndSorted = useMemo(() => {
    let result = [...allRankings];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }

    // 2. Era filter
    if (selectedEra !== "ALL") {
      if (selectedEra === "2020s") {
        result = result.filter(r => r.era.includes("2020s"));
      } else if (selectedEra === "2010s") {
        result = result.filter(r => r.era.includes("2010s"));
      } else if (selectedEra === "2000s") {
        result = result.filter(r => r.era.includes("2000s"));
      } else if (selectedEra === "1990s") {
        result = result.filter(r => r.era.includes("1990s"));
      } else if (selectedEra === "1980s") {
        result = result.filter(r => r.era.includes("1980s"));
      } else if (selectedEra === "1970s") {
        result = result.filter(r => r.era.includes("1970s"));
      } else if (selectedEra === "1950s-1960s") {
        result = result.filter(r => r.era.includes("1950s") || r.era.includes("1960s"));
      }
    }

    // 3. Eligibility / Status filter
    if (eligibility === "active") {
      result = result.filter(r => r.era.includes("2020s"));
    } else if (eligibility === "winners") {
      result = result.filter(r => r.wins >= 1);
    } else if (eligibility === "legends") {
      result = result.filter(r => r.wins >= 10);
    } else if (eligibility === "titans") {
      result = result.filter(r => r.wins >= 25);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "peakElo") return b.peakElo - a.peakElo;
      if (sortBy === "currentElo") return b.currentElo - a.currentElo;
      if (sortBy === "wins") return b.wins - a.wins;
      if (sortBy === "races") return b.races - a.races;
      if (sortBy === "winRate") {
        const rateA = a.races > 0 ? a.wins / a.races : 0;
        const rateB = b.races > 0 ? b.wins / b.races : 0;
        return rateB - rateA;
      }
      return 0;
    });

    return result;
  }, [allRankings, searchQuery, selectedEra, sortBy, eligibility]);

  const getMedalColor = (index: number) => {
    if (index === 0) return "var(--amber)";
    if (index === 1) return "#94a3b8";
    if (index === 2) return "#cd7f32";
    return "var(--text-muted)";
  };

  const resetFilters = () => {
    setSelectedEra("ALL");
    setSortBy("peakElo");
    setEligibility("all");
    setSearchQuery("");
  };

  const isFiltered = selectedEra !== "ALL" || sortBy !== "peakElo" || eligibility !== "all" || searchQuery !== "";

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-10">
      {/* Sub-navigation bar */}
      <HistoryNav activeTab="goat" />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow flex items-center gap-2 flex-wrap">
            <Trophy size={13} className="text-[var(--amber)]" />
            <span>Dual-Elo Statistical Model &bull; Formula 1 (1950 &ndash; Present)</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-none bg-red-600/15 text-red-400 border border-red-500/25 uppercase tracking-wider">
              F1 Active &bull; Multi-Series in Dev
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-disp)] uppercase text-white mt-1">
            The <span className="text-[var(--amber)]">GOAT</span> Debate
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-[620px] mt-2 leading-relaxed">
            Mathematically isolates Formula 1 driver skill from constructor dominance by evaluating relative teammate performance across 75 seasons of Grand Prix racing. Multi-motorsport ratings (WEC, NASCAR, IndyCar) are currently in development.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3 bg-[var(--surface-elevated)] border border-[var(--border-hairline)] p-3 rounded-none shrink-0 font-mono text-xs">
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Ranked Drivers</div>
            <div className="text-base font-bold text-white">{filteredAndSorted.length}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Highest Rating</div>
            <div className="text-base font-bold text-[var(--amber)]">
              {filteredAndSorted[0]?.peakElo?.toLocaleString() ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter & Sort Control Deck ─────────────────────────────── */}
      <div className="card glass rounded-none border border-[var(--border-hairline)] p-4 mb-8 bg-[var(--surface-console)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Racing Era Dropdown */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <Filter size={11} className="text-[var(--amber)]" />
              <span>Racing Era</span>
            </label>
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2.5 rounded-none outline-none focus:border-[var(--amber)] cursor-pointer"
            >
              <option value="ALL">All Eras (1950 &ndash; Present)</option>
              <option value="2020s">2020s &bull; Ground Effect Era</option>
              <option value="2010s">2010s &bull; Turbo-Hybrid V6</option>
              <option value="2000s">2000s &bull; V10 &amp; High-Rev V8</option>
              <option value="1990s">1990s &bull; Electronic Active Suspension</option>
              <option value="1980s">1980s &bull; 1.5L Turbo Monster Era</option>
              <option value="1970s">1970s &bull; Ground Effect &amp; Cosworth DFV</option>
              <option value="1950s-1960s">1950s&ndash;1960s &bull; Golden Era</option>
            </select>
          </div>

          {/* 2. Ranking Metric / Sort Dropdown */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <ArrowUpDown size={11} className="text-[var(--amber)]" />
              <span>Sort Metric</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2.5 rounded-none outline-none focus:border-[var(--amber)] cursor-pointer"
            >
              <option value="peakElo">Peak Elo Rating (Career Zenith)</option>
              <option value="wins">Total Grand Prix Wins</option>
              <option value="winRate">Win Rate % (Starts vs Wins)</option>
              <option value="races">Total Career Starts</option>
              <option value="currentElo">Final Career Elo</option>
            </select>
          </div>

          {/* 3. Driver Pool / Status Dropdown */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <Users size={11} className="text-[var(--amber)]" />
              <span>Driver Pool</span>
            </label>
            <select
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value as any)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2.5 rounded-none outline-none focus:border-[var(--amber)] cursor-pointer"
            >
              <option value="all">All Qualified (15+ Starts)</option>
              <option value="active">Active 2024&ndash;2025 Grid</option>
              <option value="winners">Grand Prix Winners (1+ Wins)</option>
              <option value="legends">Legends (10+ Wins)</option>
              <option value="titans">Titans of Sport (25+ Wins)</option>
            </select>
          </div>

          {/* 4. Instant Search Input */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
              <Search size={11} className="text-[var(--amber)]" />
              <span>Driver Search</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Senna, Hamilton..."
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2.5 pl-8 rounded-none outline-none focus:border-[var(--amber)] placeholder:text-[var(--text-muted)]"
              />
              <Search size={13} className="absolute left-2.5 top-3 text-[var(--text-muted)] pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-white text-xs cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Indicator Bar */}
        {isFiltered && (
          <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <span>Showing {filteredAndSorted.length} of {allRankings.length} drivers</span>
              {selectedEra !== "ALL" && (
                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                  Era: {selectedEra}
                </span>
              )}
              {eligibility !== "all" && (
                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                  Pool: {eligibility}
                </span>
              )}
              {sortBy !== "peakElo" && (
                <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px]">
                  Sorted: {sortBy}
                </span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[10px] text-[var(--amber)] hover:text-amber-300 underline cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      {/* Rankings List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--amber)] rounded-full animate-spin mb-4" />
          <p className="font-mono text-xs tracking-wider uppercase">Crunching 74 years of teammate Elo deltas...</p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-16 card glass rounded-none border border-[var(--border-hairline)] p-8">
          <p className="text-sm font-mono text-[var(--text-muted)] mb-3">No drivers found matching your selected filters.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[var(--amber)] text-black font-mono font-bold text-xs uppercase cursor-pointer hover:bg-yellow-400 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSorted.map((driver, index) => {
            const winPct = driver.races > 0 ? Math.round((driver.wins / driver.races) * 100) : 0;
            const isTop3 = index < 3 && selectedEra === "ALL" && eligibility === "all" && sortBy === "peakElo";

            return (
              <div
                key={driver.driverId}
                className={`card glass rounded-none p-4 flex items-center gap-4 transition-all hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] group ${
                  isTop3 ? "border-l-4" : ""
                }`}
                style={isTop3 ? { borderLeftColor: getMedalColor(index) } : undefined}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {isTop3 ? (
                    <div
                      className="font-[family-name:var(--font-disp)] text-2xl font-black"
                      style={{ color: getMedalColor(index) }}
                    >
                      {index + 1}
                    </div>
                  ) : (
                    <div className="font-mono text-sm font-bold text-[var(--text-muted)]">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight truncate text-white group-hover:text-amber-300 transition-colors">
                      {driver.name}
                    </h2>
                    {driver.era.includes("2020s") && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-none shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-1 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex-wrap">
                    <span>{driver.races} starts</span>
                    <span className="text-white/20">&bull;</span>
                    <span className={driver.wins > 0 ? 'text-amber-400 font-semibold' : ''}>
                      {driver.wins} wins ({winPct}%)
                    </span>
                    <span className="text-white/20">&bull;</span>
                    <span>{driver.era}</span>
                  </div>
                </div>

                {/* Elo Score & Action Link */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-0.5">
                      {sortBy === "wins" ? "Grand Prix Wins" : sortBy === "winRate" ? "Win Rate" : sortBy === "races" ? "Career Starts" : "Peak Elo"}
                    </div>
                    <div
                      className="font-[family-name:var(--font-disp)] text-xl md:text-2xl font-black tabular-nums"
                      style={{ color: isTop3 ? getMedalColor(index) : "var(--text-primary)" }}
                    >
                      {sortBy === "wins" ? driver.wins : sortBy === "winRate" ? `${winPct}%` : sortBy === "races" ? driver.races : driver.peakElo.toLocaleString()}
                    </div>
                  </div>

                  {/* Head to Head Link Button */}
                  <Link
                    href={`/history/head-to-head?d1=${driver.driverId}`}
                    className="hidden sm:flex items-center justify-center p-2 rounded-none bg-white/5 hover:bg-[var(--amber)] hover:text-black text-[var(--text-muted)] border border-white/5 transition-colors"
                    title={`Compare ${driver.name} in Head-to-Head`}
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
