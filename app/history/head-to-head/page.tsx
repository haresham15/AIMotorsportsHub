import Link from 'next/link';
import { getDriversWithStats, getHeadToHead } from '@/lib/db';
import HistoryNav from '@/components/history/HistoryNav';
import { Users, Swords, Trophy, Sparkles, ChevronRight, ArrowRightLeft } from 'lucide-react';

export const metadata = {
  title: 'Driver Head-to-Head - Historical Data',
};

const CLASSIC_RIVALRIES = [
  { label: 'Lewis Hamilton vs. Max Verstappen (2021 Title Fight)', d1: 1, d2: 830 },
  { label: 'Ayrton Senna vs. Alain Prost (1988–1993 McLaren War)', d1: 102, d2: 117 },
  { label: 'Michael Schumacher vs. Fernando Alonso (2005–2006 Shift)', d1: 30, d2: 4 },
  { label: 'Niki Lauda vs. James Hunt (1976 Title Decider)', d1: 182, d2: 231 },
  { label: 'Michael Schumacher vs. Mika Häkkinen (1998–2001)', d1: 30, d2: 57 },
  { label: 'Sebastian Vettel vs. Fernando Alonso (2010–2012)', d1: 20, d2: 4 },
  { label: 'Lewis Hamilton vs. Nico Rosberg (2014–2016 Silver War)', d1: 1, d2: 3 },
  { label: 'Charles Leclerc vs. Max Verstappen (Modern Rivals)', d1: 844, d2: 830 },
  { label: 'Lando Norris vs. Oscar Piastri (McLaren Teammates)', d1: 846, d2: 857 },
];

