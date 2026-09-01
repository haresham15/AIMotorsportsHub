import Link from 'next/link';
import { getSeasons } from '@/lib/db';

export const metadata = {
  title: 'Seasons - Historical Data',
};

export default function SeasonsPage() {
  const seasons = getSeasons() as { year: number, url: string }[];

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/history" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to History</Link>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6 mb-8 tracking-tight">Past Seasons</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {seasons.map((season) => (
          <Link
            key={season.year}
            href={`/history/seasons/${season.year}`}
            className="card glass rounded-[var(--radius-lg)] p-4 text-center font-bold text-lg hover-lift group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--amber)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">{season.year}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
