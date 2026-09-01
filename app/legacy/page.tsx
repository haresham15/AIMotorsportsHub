import Link from 'next/link';

export default function LegacyPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to Hub</Link>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6 mb-8 tracking-tight">The Heritage of Racing</h1>
      <p className="text-[var(--text-secondary)] text-[18px] max-w-[640px] mb-[var(--sp-9)] leading-[1.65]">
        Every series traces back to someone deciding two vehicles should settle it on a track. These are the foundational moments that built the sport you watch today.
      </p>

      <div className="space-y-[var(--sp-7)]">
        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1894</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">Paris-Rouen</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                The first organized motoring competition - 79 miles, no rulebook, and the birth of the idea that cars could race, not just drive.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1911</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">Indianapolis 500</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                The first running of what's now the oldest surviving major race in the world - and the start of American open-wheel racing.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1923</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">24 Hours of Le Mans</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                Endurance racing's founding event - the same discipline GT World Challenge fields carry into the night today.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1950</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">F1's First Championship</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                Silverstone hosted round one of the first official Formula 1 World Championship - the series that still leads this dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1951</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">NHRA Founded</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                Wally Parks organized America's dragstrip chaos into a sanctioned sport - Top Fuel's quarter-mile record chase started here.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1959</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">First Daytona 500</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                NASCAR's new high-banked superspeedway hosted its first 500 - and stock car racing found its cathedral.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">1994</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">Imola, and a Reckoning</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                Ayrton Senna's death at the San Marino Grand Prix triggered the safety-first era every series on this dashboard now races under.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass rounded-[var(--radius-xl)] p-8">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-baseline">
            <div className="font-mono text-3xl font-extrabold text-[var(--amber)]">2014</div>
            <div>
              <h2 className="font-[family-name:var(--font-disp)] text-2xl font-extrabold text-[var(--text-primary)] uppercase mb-2">Formula E's First Race</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                The Beijing ePrix opened all-electric racing on city streets - proof the sport's next chapter was already being written.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
