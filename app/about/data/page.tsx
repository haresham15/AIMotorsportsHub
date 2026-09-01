import Link from 'next/link';

export default function DataMethodologyPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/about" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to About</Link>
      <div className="eyebrow mt-8">Transparency</div>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-8 tracking-tight font-[family-name:var(--font-disp)] uppercase">Data & Methodology</h1>
      
      <div className="space-y-12 max-w-3xl">
        <section>
          <p className="text-[var(--text-secondary)] text-[18px] leading-[1.65] mb-8">
            Apexis is built on a hybrid data architecture, combining real-time telemetry APIs with an extensive historical database to power both live dashboards and predictive AI models.
          </p>
        </section>

        <section className="card glass rounded-[var(--radius-xl)] p-8">
          <h2 className="text-2xl font-extrabold mb-4 font-[family-name:var(--font-disp)] uppercase tracking-tight text-[var(--amber)]">Live Telemetry</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
            For live sessions, Apexis integrates with various open APIs depending on the racing series:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="font-bold text-[var(--text-primary)] min-w-[140px]">Formula 1:</span>
              <span className="text-[var(--text-secondary)]">Powered by the OpenF1 API proxy, delivering sub-second updates for live timing, track limits, and tyre life during race weekends.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[var(--text-primary)] min-w-[140px]">Other Series:</span>
              <span className="text-[var(--text-secondary)]">When live data is unavailable or out of session, the system seamlessly falls back to our local Web Worker simulation engine to demonstrate live timing capabilities.</span>
            </li>
          </ul>
        </section>

        <section className="card glass rounded-[var(--radius-xl)] p-8">
          <h2 className="text-2xl font-extrabold mb-4 font-[family-name:var(--font-disp)] uppercase tracking-tight text-[var(--amber)]">Historical Archive</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            Our historical statistics archive (1950–Present) is driven by a local SQLite database (powered by `better-sqlite3`). This dataset contains:
          </p>
          <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mb-6 ml-2">
            <li>Every official race result and championship standing</li>
            <li>Circuit records and historical calendar data</li>
            <li>Driver head-to-head metrics</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
            This deterministic database serves as the grounding context for our AI narrator and predictive models, ensuring they rely on verified historical facts rather than hallucinated stats.
          </p>
        </section>

        <section className="card glass rounded-[var(--radius-xl)] p-8">
          <h2 className="text-2xl font-extrabold mb-4 font-[family-name:var(--font-disp)] uppercase tracking-tight text-[var(--amber)]">AI & Simulations</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            To keep the experience fast and serverless compute costs low, heavy processing tasks are pushed to the client:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="font-bold text-[var(--text-primary)] min-w-[140px]">Predictive Models:</span>
              <span className="text-[var(--text-secondary)]">Tire degradation and strategy predictions are executed entirely in the browser using TensorFlow.js.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[var(--text-primary)] min-w-[140px]">Simulated Replays:</span>
              <span className="text-[var(--text-secondary)]">Live Map features and gap calculations are handled efficiently by dedicated Web Workers (`simulator.worker.ts`), allowing the UI to remain highly responsive.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[var(--text-primary)] min-w-[140px]">Broadcast Scanners:</span>
              <span className="text-[var(--text-secondary)]">Computer Vision tasks (like live standings extraction) utilize client-side OCR via `tesseract.js`.</span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
