import Link from 'next/link';
import { getTrackRecords } from '@/lib/db';

export const metadata = {
  title: 'Track Records - Historical Data',
};

export default function TracksPage() {
  const tracks = getTrackRecords() as { circuitId: number; name: string; country: string; racesHosted: number }[];

  return (
    <main className="max-w-[800px] mx-auto px-6 py-12">
      <Link href="/history" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to History</Link>
      <div className="eyebrow mt-8">Historical Archive</div>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-4 tracking-tight font-[family-name:var(--font-disp)] uppercase">Track Records</h1>
      <p className="text-[var(--text-secondary)] text-[18px] max-w-[640px] mb-12 leading-[1.65]">
        A comprehensive look at the raceways and circuits that define motorsports, featuring race counts, locations, and historical significance.
      </p>
      
      <div className="card glass rounded-[var(--radius-xl)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs uppercase text-[var(--text-muted)] bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Circuit Name</th>
                <th className="px-6 py-4 font-bold tracking-wider">Country</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Races Hosted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {tracks.map((t) => (
                <tr key={t.circuitId} className="hover:bg-[var(--surface-highlight)] transition-colors group">
                  <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{t.name}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{t.country}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-[var(--amber)]">{t.racesHosted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
