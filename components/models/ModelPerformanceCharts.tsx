'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'

export interface OutcomeMetrics {
  model: string
  test_samples: number
  log_loss: number
  brier_score: number
  calibration: { prob_true: number[]; prob_pred: number[] }
  feature_importance: Record<string, number>
}

export default function ModelPerformanceCharts({ metrics }: { metrics: OutcomeMetrics }) {
  const calibration = metrics.calibration.prob_pred.map((predicted, index) => ({ predicted, observed: metrics.calibration.prob_true[index], ideal: predicted }))
  const importance = Object.entries(metrics.feature_importance).map(([feature, value]) => ({ feature, value }))
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <section className="card glass rounded-[var(--radius-xl)] p-6">
      <h2 className="text-xl font-bold mb-1">Calibration Curve (Reliability)</h2>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        This chart shows if the model's confidence is trustworthy. If the model predicts a 70% chance of a driver getting a podium, do they actually get a podium 70% of the time?
      </p>
      <p className="text-xs text-[var(--text-secondary)] mb-5">
        <strong className="text-red-500">Red line:</strong> Actual observed outcomes. <strong className="text-slate-500">Dashed line:</strong> Perfect ideal prediction. The closer the red line is to the dashed line, the better.
      </p>
      <div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={calibration}><CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis dataKey="predicted" domain={[0,1]} type="number" /><YAxis domain={[0,1]} /><Tooltip /><Line dataKey="ideal" stroke="#64748b" strokeDasharray="5 5" dot={false} /><Line dataKey="observed" stroke="#ef4444" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
    </section>
    <section className="card glass rounded-[var(--radius-xl)] p-6">
      <h2 className="text-xl font-bold mb-1">Feature Importance</h2>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        This shows which data points the AI relied on the most when making its decisions.
      </p>
      <p className="text-xs text-[var(--text-secondary)] mb-5">
        A higher bar means that specific feature (like starting grid position) had a massive impact on whether the model predicted a podium finish or not.
      </p>
      <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={importance} layout="vertical"><CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis type="number" /><YAxis type="category" dataKey="feature" width={100} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer></div>
    </section>
  </div>
}
