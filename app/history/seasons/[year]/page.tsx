import Link from 'next/link';
import { getSeasonDetails } from '@/lib/db';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { year: string } }) {
  // Fix for Next.js 15: params is now a Promise
  const resolvedParams = await Promise.resolve(params);
  return {
    title: `${resolvedParams.year} Season - Historical Data`,
  };
}

export default async function SeasonDetailsPage({ params }: { params: { year: string } }) {
  // Fix for Next.js 15: params is now a Promise
  const resolvedParams = await Promise.resolve(params);
  const year = parseInt(resolvedParams.year, 10);
  
  if (isNaN(year)) {
    notFound();
  }

  const { races, standings } = getSeasonDetails(year) as {
    races: any[];
    standings: any[];
  };

  if (races.length === 0) {
    notFound();
  }

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/history/seasons" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to Seasons</Link>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6 mb-8 tracking-tight">{year} Formula 1 Season</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 font-[family-name:var(--font-disp)]">Championship Standings</h2>
          {standings.length > 0 ? (
            <div className="card glass rounded-[var(--radius-xl)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase text-[var(--text-muted)] bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Pos</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Driver</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Constructor</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Pts</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Wins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {standings.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface-highlight)] transition-colors group">
                        <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{s.position}</td>
                        <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{s.forename} {s.surname}</td>
                        <td className="px-6 py-4 text-[var(--text-secondary)]">{s.constructorName || '-'}</td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-[var(--amber)]">{s.points}</td>
                        <td className="px-6 py-4 text-right font-mono text-[var(--text-secondary)]">{s.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">Standings data not available for this season.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 font-[family-name:var(--font-disp)]">Race Calendar</h2>
          <div className="space-y-4">
            {races.map((r) => (
              <div key={r.raceId} className="card glass rounded-[var(--radius-lg)] p-5 hover-lift flex justify-between items-center group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--surface-highlight)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="text-xs font-bold text-[var(--amber)] uppercase tracking-wider block mb-1">Round {r.round}</span>
                  <span className="text-lg font-bold text-[var(--text-primary)] block leading-tight">{r.raceName}</span>
                  <span className="block text-sm text-[var(--text-secondary)] mt-1">{r.circuitName}, {r.country}</span>
                </div>
                <div className="text-right relative z-10">
                  <span className="font-mono text-sm font-semibold text-[var(--text-muted)] bg-[var(--surface-sunken)] px-3 py-1.5 rounded-[var(--radius-sm)]">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
