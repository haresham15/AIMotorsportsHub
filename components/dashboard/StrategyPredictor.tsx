'use client'

import { useEffect, useState, useRef } from 'react'
import { BrainCircuit, Loader2 } from 'lucide-react'
import { TireDegradationModel } from '@/lib/ml/tireModel'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

type Compound = 'SOFT' | 'MEDIUM' | 'HARD'

export default function StrategyPredictor() {
  const [predictions, setPredictions] = useState<{ lap: number, degradation: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [compound, setCompound] = useState<Compound>('SOFT')
  const [pitLap, setPitLap] = useState<number>(20)
  
  const modelRef = useRef<TireDegradationModel | null>(null)

  useEffect(() => {
    let isMounted = true

    const initModel = async () => {
      try {
        const tfModel = new TireDegradationModel()
        await tfModel.train()
        
        if (!isMounted) {
          tfModel.dispose()
          return
        }
        
        modelRef.current = tfModel
        setLoading(false)
      } catch (error) {
        console.error('ML Model Error:', error)
        if (isMounted) setLoading(false)
      }
    }

    initModel()

    return () => {
      isMounted = false
      if (modelRef.current) {
        try {
          modelRef.current.dispose()
        } catch(e) {
          console.error(e)
        }
      }
    }
  }, [])

  // Re-run predictions when the model loads or slider/compound changes
  useEffect(() => {
    if (!modelRef.current) return

    const preds = []
    // Predict degradation for laps 1 to 40
    for (let lap = 1; lap <= 40; lap++) {
      // If the car pits, degradation resets
      const currentTireAge = lap < pitLap ? lap : (lap - pitLap + 1)
      const pred = modelRef.current.predict(currentTireAge, compound)
      preds.push({ lap, degradation: Number(pred.toFixed(2)) })
    }
    
    setPredictions(preds)
  }, [loading, compound, pitLap])

  return (
    <div className="card glass rounded-[var(--radius-xl)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-purple-500/12 flex items-center justify-center text-purple-400">
            <BrainCircuit size={16} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-xl font-extrabold tracking-[-0.01em]">Interactive Strategy Sandbox</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              Live time-loss projection via ML Model
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[250px] gap-3">
          <Loader2 className="animate-spin text-purple-400" size={24} />
          <div className="text-[12px] text-[var(--text-muted)]">
            Training TensorFlow.js model in browser...
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--surface-sunken)] p-4 rounded-[var(--radius-lg)]">
            <div>
              <label className="text-[12px] uppercase font-bold text-[var(--text-muted)] mb-2 block">
                Tire Compound
              </label>
              <div className="flex gap-2">
                {(['SOFT', 'MEDIUM', 'HARD'] as Compound[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCompound(c)}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-[var(--radius-sm)] transition-all ${
                      compound === c
                        ? c === 'SOFT' ? 'bg-red-500 text-white'
                        : c === 'MEDIUM' ? 'bg-yellow-500 text-black'
                        : 'bg-white text-black'
                        : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[12px] uppercase font-bold text-[var(--text-muted)]">
                  Pit Stop Lap
                </label>
                <span className="text-[12px] font-mono text-[var(--amber)]">Lap {pitLap}</span>
              </div>
              <input 
                type="range" 
                min="5" max="35" 
                value={pitLap} 
                onChange={(e) => setPitLap(parseInt(e.target.value))}
                className="w-full accent-[var(--amber)] cursor-pointer"
              />
            </div>
          </div>
          
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="lap" 
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `+${val}s`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-elevated)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                  formatter={(value: any) => [`+${value}s`, 'Degradation']}
                  labelFormatter={(label) => `Lap ${label}`}
                />
                <ReferenceLine x={pitLap} stroke="var(--amber)" strokeDasharray="3 3" label={{ position: 'top', value: 'PIT', fill: 'var(--amber)', fontSize: 10, fontWeight: 'bold' }} />
                <Area 
                  type="monotone" 
                  dataKey="degradation" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDeg)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
