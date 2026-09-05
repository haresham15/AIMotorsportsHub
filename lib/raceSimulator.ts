// ========================================================================
// CLIENT-SIDE RACE SIMULATOR
// Generates realistic demo telemetry frames for any racing series.
// Used when no pre-computed data is available from the Python backend.
// ========================================================================

import type {
  RaceFrame,
  DriverFrameState,
  TrackGeometry,
  DriverInfo,
  ReplayData,
  TrackStatusPeriod,
  WeatherState,
  SafetyCarState,
  RaceControlMessage,
} from './replayTypes';

export interface ReplaySessionMeta {
  year?: number;
  round?: number;
  circuitName?: string;
  country?: string;
  eventName?: string;
  seriesName?: string;
  sessionType?: string;
}
import { REPLAY_FPS } from './replayTypes';
import {
  computeCumulativeDistances,
  positionAtDistance,
} from './trackData';
import { ensureTrackWithPitLane } from './pitLaneGenerator';

// ── Seeded pseudo-random for deterministic replays ─────────────────
class SeededRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0xffffffff;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

// ── Configuration per series type ────────────────────────────────────
interface SeriesConfig {
  baseSpeedFactor: number;    // multiplier on track-distance-per-second
  speedVariation: number;     // random speed variation between drivers
  lapTimeSeconds: number;     // approximate lap time
  pitStopDurationS: number;   // pit stop duration in seconds
  pitStopLaps: number[];      // laps at which pit stops typically occur (at full race distance)
  tyreCompounds: string[];    // available tyre compounds
  hasDRS: boolean;
  hasSafetyCar: boolean;
  driverCount: number;
  gridSpreadFactor: number;   // how spread out cars are at start (0-1)
  defaultLaps: number | null; // series-specific lap count override (null = use track.totalLaps)
  targetAvgSpeedKmh?: number; // target average speed in km/h for realistic physics
}

// Maximum frames to generate before downsampling FPS.
// ~75,000 frames ≈ 50 min at 25 FPS — keeps memory usage reasonable
// while allowing full race lengths for all series.
const MAX_FRAMES = 75_000;

