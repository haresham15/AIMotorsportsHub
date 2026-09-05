'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin, Trophy, Flag, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface TrackItem {
  circuitId: number;
  name: string;
  country: string;
  racesHosted: number;
}

interface TracksExplorerProps {
  tracks: TrackItem[];
}

export default function TracksExplorer({ tracks }: TracksExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'races-desc' | 'races-asc' | 'name-asc' | 'country-asc'>('races-desc');

  // Compute country statistics for intelligent optgroups
  const { topCountries, allCountries } = useMemo(() => {
    const countryCounts: Record<string, { count: number; totalRaces: number }> = {};
    for (const t of tracks) {
      if (!countryCounts[t.country]) {
        countryCounts[t.country] = { count: 0, totalRaces: 0 };
      }
      countryCounts[t.country].count += 1;
      countryCounts[t.country].totalRaces += t.racesHosted;
    }

    const uniqueCountries = Object.keys(countryCounts).sort();
    const top = [...uniqueCountries]
      .filter((c) => countryCounts[c].totalRaces >= 20)
      .sort((a, b) => countryCounts[b].totalRaces - countryCounts[a].totalRaces);

    return {
      topCountries: top.map((c) => ({
        country: c,
        circuits: countryCounts[c].count,
        races: countryCounts[c].totalRaces,
      })),
      allCountries: uniqueCountries.map((c) => ({
        country: c,
        circuits: countryCounts[c].count,
        races: countryCounts[c].totalRaces,
      })),
    };
  }, [tracks]);

  // Filter and sort tracks
  const filteredTracks = useMemo(() => {
    return tracks
      .filter((t) => {
        // Country filter
        if (selectedCountry !== 'ALL' && t.country !== selectedCountry) {
          return false;
        }

        // Tier filter
        if (tierFilter === 'MONUMENT' && t.racesHosted < 50) return false;
        if (tierFilter === 'ESTABLISHED' && (t.racesHosted < 20 || t.racesHosted >= 50)) return false;
        if (tierFilter === 'MODERN' && t.racesHosted >= 20) return false;

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return t.name.toLowerCase().includes(q) || t.country.toLowerCase().includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'races-asc':
            return a.racesHosted - b.racesHosted;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'country-asc':
            return a.country.localeCompare(b.country) || b.racesHosted - a.racesHosted;
          case 'races-desc':
          default:
            return b.racesHosted - a.racesHosted;
        }
      });
  }, [tracks, selectedCountry, tierFilter, searchQuery, sortOption]);

  const hasActiveFilters = searchQuery !== '' || selectedCountry !== 'ALL' || tierFilter !== 'ALL' || sortOption !== 'races-desc';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('ALL');
    setTierFilter('ALL');
    setSortOption('races-desc');
  };

  return (
    <div className="space-y-6">
      {/* ── Filter & Sort Control Deck ─────────────────────────────── */}
      <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--border-hairline)] rounded-sm space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2.5">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
            <SlidersHorizontal size={13} className="text-[var(--amber)]" />
            <span>Circuit Directory &amp; Records Controls</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[10px] text-[var(--amber)] hover:underline cursor-pointer uppercase tracking-wider"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Instant Search */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Search Circuit / Country
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Monza, Silverstone, Italy..."
                className="w-full bg-[var(--surface-console)] border border-[var(--border-hairline)] focus:border-[var(--amber)] px-2.5 py-1.5 pl-7 rounded-none text-white placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Country Filter Dropdown with Optgroups */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Host Country
            </label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-[var(--surface-console)] border border-[var(--border-hairline)] focus:border-[var(--amber)] px-2.5 py-1.5 rounded-none text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Countries ({allCountries.length})</option>
                <optgroup label="🏆 Major GP Host Nations (20+ Races)">
                  {topCountries.map((c) => (
                    <option key={`top-${c.country}`} value={c.country}>
                      {c.country} ({c.races} races &bull; {c.circuits} {c.circuits === 1 ? 'track' : 'tracks'})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌍 All Host Nations (A-Z)">
                  {allCountries.map((c) => (
                    <option key={`all-${c.country}`} value={c.country}>
                      {c.country} ({c.circuits} {c.circuits === 1 ? 'track' : 'tracks'})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Circuit Tier Dropdown */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Circuit Pedigree / Tier
            </label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full bg-[var(--surface-console)] border border-[var(--border-hairline)] focus:border-[var(--amber)] px-2.5 py-1.5 rounded-none text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tiers ({tracks.length} Circuits)</option>
              <option value="MONUMENT">🏆 Monument Classics (50+ GPs)</option>
              <option value="ESTABLISHED">🏎️ Established Venues (20–49 GPs)</option>
              <option value="MODERN">🏁 Occasional &amp; Modern (1–19 GPs)</option>
            </select>
          </div>

          {/* Sort Order Dropdown */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Sort Sequence
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full bg-[var(--surface-console)] border border-[var(--border-hairline)] focus:border-[var(--amber)] px-2.5 py-1.5 rounded-none text-white focus:outline-none cursor-pointer"
            >
              <option value="races-desc">Most Races Hosted &darr;</option>
              <option value="races-asc">Fewest Races Hosted &uarr;</option>
              <option value="name-asc">Circuit Name (A–Z)</option>
              <option value="country-asc">Country (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
          <div>
            Showing <span className="text-white font-bold">{filteredTracks.length}</span> of{' '}
            <span className="text-white">{tracks.length}</span> tracks in registry
          </div>
          {selectedCountry !== 'ALL' && (
            <span className="text-amber-400 font-mono">
              Filtered: {selectedCountry}
            </span>
          )}
        </div>
      </div>

      {/* ── Track Records Table ────────────────────────────────────── */}
      <div className="card glass rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs uppercase text-[var(--text-muted)] bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] font-mono">
              <tr>
                <th className="px-6 py-3.5 font-bold tracking-wider">#</th>
                <th className="px-6 py-3.5 font-bold tracking-wider">Circuit Name</th>
                <th className="px-6 py-3.5 font-bold tracking-wider">Country</th>
                <th className="px-6 py-3.5 font-bold tracking-wider">Pedigree Status</th>
                <th className="px-6 py-3.5 font-bold tracking-wider text-right">Races Hosted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredTracks.map((t, idx) => {
                const isMonument = t.racesHosted >= 50;
                const isEstablished = t.racesHosted >= 20 && t.racesHosted < 50;

                return (
                  <tr
                    key={t.circuitId}
                    className="hover:bg-[var(--surface-highlight)] transition-colors group font-mono"
                  >
                    <td className="px-6 py-3.5 text-xs text-[var(--text-muted)] font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[var(--text-primary)] group-hover:text-[var(--amber)] transition-colors">
                      {t.name}
                    </td>
                    <td className="px-6 py-3.5 text-[var(--text-secondary)] flex items-center gap-1.5">
                      <MapPin size={12} className="text-[var(--text-muted)]" />
                      <span>{t.country}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      {isMonument ? (
                        <span className="px-2 py-0.5 rounded-none bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider text-[10px]">
                          Monument Classic
                        </span>
                      ) : isEstablished ? (
                        <span className="px-2 py-0.5 rounded-none bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase tracking-wider text-[10px]">
                          Established GP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-none bg-white/5 text-[var(--text-muted)] border border-white/5 uppercase tracking-wider text-[10px]">
                          GP Venue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-[var(--amber)]">
                      {t.racesHosted}
                    </td>
                  </tr>
                );
              })}

              {filteredTracks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)] font-mono text-xs">
                    No circuits match your filter criteria. Try resetting filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
