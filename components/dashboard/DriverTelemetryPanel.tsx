'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ReplayData, RaceFrame } from '@/lib/replayTypes';
import { TYRE_COMPOUNDS, calculateReplayGap } from '@/lib/replayTypes';
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

// Max calibrated speed per gear (km/h) for gear ratio RPM synthesis
const F1_GEAR_MAX_KMH: Record<number, number> = {
  1: 85,
  2: 125,
  3: 165,
  4: 205,
  5: 245,
  6: 280,
  7: 315,
  8: 355,
};

const NASCAR_GEAR_MAX_KMH: Record<number, number> = {
  1: 80,
  2: 135,
  3: 195,
  4: 255,
  5: 330,
};

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

  // Compute live gap to leader
  const gapDisplay = useMemo(() => {
    if (!frame || !d) return undefined;
    const sorted = Object.values(frame.drivers).sort((a, b) => a.position - b.position);
    const leader = sorted[0];
    if (!leader) return undefined;

    if (isTopFuel) {
      if (d.position === 1) return d.finished ? 'WINNER' : 'LEADER';
      if (d.elapsedTime !== undefined && leader.elapsedTime !== undefined) {
        const delta = Math.max(0, d.elapsedTime - leader.elapsedTime);
        return `+${delta.toFixed(3)}s ET`;
      }
      return d.reactionTime ? `+${d.reactionTime.toFixed(3)}s RT` : '+0.040s';
    }

    return calculateReplayGap(
      d.position,
      d.dist,
      d.lap,
      d.relDist,
      leader.dist,
      leader.lap,
      leader.relDist
    );
  }, [frame, d, isTopFuel]);

  if (!frame || !driverCode || !d) return null;

  const driver = data.drivers.find(dr => dr.code === driverCode);
  const color = data.driverColors[driverCode] || 'var(--color-amber)';
  const tyreInfo = TYRE_COMPOUNDS[d.tyre] || TYRE_COMPOUNDS['MEDIUM'];

  const displaySpeed = isMph ? Math.round(d.speed * 0.621371) : d.speed;
  const speedUnit = isMph ? 'MPH' : 'km/h';

  // ── Realistic RPM and Shift Light Calculations ──
  let calculatedRpm = 0;
  let shiftLightCount = 0;
  let isRedline = false;
  let currentPowerKw = 0;

  if (isTopFuel) {
    // Top Fuel 8,400 RPM Nitromethane supercharged V8 with 1:1 centrifugal clutch
    if (d.speed < 5) {
      calculatedRpm = 2400 + Math.round(d.throttle * 15); // Staging idle
      shiftLightCount = 0;
    } else {
      // Clutch slips at launch, locks up to 1:1 drive
      const clutchLockSpeed = 160; // km/h (100 mph)
      const clutchProgress = Math.min(1, d.speed / clutchLockSpeed);
      const baseLaunchRpm = 6200;
      const directDriveRpm = (d.speed / 535) * 8400;
      calculatedRpm = Math.round(baseLaunchRpm * (1 - clutchProgress) + directDriveRpm * clutchProgress);
      calculatedRpm = Math.min(8450, Math.max(3000, calculatedRpm));
      shiftLightCount = calculatedRpm >= 8200 ? 5 : calculatedRpm >= 7600 ? 4 : calculatedRpm >= 7000 ? 3 : calculatedRpm >= 6400 ? 2 : calculatedRpm >= 5500 ? 1 : 0;
      isRedline = calculatedRpm >= 8250;
    }
  } else if (isFormulaE) {
    // Formula E: Gen3 electric powertrain (300kW base, 350kW Attack Mode, up to -250kW regen)
    currentPowerKw = d.attackMode ? 350 * (d.throttle / 100) : 300 * (d.throttle / 100);
    // Electric motor revs up to ~18,500 RPM directly proportional to vehicle speed
    calculatedRpm = Math.round((d.speed / 320) * 18500);
    const powerPct = (currentPowerKw / (d.attackMode ? 350 : 300)) * 100;
    shiftLightCount = d.attackMode && d.throttle > 85 ? 5 : powerPct >= 90 ? 5 : powerPct >= 75 ? 4 : powerPct >= 55 ? 3 : powerPct >= 35 ? 2 : powerPct >= 15 ? 1 : 0;
    isRedline = Boolean(d.attackMode && d.throttle >= 85);
  } else if (isNascar) {
    // NASCAR Cup Series: 5.86L pushrod V8, 5-speed sequential, ~9,200 RPM redline
    const g = Math.max(1, Math.min(5, d.gear || 1));
    const maxKmh = NASCAR_GEAR_MAX_KMH[g] || 330;
    const idleRpm = 2800;
    const shiftRpm = 8900;
    
    if (d.speed < 5 || d.gear === 0) {
      calculatedRpm = idleRpm + Math.round(d.throttle * 12);
      shiftLightCount = 0;
      isRedline = false;
    } else {
      const revRatio = Math.min(1.05, Math.max(0.35, d.speed / maxKmh));
      calculatedRpm = Math.round(revRatio * shiftRpm);
      calculatedRpm = Math.min(9250, Math.max(idleRpm, calculatedRpm));

      if (d.throttle >= 15 && d.brake < 20) {
        shiftLightCount = calculatedRpm >= 8850 ? 5 : calculatedRpm >= 8400 ? 4 : calculatedRpm >= 7900 ? 3 : calculatedRpm >= 7300 ? 2 : calculatedRpm >= 6700 ? 1 : 0;
        isRedline = calculatedRpm >= 8850 && d.throttle >= 80;
      } else {
        shiftLightCount = 0;
        isRedline = false;
      }
    }
  } else {
    // Open-Wheel (F1 / F2 / F3) & WEC / GT: 1.6L V6 Turbo Hybrid (13,500 RPM max, 12,800 shift point)
    const g = Math.max(1, Math.min(8, d.gear || 1));
    const maxKmh = F1_GEAR_MAX_KMH[g] || 355;
    const idleRpm = 4200;
    const shiftRpm = 12800;

    if (d.speed < 5 || d.gear === 0) {
      calculatedRpm = idleRpm + Math.round(d.throttle * 25);
      shiftLightCount = 0;
      isRedline = false;
    } else {
      if (g === 1 && d.speed < 30) {
        const tVal = d.speed / 30;
        const target = (d.speed / maxKmh) * shiftRpm;
        calculatedRpm = Math.round(idleRpm * (1 - tVal) + target * tVal);
      } else {
        const revRatio = Math.min(1.05, Math.max(0.40, d.speed / maxKmh));
        calculatedRpm = Math.round(revRatio * shiftRpm);
      }
      calculatedRpm = Math.min(13450, Math.max(idleRpm, calculatedRpm));

      if (d.throttle >= 15 && d.brake < 20) {
        shiftLightCount = calculatedRpm >= 12750 ? 5 : calculatedRpm >= 12300 ? 4 : calculatedRpm >= 11700 ? 3 : calculatedRpm >= 11000 ? 2 : calculatedRpm >= 10200 ? 1 : 0;
        isRedline = calculatedRpm >= 12750 && d.throttle >= 75;
      } else {
        shiftLightCount = 0;
        isRedline = false;
      }
    }
  }

  const gearDisplay = isTopFuel
    ? '1:1'
    : isFormulaE
    ? '1'
    : d.gear === 0 ? 'N' : String(d.gear);
  const gearSubtext = isTopFuel 
    ? 'DIRECT' 
    : isFormulaE 
    ? 'EV' 
    : d.inPit 
    ? (d.pitPhase === 'STOP' ? 'PIT BOX' : 'LIMITER') 
    : 'GEAR';

  return (
    <div
      className="absolute bottom-3 left-3 w-76 bg-[rgba(11,14,19,0.96)] backdrop-blur-2xl border border-white/15 rounded-none shadow-2xl p-3.5 z-10 flex flex-col gap-2.5 animate-fade-in text-xs font-sans select-none card-interactive"
      style={{ '--driver-color': color } as React.CSSProperties}
    >
      {/* ── Cockpit Shift Lights & Digital RPM Bar ─────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
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
                className={`w-4 h-1.5 rounded-none transition-all duration-75 ${
                  isRedline && active ? 'rpm-pulse-fast' : ''
                }`}
                style={{
                  backgroundColor: active ? led.col : '#1F242D',
                  color: led.col,
                  boxShadow: active ? `0 0 8px ${led.glow}` : 'none',
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xs font-black text-white tracking-wider">
            {isFormulaE ? `${Math.round(currentPowerKw)} kW` : `${calculatedRpm.toLocaleString()} RPM`}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] font-bold">
            {isFormulaE ? (d.attackMode ? 'ATK' : 'PWR') : isTopFuel ? 'NITRO' : 'ENG'}
          </span>
        </div>
      </div>

      {/* ── Driver Header with Number & Gap-to-Leader ───────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-7 shrink-0" style={{ background: color }} />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-black text-sm text-white">{driverCode}</span>
              {driver?.number && (
                <span className="font-mono text-[10px] text-white/50 font-bold">#{driver.number}</span>
              )}
              <span className="font-mono font-bold text-xs px-1.5 py-0.2 bg-white/10 text-white">
                {isWec && d.classPosition ? `${d.carClass === 'HYPERCAR' ? 'HYP' : 'GT3'}-P${d.classPosition}` : `P${d.position}`}
              </span>
              {d.inPit ? (
                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {d.pitPhase === 'STOP' ? `BOX STOP ${d.pitStopDuration ? `(${d.pitStopDuration.toFixed(1)}s)` : ''}` : d.pitPhase === 'EXIT' ? 'PIT EXIT' : 'PIT LIMITER'}
                </span>
              ) : gapDisplay && (
                <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 bg-[var(--amber)]/10 text-amber-300 border border-[var(--amber)]/25">
                  {gapDisplay}
                </span>
              )}
              {isWec && d.carClass && (
                <span className={`text-[8px] font-black font-mono px-1 py-0.2 ${
                  d.carClass === 'HYPERCAR' ? 'bg-red-500/25 text-red-300 border border-red-500/40' : 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                }`}>
                  {d.carClass}
                </span>
              )}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px] flex items-center gap-1 mt-0.5">
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
              title="Inspect Full Driver Dossier"
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
          <div className={`text-xl font-mono font-black ${
            gearDisplay === 'N' ? 'text-emerald-400' : 'text-[var(--amber)]'
          } ${gearPop ? 'gear-pop-active text-white' : ''}`}>
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
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-12 text-right">
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
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-12 text-right">
            {isFormulaE && d.regenKw ? `-${d.regenKw} kW` : `${Math.round(d.brake)}%`}
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
          className="w-full py-1 text-[10px] font-mono font-bold text-amber-400/90 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Activity size={10} />
          <span>Full Telemetry Dossier</span>
        </button>
      )}
    </div>
  );
}


