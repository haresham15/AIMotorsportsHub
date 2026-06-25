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
  const color = data.driverColors[driverCode] || '#3b82f6'
  const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM']

  return (
    <div className="replay-telemetry" style={{ '--driver-color': color } as React.CSSProperties}>
      <div className="replay-telemetry__header">
        <div className="replay-telemetry__driver">
          <span className="replay-telemetry__color" style={{ background: color }} />
          <span className="replay-telemetry__code">{driverCode}</span>
          <span className="replay-telemetry__name">{driver?.name ?? driverCode}</span>
        </div>
        <button className="replay-telemetry__close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="replay-telemetry__body">
        {/* Position + Lap */}
        <div className="replay-telemetry__row">
          <span className="replay-telemetry__label">Position</span>
          <span className="replay-telemetry__value replay-telemetry__value--pos">P{d.position}</span>
        </div>
        <div className="replay-telemetry__row">
          <span className="replay-telemetry__label">Lap</span>
          <span className="replay-telemetry__value">{d.lap}/{data.totalLaps}</span>
        </div>

        {/* Speed */}
        <div className="replay-telemetry__gauge">
          <Gauge size={14} />
          <div className="replay-telemetry__gauge-bar">
            <div className="replay-telemetry__gauge-fill" style={{ width: `${Math.min(100, d.speed / 3.5)}%`, background: color }} />
          </div>
          <span className="replay-telemetry__gauge-val">{d.speed} km/h</span>
        </div>

        {/* Gear */}
        <div className="replay-telemetry__row">
          <span className="replay-telemetry__label">Gear</span>
          <span className="replay-telemetry__value replay-telemetry__value--gear">{d.gear}</span>
        </div>

        {/* Throttle */}
        <div className="replay-telemetry__bar-row">
          <Zap size={12} style={{ color: '#22c55e' }} />
          <span className="replay-telemetry__bar-label">Throttle</span>
          <div className="replay-telemetry__bar">
            <div className="replay-telemetry__bar-fill replay-telemetry__bar-fill--throttle" style={{ width: `${d.throttle}%` }} />
          </div>
          <span className="replay-telemetry__bar-val">{Math.round(d.throttle)}%</span>
        </div>

        {/* Brake */}
        <div className="replay-telemetry__bar-row">
          <Wind size={12} style={{ color: '#ef4444' }} />
          <span className="replay-telemetry__bar-label">Brake</span>
          <div className="replay-telemetry__bar">
            <div className="replay-telemetry__bar-fill replay-telemetry__bar-fill--brake" style={{ width: `${d.brake}%` }} />
          </div>
          <span className="replay-telemetry__bar-val">{Math.round(d.brake)}%</span>
        </div>

        {/* Tyre */}
        <div className="replay-telemetry__tyre">
          <span className="replay-telemetry__tyre-dot" style={{ background: tyreInfo.color }} />
          <span>{tyreInfo.label}</span>
          <span className="replay-telemetry__tyre-life">{d.tyreLife} laps</span>
        </div>

        {/* DRS */}
        {d.drs >= 10 && (
          <div className="replay-telemetry__drs-active">
            <span>DRS ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}
