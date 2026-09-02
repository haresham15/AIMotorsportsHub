'use client'

import type { ReplayData, RaceFrame } from '@/lib/replayTypes'
import { TYRE_COMPOUNDS } from '@/lib/replayTypes'
import { X, Gauge, Zap, Wind } from 'lucide-react'

interface Props {
  data: ReplayData
  frame: RaceFrame | null
  driverCode: string | null
  onClose: () => void
}

export default function DriverTelemetryPanel({ data, frame, driverCode, onClose }: Props) {
  if (!frame || !driverCode) return null

  const d = frame.drivers[driverCode]
  if (!d) return null

  const driver = data.drivers.find(dr => dr.code === driverCode)
  const color = data.driverColors[driverCode] || 'var(--color-amber)'
  const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM']

  return (
    <div className="card glass absolute top-4 left-4 w-72 rounded-[var(--radius-lg)] overflow-hidden z-10 shadow-xl backdrop-blur-xl" style={{ '--driver-color': color } as React.CSSProperties}>
      <div className="flex items-center justify-between p-3 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 rounded-[var(--radius-sm)]" style={{ background: color }} />
          <span className="font-mono font-bold text-lg text-white">{driverCode}</span>
          <span className="text-sm font-semibold text-[var(--text-secondary)] truncate max-w-[120px]">{driver?.name ?? driverCode}</span>
        </div>
        <button 
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-highlight)] transition-colors"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Position + Lap */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Position</span>
          <span className="text-lg font-bold font-mono" style={{ color }}>P{d.position}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Lap</span>
          <span className="text-sm font-mono font-semibold">{d.lap}/{data.totalLaps}</span>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-3 mt-1">
          <Gauge size={14} className="text-[var(--text-secondary)]" />
          <div className="flex-1 h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${Math.min(100, d.speed / 3.5)}%`, background: color }} />
          </div>
          <span className="text-xs font-mono font-bold w-16 text-right">{d.speed} km/h</span>
        </div>

        {/* Gear */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Gear</span>
          <span className="text-sm font-mono font-bold bg-[var(--surface-sunken)] px-2 py-0.5 rounded-[var(--radius-sm)]">{d.gear}</span>
        </div>

        {/* Throttle */}
        <div className="flex items-center gap-3">
          <Zap size={12} className="text-green-500" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-12">Thr</span>
          <div className="flex-1 h-1.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-100 ease-linear" style={{ width: `${d.throttle}%` }} />
          </div>
          <span className="text-xs font-mono w-8 text-right">{Math.round(d.throttle)}%</span>
        </div>

        {/* Brake */}
        <div className="flex items-center gap-3">
          <Wind size={12} className="text-red-500" />
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider w-12">Brk</span>
          <div className="flex-1 h-1.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-100 ease-linear" style={{ width: `${d.brake}%` }} />
          </div>
          <span className="text-xs font-mono w-8 text-right">{Math.round(d.brake)}%</span>
        </div>

        {/* Tyre */}
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[var(--border-subtle)]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: tyreInfo.color }} />
          <span className="text-xs font-semibold">{tyreInfo.label}</span>
          <span className="text-xs text-[var(--text-muted)] ml-auto">{d.tyreLife} laps</span>
        </div>

        {/* DRS */}
        {d.drs >= 10 && (
          <div className="mt-1 flex items-center justify-center py-1.5 bg-green-500/10 border border-green-500/20 rounded-[var(--radius-sm)]">
            <span className="text-xs font-bold text-green-400 tracking-widest">DRS ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}
