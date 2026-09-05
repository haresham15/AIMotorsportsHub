'use client';

import React from 'react';
import { X, Star, Gauge, Trophy } from 'lucide-react';
import { getDriverColor, SERIES_DRIVERS } from '@/lib/data';
import { useUserProfile } from '@/lib/userPreferences';
import { toast } from 'sonner';

interface DriverProfileModalProps {
  driverCode: string | null;
  isOpen: boolean;
  onClose: () => void;
  series?: string;
  telemetry?: {
    speed?: number;
    gear?: number;
    throttle?: number;
    brake?: number;
    tyre?: string;
    tyreLife?: number;
    drs?: boolean;
    position?: number;
    gap?: string;
    isMph?: boolean;
    chuteDeployed?: boolean;
    attackMode?: boolean;
    energyPct?: number;
    carClass?: string;
    stintNumber?: number;
    stageNumber?: number;
  };
}


const DRIVER_DOSSIER: Record<string, {
  name: string;
  number: string;
  team: string;
  country: string;
  championshipPoints: number;
  podiums: number;
  wins: number;
  bio: string;
}> = {
  'VER': {
    name: 'Max Verstappen',
    number: '1',
    team: 'Red Bull Racing',
    country: 'Netherlands',
    championshipPoints: 429,
    podiums: 111,
    wins: 63,
    bio: '4-time World Drivers Champion known for relentless race pace and surgical racecraft.',
  },
  'NOR': {
    name: 'Lando Norris',
    number: '4',
    team: 'McLaren F1 Team',
    country: 'United Kingdom',
    championshipPoints: 345,
    podiums: 26,
    wins: 4,
    bio: 'McLaren team leader possessing explosive single-lap qualifying pace and high tire preservation.',
  },
  'LEC': {
    name: 'Charles Leclerc',
    number: '16',
    team: 'Scuderia Ferrari',
    country: 'Monaco',
    championshipPoints: 312,
    podiums: 42,
    wins: 8,
    bio: 'Scuderia Ferrari talisman celebrated for pole position mastery and street circuit supremacy.',
  },
  'HAM': {
    name: 'Lewis Hamilton',
    number: '44',
    team: 'Scuderia Ferrari',
    country: 'United Kingdom',
    championshipPoints: 215,
    podiums: 201,
    wins: 105,
    bio: '7-time World Champion holding the all-time records for Grand Prix wins and pole positions.',
  },
  'PIA': {
    name: 'Oscar Piastri',
    number: '81',
    team: 'McLaren F1 Team',
    country: 'Australia',
    championshipPoints: 278,
    podiums: 11,
    wins: 3,
    bio: 'Formula 2 and Formula 3 champion renowned for calm radio demeanor and wheel-to-wheel defense.',
  },
  'RUS': {
    name: 'George Russell',
    number: '63',
    team: 'Mercedes-AMG Petronas',
    country: 'United Kingdom',
    championshipPoints: 220,
    podiums: 15,
    wins: 3,
    bio: 'Mercedes team spearhead renowned for precise technical feedback and relentless race starts.',
  },
  'ANT': {
    name: 'Kimi Antonelli',
    number: '12',
    team: 'Mercedes-AMG Petronas',
    country: 'Italy',
    championshipPoints: 64,
    podiums: 1,
    wins: 0,
    bio: 'Italian generational prodigy and Mercedes rookie sensation competing in his debut Grand Prix season.',
  },
  'SAI': {
    name: 'Carlos Sainz',
    number: '55',
    team: 'Williams Racing',
    country: 'Spain',
    championshipPoints: 185,
    podiums: 25,
    wins: 4,
    bio: 'Smooth operator revered for analytical strategy intuition and wet-weather mastery.',
  },
  'ALO': {
    name: 'Fernando Alonso',
    number: '14',
    team: 'Aston Martin F1',
    country: 'Spain',
    championshipPoints: 68,
    podiums: 106,
    wins: 32,
    bio: '2-time World Champion with over 400 Grand Prix entries and legendary racecraft acumen.',
  },
};

