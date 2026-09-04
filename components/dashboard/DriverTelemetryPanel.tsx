'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ReplayData, RaceFrame } from '@/lib/replayTypes';
import { TYRE_COMPOUNDS } from '@/lib/replayTypes';
import { X, ExternalLink, Activity } from 'lucide-react';

interface Props {
  data: ReplayData;
  frame: RaceFrame | null;
  driverCode: string | null;
  onClose: () => void;
  onInspect?: (driverCode: string) => void;
}

export default function DriverTelemetryPanel({ 
  data, 
  frame, 
  driverCode, 
  onClose,
  onInspect,
}: Props) {
  const [gearPop, setGearPop] = useState(false);
  const prevGearRef = useRef<number | null>(null);

  const d = (frame && driverCode) ? frame.drivers[driverCode] : undefined;
  const currentGear = d?.gear;

  // Trigger micro-animation on gear shift
  useEffect(() => {
    if (prevGearRef.current !== null && currentGear !== undefined && prevGearRef.current !== currentGear) {
      setGearPop(true);
      const timer = setTimeout(() => setGearPop(false), 260);
      return () => clearTimeout(timer);
    }
    prevGearRef.current = currentGear ?? null;
  }, [currentGear]);

  if (!frame || !driverCode || !d) return null;

  const driver = data.drivers.find(dr => dr.code === driverCode);
  const color = data.driverColors[driverCode] || 'var(--color-amber)';
  const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM'];

  // Compute shift light stages based on speed and throttle
  // Speed thresholds: <150 (1 light), 150-200 (2), 200-250 (3), 250-290 (4), >290 (5 all lit/flashing)
  const shiftLightCount = d.speed > 295 ? 5 : d.speed > 250 ? 4 : d.speed > 195 ? 3 : d.speed > 140 ? 2 : d.speed > 80 ? 1 : 0;
  const isRedline = d.speed >= 305 && d.throttle >= 90;

  return (
    <div
      className="absolute bottom-3 left-3 w-68 bg-[rgba(11,14,19,0.94)] backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-3.5 z-10 flex flex-col gap-2.5 animate-fade-in text-xs font-sans select-none card-interactive"
      style={{ '--driver-color': color } as React.CSSProperties}
    >
      {/* ── Cockpit Shift Lights Bar ─────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 pb-2 border-b border-white/10">
        {[
          { col: '#10B981', glow: '#10B981' }, // Green
          { col: '#10B981', glow: '#10B981' }, // Green
          { col: '#F59E0B', glow: '#F59E0B' }, // Yellow
          { col: '#EF4444', glow: '#EF4444' }, // Red
          { col: '#3B82F6', glow: '#3B82F6' }, // Blue Shift Point
        ].map((led, index) => {
          const active = index < shiftLightCount;
          return (
            <div
              key={index}
              className={`w-3.5 h-1.5 rounded-full transition-all duration-100 ${
                isRedline && active ? 'rpm-pulse-fast' : ''
              }`}
              style={{
                backgroundColor: active ? led.col : '#1F242D',
                boxShadow: active ? `0 0 8px ${led.glow}` : 'none',
              }}
            />
          );
        })}
        <span className="text-[9px] font-mono text-[var(--text-muted)] ml-1 font-bold">RPM</span>
      </div>

      {/* ── Driver Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full" style={{ background: color }} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-sm text-white">{driverCode}</span>
              <span className="font-mono font-bold text-xs px-1.5 py-0.2 rounded bg-white/10 text-white">
                P{d.position}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[125px]">
              {driver?.name ?? driverCode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onInspect && (
            <button
              onClick={() => onInspect(driverCode)}
              className="w-6 h-6 rounded flex items-center justify-center text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors cursor-pointer"
              title="Inspect Full Driver Profile"
            >
              <ExternalLink size={12} />
            </button>
          )}
          <button 
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onClose}
            title="Dismiss Driver Telemetry"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Speed & Dynamic Gear Display ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-lg border border-white/5 text-center">
        <div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Speed</div>
          <div className="text-xl font-mono font-black text-white tracking-tight">
            {d.speed} <span className="text-[10px] font-normal text-[var(--text-muted)]">km/h</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Gear</div>
          <div className={`text-xl font-mono font-black text-[var(--amber)] ${gearPop ? 'gear-pop-active text-white' : ''}`}>
            {d.gear === 0 ? 'N' : `G${d.gear}`}
          </div>
        </div>
      </div>

      {/* ── Pedal Inputs (Throttle & Brake) ────────────────────────── */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        {/* Throttle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 font-bold w-7">THR</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full telemetry-bar-fluid"
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
              className="h-full bg-red-500 rounded-full telemetry-bar-fluid"
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
          <span className="text-[9px] font-black font-mono text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 rounded shadow-sm shadow-emerald-500/20 animate-pulse">
            DRS OPEN
          </span>
        ) : (
          <span className="text-[9px] font-mono text-[var(--text-muted)]">DRS OFF</span>
        )}
      </div>

      {/* Quick Action Button to Inspect Full Profile */}
      {onInspect && (
        <button
          onClick={() => onInspect(driverCode)}
          className="w-full py-1 text-[10px] font-mono font-bold text-amber-400/90 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Activity size={10} />
          <span>Full Telemetry Dossier</span>
        </button>
      )}
    </div>
  );
}
