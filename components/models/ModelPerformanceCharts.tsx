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
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <section className="console-panel p-5 rounded-none border border-[var(--border-hairline)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5 mb-3">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white m-0">Calibration Curve (Reliability)</h2>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">[METRIC-REL-01]</span>
      </div>
      <p className="text-xs font-mono text-[var(--text-muted)] mb-2">
        Confidence alignment. Evaluates whether a 70% predicted podium probability converts to a 70% empirical realization.
      </p>
      <p className="text-xs font-mono text-[var(--text-secondary)] mb-4">
        <strong className="text-[var(--flag-red)]">Red:</strong> Observed outcomes. <strong className="text-[var(--text-muted)]">Dashed:</strong> Parity line.
      </p>
      <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={calibration}><CartesianGrid stroke="rgba(255,255,255,.05)" /><XAxis dataKey="predicted" domain={[0,1]} type="number" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} /><YAxis domain={[0,1]} tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} /><Tooltip contentStyle={{ background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }} /><Line dataKey="ideal" stroke="#71717a" strokeDasharray="4 4" dot={false} /><Line dataKey="observed" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} /></LineChart></ResponsiveContainer></div>
    </section>
    <section className="console-panel p-5 rounded-none border border-[var(--border-hairline)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5 mb-3">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white m-0">Feature Importance Weights</h2>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">[SHAP-ATTRIB-02]</span>
      </div>
      <p className="text-xs font-mono text-[var(--text-muted)] mb-2">
        Primary signal weights across driver qualifying delta, tire compound telemetry, and pit stop windows.
      </p>
      <p className="text-xs font-mono text-[var(--text-secondary)] mb-4">
        Relative weight in determining race podium probabilities.
      </p>
      <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={importance} layout="vertical"><CartesianGrid stroke="rgba(255,255,255,.05)" /><XAxis type="number" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} /><YAxis type="category" dataKey="feature" width={110} tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} /><Tooltip contentStyle={{ background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }} /><Bar dataKey="value" fill="#ffb020" radius={[0,0,0,0]} /></BarChart></ResponsiveContainer></div>
    </section>
  </div>
}