const SERIES_CONFIGS: Record<string, SeriesConfig> = {
  f1: {
    baseSpeedFactor: 1.0,
    speedVariation: 0.025,
    lapTimeSeconds: 90,
    targetAvgSpeedKmh: 225,
    pitStopDurationS: 25,
    pitStopLaps: [15, 35],
    tyreCompounds: ['SOFT', 'MEDIUM', 'HARD'],
    hasDRS: true,
    hasSafetyCar: true,
    driverCount: 20,
    gridSpreadFactor: 0.02,
    defaultLaps: null, // use track.totalLaps (varies 50-78 by circuit)
  },
  f2: {
    baseSpeedFactor: 0.92,
    speedVariation: 0.03,
    lapTimeSeconds: 95,
    pitStopDurationS: 28,
    pitStopLaps: [18],
    tyreCompounds: ['SOFT', 'MEDIUM', 'HARD'],
    hasDRS: true,
    hasSafetyCar: true,
    driverCount: 22,
    gridSpreadFactor: 0.025,
    defaultLaps: null, // use track.totalLaps
  },
  f3: {
    baseSpeedFactor: 0.85,
    speedVariation: 0.035,
    lapTimeSeconds: 100,
    pitStopDurationS: 30,
    pitStopLaps: [],
    tyreCompounds: ['SOFT', 'MEDIUM'],
    hasDRS: true,
    hasSafetyCar: true,
    driverCount: 30,
    gridSpreadFactor: 0.03,
    defaultLaps: null, // use track.totalLaps
  },
  'formula-e': {
    baseSpeedFactor: 0.78,
    speedVariation: 0.02,
    lapTimeSeconds: 75,
    pitStopDurationS: 0,
    pitStopLaps: [],
    tyreCompounds: ['ALLWEATHER'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 22,
    gridSpreadFactor: 0.02,
    defaultLaps: 36, // standard E-Prix length
  },
  nascar: {
    baseSpeedFactor: 0.95,
    speedVariation: 0.015,
    lapTimeSeconds: 50,
    pitStopDurationS: 15,
    pitStopLaps: [40, 80, 120, 160],
    tyreCompounds: ['SLICK'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 40,
    gridSpreadFactor: 0.008,
    defaultLaps: 200, // typical Cup Series race
  },
  'nascar-cup': {
    baseSpeedFactor: 0.95,
    speedVariation: 0.015,
    lapTimeSeconds: 50,
    pitStopDurationS: 15,
    pitStopLaps: [40, 80, 120, 160],
    tyreCompounds: ['SLICK'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 40,
    gridSpreadFactor: 0.008,
    defaultLaps: 200, // typical Cup Series race
  },
  'nascar-xfinity': {
    baseSpeedFactor: 0.90,
    speedVariation: 0.018,
    lapTimeSeconds: 53,
    pitStopDurationS: 15,
    pitStopLaps: [30, 60, 90],
    tyreCompounds: ['SLICK'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 38,
    gridSpreadFactor: 0.009,
    defaultLaps: 150,
  },
  'nascar-trucks': {
    baseSpeedFactor: 0.85,
    speedVariation: 0.02,
    lapTimeSeconds: 56,
    pitStopDurationS: 16,
    pitStopLaps: [30, 60],
    tyreCompounds: ['SLICK'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 36,
    gridSpreadFactor: 0.01,
    defaultLaps: 100,
  },
  'gt-world-challenge': {
    baseSpeedFactor: 0.88,
    speedVariation: 0.03,
    lapTimeSeconds: 140,
    pitStopDurationS: 80,
    pitStopLaps: [8, 16],
    tyreCompounds: ['SOFT', 'MEDIUM', 'HARD'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 20,
    gridSpreadFactor: 0.02,
    defaultLaps: 24, // endurance format
  },
  'top-fuel': {
    baseSpeedFactor: 2.5,
    speedVariation: 0.04,
    lapTimeSeconds: 3.7, // calibrated to ~3.7s 1,000-ft NHRA pass
    pitStopDurationS: 0,
    pitStopLaps: [],
    tyreCompounds: ['STOCK'],
    hasDRS: false,
    hasSafetyCar: false,
    driverCount: 2,
    gridSpreadFactor: 0.0,
    defaultLaps: 1, // single 1,000-ft elimination pass
  },
  wec: {
    baseSpeedFactor: 0.90,
    speedVariation: 0.03,
    lapTimeSeconds: 125,
    targetAvgSpeedKmh: 215,
    pitStopDurationS: 45,
    pitStopLaps: [12, 24, 36],
    tyreCompounds: ['SOFT', 'MEDIUM', 'HARD', 'WET'],
    hasDRS: false,
    hasSafetyCar: true,
    driverCount: 16,
    gridSpreadFactor: 0.015,
    defaultLaps: 48,
  },
};

// ── Simulation Engine ────────────────────────────────────────────────

interface DriverSimState {
  code: string;
  dist: number;          // cumulative distance travelled (metres)
  lap: number;
  baseSpeed: number;     // base distance-per-second
  currentSpeed: number;  // actual speed
  tyre: string;
  tyreLife: number;
  inPit: boolean;
  pitPhase?: 'ENTRY' | 'STOP' | 'EXIT';
  pitProgress: number;   // distance along pit lane in world units
  stationaryTimer: number;
  stationaryDuration: number;
  pitTimer: number;
  nextPitLap: number;
  plannedPitLaps: number[];
  pitStopIndex: number;
  retired: boolean;
  finished: boolean;
  position: number;
  gear: number;
  drs: number;
  throttle: number;
  brake: number;
  // Specialized series telemetry:
  reactionTime?: number;
  elapsedTime?: number;
  chuteDeployed?: boolean;
  energyPct?: number;
  attackMode?: boolean;
  regenKw?: number;
  carClass?: 'HYPERCAR' | 'LMGT3';
  classPosition?: number;
  stintNumber?: number;
  stageNumber?: number;
  stageLapsToGo?: number;
  qualifyingPhase?: string;
}

// ── Track Velocity & Telemetry Physics Engine ──────────────────────────

interface TrackSpeedProfile {
  speeds: Float32Array;
  sampleDist: number;
  trackLength: number;
}

function computeTrackSpeedProfile(
  track: TrackGeometry,
  cumDists: number[],
  baseSpeedWorld: number,
  worldUnitsPerMetre: number
): TrackSpeedProfile {
  const trackLength = cumDists[cumDists.length - 1];
  const N = 360;
  const sampleDist = trackLength / N;
  const rawApexSpeeds = new Float32Array(N);

  const delta = Math.max(12, trackLength * 0.008);

  for (let i = 0; i < N; i++) {
    const s = (i / N) * trackLength;
    const pPrev = positionAtDistance(track.referenceLine, cumDists, (s - delta + trackLength) % trackLength);
    const pCurr = positionAtDistance(track.referenceLine, cumDists, s);
    const pNext = positionAtDistance(track.referenceLine, cumDists, (s + delta) % trackLength);

    const v1x = pCurr.x - pPrev.x, v1y = pCurr.y - pPrev.y;
    const v2x = pNext.x - pCurr.x, v2y = pNext.y - pCurr.y;

    const th1 = Math.atan2(v1y, v1x);
    const th2 = Math.atan2(v2y, v2x);
    let dTh = Math.abs(th2 - th1);
    if (dTh > Math.PI) dTh = 2 * Math.PI - dTh;

    const curvature = dTh / delta;
    const normalizedCurv = Math.min(1, curvature * 22);
    // Straight = 1.38 (~340 km/h), sharp corner = 0.32 (~80 km/h)
    const factor = 1.38 - 1.06 * Math.pow(normalizedCurv, 0.70);
    rawApexSpeeds[i] = baseSpeedWorld * factor;
  }

  // Braking and Acceleration limits in world units
  const aBrake = 46 * worldUnitsPerMetre; // ~4.7g braking capability
  const aAccel = 11 * worldUnitsPerMetre; // ~1.1g acceleration capability

  const speeds = new Float32Array(rawApexSpeeds);

  // Backward pass for braking zones
  for (let pass = 0; pass < 2; pass++) {
    for (let i = N - 1; i >= 0; i--) {
      const prev = (i - 1 + N) % N;
      const maxAllowed = Math.sqrt(speeds[i] * speeds[i] + 2 * aBrake * sampleDist);
      if (speeds[prev] > maxAllowed) {
        speeds[prev] = maxAllowed;
      }
    }
  }

  // Forward pass for acceleration zones
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      const maxAllowed = Math.sqrt(speeds[i] * speeds[i] + 2 * aAccel * sampleDist);
      if (speeds[next] > maxAllowed) {
        speeds[next] = maxAllowed;
      }
    }
  }

  return { speeds, sampleDist, trackLength };
}

function sampleSpeedProfile(profile: TrackSpeedProfile, dist: number): number {
  const normDist = ((dist % profile.trackLength) + profile.trackLength) % profile.trackLength;
  const idx = (normDist / profile.trackLength) * profile.speeds.length;
  const i0 = Math.floor(idx) % profile.speeds.length;
  const i1 = (i0 + 1) % profile.speeds.length;
  const t = idx - Math.floor(idx);
  return profile.speeds[i0] * (1 - t) + profile.speeds[i1] * t;
}

export function generateReplayData(
  seriesId: string,
  track: TrackGeometry,
  drivers: DriverInfo[],
  sessionType: string = 'Race',
  sessionMeta?: ReplaySessionMeta
): ReplayData {
  track = ensureTrackWithPitLane(track);
  const config = SERIES_CONFIGS[seriesId] || SERIES_CONFIGS.f1;
  const rng = new SeededRNG(seriesId.length * 1000 + track.referenceLine.length);

  // ── Guard: degenerate track data ────────────────────────────────
  if (!track.referenceLine || track.referenceLine.length < 2) {
    // Return a minimal empty replay so the UI can render an error state
    // instead of crashing on bad geometry.
    return {
      frames: [],
      trackGeometry: track,
      drivers: drivers.slice(0, config.driverCount),
      driverColors: {},
      trackStatuses: [],
      raceControlMessages: [],
      totalLaps: 0,
      sessionInfo: {
        seriesId,
        seriesName: sessionMeta?.seriesName || seriesId.toUpperCase(),
        eventName: sessionMeta?.eventName || track.name,
        circuitName: sessionMeta?.circuitName || track.name,
        country: sessionMeta?.country || track.country,
        year: sessionMeta?.year || new Date().getFullYear(),
        round: sessionMeta?.round || 1,
        sessionType: sessionMeta?.sessionType || sessionType,
      },
    };
  }

  const cumDists = computeCumulativeDistances(track.referenceLine);
  const trackLength = cumDists[cumDists.length - 1]; // total track perimeter in world units

  // Scale factor: world units per metre (approximate).
  // Guard against zero-length tracks to prevent Infinity/NaN propagation.
  const trackLengthMetres = Math.max(1, (track.lengthKm || 1) * 1000);
  const worldUnitsPerMetre = trackLength / trackLengthMetres;
  const lapDistWorld = trackLength;

  // Pit lane cumulative distances and geometry markers
  const pitCumDists = (track.pitLane && track.pitLane.length >= 4)
    ? computeCumulativeDistances(track.pitLane)
    : [];
  const pitLaneLength = pitCumDists.length > 0 ? pitCumDists[pitCumDists.length - 1] : 0;

  const sfIdx = track.startFinishIdx ?? 0;
  const refN = track.referenceLine.length;
  const halfSpan = Math.max(12, Math.min(45, Math.round(refN * 0.065)));
  const entryIdx = (sfIdx - halfSpan + refN) % refN;
  const exitIdx = (sfIdx + halfSpan) % refN;
  const entryTrackDist = cumDists[entryIdx];
  const exitTrackDist = cumDists[exitIdx];

  // Pit speed limiter in world units (80 km/h for F1/WEC, 75 km/h for NASCAR)
  const pitLimiterKmh = (seriesId === 'nascar' || seriesId?.startsWith('nascar-')) ? 75 : 80;
  const pitLimiterWorld = (pitLimiterKmh / 3.6) * worldUnitsPerMetre;

  // Dynamic lap time calculation based on track length and realistic series speeds
  const targetAvgSpeedKmh = config.targetAvgSpeedKmh || (track.lengthKm ? 220 : 200);
  const targetSpeedMps = targetAvgSpeedKmh / 3.6;
  const effectiveLapTimeSeconds = track.lengthKm && track.lengthKm > 0.5
    ? Math.max(15, Math.round(trackLengthMetres / targetSpeedMps))
    : config.lapTimeSeconds;

  // Base speed in world units per second
  const baseSpeedWorld = (lapDistWorld / effectiveLapTimeSeconds) * config.baseSpeedFactor;

  // Compute realistic track velocity & braking profile
  const speedProfile = computeTrackSpeedProfile(track, cumDists, baseSpeedWorld, worldUnitsPerMetre);

  // ── Dynamic lap count: use series config, then track data, then fallback ──
  let totalLaps = config.defaultLaps ?? track.totalLaps ?? 50;
  
  // Adjust lap count based on session type and circuit configuration
  const sTypeLower = sessionType.toLowerCase();
  if (track.type === 'drag' || seriesId === 'top-fuel') {
    totalLaps = 1;
  } else if (sTypeLower.includes('sprint')) {
    totalLaps = Math.max(12, Math.min(24, Math.ceil(totalLaps / 3)));
  } else if (sTypeLower.includes('qualifying') || sTypeLower.includes('hyperpole') || sTypeLower.includes('shootout')) {
    totalLaps = Math.max(12, Math.min(20, Math.ceil(totalLaps * 0.35)));
  } else if (sTypeLower.includes('practice')) {
    totalLaps = Math.max(15, Math.min(30, Math.ceil(totalLaps * 0.4)));
  }

  // ── Frame budget: downsample FPS for very long races to stay under
  // MAX_FRAMES, rather than truncating the number of laps.
  const rawFrameCount = totalLaps * effectiveLapTimeSeconds * REPLAY_FPS;
  const effectiveFPS = rawFrameCount > MAX_FRAMES
    ? Math.max(5, Math.floor(MAX_FRAMES / (totalLaps * effectiveLapTimeSeconds)))
    : REPLAY_FPS;
  const totalFrames = (track.type === 'drag' || seriesId === 'top-fuel')
    ? Math.ceil(6.5 * REPLAY_FPS)
    : Math.min(
        MAX_FRAMES,
        Math.ceil(totalLaps * effectiveLapTimeSeconds * effectiveFPS * 1.5)
      );
  const dt = 1 / effectiveFPS;

  // Initialize driver states
  const activeDrivers = drivers.slice(0, config.driverCount);
  const driverStates: DriverSimState[] = activeDrivers.map((driver, idx) => {
    // Bias speed by input order (standings position): P1 fastest, last slowest
    const driverCount = Math.max(1, activeDrivers.length - 1);
    const positionFactor = 1 - (idx / driverCount); // 1.0 for first, 0.0 for last
    const speedBias = config.speedVariation * 2 * positionFactor - config.speedVariation;
    const speedMult = 1 + speedBias + rng.range(-config.speedVariation * 0.15, config.speedVariation * 0.15);
    const startOffset = idx * config.gridSpreadFactor * lapDistWorld;
    const tyre = config.tyreCompounds[rng.int(0, config.tyreCompounds.length - 1)];

    // Determine planned pit stop laps.
    // Scale all pit stop laps to actual totalLaps with driver-specific variance (+/- 1-2 laps)
    const refDistance = Math.max(track.totalLaps || totalLaps, ...config.pitStopLaps) + 10;
    const plannedPitLaps: number[] = [];
    if (config.pitStopLaps.length > 0 && totalLaps > 5) {
      for (const baseLap of config.pitStopLaps) {
        const offset = rng.int(-2, 2);
        const scaledLap = Math.min(Math.round((baseLap + offset) * totalLaps / refDistance), totalLaps - 1);
        if (scaledLap >= 2 && (plannedPitLaps.length === 0 || scaledLap > plannedPitLaps[plannedPitLaps.length - 1] + 3)) {
          plannedPitLaps.push(scaledLap);
        }
      }
    }
    const nextPitLap = plannedPitLaps.length > 0 ? plannedPitLaps[0] : Infinity;

    const initialTrackDist = ((-startOffset % lapDistWorld) + lapDistWorld) % lapDistWorld;
    const initialSpeed = sampleSpeedProfile(speedProfile, initialTrackDist) * speedMult;
    const initialSpeedKmh = (initialSpeed / worldUnitsPerMetre) * 3.6;
    let initialGear = 1;
    if (seriesId === 'nascar' || seriesId?.startsWith('nascar-')) {
      if (initialSpeedKmh < 80) initialGear = 1;
      else if (initialSpeedKmh < 135) initialGear = 2;
      else if (initialSpeedKmh < 195) initialGear = 3;
      else if (initialSpeedKmh < 255) initialGear = 4;
      else initialGear = 5;
    } else if (seriesId === 'formula-e' || seriesId === 'top-fuel' || track.type === 'drag') {
      initialGear = 1;
    } else {
      if (initialSpeedKmh < 85) initialGear = 1;
      else if (initialSpeedKmh < 125) initialGear = 2;
      else if (initialSpeedKmh < 165) initialGear = 3;
      else if (initialSpeedKmh < 205) initialGear = 4;
      else if (initialSpeedKmh < 245) initialGear = 5;
      else if (initialSpeedKmh < 280) initialGear = 6;
      else if (initialSpeedKmh < 315) initialGear = 7;
      else initialGear = 8;
    }

    const isTopFuel = seriesId === 'top-fuel' || track.type === 'drag';
    const isWec = seriesId === 'wec';
    const isFormulaE = seriesId === 'formula-e';
    const isNascar = seriesId === 'nascar' || seriesId?.startsWith('nascar-');

    // Top Fuel: staged on the start line with realistic reaction time delay (~0.035 to 0.048s)
    const rt = isTopFuel ? Math.round((0.036 + (idx * 0.009) + rng.range(-0.001, 0.003)) * 1000) / 1000 : undefined;
    const startDist = isTopFuel ? 0 : -startOffset;
    const carSpeed = isTopFuel ? 0 : initialSpeed;
    const carThrottle = isTopFuel ? 0 : 98;
    const carBrake = isTopFuel ? 100 : 0;
    const carClass: 'HYPERCAR' | 'LMGT3' | undefined = isWec
      ? (idx < Math.ceil(activeDrivers.length / 2) ? 'HYPERCAR' : 'LMGT3')
      : undefined;

    const s1End = isNascar ? Math.max(1, Math.round(totalLaps * 0.3)) : undefined;

    return {
      code: driver.code,
      dist: startDist,  // negative = behind start line (0 for drag staging)
      lap: 1,
      baseSpeed: baseSpeedWorld * speedMult,
      currentSpeed: carSpeed,
      tyre,
      tyreLife: 0,
      inPit: false,
      pitPhase: undefined,
      pitProgress: 0,
      stationaryTimer: 0,
      stationaryDuration: 0,
      pitTimer: 0,
      nextPitLap,
      plannedPitLaps,
      pitStopIndex: 0,
      retired: false,
      finished: false,
      position: idx + 1,
      gear: initialGear,
      drs: 0,
      throttle: carThrottle,
      brake: carBrake,
      reactionTime: rt,
      elapsedTime: undefined,
      chuteDeployed: false,
      energyPct: isFormulaE ? 100.0 : undefined,
      attackMode: false,
      regenKw: 0,
      carClass,
      classPosition: isWec ? (idx % Math.ceil(activeDrivers.length / 2)) + 1 : undefined,
      stintNumber: isWec ? 1 : undefined,
      stageNumber: isNascar ? 1 : undefined,
      stageLapsToGo: isNascar ? s1End : undefined,
      qualifyingPhase: (sTypeLower.includes('qualifying') || sTypeLower.includes('shootout')) ? 'Q1' : undefined,
    };
  });

  // Generate safety car deployment (random lap if applicable for races)
  let scDeployLap = Infinity;
  let scDuration = 0;
  if (config.hasSafetyCar && !sTypeLower.includes('qualifying') && !sTypeLower.includes('practice') && totalLaps > 5 && rng.next() > 0.4) {
    scDeployLap = rng.int(3, Math.floor(totalLaps * 0.6));
    scDuration = rng.range(2, 4) * config.lapTimeSeconds;
  }

  // Weather
  const baseWeather: WeatherState = {
    trackTemp: rng.range(28, 48),
    airTemp: rng.range(20, 35),
    humidity: rng.range(30, 80),
    windSpeed: rng.range(2, 25),
    windDirection: rng.range(0, 360),
    rainState: 'DRY',
  };

  const frames: RaceFrame[] = [];
  const trackStatuses: TrackStatusPeriod[] = [];
  const initialSessionMessage = (() => {
    if (track.type === 'drag' || seriesId === 'top-fuel') {
      return 'TOP FUEL ELIMINATIONS - STAGING BEAMS ACTIVE / GREEN LIGHT';
    }
    if (sTypeLower.includes('sprint')) {
      return 'SPRINT RACE - FORMATION LAP COMPLETE / GREEN FLAG';
    }
    if (sTypeLower.includes('qualifying') || sTypeLower.includes('hyperpole') || sTypeLower.includes('shootout')) {
      return `${sessionType.toUpperCase()} - PIT EXIT OPEN / GREEN FLAG`;
    }
    return 'GREEN FLAG - SESSION STARTED';
  })();

  const raceControlMessages: RaceControlMessage[] = [
    {
      time: 0,
      category: 'Flag',
      message: initialSessionMessage,
      flag: 'GREEN',
      scope: 'Track',
      sector: 'All',
      racingNumber: '',
    },
    {
      time: Math.min(120, Math.round(effectiveLapTimeSeconds * 1.5)),
      category: 'Drs',
      message: 'DRS ENABLED IN DESIGNATED ZONES',
      flag: 'CLEAR',
      scope: 'Track',
      sector: 'All',
      racingNumber: '',
    },
  ];
  let scActive = false;
  let scStartTime = -1;
  let scEndTime = -1;

  // ── Frame generation loop ───────────────────────────────────────
  let allFinished = false;
  for (let fi = 0; fi < totalFrames; fi++) {
    // Early termination: stop generating frames once every driver has finished
    if (allFinished) break;

    const t = fi * dt;

    // Determine if safety car is active
    const leaderLap = Math.max(...driverStates.filter(d => !d.retired).map(d => d.lap));

    if (leaderLap >= scDeployLap && !scActive && scStartTime < 0) {
      scActive = true;
      scStartTime = t;
      scEndTime = t + scDuration;
      trackStatuses.push({
        status: '4',
        startTime: t,
        endTime: t + scDuration,
      });

      // Designate an incident driver causing the safety car (only if more than 2 drivers on track)
      if (driverStates.length > 2) {
        const incidentDriver = driverStates[driverStates.length - 1];
        if (incidentDriver && !incidentDriver.retired) {
          incidentDriver.retired = true;
          const driverInfo = activeDrivers.find(d => d.code === incidentDriver.code);
          raceControlMessages.push({
            time: Math.round(t),
            category: 'CarEvent',
            message: `INCIDENT: CAR ${driverInfo?.number ?? ''} (${incidentDriver.code}) STOPPED ON TRACK`,
            flag: 'YELLOW',
            scope: 'Sector',
            sector: '2',
            racingNumber: String(driverInfo?.number ?? ''),
          });
        }
      }

      raceControlMessages.push({
        time: Math.round(t + 2),
        category: 'SafetyCar',
        message: 'SAFETY CAR DEPLOYED - INCIDENT IN SECTOR 2',
        flag: 'SAFETY CAR',
        scope: 'Track',
        sector: 'All',
        racingNumber: '',
      });
    }

    if (scActive && t >= scEndTime) {
      scActive = false;
      raceControlMessages.push({
        time: Math.round(t),
        category: 'SafetyCar',
        message: 'SAFETY CAR IN THIS LAP - TRACK CLEAR',
        flag: 'CLEAR',
        scope: 'Track',
        sector: 'All',
        racingNumber: '',
      });
    }

    // Update each driver
    for (const ds of driverStates) {
      if (ds.retired || ds.finished) continue;

      // Track distance
      const trackDist = ((ds.dist % lapDistWorld) + lapDistWorld) % lapDistWorld;

      // Pit stop logic
      if (ds.inPit) {
        if (pitLaneLength > 0) {
          const boxStopTarget = pitLaneLength * 0.5;

          if (ds.pitPhase === 'ENTRY') {
            const distToBox = boxStopTarget - ds.pitProgress;

            if (distToBox <= Math.max(1.5 * worldUnitsPerMetre, ds.currentSpeed * dt * 1.2)) {
              // Arrived at team pit box
              ds.pitProgress = boxStopTarget;
              ds.pitPhase = 'STOP';
              ds.currentSpeed = 0;
              ds.gear = 0; // Neutral
              ds.throttle = 0;
              ds.brake = 100;
              ds.drs = 0;
            } else if (distToBox < 18 * worldUnitsPerMetre) {
              // Braking into pit box
              const decelRate = 35 * worldUnitsPerMetre;
              ds.currentSpeed = Math.max(2 * worldUnitsPerMetre, ds.currentSpeed - decelRate * dt);
              ds.throttle = 0;
              ds.brake = 85;
              ds.gear = 1;
              ds.drs = 0;
              ds.pitProgress += ds.currentSpeed * dt;
            } else {
              // Pit lane limiter cruise
              const speedDiff = pitLimiterWorld - ds.currentSpeed;
              const maxRate = (speedDiff < 0 ? 45 : 15) * worldUnitsPerMetre;
              ds.currentSpeed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), maxRate * dt);
              ds.throttle = ds.currentSpeed < pitLimiterWorld ? 35 : 15;
              ds.brake = speedDiff < -5 * worldUnitsPerMetre ? 50 : 0;
              ds.gear = 2;
              ds.drs = 0;
              ds.pitProgress += ds.currentSpeed * dt;
            }
          } else if (ds.pitPhase === 'STOP') {
            // Stationary in pit box
            ds.currentSpeed = 0;
            ds.gear = 0; // Neutral
            ds.throttle = 0;
            ds.brake = 100;
            ds.drs = 0;
            ds.stationaryTimer -= dt;

            if (ds.stationaryTimer <= 0) {
              // Fresh tyres fitted, exit pit box
              ds.tyreLife = 0;
              const compounds = config.tyreCompounds.length > 0 ? config.tyreCompounds : ['MEDIUM'];
              ds.tyre = compounds[rng.int(0, compounds.length - 1)];
              ds.pitStopIndex++;
              ds.nextPitLap = ds.pitStopIndex < ds.plannedPitLaps.length
                ? ds.plannedPitLaps[ds.pitStopIndex]
                : Infinity;
              ds.lap++; // Crossing start-finish in pit lane completes the lap
              if (ds.lap > totalLaps) {
                ds.lap = totalLaps;
                ds.finished = true;
              }
              ds.pitPhase = 'EXIT';
              ds.gear = 1;
              ds.throttle = 80;
              ds.brake = 0;

              const driverInfo = activeDrivers.find(d => d.code === ds.code);
              raceControlMessages.push({
                time: Math.round(t),
                category: 'CarEvent',
                message: `CAR ${driverInfo?.number ?? ''} (${ds.code}) PIT STOP COMPLETED (${ds.stationaryDuration.toFixed(1)}s) - ${ds.tyre}`,
                flag: 'CLEAR',
                scope: 'Track',
                sector: 'Pit',
                racingNumber: String(driverInfo?.number ?? ''),
              });
            }
          } else if (ds.pitPhase === 'EXIT') {
            if (ds.pitProgress >= pitLaneLength) {
              // Blended back onto main circuit
              ds.inPit = false;
              ds.pitPhase = undefined;
              ds.dist = (ds.lap - 1) * lapDistWorld + exitTrackDist;
              ds.throttle = 100;
              ds.brake = 0;
              ds.gear = 3;

              const driverInfo = activeDrivers.find(d => d.code === ds.code);
              raceControlMessages.push({
                time: Math.round(t),
                category: 'CarEvent',
                message: `CAR ${driverInfo?.number ?? ''} (${ds.code}) REJOINED TRACK FROM PIT EXIT`,
                flag: 'CLEAR',
                scope: 'Track',
                sector: 'Pit',
                racingNumber: String(driverInfo?.number ?? ''),
              });
            } else {
              // Accelerating down pit exit up to limiter
              const speedDiff = pitLimiterWorld - ds.currentSpeed;
              const maxRate = 18 * worldUnitsPerMetre;
              ds.currentSpeed = Math.min(pitLimiterWorld, ds.currentSpeed + maxRate * dt);
              ds.gear = ds.currentSpeed < pitLimiterWorld * 0.5 ? 1 : 2;
              ds.throttle = ds.currentSpeed < pitLimiterWorld * 0.95 ? 75 : 30;
              ds.brake = 0;
              ds.drs = 0;
              ds.pitProgress += ds.currentSpeed * dt;
            }
          }

          // Maintain distance along circuit during pit stop
          const entryToExitTrackDelta = ((exitTrackDist - entryTrackDist) % lapDistWorld + lapDistWorld) % lapDistWorld;
          const pitFraction = Math.max(0, Math.min(1, ds.pitProgress / pitLaneLength));
          const simTrackDist = (entryTrackDist + pitFraction * entryToExitTrackDelta) % lapDistWorld;
          ds.dist = (ds.lap - 1) * lapDistWorld + simTrackDist;
        } else {
          // Fallback if no pit lane geometry
          ds.stationaryTimer -= dt;
          if (ds.stationaryTimer <= 0) {
            ds.inPit = false;
            ds.tyreLife = 0;
            const compounds = config.tyreCompounds.length > 0 ? config.tyreCompounds : ['MEDIUM'];
            ds.tyre = compounds[rng.int(0, compounds.length - 1)];
            ds.pitStopIndex++;
            ds.nextPitLap = ds.pitStopIndex < ds.plannedPitLaps.length
              ? ds.plannedPitLaps[ds.pitStopIndex]
              : Infinity;
          }
          ds.currentSpeed = 0;
          ds.gear = 0;
          ds.throttle = 0;
          ds.brake = 100;
          ds.drs = 0;
        }
        continue;
      }

      // Check if driver should enter pit this lap
      if (ds.lap >= ds.nextPitLap && ds.dist > 0 && !ds.retired && !ds.finished) {
        if (pitLaneLength > 0) {
          const distToEntry = ((entryTrackDist - trackDist) % lapDistWorld + lapDistWorld) % lapDistWorld;
          const entryWindow = Math.max(25 * worldUnitsPerMetre, ds.currentSpeed * dt * 1.5);
          if (distToEntry < entryWindow || distToEntry > lapDistWorld - 10 * worldUnitsPerMetre) {
            ds.inPit = true;
            ds.pitPhase = 'ENTRY';
            ds.pitProgress = 0;
            ds.currentSpeed = Math.min(ds.currentSpeed, pitLimiterWorld);
            ds.gear = 2;
            ds.throttle = 30;
            ds.brake = 0;
            ds.stationaryDuration = seriesId === 'f1' ? rng.range(2.2, 3.2)
              : (seriesId === 'f2' || seriesId === 'f3') ? rng.range(5.0, 7.0)
              : (seriesId === 'nascar' || seriesId?.startsWith('nascar-')) ? rng.range(9.5, 12.5)
              : seriesId === 'wec' ? rng.range(12.0, 18.0)
              : seriesId === 'gt-world-challenge' ? rng.range(25.0, 35.0)
              : 3.5;
            ds.stationaryTimer = ds.stationaryDuration;

            const driverInfo = activeDrivers.find(d => d.code === ds.code);
            raceControlMessages.push({
              time: Math.round(t),
              category: 'CarEvent',
              message: `CAR ${driverInfo?.number ?? ''} (${ds.code}) ENTERED PIT LANE`,
              flag: 'CLEAR',
              scope: 'Track',
              sector: 'Pit',
              racingNumber: String(driverInfo?.number ?? ''),
            });
            continue;
          }
        } else {
          // Fallback trigger without pitLane
          const lapProgress = (ds.dist % lapDistWorld) / lapDistWorld;
          if (lapProgress > 0.85 && lapProgress < 0.95) {
            ds.inPit = true;
            ds.stationaryDuration = config.pitStopDurationS * rng.range(0.9, 1.1);
            ds.stationaryTimer = ds.stationaryDuration;
            ds.currentSpeed = 0;
            ds.gear = 0;
            ds.throttle = 0;
            ds.brake = 100;
            ds.drs = 0;
            continue;
          }
        }
      }

      // Speed calculation from physics profile
      const driverPace = ds.baseSpeed / baseSpeedWorld;
      let targetSpeed = sampleSpeedProfile(speedProfile, trackDist) * driverPace;

      // SC slows everyone down
      if (scActive) {
        targetSpeed = Math.min(targetSpeed, baseSpeedWorld * 0.6);
      }

      // Tyre degradation effect (clamped to prevent negative/zero speed)
      const degradation = Math.max(0.85, 1 - (ds.tyreLife * 0.002));
      targetSpeed *= degradation;

      // Random micro-variation per frame (simulates driver throttle control)
      targetSpeed *= rng.range(0.99, 1.01);

      // For drag racing (Top Fuel): NHRA 1,000-ft pass + parachute deployment in shutdown area
      if (seriesId === 'top-fuel' || track.type === 'drag') {
        const rt = ds.reactionTime ?? 0.038;
        if (t < rt) {
          // Staging lights active - stationary on the start line
          ds.currentSpeed = 0;
          ds.throttle = 0;
          ds.brake = 100;
          ds.gear = 1;
          ds.drs = 0;
          ds.chuteDeployed = false;
        } else if (!ds.finished) {
          const passTime = t - rt;
          // NHRA 1,000-ft acceleration: reaches ~535 km/h (332+ mph) in ~3.68 - 3.75s
          const progressFactor = Math.min(1.0, passTime / 3.70);
          const trapSpeedKmh = 535 * driverPace;
          const currentSpeedKmh = Math.min(trapSpeedKmh, 30 + Math.pow(progressFactor, 1.05) * (trapSpeedKmh - 30));
          ds.currentSpeed = (currentSpeedKmh / 3.6) * worldUnitsPerMetre;
          ds.dist += ds.currentSpeed * dt;
          ds.throttle = 100;
          ds.brake = 0;
          ds.gear = 1; // Direct drive centrifugal clutch
          ds.drs = 0;
          ds.chuteDeployed = false;

          // Check for 1,000-ft (304.8m) finish beam
          if (ds.dist >= lapDistWorld || passTime >= 3.70) {
            ds.finished = true;
            ds.elapsedTime = Math.round(passTime * 1000) / 1000;
            ds.chuteDeployed = true;
          }
        } else {
          // Shutdown area: Dual parachutes deployed past 1,000 ft, heavy deceleration
          ds.chuteDeployed = true;
          ds.throttle = 0;
          ds.brake = 95;
          ds.gear = 1;
          ds.drs = 0;
          const decelKmh = 145 * dt;
          const currentSpeedKmh = Math.max(15, (ds.currentSpeed / worldUnitsPerMetre) * 3.6 - decelKmh);
          ds.currentSpeed = (currentSpeedKmh / 3.6) * worldUnitsPerMetre;
          ds.dist += ds.currentSpeed * dt;
        }
      } else {
        // Smooth acceleration / deceleration towards target speed
        const speedDiff = targetSpeed - ds.currentSpeed;
        const maxRate = (speedDiff < 0 ? 46 : 11) * worldUnitsPerMetre;
        ds.currentSpeed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), maxRate * dt);
        ds.currentSpeed = Number.isFinite(ds.currentSpeed) ? ds.currentSpeed : targetSpeed;

        ds.dist += ds.currentSpeed * dt;

        // Update lap count
        const newLap = Math.floor(ds.dist / lapDistWorld) + 1;
        if (newLap > ds.lap) {
          ds.tyreLife++;
          ds.lap = newLap;
        }

        // Check if race is finished
        if (ds.lap > totalLaps) {
          ds.lap = totalLaps;
          ds.finished = true; // Finished
        }

        // Simulated telemetry values
        const speedKmh = (ds.currentSpeed / worldUnitsPerMetre) * 3.6;
        const lookaheadDist = Math.max(25, lapDistWorld * 0.015);
        const speedAheadWorld = sampleSpeedProfile(speedProfile, trackDist + lookaheadDist) * driverPace;
        const speedAheadKmh = (speedAheadWorld / worldUnitsPerMetre) * 3.6;
        const deltaAhead = speedAheadKmh - speedKmh;

        // Dynamic Gear shifting
        if (seriesId === 'nascar' || seriesId?.startsWith('nascar-')) {
          if (speedKmh < 8) ds.gear = ds.throttle > 10 ? 1 : 0;
          else if (speedKmh < 80) ds.gear = 1;
          else if (speedKmh < 135) ds.gear = 2;
          else if (speedKmh < 195) ds.gear = 3;
          else if (speedKmh < 255) ds.gear = 4;
          else ds.gear = 5;
        } else if (seriesId === 'formula-e') {
          ds.gear = 1;
        } else {
          // Open-Wheel (F1/F2/F3) & Sports Cars / WEC: 8-speed / 7-speed
          if (speedKmh < 8) ds.gear = ds.throttle > 10 ? 1 : 0;
          else if (speedKmh < 85) ds.gear = 1;
          else if (speedKmh < 125) ds.gear = 2;
          else if (speedKmh < 165) ds.gear = 3;
          else if (speedKmh < 205) ds.gear = 4;
          else if (speedKmh < 245) ds.gear = 5;
          else if (speedKmh < 280) ds.gear = 6;
          else if (speedKmh < 315) ds.gear = 7;
          else ds.gear = 8;
        }

        // Dynamic Throttle & Brake Pedals
        if (deltaAhead < -14) {
          // Heavy braking zone
          ds.throttle = 0;
          ds.brake = Math.min(100, Math.max(70, Math.round(Math.abs(deltaAhead) * 2.8)));
          ds.drs = 0;
        } else if (deltaAhead < -4) {
          // Trail braking turning into apex
          ds.throttle = 0;
          ds.brake = Math.min(65, Math.max(15, Math.round(Math.abs(deltaAhead) * 2.2)));
          ds.drs = 0;
        } else if (deltaAhead < 4 && speedKmh < 165) {
          // Corner apex: partial throttle balancing car
          ds.brake = 0;
          ds.throttle = Math.min(55, Math.max(30, Math.round(35 + (speedKmh / 165) * 15)));
          ds.drs = 0;
        } else {
          // Accelerating on exit or full speed down straight
          ds.brake = 0;
          if (speedKmh > 265 || deltaAhead >= 0) {
            ds.throttle = Math.round(rng.range(96, 100));
          } else {
            ds.throttle = Math.min(95, Math.round(55 + (speedKmh / 265) * 40));
          }

          // DRS simulation on high-speed straights
          if (config.hasDRS && !scActive && ds.gear >= 7 && ds.throttle >= 95) {
            ds.drs = 12;
          } else {
            ds.drs = 0;
          }
        }

        // Formula E energy management & Attack Mode
        if (seriesId === 'formula-e') {
          ds.gear = 1;
          ds.attackMode = (ds.lap >= 10 && ds.lap <= 14) || (ds.lap >= 22 && ds.lap <= 26);
          if (ds.energyPct !== undefined) {
            if (ds.throttle > 50) {
              const drainRate = ds.attackMode ? 0.040 : 0.028;
              ds.energyPct = Math.max(1.5, ds.energyPct - dt * drainRate * (ds.throttle / 100));
              ds.regenKw = 0;
            } else if (ds.brake > 10) {
              const regenRate = 0.015;
              ds.energyPct = Math.min(100, ds.energyPct + dt * regenRate * (ds.brake / 100));
              ds.regenKw = Math.round((ds.brake / 100) * 250);
            } else {
              ds.regenKw = 0;
            }
          }
        }

        // NASCAR stage tracking
        if (seriesId === 'nascar' || seriesId?.startsWith('nascar-')) {
          const s1End = Math.max(1, Math.round(totalLaps * 0.3));
          const s2End = Math.max(s1End + 1, Math.round(totalLaps * 0.6));
          if (ds.lap <= s1End) {
            ds.stageNumber = 1;
            ds.stageLapsToGo = s1End - ds.lap + 1;
          } else if (ds.lap <= s2End) {
            ds.stageNumber = 2;
            ds.stageLapsToGo = s2End - ds.lap + 1;
          } else {
            ds.stageNumber = 3;
            ds.stageLapsToGo = totalLaps - ds.lap + 1;
          }
        }

        // WEC stint tracker
        if (seriesId === 'wec') {
          ds.stintNumber = 1 + ds.pitStopIndex;
        }

        // Qualifying shootout knockout phase
        if (sTypeLower.includes('qualifying') || sTypeLower.includes('shootout')) {
          const qProg = fi / totalFrames;
          ds.qualifyingPhase = qProg < 0.42 ? 'Q1' : qProg < 0.76 ? 'Q2' : 'Q3';
        }
      }
    }

    // Sort by distance to determine positions (or reaction + ET for Top Fuel)
    const activeDriversSorted = [...driverStates]
      .filter(d => !d.retired)
      .sort((a, b) => {
        if (seriesId === 'top-fuel' || track.type === 'drag') {
          if (a.finished && b.finished) {
            const aTotal = (a.reactionTime ?? 0) + (a.elapsedTime ?? 999);
            const bTotal = (b.reactionTime ?? 0) + (b.elapsedTime ?? 999);
            return aTotal - bTotal;
          }
        }
        return b.dist - a.dist;
      });

    activeDriversSorted.forEach((ds, idx) => {
      ds.position = idx + 1;
    });

    // Multiclass position ranking for WEC (Hypercar vs LMGT3)
    if (seriesId === 'wec') {
      let hypRank = 1;
      let gtRank = 1;
      activeDriversSorted.forEach(ds => {
        if (ds.carClass === 'HYPERCAR') {
          ds.classPosition = hypRank++;
        } else {
          ds.classPosition = gtRank++;
        }
      });
    }

    // Check if every driver has finished or retired
    allFinished = driverStates.every(ds => ds.retired || ds.finished);

    // Build frame
    const driversRecord: Record<string, DriverFrameState> = {};

    for (const ds of driverStates) {
      const trackDist = ((ds.dist % lapDistWorld) + lapDistWorld) % lapDistWorld;
      let pos: { x: number; y: number };

      if (ds.inPit && pitCumDists.length > 0 && track.pitLane && track.pitLane.length >= 2) {
        // Driver is navigating the pit lane (entry, box stop, or exit)
        pos = positionAtDistance(track.pitLane, pitCumDists, Math.min(pitLaneLength, Math.max(0, ds.pitProgress)));
      } else {
        pos = positionAtDistance(track.referenceLine, cumDists, trackDist);
        // For drag strip, offset parallel lanes so cars run side-by-side
        if (track.type === 'drag') {
          const driverIdx = activeDrivers.findIndex(d => d.code === ds.code);
          const laneOffset = driverIdx === 0 ? -10 : 10;
          pos = { x: pos.x, y: pos.y + laneOffset };
        }
      }

      // Calculate speed in km/h (approximate)
      const speedKmh = (ds.currentSpeed / worldUnitsPerMetre) * 3.6;
      const safeScale = (worldUnitsPerMetre > 0 && Number.isFinite(worldUnitsPerMetre)) ? worldUnitsPerMetre : 1;

      driversRecord[ds.code] = {
        x: pos.x,
        y: pos.y,
        position: ds.position,
        lap: Math.max(1, Math.min(ds.lap, totalLaps)),
        dist: Math.round(ds.dist / safeScale),
        relDist: (trackDist / lapDistWorld),
        speed: Math.round(speedKmh),
        gear: ds.gear,
        tyre: ds.tyre,
        tyreLife: ds.tyreLife,
        drs: ds.drs,
        throttle: ds.throttle,
        brake: ds.brake,
        inPit: ds.inPit,
        pitPhase: ds.pitPhase,
        pitStopDuration: ds.stationaryDuration,
        retired: ds.retired,
        finished: ds.finished,
        reactionTime: ds.reactionTime,
        elapsedTime: ds.elapsedTime,
        chuteDeployed: ds.chuteDeployed,
        energyPct: ds.energyPct !== undefined ? Math.round(ds.energyPct * 10) / 10 : undefined,
        attackMode: ds.attackMode,
        regenKw: ds.regenKw,
        carClass: ds.carClass,
        classPosition: ds.classPosition,
        stintNumber: ds.stintNumber,
        stageNumber: ds.stageNumber,
        stageLapsToGo: ds.stageLapsToGo,
        qualifyingPhase: ds.qualifyingPhase,
      };
    }

    // Safety car position
    let safetyCar: SafetyCarState | null = null;
    if (scActive || (t >= scEndTime && t < scEndTime + 3)) {
      const leader = activeDriversSorted[0];
      if (leader) {
        const scOffset = 150 * worldUnitsPerMetre;
        const scDist = ((leader.dist + scOffset) % lapDistWorld + lapDistWorld) % lapDistWorld;
        const scPos = positionAtDistance(track.referenceLine, cumDists, scDist);

        let phase: 'deploying' | 'on_track' | 'returning' = 'on_track';
        let alpha = 1.0;

        if (t - scStartTime < 3) {
          phase = 'deploying';
          alpha = (t - scStartTime) / 3;
        } else if (t >= scEndTime) {
          phase = 'returning';
          alpha = Math.max(0, 1 - (t - scEndTime) / 3);
        }

        safetyCar = { x: scPos.x, y: scPos.y, phase, alpha };
      }
    }

    // Weather with slight variation
    const weather: WeatherState = {
      ...baseWeather,
      trackTemp: baseWeather.trackTemp + rng.range(-0.5, 0.5),
      airTemp: baseWeather.airTemp + rng.range(-0.2, 0.2),
    };

    frames.push({
      t: Math.round(t * 1000) / 1000,
      lap: Math.max(...driverStates.filter(d => !d.retired || d.lap >= totalLaps).map(d => d.lap)),
      drivers: driversRecord,
      safetyCar,
      weather,
      trackStatus: scActive ? '4' : '1',
    });

    allFinished = driverStates.every(d => d.finished || d.retired);
  }

  // Build driver colors map
  const driverColors: Record<string, string> = {};
  for (const driver of activeDrivers) {
    driverColors[driver.code] = driver.color;
  }

  return {
    frames,
    trackGeometry: track,
    drivers: activeDrivers,
    driverColors,
    trackStatuses,
    raceControlMessages,
    totalLaps,
    sessionInfo: {
      seriesId,
      seriesName: sessionMeta?.seriesName || seriesId.toUpperCase(),
      eventName: sessionMeta?.eventName || track.name,
      circuitName: sessionMeta?.circuitName || track.name,
      country: sessionMeta?.country || track.country,
      year: sessionMeta?.year || new Date().getFullYear(),
      round: sessionMeta?.round || 1,
      sessionType: sessionMeta?.sessionType || sessionType,
    },
  };
}
