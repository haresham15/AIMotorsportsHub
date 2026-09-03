'use client';

import React from 'react';
import { X, MapPin, Wind, Thermometer, Gauge, Clock, Compass, Layers } from 'lucide-react';
import { TRACK_REGISTRY } from '@/lib/trackData';

interface TrackDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuitName: string;
  country?: string;
  onSelectTrack?: (trackName: string) => void;
}

const CIRCUIT_SPECS: Record<string, {
  officialName: string;
  lengthKm: number;
  turns: number;
  drsZones: number;
  lapRecord: string;
  recordHolder: string;
  recordYear: number;
  ambientTemp: number;
  trackTemp: number;
  grip: string;
  wind: string;
}> = {
  'Zandvoort': {
    officialName: 'Circuit Zandvoort',
    lengthKm: 4.259,
    turns: 14,
    drsZones: 2,
    lapRecord: '1:11.097',
    recordHolder: 'Lewis Hamilton',
    recordYear: 2021,
    ambientTemp: 22,
    trackTemp: 34,
    grip: 'High (Banked Tarzan & Arie Luyendyk)',
    wind: '14 km/h NW (Coastal Gusts)',
  },
  'Monza': {
    officialName: 'Autodromo Nazionale Monza',
    lengthKm: 5.793,
    turns: 11,
    drsZones: 2,
    lapRecord: '1:21.046',
    recordHolder: 'Rubens Barrichello',
    recordYear: 2004,
    ambientTemp: 28,
    trackTemp: 42,
    grip: 'Low Downforce / High Speed Traps',
    wind: '6 km/h NE (Calm Paddock)',
  },
  'Spa-Francorchamps': {
    officialName: 'Circuit de Spa-Francorchamps',
    lengthKm: 7.004,
    turns: 19,
    drsZones: 2,
    lapRecord: '1:46.286',
    recordHolder: 'Valtteri Bottas',
    recordYear: 2018,
    ambientTemp: 19,
    trackTemp: 27,
    grip: 'Variable Microclimates',
    wind: '11 km/h SW (Ardennes Forest)',
  },
  'Silverstone': {
    officialName: 'Silverstone Circuit',
    lengthKm: 5.891,
    turns: 18,
    drsZones: 2,
    lapRecord: '1:27.097',
    recordHolder: 'Max Verstappen',
    recordYear: 2020,
    ambientTemp: 21,
    trackTemp: 32,
    grip: 'High Lateral Load (Maggots & Becketts)',
    wind: '18 km/h W (Exposed Airfield)',
  },
  'Monte Carlo': {
    officialName: 'Circuit de Monaco',
    lengthKm: 3.337,
    turns: 19,
    drsZones: 1,
    lapRecord: '1:12.909',
    recordHolder: 'Lewis Hamilton',
    recordYear: 2021,
    ambientTemp: 25,
    trackTemp: 39,
    grip: 'Maximum Downforce / Street Barriers',
    wind: '8 km/h S (Harbor Breeze)',
  },
  'Las Vegas': {
    officialName: 'Las Vegas Strip Circuit',
    lengthKm: 6.201,
    turns: 17,
    drsZones: 2,
    lapRecord: '1:35.490',
    recordHolder: 'Oscar Piastri',
    recordYear: 2023,
    ambientTemp: 14,
    trackTemp: 18,
    grip: 'Cold Surface / Low Tire Wake',
    wind: '5 km/h E (Desert Night)',
  },
  'Phoenix Raceway': {
    officialName: 'Phoenix Raceway',
    lengthKm: 1.645,
    turns: 4,
    drsZones: 0,
    lapRecord: '25.688s (140.144 mph)',
    recordHolder: 'Ryan Blaney',
    recordYear: 2023,
    ambientTemp: 29,
    trackTemp: 44,
    grip: 'Low-Banked Asymmetrical Tri-Oval & Dogleg Apron',
    wind: '9 km/h S (Sonoran Desert Breeze)',
  },
  'Daytona International Speedway': {
    officialName: 'Daytona International Speedway',
    lengthKm: 4.023,
    turns: 4,
    drsZones: 0,
    lapRecord: '40.364s (210.364 mph)',
    recordHolder: 'Bill Elliott',
    recordYear: 1987,
    ambientTemp: 26,
    trackTemp: 39,
    grip: '31° High-Banked Superspeedway Draft Pack',
    wind: '16 km/h E (Atlantic Coast Wind)',
  },
};

export default function TrackDetailsModal({
  isOpen,
  onClose,
  circuitName,
  country,
  onSelectTrack,
}: TrackDetailsModalProps) {
  if (!isOpen) return null;

  const specs = CIRCUIT_SPECS[circuitName] || {
    officialName: circuitName,
    lengthKm: 4.8,
    turns: 16,
    drsZones: 2,
    lapRecord: '1:18.450',
    recordHolder: 'Max Verstappen',
    recordYear: 2023,
    ambientTemp: 24,
    trackTemp: 35,
    grip: 'Optimal Racing Surface',
    wind: '10 km/h',
  };

  const availableTracks = Object.keys(CIRCUIT_SPECS);

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[560px] my-auto max-h-[90vh] flex flex-col bg-[rgba(11,14,19,0.98)] border border-white/15 rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[var(--amber)] uppercase font-bold tracking-wider">
                Circuit Technical Dossier
              </div>
              <h2 className="text-xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-wide m-0">
                {specs.officialName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close track modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Length</div>
              <div className="text-lg font-mono font-black text-white">{specs.lengthKm} <span className="text-xs font-normal text-[var(--text-muted)]">km</span></div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Corners</div>
              <div className="text-lg font-mono font-black text-amber-400">{specs.turns} <span className="text-xs font-normal text-[var(--text-muted)]">turns</span></div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">DRS Zones</div>
              <div className="text-lg font-mono font-black text-emerald-400">{specs.drsZones}</div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Lap Record</div>
              <div className="text-sm font-mono font-black text-sky-400 mt-0.5">{specs.lapRecord}</div>
              <div className="text-[9px] font-mono text-[var(--text-muted)] truncate">{specs.recordHolder} ({specs.recordYear})</div>
            </div>
          </div>

          {/* Environmental Telemetry */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2.5 flex items-center gap-2">
              <Thermometer size={14} className="text-amber-400" />
              <span>Trackside Meteorology &amp; Surface Grip</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono text-[var(--text-muted)]">Track Surface</div>
                <div className="text-sm font-mono font-bold text-red-400 mt-0.5">{specs.trackTemp}°C</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono text-[var(--text-muted)]">Ambient Air</div>
                <div className="text-sm font-mono font-bold text-sky-400 mt-0.5">{specs.ambientTemp}°C</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono text-[var(--text-muted)]">Wind Vector</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5 truncate">{specs.wind}</div>
              </div>
            </div>
          </div>

          {/* Circuit Switcher */}
          {onSelectTrack && (
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2 flex items-center gap-2">
                <Layers size={14} className="text-amber-400" />
                <span>Switch Circuit Preview</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTracks.map((name) => {
                  const isActive = name === circuitName;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        onSelectTrack(name);
                        onClose();
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
          <span>Apexis Track Geometry Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