export default function DriverProfileModal({
  driverCode,
  isOpen,
  onClose,
  series = 'f1',
  telemetry,
}: DriverProfileModalProps) {
  const { toggleDriver, isDriverFollowed } = useUserProfile();

  if (!isOpen || !driverCode) return null;

  // Lookup driver across series roster if not in DOSSIER
  const seriesRoster = SERIES_DRIVERS[series] || SERIES_DRIVERS['f1'] || [];
  const rosterDriver = seriesRoster.find(d => d.code === driverCode);

  const driverData = DRIVER_DOSSIER[driverCode] || {
    name: rosterDriver?.name || driverCode,
    number: rosterDriver ? String(rosterDriver.number) : '00',
    team: rosterDriver?.team || `${series.toUpperCase()} Competitor`,
    country: 'International',
    championshipPoints: 12,
    podiums: 1,
    wins: 0,
    bio: `${rosterDriver?.name || driverCode} competing for ${rosterDriver?.team || 'the team'} in ${series.toUpperCase()} championship competition.`,
  };

  const teamColor = rosterDriver?.color || getDriverColor(series, driverCode) || '#fbbf24';
  const isFollowed = isDriverFollowed(driverCode, series);

  const handleToggleFollow = () => {
    toggleDriver({
      code: driverCode,
      name: driverData.name,
      team: driverData.team,
      series: series,
      color: teamColor,
    });
    if (!isFollowed) {
      toast.success(`Added ${driverData.name} to My Garage favorites!`);
    } else {
      toast.info(`Removed ${driverData.name} from My Garage.`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[540px] my-auto max-h-[90vh] flex flex-col bg-[rgba(11,14,19,0.98)] border border-white/15 rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Team Color Accent Bar */}
        <div 
          className="h-2 w-full"
          style={{ backgroundColor: teamColor, boxShadow: `0 0 16px ${teamColor}80` }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl text-white border shadow-lg"
              style={{ 
                backgroundColor: `${teamColor}25`, 
                borderColor: `${teamColor}60`,
                color: teamColor 
              }}
            >
              {driverData.number || driverCode.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white font-[family-name:var(--font-disp)] uppercase tracking-wide m-0">
                  {driverData.name}
                </h2>
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/15">
                  {driverCode}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono m-0 mt-0.5">
                {driverData.team} • {driverData.country}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          
          {/* Action Row: Follow Toggle & Position Badge */}
          <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Track Position:</span>
              <span className="text-sm font-mono font-black text-[var(--amber)]">
                P{telemetry?.position ?? '—'}
              </span>
              {telemetry?.gap && (
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  ({telemetry.gap})
                </span>
              )}
            </div>

            <button
              onClick={handleToggleFollow}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isFollowed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-white/5 text-[var(--text-muted)] hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <Star size={13} className={isFollowed ? 'fill-amber-400 text-amber-400' : ''} />
              <span>{isFollowed ? 'Following' : 'Follow Driver'}</span>
            </button>
          </div>

          {/* Real-time Telemetry Snapshot */}
          {(() => {
            const isTopFuel = series === 'top-fuel';
            const isNascar = series === 'nascar' || series.startsWith('nascar-');
            const isFormulaE = series === 'formula-e';
            const isWec = series === 'wec' || series === 'gt-world-challenge';
            const isMph = telemetry?.isMph ?? (isTopFuel || isNascar);

            const displaySpeed = telemetry?.speed !== undefined
              ? (isMph ? Math.round(telemetry.speed * 0.621371) : telemetry.speed)
              : '—';
            const speedUnit = isMph ? 'MPH' : 'km/h';

            const gearDisplay = isTopFuel
              ? '1:1'
              : isFormulaE
              ? '1'
              : telemetry?.gear !== undefined ? (telemetry.gear === 0 ? 'N' : String(telemetry.gear)) : '—';
            const gearLabel = isTopFuel ? 'DIRECT' : isFormulaE ? 'EV DRIVE' : 'GEAR';

            return (
              <div>
                <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2 flex items-center gap-1.5">
                  <Gauge size={13} className="text-amber-400" />
                  <span>Live Telemetry Telecast</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Speed</div>
                    <div className="text-lg font-mono font-black text-white">
                      {displaySpeed} <span className="text-[10px] font-normal text-[var(--text-muted)]">{speedUnit}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{gearLabel}</div>
                    <div className={`text-lg font-mono font-black ${gearDisplay === 'N' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {gearDisplay}
                    </div>
                  </div>

                  {isTopFuel ? (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Nitro Blend</div>
                      <div className="text-sm font-mono font-black text-amber-300 mt-0.5">
                        90% CH₃NO₂
                      </div>
                      <div className="text-[9px] font-mono text-[var(--text-muted)]">
                        NITROMETHANE
                      </div>
                    </div>
                  ) : isFormulaE ? (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Battery</div>
                      <div className="text-lg font-mono font-black text-sky-400">
                        ⚡ {telemetry?.energyPct !== undefined ? `${telemetry.energyPct.toFixed(1)}%` : '98.0%'}
                      </div>
                      <div className="text-[9px] font-mono text-[var(--text-muted)]">
                        USABLE SOC
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Tyre</div>
                      <div className="text-lg font-mono font-black text-emerald-400">
                        {telemetry?.tyre ?? 'HARD'}
                      </div>
                      <div className="text-[9px] font-mono text-[var(--text-muted)]">
                        {telemetry?.tyreLife ?? 0} laps old
                      </div>
                    </div>
                  )}

                  {isTopFuel ? (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Parachute</div>
                      <div className={`text-sm font-mono font-black mt-1 ${telemetry?.chuteDeployed ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                        {telemetry?.chuteDeployed ? 'DEPLOYED' : 'ARMED'}
                      </div>
                    </div>
                  ) : isFormulaE ? (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Power Mode</div>
                      <div className={`text-sm font-mono font-black mt-1 ${telemetry?.attackMode ? 'text-cyan-300 animate-pulse' : 'text-sky-400'}`}>
                        {telemetry?.attackMode ? '350kW ATK' : '300kW BASE'}
                      </div>
                    </div>
                  ) : isWec ? (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Stint</div>
                      <div className="text-sm font-mono font-black text-amber-400 mt-1">
                        STINT {telemetry?.stintNumber || 1}
                      </div>
                    </div>
                  ) : isNascar ? (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Stage</div>
                      <div className="text-sm font-mono font-black text-amber-300 mt-1">
                        STAGE {telemetry?.stageNumber || 1}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">DRS Wing</div>
                      <div className={`text-sm font-mono font-black mt-1 ${telemetry?.drs ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                        {telemetry?.drs ? 'OPEN' : 'OFF'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}


          {/* Pedals Micro-HUD */}
          {telemetry && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">THROTTLE</span>
                <span className="text-white font-bold">{telemetry.throttle ?? 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full telemetry-bar-fluid"
                  style={{ width: `${telemetry.throttle ?? 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                <span className="text-red-400 font-bold">BRAKE</span>
                <span className="text-white font-bold">{telemetry.brake ?? 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full telemetry-bar-fluid"
                  style={{ width: `${telemetry.brake ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Season Standing & Career Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2 flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-400" />
              <span>Championship Metrics</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-mono text-[var(--text-muted)]">Points</div>
                <div className="text-base font-mono font-bold text-white">{driverData.championshipPoints}</div>
              </div>
              <div>
                <div className="text-xs font-mono text-[var(--text-muted)]">Podiums</div>
                <div className="text-base font-mono font-bold text-white">{driverData.podiums}</div>
              </div>
              <div>
                <div className="text-xs font-mono text-[var(--text-muted)]">Career Wins</div>
                <div className="text-base font-mono font-bold text-white">{driverData.wins}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
          <span>Apexis Telemetry Inspector</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
