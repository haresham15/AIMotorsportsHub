import Link from 'next/link';
import { getTrackRecords } from '@/lib/db';

export const metadata = {
  title: 'Track Records - Historical Data',
};

export default function TracksPage() {
  const tracks = getTrackRecords() as { circuitId: number; name: string; country: string; racesHosted: number }[];

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/history" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to History</Link>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6 mb-8 tracking-tight">Track Records</h1>
      
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
