'use client'

import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CheckCircle2, AlertTriangle, Cpu, Layers, Activity } from 'lucide-react'

export interface LapTimeBenchmarkData {
  task: string
  temporal_split: {
    train_season: number
    train_rounds: number[]
    train_samples: number
    test_season: number
    test_rounds: number[]
    test_samples: number
    held_out_race: string
  }
  comparison: {
    winner: string
    verdict: string
    margin_mae_seconds: number
  }
  transformer: {
    architecture: string
    custom_attention_from_scratch: boolean
    n_parameters: number
    d_model: number
    n_heads: number
    n_layers: number
    held_out_mae: number
    held_out_rmse: number
    held_out_r2: number
  }
  baseline_gbdt: {
    architecture: string
    max_iter: number
    learning_rate: number
    held_out_mae: number
    held_out_rmse: number
    held_out_r2: number
  }
  normalization: {
    target_mean: number
    target_std: number
    seq_length: number
  }
}

export default function LapTimeBenchmarkSection({ benchmark }: { benchmark: LapTimeBenchmarkData }) {
  const chartData = [
    {
      metric: 'Mean Absolute Error (MAE)',
      Transformer: benchmark.transformer.held_out_mae,
      GBDT_Baseline: benchmark.baseline_gbdt.held_out_mae,
    },
    {
      metric: 'Root Mean Squared Error (RMSE)',
      Transformer: benchmark.transformer.held_out_rmse,
      GBDT_Baseline: benchmark.baseline_gbdt.held_out_rmse,
    }
  ]

  const isTransformerWinner = benchmark.comparison.winner === 'Transformer'

  return (
    <div className="mt-12 border-t border-[var(--border-hairline)] pt-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <div className="eyebrow">Lap-Time Sequence Model</div>
          <h2 className="text-2xl font-extrabold tracking-tight font-[family-name:var(--font-disp)] uppercase text-white m-0">
            Temporal Held-Out Benchmark: Transformer vs. GBDT
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 bg-white/5 border border-[var(--border-hairline)] text-[var(--text-muted)] uppercase tracking-wider">
            FastF1 Strict Time Split
          </span>
          <span className="text-[10px] font-mono px-2 py-1 bg-[var(--surface-raised)] border border-[var(--border-hairline)] text-[var(--amber-pit)] uppercase tracking-wider">
            ONNX Ready
          </span>
        </div>
      </div>

      <p className="text-sm font-mono text-[var(--text-secondary)] mb-6 max-w-[780px] leading-relaxed">
        Strict chronological evaluation: models trained on 2023 Rounds 1–4 (Bahrain, Saudi Arabia, Australia, Azerbaijan)
        and evaluated on an unseen held-out race ({benchmark.temporal_split.held_out_race}).
        The PyTorch Transformer uses custom Multi-Head Self-Attention built without <code className="text-[var(--text-primary)]">nn.MultiheadAttention</code>.
      </p>

      {/* Honest Verdict Banner */}
      <div className={`p-5 mb-8 rounded-sm border ${
        isTransformerWinner 
          ? 'bg-[var(--flag-green)]/10 border-[var(--flag-green)]/30 text-[var(--flag-green)]' 
          : 'bg-[var(--flag-yellow)]/10 border-[var(--flag-yellow)]/30 text-[var(--flag-yellow)]'
      }`}>
        <div className="flex items-start gap-3">
          {isTransformerWinner ? (
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-mono font-bold tracking-wider uppercase mb-1">
              Honest Evaluation Verdict: {benchmark.comparison.winner.toUpperCase()} WINS
            </div>
            <p className="text-sm font-mono leading-relaxed text-white m-0">
              {benchmark.comparison.verdict}
            </p>
            <div className="text-xs font-mono text-[var(--text-secondary)] mt-2">
              Tested on {benchmark.temporal_split.test_samples.toLocaleString()} held-out sequential laps across 20 drivers.
              {isTransformerWinner
                ? ` The Transformer's causal self-attention successfully tracks tire degradation and compound delta.`
                : ` The GBDT baseline demonstrates superior tabular sample efficiency on sequential lap metrics.`}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
          <div className="text-[10px] font-mono uppercase text-[var(--amber-pit)] tracking-wider mb-2 font-bold flex items-center justify-between">
            <span>Transformer MAE</span>
            <Cpu size={12} />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-wider tabular-nums">
            {benchmark.transformer.held_out_mae.toFixed(3)}s
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">
            PyTorch Transformer with custom MHA ({benchmark.transformer.n_parameters.toLocaleString()} params).
          </p>
        </div>

        <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
          <div className="text-[10px] font-mono uppercase text-[var(--amber-pit)] tracking-wider mb-2 font-bold flex items-center justify-between">
            <span>GBDT Baseline MAE</span>
            <Layers size={12} />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-wider tabular-nums">
            {benchmark.baseline_gbdt.held_out_mae.toFixed(3)}s
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">
            HistGradientBoosting baseline on identical temporal feature sequences.
          </p>
        </div>

        <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
          <div className="text-[10px] font-mono uppercase text-[var(--green-flag)] tracking-wider mb-2 font-bold flex items-center justify-between">
            <span>Delta Margin</span>
            <Activity size={12} />
          </div>
          <div className="text-2xl font-mono font-bold text-[var(--flag-green)] tracking-wider tabular-nums">
            {benchmark.comparison.margin_mae_seconds.toFixed(3)}s
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">
            Absolute lap-time accuracy delta between architectures on held-out GP.
          </p>
        </div>

        <div className="console-panel p-4 rounded-sm border border-[var(--border-hairline)]">
          <div className="text-[10px] font-mono uppercase text-[var(--amber-pit)] tracking-wider mb-2 font-bold">
            Held-Out Test N
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-wider tabular-nums">
            {benchmark.temporal_split.test_samples.toLocaleString()}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-mono leading-relaxed">
            {benchmark.temporal_split.held_out_race} test sequences.
          </p>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="console-panel p-5 rounded-none border border-[var(--border-hairline)] mb-8">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5 mb-3">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white m-0">
            Held-Out Error Comparison (Seconds — Lower is Better)
          </h3>
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
            [MAE-RMSE-DELTA]
          </span>
        </div>
        <p className="text-xs font-mono text-[var(--text-muted)] mb-4">
          Evaluating next-lap prediction accuracy on unseen Miami Grand Prix laps. Lower error indicates tighter prediction around the true physical lap time.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis unit="s" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip 
                formatter={(val: any) => [`${Number(val).toFixed(3)} s`, '']}
                contentStyle={{ background: '#121214', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: 11 }} 
              />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="Transformer" fill="#22c55e" name="PyTorch Transformer (Custom MHA)" />
              <Bar dataKey="GBDT_Baseline" fill="#f59e0b" name="GBDT Baseline" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