export default async function HeadToHeadPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const resolvedParams = await Promise.resolve(searchParams);
  
  const drivers = getDriversWithStats();
  
  const d1Param = resolvedParams.d1 as string;
  const d2Param = resolvedParams.d2 as string;
  
  let d1Id = d1Param ? parseInt(d1Param, 10) : null;
  let d2Id = d2Param ? parseInt(d2Param, 10) : null;
  
  // Default to Hamilton vs Verstappen if no params provided
  if (!d1Id && !d2Id) {
    d1Id = 1;
    d2Id = 830;
  }

  let comparisonData = null;
  let d1Info = null;
  let d2Info = null;

  if (d1Id && d2Id && !isNaN(d1Id) && !isNaN(d2Id)) {
    comparisonData = getHeadToHead(d1Id, d2Id) as any;
    d1Info = drivers.find(d => d.driverId === d1Id);
    d2Info = drivers.find(d => d.driverId === d2Id);
  }

  // Organize drivers into structured categories for dropdowns
  const worldChampions = drivers.filter(d => d.totalWins >= 10);
  const activeDrivers = drivers.filter(d => d.lastYear && d.lastYear >= 2024 && d.totalWins < 10);
  const raceWinners = drivers.filter(d => d.totalWins >= 1 && d.totalWins < 10 && (!d.lastYear || d.lastYear < 2024));
  const veterans = drivers.filter(d => d.totalWins === 0 && d.totalRaces >= 50);
  const otherDrivers = [...drivers].sort((a, b) => a.surname.localeCompare(b.surname));

  return (
    <main className="max-w-[900px] mx-auto px-6 py-10">
      {/* Sub-navigation bar */}
      <HistoryNav activeTab="head-to-head" />

      {/* Header */}
      <div className="mb-8">
        <div className="eyebrow flex items-center gap-2">
          <Users size={13} className="text-[var(--amber)]" />
          <span>Historical Archive &bull; Pairwise Analysis</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mt-1 mb-3 tracking-tight font-[family-name:var(--font-disp)] uppercase text-white">
          Driver <span className="text-[var(--amber)]">Head-to-Head</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-[640px] leading-relaxed">
          Compare any two drivers across every Grand Prix they both contested. Analyze finish deltas, points scored, race wins, and head-to-head qualifying records.
        </p>
      </div>

      {/* ── Selection Control Deck ──────────────────────────────────── */}
      <div className="card glass rounded-none border border-[var(--border-hairline)] p-6 mb-8 bg-[var(--surface-console)]">
        {/* Preset Rivalry Quick Selector */}
        <div className="mb-6 pb-5 border-b border-[var(--border-hairline)]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)] flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--amber)]" />
              <span>Classic Rivalry Quick-Load</span>
            </label>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">PRESET TITLE FIGHTS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {CLASSIC_RIVALRIES.slice(0, 6).map((rivalry, idx) => {
              const isActive = (d1Id === rivalry.d1 && d2Id === rivalry.d2) || (d1Id === rivalry.d2 && d2Id === rivalry.d1);
              return (
                <Link
                  key={idx}
                  href={`/history/head-to-head?d1=${rivalry.d1}&d2=${rivalry.d2}`}
                  className={`p-2 rounded-none border text-[11px] font-mono transition-all no-underline flex items-center justify-between ${
                    isActive
                      ? 'bg-[var(--amber)] text-black font-bold border-[var(--amber)] shadow-sm'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-active)] border-[var(--border-hairline)]'
                  }`}
                >
                  <span className="truncate">{rivalry.label.split('(')[0]}</span>
                  <ChevronRight size={11} className="shrink-0 opacity-60" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Custom Driver Comparison Form */}
        <form method="GET" action="/history/head-to-head" className="flex flex-col md:flex-row gap-4 items-end">
          {/* Driver 1 Select */}
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Driver 1 (Primary)</span>
            </label>
            <select
              name="d1"
              defaultValue={d1Id || ""}
              className="w-full p-2.5 bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono rounded-none focus:outline-none focus:border-[var(--amber)] transition-colors cursor-pointer"
            >
              <option value="" disabled>Select Driver 1</option>

              <optgroup label="🏆 World Champions & Multi-Winners (10+ Wins)">
                {worldChampions.map(d => (
                  <option key={`d1-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; {d.totalWins} Wins
                  </option>
                ))}
              </optgroup>

              <optgroup label="⚡ Active 2024–2025 Grid">
                {activeDrivers.map(d => (
                  <option key={`d1-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; Active Grid
                  </option>
                ))}
              </optgroup>

              <optgroup label="🏎️ Grand Prix Winners (1–9 Wins)">
                {raceWinners.map(d => (
                  <option key={`d1-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; {d.totalWins} {d.totalWins === 1 ? 'Win' : 'Wins'}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🏁 Notable F1 Competitors (50+ Starts)">
                {veterans.map(d => (
                  <option key={`d1-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; {d.totalRaces} Starts
                  </option>
                ))}
              </optgroup>

              <optgroup label="📋 All Historical Drivers (A–Z)">
                {otherDrivers.map(d => (
                  <option key={`d1-all-${d.driverId}`} value={d.driverId}>
                    {d.surname}, {d.forename} ({d.nationality})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          {/* Swap / VS Indicator */}
          <div className="flex items-center justify-center font-mono font-extrabold text-sm pb-2.5 px-1 text-[var(--text-muted)]">
            <span className="px-2 py-1 bg-white/5 border border-white/5">VS</span>
          </div>

          {/* Driver 2 Select */}
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Driver 2 (Rival)</span>
            </label>
            <select
              name="d2"
              defaultValue={d2Id || ""}
              className="w-full p-2.5 bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono rounded-none focus:outline-none focus:border-[var(--amber)] transition-colors cursor-pointer"
            >
              <option value="" disabled>Select Driver 2</option>

              <optgroup label="🏆 World Champions & Multi-Winners (10+ Wins)">
                {worldChampions.map(d => (
                  <option key={`d2-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; {d.totalWins} Wins
                  </option>
                ))}
              </optgroup>

              <optgroup label="⚡ Active 2024–2025 Grid">
                {activeDrivers.map(d => (
                  <option key={`d2-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; Active Grid
                  </option>
                ))}
              </optgroup>

              <optgroup label="🏎️ Grand Prix Winners (1–9 Wins)">
                {raceWinners.map(d => (
                  <option key={`d2-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; {d.totalWins} {d.totalWins === 1 ? 'Win' : 'Wins'}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🏁 Notable F1 Competitors (50+ Starts)">
                {veterans.map(d => (
                  <option key={`d2-${d.driverId}`} value={d.driverId}>
                    {d.forename} {d.surname} ({d.nationality}) &bull; {d.totalRaces} Starts
                  </option>
                ))}
              </optgroup>

              <optgroup label="📋 All Historical Drivers (A–Z)">
                {otherDrivers.map(d => (
                  <option key={`d2-all-${d.driverId}`} value={d.driverId}>
                    {d.surname}, {d.forename} ({d.nationality})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 bg-[var(--amber)] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-none hover:bg-yellow-400 transition-colors shadow-lg cursor-pointer shrink-0"
          >
            Compare
          </button>
        </form>
      </div>

      {/* Comparison Results */}
      {comparisonData && d1Info && d2Info && (
        <div className="space-y-6 animate-fade-in">
          {/* Shared Head-to-Head Banner */}
          <div className="grid grid-cols-3 text-center card glass rounded-none p-6 border border-[var(--border-hairline)] relative overflow-hidden bg-[var(--surface-console)]">
            <div className="relative z-10 flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase mb-1">Driver 1</span>
              <h2 className="text-xl md:text-2xl font-black text-white font-[family-name:var(--font-disp)]">
                {d1Info.forename} <span className="text-blue-400">{d1Info.surname}</span>
              </h2>
              <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{d1Info.nationality}</span>
            </div>

            <div className="flex flex-col justify-center relative z-10 border-x border-[var(--border-hairline)] px-2">
              <span className="text-[10px] font-mono font-bold text-[var(--amber)] uppercase tracking-widest mb-1">
                Shared Races
              </span>
              <span className="text-3xl md:text-4xl font-extrabold text-white font-mono">
                {comparisonData.racesTogether}
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">Direct Starts</span>
            </div>

            <div className="relative z-10 flex flex-col justify-center items-center">
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase mb-1">Driver 2</span>
              <h2 className="text-xl md:text-2xl font-black text-white font-[family-name:var(--font-disp)]">
                {d2Info.forename} <span className="text-red-400">{d2Info.surname}</span>
              </h2>
              <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{d2Info.nationality}</span>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-3 text-center gap-2">
            {/* Finished Ahead */}
            <div className="card glass rounded-none p-4 border border-[var(--border-hairline)] flex flex-col justify-center bg-[var(--surface-elevated)]">
              <span className="text-3xl md:text-4xl font-black text-blue-400 font-mono">{comparisonData.driver1.ahead}</span>
            </div>
            <div className="flex flex-col justify-center font-mono font-bold text-white text-xs uppercase tracking-wider border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-2">
              <span>Finished Ahead</span>
              <span className="text-[9px] text-[var(--text-muted)] font-normal mt-0.5">Higher Race Result</span>
            </div>
            <div className="card glass rounded-none p-4 border border-[var(--border-hairline)] flex flex-col justify-center bg-[var(--surface-elevated)]">
              <span className="text-3xl md:text-4xl font-black text-red-400 font-mono">{comparisonData.driver2.ahead}</span>
            </div>

            {/* Total Points in Shared Races */}
            <div className="card glass rounded-none p-4 border border-[var(--border-hairline)] flex flex-col justify-center bg-[var(--surface-elevated)]">
              <span className="text-3xl md:text-4xl font-black text-white font-mono">{comparisonData.driver1.points}</span>
            </div>
            <div className="flex flex-col justify-center font-mono font-bold text-white text-xs uppercase tracking-wider border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-2">
              <span>Points Scored</span>
              <span className="text-[9px] text-[var(--text-muted)] font-normal mt-0.5">During Shared Races</span>
            </div>
            <div className="card glass rounded-none p-4 border border-[var(--border-hairline)] flex flex-col justify-center bg-[var(--surface-elevated)]">
              <span className="text-3xl md:text-4xl font-black text-white font-mono">{comparisonData.driver2.points}</span>
            </div>

            {/* Shared Race Wins */}
            <div className="card glass rounded-none p-4 border border-[var(--border-hairline)] flex flex-col justify-center bg-[var(--surface-elevated)]">
              <span className="text-3xl md:text-4xl font-black text-[var(--amber)] font-mono">{comparisonData.driver1.wins}</span>
            </div>
            <div className="flex flex-col justify-center font-mono font-bold text-white text-xs uppercase tracking-wider border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-2">
              <span>Grand Prix Wins</span>
              <span className="text-[9px] text-[var(--text-muted)] font-normal mt-0.5">In Same Events</span>
            </div>
            <div className="card glass rounded-none p-4 border border-[var(--border-hairline)] flex flex-col justify-center bg-[var(--surface-elevated)]">
              <span className="text-3xl md:text-4xl font-black text-[var(--amber)] font-mono">{comparisonData.driver2.wins}</span>
            </div>
          </div>
          
          {/* Race-by-Race Log */}
          <div className="mt-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] mb-4">
              <h3 className="text-xl font-bold font-[family-name:var(--font-disp)] uppercase text-white">
                Shared Race History
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {comparisonData.history.length} CONTESTED GRANDS PRIX
              </span>
            </div>

            <div className="card glass rounded-none border border-[var(--border-hairline)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left whitespace-nowrap">
                  <thead className="uppercase text-[var(--text-muted)] bg-[var(--surface-sunken)] border-b border-[var(--border-hairline)]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Year</th>
                      <th className="px-4 py-3 font-bold">Grand Prix</th>
                      <th className="px-4 py-3 font-bold text-center text-blue-400">{d1Info.surname} Finish</th>
                      <th className="px-4 py-3 font-bold text-center text-red-400">{d2Info.surname} Finish</th>
                      <th className="px-4 py-3 font-bold text-right">Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-hairline)]">
                    {comparisonData.history.map((race: any, idx: number) => {
                      const d1WonDuel = race.d1_pos < race.d2_pos && race.d1_pos > 0;
                      const d2WonDuel = race.d2_pos < race.d1_pos && race.d2_pos > 0;
                      return (
                        <tr key={idx} className="hover:bg-[var(--surface-elevated)] transition-colors">
                          <td className="px-4 py-3 text-[var(--text-muted)] font-bold">{race.year}</td>
                          <td className="px-4 py-3 font-semibold text-white">{race.raceName}</td>
                          <td className={`px-4 py-3 text-center font-bold ${
                            race.d1_pos === 1 ? 'text-[var(--amber)]' : d1WonDuel ? 'text-blue-400' : 'text-[var(--text-secondary)]'
                          }`}>
                            {race.d1_pos === 1 ? 'P1 WIN' : race.d1_pos ? `P${race.d1_pos}` : 'DNF'}
                          </td>
                          <td className={`px-4 py-3 text-center font-bold ${
                            race.d2_pos === 1 ? 'text-[var(--amber)]' : d2WonDuel ? 'text-red-400' : 'text-[var(--text-secondary)]'
                          }`}>
                            {race.d2_pos === 1 ? 'P1 WIN' : race.d2_pos ? `P${race.d2_pos}` : 'DNF'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {d1WonDuel ? (
                              <span className="text-[10px] text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 font-bold">
                                {d1Info.surname}
                              </span>
                            ) : d2WonDuel ? (
                              <span className="text-[10px] text-red-400 bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 font-bold">
                                {d2Info.surname}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)]">TIED</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
