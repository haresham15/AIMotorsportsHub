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
  series?: string;
  sessionType?: string;
}

export default function DriverTelemetryPanel({ 
  data, 
  frame, 
  driverCode, 
  onClose,
  onInspect,
  series,
  sessionType,
}: Props) {
  const [gearPop, setGearPop] = useState(false);
  const prevGearRef = useRef<number | null>(null);

  const effectiveSeries = series || data.sessionInfo?.seriesId || 'f1';
  const isTopFuel = effectiveSeries === 'top-fuel' || data.trackGeometry?.type === 'drag';
  const isNascar = effectiveSeries === 'nascar' || effectiveSeries.startsWith('nascar-');
  const isFormulaE = effectiveSeries === 'formula-e';
  const isWec = effectiveSeries === 'wec' || effectiveSeries === 'gt-world-challenge';
  const isMph = isTopFuel || isNascar;

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
  const shiftLightCount = isTopFuel
    ? (d.throttle >= 90 ? 5 : d.throttle > 50 ? 3 : 1)
    : d.speed > 295 ? 5 : d.speed > 250 ? 4 : d.speed > 195 ? 3 : d.speed > 140 ? 2 : d.speed > 80 ? 1 : 0;
  const isRedline = isTopFuel ? d.throttle >= 95 : (d.speed >= 305 && d.throttle >= 90);

  const displaySpeed = isMph ? Math.round(d.speed * 0.621371) : d.speed;
  const speedUnit = isMph ? 'MPH' : 'km/h';

  const gearDisplay = isTopFuel
    ? '1:1'
    : isFormulaE
    ? '1-SPD'
    : d.gear === 0 ? 'N' : `G${d.gear}`;
  const gearSubtext = isTopFuel ? 'DIRECT' : isFormulaE ? 'EV' : 'GEAR';

  return (
    <div
      className="absolute bottom-3 left-3 w-72 bg-[rgba(11,14,19,0.95)] backdrop-blur-2xl border border-white/15 rounded-none shadow-2xl p-3.5 z-10 flex flex-col gap-2.5 animate-fade-in text-xs font-sans select-none card-interactive"
      style={{ '--driver-color': color } as React.CSSProperties}
    >
      {/* ── Cockpit Shift Lights Bar ─────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 pb-2 border-b border-white/10">
        {[
          { col: isFormulaE ? '#00D2FF' : '#10B981', glow: isFormulaE ? '#00D2FF' : '#10B981' },
          { col: isFormulaE ? '#00D2FF' : '#10B981', glow: isFormulaE ? '#00D2FF' : '#10B981' },
          { col: '#F59E0B', glow: '#F59E0B' },
          { col: '#EF4444', glow: '#EF4444' },
          { col: isFormulaE ? '#A855F7' : '#3B82F6', glow: isFormulaE ? '#A855F7' : '#3B82F6' },
        ].map((led, index) => {
          const active = index < shiftLightCount;
          return (
            <div
              key={index}
              className={`w-3.5 h-1.5 rounded-none transition-all duration-100 ${
                isRedline && active ? 'rpm-pulse-fast' : ''
              }`}
              style={{
                backgroundColor: active ? led.col : '#1F242D',
                boxShadow: active ? `0 0 8px ${led.glow}` : 'none',
              }}
            />
          );
        })}
        <span className="text-[9px] font-mono text-[var(--text-muted)] ml-1 font-bold">
          {isFormulaE ? 'PWR' : isTopFuel ? 'NITRO' : 'RPM'}
        </span>
      </div>

      {/* ── Driver Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6" style={{ background: color }} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-sm text-white">{driverCode}</span>
              <span className="font-mono font-bold text-xs px-1.5 py-0.2 bg-white/10 text-white">
                {isWec && d.classPosition ? `${d.carClass === 'HYPERCAR' ? 'HYP' : 'GT3'}-P${d.classPosition}` : `P${d.position}`}
              </span>
              {isWec && d.carClass && (
                <span className={`text-[9px] font-black font-mono px-1 py-0.2 ${
                  d.carClass === 'HYPERCAR' ? 'bg-red-500/25 text-red-300 border border-red-500/40' : 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                }`}>
                  {d.carClass}
                </span>
              )}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[140px] flex items-center gap-1">
              <span>{driver?.name ?? driverCode}</span>
              {sessionType && <span className="text-[9px] text-white/40 font-mono">• {sessionType}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onInspect && (
            <button
              onClick={() => onInspect(driverCode)}
              className="w-6 h-6 flex items-center justify-center text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors cursor-pointer"
              title="Inspect Full Driver Profile"
            >
              <ExternalLink size={12} />
            </button>
          )}
          <button 
            className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onClose}
            title="Dismiss Driver Telemetry"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Speed & Dynamic Gear Display ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 border border-white/5 text-center">
        <div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Speed</div>
          <div className="text-xl font-mono font-black text-white tracking-tight">
            {displaySpeed} <span className="text-[10px] font-normal text-[var(--text-muted)]">{speedUnit}</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase">{gearSubtext}</div>
          <div className={`text-xl font-mono font-black text-[var(--amber)] ${gearPop ? 'gear-pop-active text-white' : ''}`}>
            {gearDisplay}
          </div>
        </div>
      </div>

      {/* ── Pedal Inputs (Throttle & Brake) ────────────────────────── */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        {/* Throttle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 font-bold w-7">
            {isFormulaE ? 'PWR' : 'THR'}
          </span>
          <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-400 telemetry-bar-fluid"
              style={{ width: `${d.throttle}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 text-right">
            {isFormulaE && d.attackMode ? '350kW' : `${Math.round(d.throttle)}%`}
          </span>
        </div>

        {/* Brake / Regen */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold w-7 ${isFormulaE ? 'text-sky-400' : 'text-red-400'}`}>
            {isFormulaE ? 'RGN' : 'BRK'}
          </span>
          <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
            <div
              className={`h-full telemetry-bar-fluid ${isFormulaE ? 'bg-sky-400' : 'bg-red-500'}`}
              style={{ width: `${d.brake}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 text-right">
            {isFormulaE && d.regenKw ? `-${d.regenKw}k` : `${Math.round(d.brake)}%`}
          </span>
        </div>
      </div>

      {/* ── Series-Specific Secondary Readout ──────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
        {isTopFuel ? (
          <>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300">
              <span>NITRO: 90% CH₃NO₂</span>
            </div>
            {d.chuteDeployed ? (
              <span className="text-[9px] font-black font-mono text-amber-400 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 animate-pulse">
                CHUTE OUT
              </span>
            ) : (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2">
                CHUTE ARMED
              </span>
            )}
          </>
        ) : isFormulaE ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-sky-400 font-bold">
                ⚡ {d.energyPct !== undefined ? `${d.energyPct.toFixed(1)}%` : '98.0%'}
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">BATT</span>
            </div>
            {d.attackMode ? (
              <span className="text-[9px] font-black font-mono text-cyan-300 bg-cyan-500/25 border border-cyan-400/50 px-1.5 py-0.2 animate-pulse">
                ⚡ ATTACK 350kW
              </span>
            ) : (
              <span className="text-[9px] font-mono text-white/50">BASE 300kW</span>
            )}
          </>
        ) : isWec ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: tyreInfo.color }} />
              <span className="text-[11px] font-semibold text-white">{tyreInfo.label}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">({d.tyreLife}L)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--amber)] bg-[var(--amber)]/10 px-1.5 py-0.2 border border-[var(--amber)]/25">
              STINT {d.stintNumber || 1}
            </span>
          </>
        ) : isNascar ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: tyreInfo.color }} />
              <span className="text-[11px] font-semibold text-white">{tyreInfo.label}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">({d.tyreLife}L)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2">
              STAGE {d.stageNumber || 1} ({d.stageLapsToGo || 0}L TO GO)
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: tyreInfo.color }} />
              <span className="text-[11px] font-semibold text-white">{tyreInfo.label}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">({d.tyreLife}L)</span>
            </div>
            {d.drs >= 10 ? (
              <span className="text-[9px] font-black font-mono text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 shadow-sm shadow-emerald-500/20 animate-pulse">
                DRS OPEN
              </span>
            ) : (
              <span className="text-[9px] font-mono text-[var(--text-muted)]">DRS OFF</span>
            )}
          </>
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
