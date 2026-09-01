import Link from 'next/link'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import ModelPerformanceCharts, { OutcomeMetrics } from '@/components/models/ModelPerformanceCharts'

export default async function ModelsPage() {
  const metrics = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public/models/advanced_outcomes.json'), 'utf8')) as OutcomeMetrics
  return <main className="max-w-[1200px] mx-auto px-6 py-12">
    <Link href="/" className="text-sm text-[var(--text-muted)]">← Back to hub</Link>
    <h1 className="text-4xl font-extrabold mt-6 mb-2">Model Performance</h1>
    <p className="text-[var(--text-secondary)] mb-8">Evaluation results exported by the race-outcome training pipeline.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="card glass rounded-[var(--radius-lg)] p-5">
        <div className="text-xs uppercase text-[var(--text-muted)] font-semibold flex items-center justify-between">
          Model
        </div>
        <div className="text-2xl font-bold mt-2">{metrics.model}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">The AI algorithm chosen for predicting race outcomes based on historical performance.</p>
      </div>

      <div className="card glass rounded-[var(--radius-lg)] p-5">
        <div className="text-xs uppercase text-[var(--text-muted)] font-semibold flex items-center justify-between">
          Test Samples
        </div>
        <div className="text-2xl font-bold mt-2">{metrics.test_samples.toLocaleString()}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">The number of historical races the model was tested against to verify its accuracy.</p>
      </div>

      <div className="card glass rounded-[var(--radius-lg)] p-5">
        <div className="text-xs uppercase text-[var(--text-muted)] font-semibold flex items-center justify-between">
          Log Loss
        </div>
        <div className="text-2xl font-bold mt-2">{metrics.log_loss.toFixed(4)}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">Measures prediction confidence. <strong className="text-green-500 dark:text-green-400">Lower is better.</strong> Closer to 0 means the model is highly confident and correct.</p>
      </div>

      <div className="card glass rounded-[var(--radius-lg)] p-5">
        <div className="text-xs uppercase text-[var(--text-muted)] font-semibold flex items-center justify-between">
          Brier Score
        </div>
        <div className="text-2xl font-bold mt-2">{metrics.brier_score.toFixed(4)}</div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">Measures accuracy of probabilities. <strong className="text-green-500 dark:text-green-400">Lower is better.</strong> Closer to 0 means predictions closely match reality.</p>
      </div>
    </div>
    <ModelPerformanceCharts metrics={metrics} />
  </main>
}
