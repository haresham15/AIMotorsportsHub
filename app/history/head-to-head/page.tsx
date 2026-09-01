import Link from 'next/link';
import { getDrivers, getHeadToHead } from '@/lib/db';

export const metadata = {
  title: 'Driver Head-to-Head - Historical Data',
};

export default async function HeadToHeadPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fix for Next.js 15: searchParams is a Promise
  const resolvedParams = await Promise.resolve(searchParams);
  
  const drivers = getDrivers() as { driverId: number; forename: string; surname: string; nationality: string }[];
  
  const d1Param = resolvedParams.d1 as string;
  const d2Param = resolvedParams.d2 as string;
  
  let d1Id = d1Param ? parseInt(d1Param, 10) : null;
  let d2Id = d2Param ? parseInt(d2Param, 10) : null;
  
  let comparisonData = null;
  let d1Info = null;
  let d2Info = null;

  if (d1Id && d2Id && !isNaN(d1Id) && !isNaN(d2Id)) {
    comparisonData = getHeadToHead(d1Id, d2Id) as any;
    d1Info = drivers.find(d => d.driverId === d1Id);
    d2Info = drivers.find(d => d.driverId === d2Id);
  }

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/history" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to History</Link>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6 mb-8 tracking-tight">Driver Head-to-Head</h1>

      <div className="card glass rounded-[var(--radius-xl)] p-8 mb-8">
        <form method="GET" action="/history/head-to-head" className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs uppercase font-bold text-[var(--text-muted)] mb-2">Driver 1</label>
            <select name="d1" defaultValue={d1Id || ""} className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition-all">
              <option value="" disabled>Select a driver</option>
              {drivers.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.forename} {d.surname} ({d.nationality})</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-center font-extrabold text-2xl pb-2 px-2 text-[var(--text-muted)]">VS</div>

          <div className="flex-1 w-full">
            <label className="block text-xs uppercase font-bold text-[var(--text-muted)] mb-2">Driver 2</label>
            <select name="d2" defaultValue={d2Id || ""} className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition-all">
              <option value="" disabled>Select a driver</option>
              {drivers.map(d => (
                <option key={d.driverId} value={d.driverId}>{d.forename} {d.surname} ({d.nationality})</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="w-full md:w-auto px-8 py-3 bg-[var(--amber)] text-black font-extrabold rounded-[var(--radius-md)] hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20">
            Compare
          </button>
        </form>
      </div>

      {comparisonData && d1Info && d2Info && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 text-center card glass rounded-[var(--radius-xl)] p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--amber)]/5 via-transparent to-[var(--amber)]/5" />
            <div className="relative z-10 flex items-center justify-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">{d1Info.forename} <br className="hidden md:block"/><span className="text-[var(--amber)]">{d1Info.surname}</span></h2>
            </div>
            <div className="flex flex-col justify-center relative z-10 border-x border-[var(--border-subtle)] px-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Races Together</span>
              <span className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-mono">{comparisonData.racesTogether}</span>
            </div>
            <div className="relative z-10 flex items-center justify-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">{d2Info.forename} <br className="hidden md:block"/><span className="text-[var(--amber)]">{d2Info.surname}</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-3 text-center gap-y-6 gap-x-2">
            {/* Finished Ahead */}
            <div className="card glass rounded-[var(--radius-lg)] p-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-blue-500 font-mono">{comparisonData.driver1.ahead}</span>
            </div>
            <div className="flex flex-col justify-center font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              Finished Ahead
            </div>
            <div className="card glass rounded-[var(--radius-lg)] p-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-red-500 font-mono">{comparisonData.driver2.ahead}</span>
            </div>

            {/* Total Points (in shared races) */}
            <div className="card glass rounded-[var(--radius-lg)] p-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">{comparisonData.driver1.points}</span>
            </div>
            <div className="flex flex-col justify-center font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              Points Scored<br/><span className="text-[10px] text-[var(--text-muted)]">(Shared Races)</span>
            </div>
            <div className="card glass rounded-[var(--radius-lg)] p-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">{comparisonData.driver2.points}</span>
            </div>

            {/* Shared Race Wins */}
            <div className="card glass rounded-[var(--radius-lg)] p-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-[var(--amber)] font-mono">{comparisonData.driver1.wins}</span>
            </div>
            <div className="flex flex-col justify-center font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              Shared Wins
            </div>
            <div className="card glass rounded-[var(--radius-lg)] p-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-[var(--amber)] font-mono">{comparisonData.driver2.wins}</span>
            </div>
          </div>
          
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 font-[family-name:var(--font-disp)]">Recent Shared Races</h3>
            <div className="card glass rounded-[var(--radius-xl)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase text-[var(--text-muted)] bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Year</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Race</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">{d1Info.surname} Pos</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">{d2Info.surname} Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {comparisonData.history.slice(0, 10).map((race: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--surface-highlight)] transition-colors group">
                        <td className="px-6 py-4 font-bold text-[var(--text-muted)]">{race.year}</td>
                        <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{race.raceName}</td>
                        <td className={`px-6 py-4 text-center font-mono text-lg ${race.d1_pos < race.d2_pos && race.d1_pos > 0 ? 'text-blue-500 font-extrabold' : 'text-[var(--text-secondary)]'}`}>
                          {race.d1_pos || 'DNF'}
                        </td>
                        <td className={`px-6 py-4 text-center font-mono text-lg ${race.d2_pos < race.d1_pos && race.d2_pos > 0 ? 'text-red-500 font-extrabold' : 'text-[var(--text-secondary)]'}`}>
                          {race.d2_pos || 'DNF'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {comparisonData.history.length > 10 && (
                <div className="p-4 text-center text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--surface-sunken)] border-t border-[var(--border-subtle)]">
                  Showing 10 most recent out of {comparisonData.history.length} races
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
