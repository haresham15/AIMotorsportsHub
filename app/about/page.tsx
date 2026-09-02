import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="max-w-[800px] mx-auto px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to Hub</Link>
      <div className="eyebrow mt-8">The Platform</div>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-4 tracking-tight font-[family-name:var(--font-disp)] uppercase">About Apexis</h1>
      <p className="text-[var(--text-secondary)] text-[18px] max-w-[640px] mb-12 leading-[1.65]">
        You used to need a timing app, a strategist's Twitter feed, and last week's highlights reel. Apexis puts the whole weekend on one wall.
      </p>

      <section className="mb-16">
        <h2 className="text-3xl font-extrabold mb-8 font-[family-name:var(--font-disp)] uppercase tracking-tight">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card glass rounded-[var(--radius-xl)] p-8">
            <div className="font-mono text-sm text-[var(--amber)] font-bold mb-4 tracking-widest uppercase">01 / Track</div>
            <h3 className="text-2xl font-extrabold mb-3 font-[family-name:var(--font-disp)] uppercase">Watch it live</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Real positions, gaps, and tyre life pulled straight from session timing - not a scoreboard that updates when someone remembers to refresh it.
            </p>
          </div>
          
          <div className="card glass rounded-[var(--radius-xl)] p-8">
            <div className="font-mono text-sm text-[var(--amber)] font-bold mb-4 tracking-widest uppercase">02 / Understand</div>
            <h3 className="text-2xl font-extrabold mb-3 font-[family-name:var(--font-disp)] uppercase">Get the briefing</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              An AI-written summary grounded in the actual standings and schedule - what happened, what's next, and what it means for the championship.
            </p>
          </div>
          
          <div className="card glass rounded-[var(--radius-xl)] p-8">
            <div className="font-mono text-sm text-[var(--amber)] font-bold mb-4 tracking-widest uppercase">03 / Relive</div>
            <h3 className="text-2xl font-extrabold mb-3 font-[family-name:var(--font-disp)] uppercase">Replay the race</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Scrub through the full circuit map lap by lap, compare drivers side by side, and see exactly where the race was won or lost.
            </p>
          </div>
        </div>
      </section>

      <section className="card glass rounded-[var(--radius-xl)] p-10 text-center">
        <h2 className="text-2xl font-extrabold mb-4 font-[family-name:var(--font-disp)] uppercase tracking-tight">Data & Methodology</h2>
        <p className="text-[var(--text-secondary)] mb-6 max-w-[600px] mx-auto leading-relaxed">
          Curious about where our numbers come from? Learn about our live telemetry architecture, our historical SQLite archive, and which series use live vs. simulated data.
        </p>
        <Link href="/about/data" className="inline-block px-8 py-3 bg-[var(--amber)] text-black font-extrabold rounded-[var(--radius-md)] hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20">
          Read the Data Methodology
        </Link>
      </section>
    </main>
  );
}
