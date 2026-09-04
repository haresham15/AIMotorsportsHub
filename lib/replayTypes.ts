// ========================================================================
// RACE REPLAY TYPE DEFINITIONS
// Mirrors the frame/driver/track data structures from f1-race-replay
// ========================================================================

/** A single driver's state in a given frame */
export interface DriverFrameState {
  x: number;
  y: number;
  position: number;
  lap: number;
  dist: number;       // cumulative race distance in metres
  relDist: number;    // 0–1 progress around current lap
  speed: number;      // km/h
  gear: number;       // 0–8
  tyre: string;       // compound code: 'SOFT','MEDIUM','HARD','INTER','WET'
  tyreLife: number;   // laps on current tyre set
  drs: number;        // >= 10 means DRS open
  throttle: number;   // 0–100
  brake: number;      // 0–100
  inPit: boolean;
  retired: boolean;
  finished?: boolean;
}

/** Safety car state within a frame */
export interface SafetyCarState {
  x: number;
  y: number;
  phase: 'deploying' | 'on_track' | 'returning';
  alpha: number;      // 0–1 for fade animation
}

/** Weather snapshot */
export interface WeatherState {
  trackTemp: number;
  airTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainState: 'DRY' | 'LIGHT' | 'RAINING';
}

/** A single animation frame — the atomic unit of replay data */
export interface RaceFrame {
  t: number;                                   // time in seconds from race start
  lap: number;                                 // leader's current lap
  drivers: Record<string, DriverFrameState>;   // keyed by driver code
  safetyCar?: SafetyCarState | null;
  weather?: WeatherState;
  trackStatus?: string;                        // '1'=green, '2'=yellow, '4'=SC, '5'=red, '6'=VSC
}

/** Track status period */
export interface TrackStatusPeriod {
  status: string;
  startTime: number;
  endTime: number | null;
}

/** Race control message */
export interface RaceControlMessage {
  time: number;
  category: string;
  message: string;
  flag: string;
  scope: string;
  sector: string;
  racingNumber: string;
}

/** DRS zone definition */
export interface DRSZone {
  startIdx: number;
  endIdx: number;
}

/** Track sector boundary */
export interface TrackSector {
  name: string;
  startIdx: number;
  endIdx: number;
}

/** 2D point */
export interface Point2D {
  x: number;
  y: number;
}

/** Complete track geometry definition */
export interface TrackGeometry {
  name: string;
  country: string;
  lengthKm: number;
  totalLaps: number;
  type: 'circuit' | 'oval' | 'street' | 'drag';
  /** Center/racing line coordinates */
  referenceLine: Point2D[];
  /** Inner track boundary */
  innerEdge: Point2D[];
  /** Outer track boundary */
  outerEdge: Point2D[];
  /** Pit lane path (optional) */
  pitLane?: Point2D[];
  /** DRS activation zones (F1/F2/F3 only) */
  drsZones?: DRSZone[];
  /** Sector boundaries */
  sectors?: TrackSector[];
  /** Index on referenceLine of start/finish line */
  startFinishIdx: number;
  /** Rotation in degrees to orient the track nicely */
  rotation?: number;
}

/** Driver info for roster display */
export interface DriverInfo {
  code: string;       // 3-letter abbreviation
  name: string;       // Full name
  number: number;     // Car number
  team: string;       // Team name
  color: string;      // Hex team color
}

/** Complete replay dataset — everything needed to render a race */
export interface ReplayData {
  frames: RaceFrame[];
  trackGeometry: TrackGeometry;
  drivers: DriverInfo[];
  driverColors: Record<string, string>;
  trackStatuses: TrackStatusPeriod[];
  raceControlMessages?: RaceControlMessage[];
  totalLaps: number;
  sessionInfo: {
    seriesId: string;
    seriesName: string;
    eventName: string;
    circuitName: string;
    country: string;
    year: number;
    round: number;
    sessionType: string;  // 'Race', 'Sprint', 'Qualifying'
  };
}

/** Playback state for the replay engine */
export interface PlaybackState {
  frameIndex: number;
  isPlaying: boolean;
  speed: number;
  selectedDrivers: string[];
  showLeaderboard: boolean;
  showWeather: boolean;
  showDriverLabels: boolean;
  showDrsZones: boolean;
}

