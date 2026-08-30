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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[['Model', metrics.model], ['Test samples', metrics.test_samples.toLocaleString()], ['Log loss', metrics.log_loss.toFixed(4)], ['Brier score', metrics.brier_score.toFixed(4)]].map(([label,value]) => <div key={label} className="card glass rounded-[var(--radius-lg)] p-5"><div className="text-xs uppercase text-[var(--text-muted)]">{label}</div><div className="text-2xl font-bold mt-2">{value}</div></div>)}
    </div>
    <ModelPerformanceCharts metrics={metrics} />
  </main>
}
