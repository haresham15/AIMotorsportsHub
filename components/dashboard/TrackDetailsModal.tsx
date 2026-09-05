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
  'Sakhir': {
    officialName: 'Bahrain International Circuit',
    lengthKm: 5.412,
    turns: 15,
    drsZones: 3,
    lapRecord: '1:31.447',
    recordHolder: 'Pedro de la Rosa',
    recordYear: 2005,
    ambientTemp: 27,
    trackTemp: 31,
    grip: 'Abrasive Granite Surface / High Tire Degradation',
    wind: '12 km/h NE (Desert Crosswinds)',
  },
  'Suzuka': {
    officialName: 'Suzuka International Racing Course',
    lengthKm: 5.807,
    turns: 18,
    drsZones: 1,
    lapRecord: '1:30.983',
    recordHolder: 'Lewis Hamilton',
    recordYear: 2019,
    ambientTemp: 20,
    trackTemp: 29,
    grip: 'High Downforce Figure-8 / Esses Flow',
    wind: '10 km/h SE (Ise Bay Breeze)',
  },
  'Interlagos': {
    officialName: 'Autódromo José Carlos Pace',
    lengthKm: 4.309,
    turns: 15,
    drsZones: 2,
    lapRecord: '1:10.540',
    recordHolder: 'Valtteri Bottas',
    recordYear: 2018,
    ambientTemp: 23,
    trackTemp: 36,
    grip: 'Counter-Clockwise Undulating Bowl',
    wind: '14 km/h S (São Paulo Humidity)',
  },
  'Austin': {
    officialName: 'Circuit of the Americas',
    lengthKm: 5.513,
    turns: 20,
    drsZones: 2,
    lapRecord: '1:36.169',
    recordHolder: 'Charles Leclerc',
    recordYear: 2019,
    ambientTemp: 28,
    trackTemp: 41,
    grip: 'Blind Elevation Climb / Turn 1 Crest',
    wind: '8 km/h NW (Texas Plains)',
  },
  'Circuit de la Sarthe': {
    officialName: 'Circuit des 24 Heures du Mans',
    lengthKm: 13.626,
    turns: 38,
    drsZones: 0,
    lapRecord: '3:17.297',
    recordHolder: 'Mike Conway',
    recordYear: 2019,
    ambientTemp: 18,
    trackTemp: 24,
    grip: 'Hybrid Public Road Surface / High Top Speed Mulsanne',
    wind: '7 km/h W (Loire Valley Draft)',
  },
  'Talladega Superspeedway': {
    officialName: 'Talladega Superspeedway',
    lengthKm: 4.280,
    turns: 4,
    drsZones: 0,
    lapRecord: '44.998s (212.809 mph)',
    recordHolder: 'Bill Elliott',
    recordYear: 1987,
    ambientTemp: 25,
    trackTemp: 38,
    grip: '33° Steepest Banking in NASCAR / Pure Aerodynamic Draft',
    wind: '13 km/h SE (Alabama Valley Breeze)',
  },
  'Charlotte Motor Speedway': {
    officialName: 'Charlotte Motor Speedway',
    lengthKm: 2.414,
    turns: 4,
    drsZones: 0,
    lapRecord: '27.167s (198.771 mph)',
    recordHolder: 'Denny Hamlin',
    recordYear: 2013,
    ambientTemp: 22,
    trackTemp: 33,
    grip: '24° Quad-Oval Banking / Night Race Cooling Grip',
    wind: '8 km/h SW (Piedmont Gusts)',
  },
  'Bristol Motor Speedway': {
    officialName: 'Bristol Motor Speedway',
    lengthKm: 0.858,
    turns: 4,
    drsZones: 0,
    lapRecord: '14.573s (131.668 mph)',
    recordHolder: 'Chase Elliott',
    recordYear: 2019,
    ambientTemp: 21,
    trackTemp: 30,
    grip: '28° Concrete Colosseum High G-Load',
    wind: '5 km/h E (Appalachian Basin Calm)',
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

  const findSpecs = () => {
    if (CIRCUIT_SPECS[circuitName]) return CIRCUIT_SPECS[circuitName];
    const target = circuitName?.toLowerCase() || '';
    for (const [key, val] of Object.entries(CIRCUIT_SPECS)) {
      const k = key.toLowerCase();
      const off = val.officialName.toLowerCase();
      if (target.includes(k) || k.includes(target) || target.includes(off) || off.includes(target)) {
        return val;
      }
    }
    return {
      officialName: circuitName || 'Circuit Technical Dossier',
      lengthKm: 4.8,
      turns: 16,
      drsZones: 2,
      lapRecord: '1:18.450',
      recordHolder: 'Track Record',
      recordYear: 2023,
      ambientTemp: 24,
      trackTemp: 35,
      grip: 'Optimal Racing Surface',
      wind: '10 km/h',
    };
  };

  const specs = findSpecs();
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
                  const isActive = name === circuitName || Boolean(circuitName && (circuitName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(circuitName.toLowerCase())));
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
