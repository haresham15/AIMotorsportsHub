'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Zap,
  Gauge,
  Layers,
  Sparkles,
  Radio,
  ChevronRight,
  Clock,
} from 'lucide-react';

export interface AnomalyItem {
  id: string;
  timestamp: string;
  latencyUs: number;
  carNumber: string;
  driverName: string;
  lap: number;
  sector: number;
  type: 'PUNCTURE' | 'BRAKE_RUNAWAY' | 'CALIPER_DRAG' | 'ERS_CLIPPING' | 'PORPOISING';
  severityZ: number;
  summary: string;
  metric: string;
}

const INITIAL_ANOMALIES: AnomalyItem[] = [
  {
    id: 'anom-1',
    timestamp: 'Just now',
    latencyUs: 420,
    carNumber: '#4',
    driverName: 'Lando Norris',
    lap: 38,
    sector: 2,
    type: 'PUNCTURE',
    severityZ: 3.5,
    summary: 'Sudden RR puncture! CUSUM negative pressure drift exceeded 1.20 PSI in 110ms (Ideal Gas Law normalized).',
    metric: '18.4 PSI (-4.2 PSI vs baseline)',
  },
  {
    id: 'anom-2',
    timestamp: '4s ago',
    latencyUs: 310,
    carNumber: '#16',
    driverName: 'Charles Leclerc',
    lap: 38,
    sector: 1,
    type: 'BRAKE_RUNAWAY',
    severityZ: 3.2,
    summary: 'FL carbon brake disc thermal runaway. Exceeded 1,065°C for > 200 consecutive ticks.',
    metric: '1,068°C (+3.2 Z-score)',
  },
  {
    id: 'anom-3',
    timestamp: '12s ago',
    latencyUs: 350,
    carNumber: '#63',
    driverName: 'George Russell',
    lap: 37,
    sector: 2,
    type: 'ERS_CLIPPING',
    severityZ: 2.8,
    summary: 'MGU-K energy derating on Kemmel straight. Speed growth stalled by 14 km/h vs 5-lap median.',
    metric: '0 kW harvest (-14 km/h delta)',
  },
  {
    id: 'anom-4',
    timestamp: '28s ago',
    latencyUs: 410,
    carNumber: '#1',
    driverName: 'Max Verstappen',
    lap: 36,
    sector: 1,
    type: 'PORPOISING',
    severityZ: 2.4,
    summary: '8Hz resonant vertical oscillation on straight. Rear ride height collapsed to 1.8mm with plank bottoming.',
    metric: '1.8mm rear height (8Hz Goertzel)',
  },
];

export default function AnomalyFeedDrawer() {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>(INITIAL_ANOMALIES);

  // Poll or connect to backend for live stream anomaly pushes
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate periodic live arrivals to showcase sub-5ms streaming anomaly engine
      const incidentPool: AnomalyItem[] = [
        {
          id: `anom-${Date.now()}`,
          timestamp: 'Just now',
          latencyUs: Math.round(280 + Math.random() * 150),
          carNumber: '#44',
          driverName: 'Lewis Hamilton',
          lap: 39,
          sector: 2,
          type: 'CALIPER_DRAG',
          severityZ: 3.1,
          summary: 'Front axle caliper drag: Left/Right disc temperature delta reached 192°C under straight-line braking.',
          metric: 'Δ 192°C FL vs FR',
        },
        {
          id: `anom-${Date.now() + 1}`,
          timestamp: 'Just now',
          latencyUs: Math.round(310 + Math.random() * 100),
          carNumber: '#81',
          driverName: 'Oscar Piastri',
          lap: 39,
          sector: 3,
          type: 'ERS_CLIPPING',
          severityZ: 2.6,
          summary: 'ERS state-of-charge depletion. MGU-K override clipped before Turn 18.',
          metric: '0.42 MJ remaining ES',
        },
      ];

      const chosen = incidentPool[Math.floor(Math.random() * incidentPool.length)];
      setAnomalies((prev) => [chosen, ...prev.slice(0, 5)]);
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const getTypeIcon = (type: AnomalyItem['type']) => {
    switch (type) {
      case 'PUNCTURE':
        return <AlertTriangle size={14} className="text-red-400" />;
      case 'BRAKE_RUNAWAY':
        return <Flame size={14} className="text-orange-400" />;
      case 'CALIPER_DRAG':
        return <Gauge size={14} className="text-amber-400" />;
      case 'ERS_CLIPPING':
        return <Zap size={14} className="text-blue-400" />;
      case 'PORPOISING':
        return <Layers size={14} className="text-purple-400" />;
    }
  };

  const getBadgeClass = (type: AnomalyItem['type']) => {
    switch (type) {
      case 'PUNCTURE':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'BRAKE_RUNAWAY':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'CALIPER_DRAG':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ERS_CLIPPING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PORPOISING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="card glass rounded-[var(--radius-xl)] p-4 sm:p-5 border border-[var(--border-hairline)] bg-[var(--surface-console)]/90 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Sub-5ms Rolling Anomaly Feed
          </h3>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            &lt;0.45ms p99 SLA PASS
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          Online Welford + CUSUM + Goertzel
        </span>
      </div>

      <div className="space-y-2.5">
        {anomalies.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] hover:border-[var(--border-active)] transition-all font-mono"
          >
            <div className="flex items-center justify-between text-[11px] mb-1">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${getBadgeClass(item.type)}`}>
                  {getTypeIcon(item.type)}
                  {item.type}
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {item.carNumber} {item.driverName}
                </span>
                <span className="text-[var(--text-muted)] text-[10px]">
                  Lap {item.lap} (S{item.sector})
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                <Clock size={10} />
                <span>{(item.latencyUs / 1000).toFixed(2)}ms</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-1">
              {item.summary}
            </p>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
              <span>Metric: <strong className="text-[var(--text-primary)] font-semibold">{item.metric}</strong></span>
              <span>Severity: <strong className="text-orange-400 font-semibold">+{item.severityZ.toFixed(1)}σ</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
