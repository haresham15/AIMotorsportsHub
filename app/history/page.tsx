import Link from 'next/link';

export const metadata = {
  title: 'Historical Data - AIMotorsportsHub',
};

export default function HistoryPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to Hub</Link>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6 mb-2 tracking-tight">Historical Data & Statistics</h1>
      <p className="text-[var(--text-secondary)] mb-10 text-lg max-w-2xl">
        Dive deep into the ultimate motorsport archive. Explore past seasons, compare drivers head-to-head, and discover legendary track records.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/history/seasons" className="card glass rounded-[var(--radius-xl)] p-8 hover-lift group relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--amber)]/10 rounded-full blur-2xl group-hover:bg-[var(--amber)]/20 transition-colors" />
          <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-disp)]">Past Seasons</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Explore final standings and race results from every season since 1950.
          </p>
        </Link>
        
        <Link href="/history/head-to-head" className="card glass rounded-[var(--radius-xl)] p-8 hover-lift group relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--danger)]/10 rounded-full blur-2xl group-hover:bg-[var(--danger)]/20 transition-colors" />
          <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-disp)]">Driver Head-to-Head</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Compare any two drivers who raced against each other in the same Grand Prix.
          </p>
        </Link>
        
        <Link href="/history/tracks" className="card glass rounded-[var(--radius-xl)] p-8 hover-lift group relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--success)]/10 rounded-full blur-2xl group-hover:bg-[var(--success)]/20 transition-colors" />
          <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-disp)]">Track Records</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            View statistics for every circuit that has hosted a Grand Prix.
          </p>
        </Link>
      </div>
    </main>
  );
}
