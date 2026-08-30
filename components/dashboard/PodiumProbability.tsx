'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { OutcomeMetrics } from '@/components/models/ModelPerformanceCharts'

export default function PodiumProbability() {
  const [metrics, setMetrics] = useState<OutcomeMetrics | null>(null)
  useEffect(() => { fetch('/models/advanced_outcomes.json').then(r => r.json()).then(setMetrics).catch(() => setMetrics(null)) }, [])
  const bands = metrics?.calibration.prob_pred.map((probability, i) => ({ probability, observed: metrics.calibration.prob_true[i] })).slice(-3).reverse() || []
  return <div className="card glass rounded-[var(--radius-xl)] p-6">
    <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold mb-1">Podium Probability</h2>
    <p className="text-xs text-[var(--text-muted)] mb-4">Highest probability bands from the trained race-outcome model.</p>
    <div className="space-y-3">{bands.map(b => <div key={b.probability}><div className="flex justify-between text-xs mb-1"><span>{Math.round(b.probability * 100)}% predicted</span><span className="text-[var(--text-muted)]">{Math.round(b.observed * 100)}% observed</span></div><div className="h-2 bg-white/5 rounded"><div className="h-full bg-red-500 rounded" style={{width:`${b.probability*100}%`}} /></div></div>)}</div>
    <Link href="/models" className="text-xs text-red-400 inline-block mt-4">View full model performance →</Link>
  </div>
}
