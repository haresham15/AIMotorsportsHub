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
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(139,92,246,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6',
          }}>
            <BrainCircuit size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>AI Strategy Predictor</h2>
            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}>
              Powered by TensorFlow.js
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-md)' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Training Neural Network...
          </div>
        </div>
      ) : (
        <div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.5,
          }}>
            Predicted tire degradation (seconds added per lap) on current compound:
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            height: '140px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {predictions.map((p, i) => {
              // Normalize height for the bar chart based on max degradation (approx 3 seconds)
              const heightPercent = Math.min(100, Math.max(10, (p.degradation / 3.0) * 100))
              
              return (
                <div key={p.lap} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}>
                    +{p.degradation.toFixed(2)}s
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: `linear-gradient(to top, rgba(139,92,246,0.2), rgba(139,92,246,0.8))`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 1s ease-out',
                  }} />
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    marginTop: '4px'
                  }}>
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
