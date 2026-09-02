import Link from 'next/link';

export const metadata = {
  title: 'Historical Data - AIMotorsportsHub',
};

export default function HistoryPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to Hub</Link>
      <div className="eyebrow mt-8">The Archive</div>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-2 tracking-tight font-[family-name:var(--font-disp)] uppercase">Historical Data & Statistics</h1>
      <p className="text-[var(--text-secondary)] mb-6 text-lg max-w-[640px] leading-[1.65]">
        Dive deep into the ultimate motorsport archive. Explore past seasons, compare drivers head-to-head, and discover legendary track records.
      </p>
      
      <div className="mb-12">
        <h2 className="text-3xl font-extrabold mb-6 font-[family-name:var(--font-disp)] uppercase border-b border-[var(--border-subtle)] pb-4">Formula 1</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/history/what-if" className="card glass rounded-[var(--radius-xl)] p-8 hover-lift group relative overflow-hidden border border-[var(--primary)]/30">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--primary)]/20 rounded-full blur-2xl group-hover:bg-[var(--primary)]/30 transition-colors" />
            <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-disp)] flex items-center gap-2">
              What If? Simulator <span className="bg-[var(--primary)] text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider">New</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Ask historical counterfactuals. Our AI and ML models simulate alternate realities based on real telemetry.
            </p>
          </Link>

          <Link href="/history/seasons" className="card glass rounded-[var(--radius-xl)] p-8 hover-lift group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--amber)]/10 rounded-full blur-2xl group-hover:bg-[var(--amber)]/20 transition-colors" />
            <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-disp)]">Past Seasons</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Explore final standings and race results from every season since 1950.
            </p>
          </Link>
          
          <Link href="/history/goat" className="card glass rounded-[var(--radius-xl)] p-8 hover-lift group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--amber)]/20 rounded-full blur-2xl group-hover:bg-[var(--amber)]/30 transition-colors" />
            <h2 className="text-2xl font-bold mb-3 font-[family-name:var(--font-disp)]">The GOAT Debate</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              A mathematically rigorous, dual-Elo rating system comparing drivers across all eras by isolating their skill from car dominance.
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
      </div>

      <div>
        <h2 className="text-3xl font-extrabold mb-6 font-[family-name:var(--font-disp)] uppercase border-b border-[var(--border-subtle)] pb-4 text-[var(--text-muted)]">Other Motorsports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Formula E', 'NASCAR', 'GT World Challenge', 'NHRA Top Fuel', 'IndyCar', 'WEC'].map(series => (
            <div key={series} className="card glass rounded-[var(--radius-xl)] p-6 opacity-60 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-disp)]">{series}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4">Historical data, ML models, and season archives.</p>
              </div>
              <span className="self-start text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-[var(--border-subtle)] text-[var(--text-muted)]">Work in Progress</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
