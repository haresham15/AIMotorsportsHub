'use client'

import { useEffect, useState } from 'react'
import { BrainCircuit } from 'lucide-react'

export default function StrategyPredictor() {
  const [predictions, setPredictions] = useState<{ lap: number, degradation: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadModel = async () => {
      try {
        const res = await fetch('/models/tire_degradation_weights.json')
        let softDegRate = 0.12 // Fallback default
        if (res.ok) {
          const data = await res.json()
          if (data['SOFT']) {
            softDegRate = data['SOFT'].degradation_rate_per_lap
          }
        }
        
        if (!isMounted) return

        // Generate predictions for laps 5 to 30 (intervals of 5)
        const preds = []
        for (let lap = 5; lap <= 30; lap += 5) {
          const pred = softDegRate * lap
          preds.push({ lap, degradation: pred })
        }
        
        setPredictions(preds)
      } catch (error) {
        console.error('ML Model Error:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadModel()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="card glass rounded-[var(--radius-xl)] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-purple-500/12 flex items-center justify-center text-purple-400">
            <BrainCircuit size={16} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em]">AI Strategy Predictor</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              Powered by a trained degradation model
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <div className="skeleton h-[120px] rounded-[var(--radius-md)]" />
          <div className="text-[12px] text-[var(--text-muted)] text-center">
            Loading model weights...
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[13px] text-[var(--text-secondary)] mb-4 leading-relaxed">
            Predicted tire degradation (seconds added per lap) on current compound:
          </p>
          
          <div className="flex items-end gap-2 h-[140px] pb-5 border-b border-[var(--border-subtle)]">
            {predictions.map((p, i) => {
              // Normalize height for the bar chart based on max degradation (approx 3 seconds)
              const heightPercent = Math.min(100, Math.max(10, (p.degradation / 3.0) * 100))
              
              return (
                <div key={p.lap} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-[var(--text-primary)] font-semibold">
                    +{p.degradation.toFixed(2)}s
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: `linear-gradient(to top, rgba(139,92,246,0.2), rgba(139,92,246,0.8))`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 1s ease-out',
                  }} />
                  <div className="text-[10px] text-[var(--text-muted)] font-medium mt-1">
                    L{p.lap}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