/** Available playback speeds */
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8, 16, 32] as const;

/** Frame rate constant (matches f1-race-replay's FPS = 25) */
export const REPLAY_FPS = 25;

/** Track status code → display info mapping */
export const TRACK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  '1': { label: 'GREEN FLAG', color: '#22c55e' },
  '2': { label: 'YELLOW FLAG', color: '#eab308' },
  '4': { label: 'SAFETY CAR', color: '#f97316' },
  '5': { label: 'RED FLAG', color: '#ef4444' },
  '6': { label: 'VSC DEPLOYED', color: '#f59e0b' },
  '7': { label: 'VSC ENDING', color: '#f59e0b' },
};

/** Tyre compound display info */
export const TYRE_COMPOUNDS: Record<string, { label: string; color: string; abbr: string }> = {
  SOFT:   { label: 'Soft',          color: '#ef4444', abbr: 'S' },
  MEDIUM: { label: 'Medium',        color: '#eab308', abbr: 'M' },
  HARD:   { label: 'Hard',          color: '#f1f5f9', abbr: 'H' },
  INTER:  { label: 'Intermediate',  color: '#22c55e', abbr: 'I' },
  WET:    { label: 'Wet',           color: '#3b82f6', abbr: 'W' },
  // NASCAR / GT / other series
  SLICK:   { label: 'Slick',   color: '#94a3b8', abbr: 'K' },
  ALLWEATHER: { label: 'All Weather', color: '#8b5cf6', abbr: 'A' },
  STOCK:   { label: 'Stock',   color: '#d97706', abbr: 'T' },
};

/** Calculate gap to leader using fixed 200 km/h average speed per AGENTS.md */
export function calculateReplayGap(
  position: number,
  driverDist: number,
  driverLap: number,
  driverRelDist: number,
  leaderDist: number,
  leaderLap: number,
  leaderRelDist: number
): string {
  if (position === 1) return 'LEADER';

  const lapsBehind = leaderLap - driverLap - (driverRelDist > leaderRelDist ? 1 : 0);
  if (lapsBehind >= 1) {
    return `+${lapsBehind} LAP${lapsBehind > 1 ? 'S' : ''}`;
  }

  const distDelta = Math.max(0, leaderDist - driverDist);
  const avgSpeedMs = 200 / 3.6; // fixed average speed 200 km/h to prevent braking zone stutter
  const gapSeconds = distDelta / avgSpeedMs;
  return `+${gapSeconds.toFixed(1)}s`;
}

/** Convert a RaceFrame into unified RaceData[] for live standings sync */
export function frameToRaceData(
  frame: RaceFrame,
  replayData: ReplayData,
  series: string
): import('@/lib/types').RaceData[] {
  const sorted = Object.entries(frame.drivers)
    .sort(([, a], [, b]) => a.position - b.position);

  if (sorted.length === 0) return [];

  const leaderDist = sorted[0]?.[1]?.dist ?? 0;
  const leaderLap = sorted[0]?.[1]?.lap ?? 1;
  const leaderRelDist = sorted[0]?.[1]?.relDist ?? 0;

  return sorted.map(([code, d]) => {
    const driverInfo = replayData.drivers.find((dr) => dr.code === code);
    const gap = calculateReplayGap(
      d.position,
      d.dist,
      d.lap,
      d.relDist,
      leaderDist,
      leaderLap,
      leaderRelDist
    );

    return {
      driver_id: code,
      car_number: driverInfo?.number ? String(driverInfo.number) : undefined,
      position: d.position,
      gap_to_leader: d.inPit ? 'PIT' : d.retired ? 'OUT' : gap,
      last_lap: d.inPit ? 'PIT' : d.retired ? 'OUT' : d.finished ? 'FIN' : `${d.speed} km/h`,
      tire_compound: d.tyre || 'MEDIUM',
      team_name: driverInfo?.team,
      laps_completed: d.lap,
      pit_status: d.inPit ? 'PIT' : 'TRACK',
      drs_active: Boolean(d.drs && d.drs >= 10),
      team_color: replayData.driverColors[code] || driverInfo?.color || '#ffffff',
      drivers: {
        name: driverInfo?.name || code,
        series_id: series,
      },
    };
  });
}

