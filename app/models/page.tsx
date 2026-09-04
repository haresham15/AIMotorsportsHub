import Link from 'next/link'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import ModelPerformanceCharts, { OutcomeMetrics } from '@/components/models/ModelPerformanceCharts'

export default async function ModelsPage() {
  const metrics = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public/models/advanced_outcomes.json'), 'utf8')) as OutcomeMetrics
  return <main className="max-w-[1000px] mx-auto px-6 py-12">
    <Link href="/" className="text-xs font-mono font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5">
      &larr; Paddock Hub
    </Link>
    <div className="eyebrow mt-6">Model Benchmarks</div>
    <h1 className="text-3xl md:text-4xl font-extrabold mt-1 mb-2 tracking-tight font-[family-name:var(--font-disp)] uppercase flex items-center gap-4 flex-wrap">
      <span>Model Evaluation &amp; Validation</span>
    </h1>
    <p className="text-[var(--text-secondary)] mb-8 text-sm max-w-[640px] leading-[1.6]">Validation loss, Brier scoring, and feature attribution weights from the race-outcome inference pipeline.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
        <div className="text-[10px] font-mono uppercase text-[var(--amber-pit)] tracking-wider mb-2 font-bold">
          Architecture
        </div>
        <div className="text-xl font-mono font-bold text-white tracking-wider">{metrics.model}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">GBDT classification engine optimized for motorsport outcome probabilities.</p>
      </div>

      <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
        <div className="text-[10px] font-mono uppercase text-[var(--amber-pit)] tracking-wider mb-2 font-bold">
          Validation N
        </div>
        <div className="text-xl font-mono font-bold text-white tabular-nums">{metrics.test_samples.toLocaleString()}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">Historical Grand Prix test samples across variable meteorological conditions.</p>
      </div>

      <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
        <div className="text-[10px] font-mono uppercase text-[var(--green-flag)] tracking-wider mb-2 font-bold">
          Loss Metric
        </div>
        <div className="text-xl font-mono font-bold text-[var(--flag-green)] tabular-nums">{metrics.log_loss.toFixed(4)}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">Log-loss metric. Cross-entropy penalty verifying calibration confidence.</p>
      </div>

      <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
        <div className="text-[10px] font-mono uppercase text-[var(--amber-pit)] tracking-wider mb-2 font-bold">
          Brier Score
        </div>
        <div className="text-xl font-mono font-bold text-[var(--amber-pit)] tabular-nums">{metrics.brier_score.toFixed(4)}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">Mean squared probability error. Quantifies divergence from actual results.</p>
      </div>
    </div>
    <ModelPerformanceCharts metrics={metrics} />
  </main>
}
