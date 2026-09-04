import Link from 'next/link';

export const metadata = {
  title: 'Historical Data - AIMotorsportsHub',
};

export default function HistoryPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/" className="text-xs font-mono font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5">
        &larr; Paddock Hub
      </Link>
      <div className="eyebrow mt-6">Historical Archive</div>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-1 mb-2 tracking-tight font-[family-name:var(--font-disp)] uppercase">Historical Telemetry &amp; Statistics</h1>
      <p className="text-[var(--text-secondary)] mb-10 text-base max-w-[640px] leading-[1.6]">
        Precision motorsport records, driver head-to-head performance deltas, dual-Elo rating engines, and counterfactual simulation modules.
      </p>
      
      <div className="mb-12">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 mb-6">
          <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">Formula 1 Telemetry Archive</h2>
          <span className="text-xs font-mono text-[var(--text-muted)]">1950 &ndash; PRESENT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link href="/history/what-if" className="console-panel console-panel-interactive p-6 rounded-sm border border-[var(--border-hairline)] hover:border-[var(--amber-pit)] no-underline group block">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[var(--amber-pit)] uppercase tracking-wider">Strategy Simulator</span>
              <span className="bg-[var(--amber-pit)] text-black text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-xs tracking-wider">Active</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-disp)] uppercase tracking-wide text-white group-hover:text-[var(--amber-pit)] transition-colors">
              &ldquo;What If?&rdquo; Simulator
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0 font-sans">
              Test historical counterfactuals. Our machine learning physics model resimulates alternate race outcomes based on telemetry.
            </p>
          </Link>

          <Link href="/history/seasons" className="console-panel console-panel-interactive p-6 rounded-sm border border-[var(--border-hairline)] hover:border-[var(--border-active)] no-underline group block">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Directory</span>
              <span className="font-mono text-xs text-[var(--text-muted)] tracking-wider">74 SEASONS</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-disp)] uppercase tracking-wide text-white group-hover:text-[var(--amber-pit)] transition-colors">
              Past Seasons
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0 font-sans">
              Explore final constructor and driver standings, race outcomes, and podium distributions since 1950.
            </p>
          </Link>
          
          <Link href="/history/goat" className="console-panel console-panel-interactive p-6 rounded-sm border border-[var(--border-hairline)] hover:border-[var(--border-active)] no-underline group block">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Dual-Elo Rating</span>
              <span className="font-mono text-xs text-[var(--text-muted)] tracking-wider">MATHEMATICAL</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-disp)] uppercase tracking-wide text-white group-hover:text-[var(--amber-pit)] transition-colors">
              The GOAT Debate
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0 font-sans">
              Mathematically rigorous, dual-Elo rating system evaluating driver skill isolated from constructor machinery dominance.
            </p>
          </Link>
          
          <Link href="/history/head-to-head" className="console-panel console-panel-interactive p-6 rounded-sm border border-[var(--border-hairline)] hover:border-[var(--border-active)] no-underline group block">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Telemetry Deltas</span>
              <span className="font-mono text-xs text-[var(--text-muted)] tracking-wider">PAIRWISE</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-disp)] uppercase tracking-wide text-white group-hover:text-[var(--amber-pit)] transition-colors">
              Driver Head-to-Head
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0 font-sans">
              Direct telemetry and finish delta comparisons between any two drivers contesting the same Grand Prix events.
            </p>
          </Link>
          
          <Link href="/history/tracks" className="console-panel console-panel-interactive p-6 rounded-sm border border-[var(--border-hairline)] hover:border-[var(--border-active)] no-underline group block md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-[var(--flag-green)] uppercase tracking-wider">Circuit Geometry</span>
              <span className="font-mono text-xs text-[var(--flag-green)] tracking-wider">TRACK DATABASE</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[family-name:var(--font-disp)] uppercase tracking-wide text-white group-hover:text-[var(--amber-pit)] transition-colors">
              Circuit Records &amp; Topography
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0 font-sans">
              Detailed technical data, lap records, length deltas, and corner counts for all circuits hosted in championship history.
            </p>
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 mb-6">
          <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">Additional Series Modules</h2>
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Coming Soon</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {['Formula E', 'NASCAR', 'GT World Challenge', 'NHRA Top Fuel', 'IndyCar', 'WEC'].map((series) => (
            <div key={series} className="console-panel p-5 rounded-sm border border-[var(--border-hairline)] flex flex-col justify-between opacity-75">
              <div>
                <h3 className="text-lg font-bold mb-1.5 font-[family-name:var(--font-disp)] uppercase tracking-wide text-white">{series}</h3>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed font-sans">Historical dataset ingestion, model weights, and telemetry pipeline integration.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-hairline)]">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border-hairline)]">Engine Under Test</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
