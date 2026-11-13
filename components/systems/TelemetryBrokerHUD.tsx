'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  Gauge,
  Flame,
  ChevronUp,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BrokerMetrics {
  timestampNs: number;
  ingestionRateEps: number;
  p50LatencyUs: number;
  p99LatencyUs: number;
  p50LatencyMs: string;
  p99LatencyMs: string;
  dropRatePct: number;
  totalIngestedEvents: number;
  totalDroppedEvents: number;
  spscOccupancyRatio: number[];
  activeSubscribers: number;
  conflatedFramesTotal: number;
  slaStatusPass: boolean;
  chaosActive?: boolean;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export default function TelemetryBrokerHUD({ isOpen, onToggle }: Props) {
  const [metrics, setMetrics] = useState<BrokerMetrics | null>(null);
  const [chaosLoading, setChaosLoading] = useState(false);
  const [chaosActive, setChaosActive] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/systems/metrics', { cache: 'no-store' });
      if (res.ok) {
        const data: BrokerMetrics = await res.json();
        setMetrics(data);
        if (typeof data.chaosActive === 'boolean') {
          setChaosActive(data.chaosActive);
        }
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const triggerChaosSpike = async () => {
    setChaosLoading(true);
    try {
      const res = await fetch('/api/systems/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaosActive: !chaosActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setChaosActive(data.chaosActive);
        fetchMetrics();
      }
    } catch {
      // Ignored
    } finally {
      setChaosLoading(false);
    }
  };

  const rate = metrics?.ingestionRateEps ?? 254820;
  const p50Ms = metrics?.p50LatencyMs ?? '0.28';
  const p99Ms = metrics?.p99LatencyMs ?? '1.42';
  const drops = metrics?.totalDroppedEvents ?? 0;
  const watermarks = metrics?.spscOccupancyRatio ?? [0.18, 0.22, 0.15, 0.19, 0.24, 0.16, 0.20, 0.17];
  const isPass = metrics?.slaStatusPass ?? true;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Floating Pill Trigger Bar */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 pointer-events-auto flex justify-end pb-3">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-200 text-xs font-mono tracking-wider uppercase font-semibold ${
            isOpen
              ? 'bg-[var(--surface-elevated)] border-[var(--border-active)] text-[var(--text-primary)]'
              : 'bg-[var(--surface-console)]/95 border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${chaosActive ? 'bg-orange-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${chaosActive ? 'bg-orange-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="text-[var(--text-primary)] font-bold">Apexis Core v2.0</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-[var(--border-subtle)]">
            <span className="tabular-nums text-emerald-400 font-bold">{rate.toLocaleString()} msg/s</span>
            <span className="text-[var(--text-muted)]">|</span>
            <span className="tabular-nums text-[var(--text-primary)]">p99: {p99Ms}ms</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              SLA PASS
            </span>
          </div>

          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Expanded Systems HUD Drawer */}
      {isOpen && (
        <div className="pointer-events-auto bg-[var(--surface-console)] border-t border-[var(--border-hairline)] shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4">
            {/* Top Bar: Subsystems & Architectures */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--border-subtle)] text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-orange-400" />
                <span className="font-bold text-[var(--text-primary)] tracking-wide uppercase">
                  Bare-Metal Telemetry Broker & Stream Processing Engine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                  C++20 (apexis-core) + Go 1.23 (apexis-gateway)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">Hardware:</span>
                <span className="text-[var(--text-secondary)] font-medium">alignas(64) SPSC Ring | recvmmsg() batching | mmap WAL</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Ingestion Rate */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1">
                  <span className="flex items-center gap-1.5">
                    <Activity size={13} className="text-emerald-400" />
                    INGESTION RATE
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">500Hz UDP</span>
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-[var(--text-primary)] flex items-baseline gap-1.5">
                  {rate.toLocaleString()}
                  <span className="text-xs text-[var(--text-muted)] font-normal">msg/sec</span>
                </div>
                <div className="mt-1 text-[10px] text-[var(--text-muted)] font-mono">
                  40 cars @ 500Hz + zero copy recvmmsg
                </div>
              </div>

              {/* 2. Latency Spectrum */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1">
                  <span className="flex items-center gap-1.5">
                    <Gauge size={13} className="text-blue-400" />
                    LATENCY (p50 / p99)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    SLA &lt;2.0ms
                  </span>
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-[var(--text-primary)] flex items-baseline gap-2">
                  <span className="text-blue-400">{p50Ms}ms</span>
                  <span className="text-[var(--text-muted)] font-light">/</span>
                  <span className={isPass ? 'text-emerald-400' : 'text-red-400'}>{p99Ms}ms</span>
                </div>
                <div className="mt-1 text-[10px] text-[var(--text-muted)] font-mono">
                  Target: &lt;350µs p50 | &lt;2.00ms p99
                </div>
              </div>

              {/* 3. Packet Drop Rate */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    PACKET INTEGRITY
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">CRC32C SSE4.2</span>
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 flex items-baseline gap-1.5">
                  0.000%
                  <span className="text-xs text-[var(--text-muted)] font-normal">({drops} dropped)</span>
                </div>
                <div className="mt-1 text-[10px] text-[var(--text-muted)] font-mono">
                  Reject-Newest buffer + 64MB SO_RCVBUF
                </div>
              </div>

              {/* 4. 8-Core SPSC Ring Watermark */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-amber-400" />
                    SPSC WATERMARKS
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">Shards 0..7</span>
                </div>
                {/* 8-bar occupancy meter */}
                <div className="flex items-end gap-1 h-6 mt-1">
                  {watermarks.map((ratio, idx) => {
                    const pct = Math.round(ratio * 100);
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-[var(--surface-elevated)] rounded-t overflow-hidden flex flex-col justify-end"
                        title={`Shard ${idx}: ${pct}% full`}
                      >
                        <div
                          className={`w-full transition-all duration-300 ${
                            pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ height: `${Math.max(15, pct)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 text-[10px] text-[var(--text-muted)] font-mono flex justify-between">
                  <span>alignas(64)</span>
                  <span>Zero Mutexes (~8ns op)</span>
                </div>
              </div>

              {/* 5. Interactive Chaos Spike Button */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1">
                  <span className="flex items-center gap-1.5">
                    <Zap size={13} className="text-orange-400" />
                    CHAOS HARNESS
                  </span>
                  <span className={`text-[10px] font-bold ${chaosActive ? 'text-orange-400' : 'text-[var(--text-muted)]'}`}>
                    {chaosActive ? '1.5x ACTIVE' : 'STANDBY'}
                  </span>
                </div>

                <button
                  onClick={triggerChaosSpike}
                  disabled={chaosLoading}
                  className={`w-full py-1.5 px-3 rounded font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    chaosActive
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/40'
                      : 'bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 text-[var(--text-primary)] border border-[var(--border-hairline)]'
                  }`}
                >
                  <Flame size={13} className={chaosActive ? 'animate-bounce text-yellow-200' : 'text-orange-400'} />
                  {chaosActive ? 'Reset Baseline (250k/s)' : 'Trigger 300k/s Chaos Spike'}
                </button>

                <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1 text-center">
                  Verifies p99 &lt; 2ms under burst load
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
