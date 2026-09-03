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
    <div
      className="absolute bottom-3 left-3 w-64 bg-[rgba(11,14,19,0.9)] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 z-10 flex flex-col gap-2 animate-fade-in text-xs font-sans select-none"
      style={{ '--driver-color': color } as React.CSSProperties}
    >
      {/* ── Driver Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full" style={{ background: color }} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-sm text-white">{driverCode}</span>
              <span className="font-mono font-bold text-xs px-1.5 py-0.2 rounded bg-white/10 text-white">
                P{d.position}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[130px]">
              {driver?.name ?? driverCode}
            </div>
          </div>
        </div>

        <button 
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          onClick={onClose}
          title="Dismiss Driver Telemetry"
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Speed & Gear ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-lg border border-white/5 text-center">
        <div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Speed</div>
          <div className="text-base font-mono font-black text-white">
            {d.speed} <span className="text-[9px] font-normal text-[var(--text-muted)]">km/h</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Gear</div>
          <div className="text-base font-mono font-black text-[var(--amber)]">
            {d.gear === 0 ? 'N' : d.gear}
          </div>
        </div>
      </div>

      {/* ── Pedal Inputs (Throttle & Brake) ────────────────────────── */}
      <div className="flex flex-col gap-1.5 pt-1">
        {/* Throttle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 font-bold w-7">THR</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-75"
              style={{ width: `${d.throttle}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-right">
            {Math.round(d.throttle)}%
          </span>
        </div>

        {/* Brake */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-red-400 font-bold w-7">BRK</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-75"
              style={{ width: `${d.brake}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-right">
            {Math.round(d.brake)}%
          </span>
        </div>
      </div>

      {/* ── Tyre & DRS ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: tyreInfo.color }} />
          <span className="text-[11px] font-semibold text-white">{tyreInfo.label}</span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">({d.tyreLife}L)</span>
        </div>

        {d.drs >= 10 ? (
          <span className="text-[9px] font-black font-mono text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 rounded">
            DRS OPEN
          </span>
        ) : (
          <span className="text-[9px] font-mono text-[var(--text-muted)]">DRS OFF</span>
        )}
      </div>
    </div>
  )
}
