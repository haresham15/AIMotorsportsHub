'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface DriverSeason { id: string; name: string; year: number; x: number; y: number; cluster: number; stats: { points_per_race: number; win_rate: number } }
const COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7']

export default function DriverSimilarityMap() {
  const [points, setPoints] = useState<DriverSeason[]>([])
  useEffect(() => { fetch('/models/driver_season_clusters.json').then(r => r.json()).then(setPoints).catch(() => setPoints([])) }, [])
  return <div className="card glass rounded-[var(--radius-xl)] p-6">
    <h2 className="text-2xl font-extrabold uppercase mb-1">Driver Season Similarity</h2><p className="text-xs text-[var(--text-muted)] mb-4">Historical F1 seasons positioned by points, wins, podiums, finishes, and teammate performance.</p>
    <div className="h-96">{points.length ? <ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis dataKey="x" type="number" name="Similarity X" /><YAxis dataKey="y" type="number" name="Similarity Y" /><Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload}) => { const p=payload?.[0]?.payload as DriverSeason | undefined; return p ? <div className="bg-black/90 border border-white/10 p-3 rounded text-xs"><b>{p.name} {p.year}</b><div>{p.stats.points_per_race.toFixed(1)} pts/race · {(p.stats.win_rate*100).toFixed(0)}% wins</div></div> : null }} />{COLORS.map((color, cluster) => <Scatter key={cluster} data={points.filter(p => p.cluster === cluster)} fill={color} />)}</ScatterChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">Similarity data unavailable.</div>}</div>
  </div>
}
