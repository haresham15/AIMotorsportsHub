'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HistoryNav from '@/components/history/HistoryNav';
import { Calendar, Filter, Search, ArrowRight, Trophy } from 'lucide-react';

const DECADE_CONFIG = [
  { id: 'ALL', label: 'All Decades (1950–Present)', era: 'Complete Championship History' },
  { id: '2020s', label: '2020s (2020–2024)', era: 'Ground Effect & Turbo Hybrid', min: 2020, max: 2029 },
  { id: '2010s', label: '2010s (2010–2019)', era: 'Turbo-Hybrid V6 & Mercedes Era', min: 2010, max: 2019 },
  { id: '2000s', label: '2000s (2000–2009)', era: 'V10 Screamer & High-Rev V8 Era', min: 2000, max: 2009 },
  { id: '1990s', label: '1990s (1990–1999)', era: 'Electronics & V10 Titans', min: 1990, max: 1999 },
  { id: '1980s', label: '1980s (1980–1989)', era: '1.5L Turbo Boost Monsters', min: 1980, max: 1989 },
  { id: '1970s', label: '1970s (1970–1979)', era: 'Ground Effect & Cosworth DFV Dominance', min: 1970, max: 1979 },
  { id: '1960s', label: '1960s (1960–1969)', era: 'Cigar Cars & Aerodynamic Wings', min: 1960, max: 1969 },
  { id: '1950s', label: '1950s (1950–1959)', era: 'Golden Age of Front-Engine Legends', min: 1950, max: 1959 },
];

// Generate all seasons from 2024 down to 1950
const ALL_SEASONS = Array.from({ length: 2024 - 1950 + 1 }, (_, i) => 2024 - i);

export default function SeasonsPage() {
  const router = useRouter();
  const [selectedDecade, setSelectedDecade] = useState('ALL');
  const [searchYear, setSearchYear] = useState('');

  const filteredSeasons = useMemo(() => {
    let result = ALL_SEASONS;

    if (searchYear.trim()) {
      result = result.filter(y => String(y).includes(searchYear.trim()));
    } else if (selectedDecade !== 'ALL') {
      const config = DECADE_CONFIG.find(d => d.id === selectedDecade);
      if (config && config.min && config.max) {
        result = result.filter(y => y >= config.min && y <= config.max);
      }
    }

    return result;
  }, [selectedDecade, searchYear]);

  const handleQuickJump = (yearStr: string) => {
    if (yearStr) {
      router.push(`/history/seasons/${yearStr}`);
    }
  };

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-10">
      {/* Sub-navigation bar */}
      <HistoryNav activeTab="seasons" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <Calendar size={13} className="text-[var(--amber)]" />
            <span>Championship Archive &bull; 74 Seasons</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-disp)] uppercase text-white mt-1">
            Past <span className="text-[var(--amber)]">Seasons</span> Directory
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-[620px] mt-2 leading-relaxed">
            Every FIA Formula 1 World Championship season from the inaugural 1950 British Grand Prix to 2024. Browse final driver standings, constructor titles, and race results.
          </p>
        </div>

        {/* Quick Season Jumper Dropdown */}
        <div className="card glass rounded-none border border-[var(--border-hairline)] p-3.5 bg-[var(--surface-console)] shrink-0 w-full md:w-72">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)] mb-1.5 flex items-center justify-between">
            <span>Quick Season Jumper</span>
            <span className="text-[var(--text-muted)]">1950–2024</span>
          </label>
          <select
            onChange={(e) => handleQuickJump(e.target.value)}
            defaultValue=""
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2 rounded-none outline-none focus:border-[var(--amber)] cursor-pointer"
          >
            <option value="" disabled>Jump Directly to Year...</option>
            {DECADE_CONFIG.filter(d => d.id !== 'ALL').map(d => (
              <optgroup key={d.id} label={`${d.label} • ${d.era}`}>
                {ALL_SEASONS.filter(y => y >= d.min! && y <= d.max!).map(year => (
                  <option key={year} value={year}>
                    {year} World Championship
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* ── Filter & Navigation Deck ───────────────────────────────── */}
      <div className="card glass rounded-none border border-[var(--border-hairline)] p-4 mb-8 bg-[var(--surface-console)] flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Decade Dropdown */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Filter size={13} className="text-[var(--amber)] shrink-0" />
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase shrink-0">Filter Decade:</span>
          <select
            value={selectedDecade}
            onChange={(e) => {
              setSelectedDecade(e.target.value);
              setSearchYear('');
            }}
            className="bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2 rounded-none outline-none focus:border-[var(--amber)] cursor-pointer flex-1 md:w-64"
          >
            {DECADE_CONFIG.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Search Year */}
        <div className="relative w-full md:w-48">
          <input
            type="text"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
            placeholder="Search year (e.g. 2021)..."
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono p-2 pl-7 rounded-none outline-none focus:border-[var(--amber)] placeholder:text-[var(--text-muted)]"
          />
          <Search size={11} className="absolute left-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
          {searchYear && (
            <button
              onClick={() => setSearchYear('')}
              className="absolute right-2 top-1.5 text-[var(--text-muted)] hover:text-white text-xs cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Seasons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredSeasons.map((year) => (
          <Link
            key={year}
            href={`/history/seasons/${year}`}
            className="card glass rounded-none p-4 text-center font-mono border border-[var(--border-hairline)] hover:border-[var(--amber)] hover:bg-[var(--surface-elevated)] transition-all group no-underline relative"
          >
            <div className="text-xl font-black text-white group-hover:text-[var(--amber)] transition-colors font-[family-name:var(--font-disp)]">
              {year}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <span>View Season</span>
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[var(--amber)]" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
