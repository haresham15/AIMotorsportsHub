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
} from './replayTypes';
import { REPLAY_FPS } from './replayTypes';
import {
  computeCumulativeDistances,
  positionAtDistance,
} from './trackData';

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
    lapTimeSeconds: 4,
    pitStopDurationS: 0,
    pitStopLaps: [],
    tyreCompounds: ['STOCK'],
    hasDRS: false,
    hasSafetyCar: false,
    driverCount: 2,
    gridSpreadFactor: 0.0,
    defaultLaps: 1, // single quarter-mile pass
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
  sessionType: string = 'Race'
): ReplayData {
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
      totalLaps: 0,
      sessionInfo: {
        seriesId, seriesName: seriesId.toUpperCase(),
        eventName: track.name, circuitName: track.name,
        country: track.country, year: new Date().getFullYear(),
        round: 1, sessionType: sessionType,
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
  
  // Adjust lap count based on session type
  const sTypeLower = sessionType.toLowerCase();
  if (sTypeLower.includes('sprint')) {
    totalLaps = Math.max(1, Math.ceil(totalLaps / 3));
  } else if (sTypeLower.includes('qualifying')) {
    totalLaps = 3; // Out lap, push lap, in lap
  } else if (sTypeLower.includes('practice')) {
    totalLaps = 5; // A short practice stint
  }

  // ── Frame budget: downsample FPS for very long races to stay under
  // MAX_FRAMES, rather than truncating the number of laps.
  const rawFrameCount = totalLaps * effectiveLapTimeSeconds * REPLAY_FPS;
  const effectiveFPS = rawFrameCount > MAX_FRAMES
    ? Math.max(5, Math.floor(MAX_FRAMES / (totalLaps * effectiveLapTimeSeconds)))
    : REPLAY_FPS;
  const totalFrames = Math.min(
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
      if (initialSpeedKmh < 90) initialGear = 2;
      else if (initialSpeedKmh < 150) initialGear = 3;
      else if (initialSpeedKmh < 220) initialGear = 4;
      else initialGear = 5;
    } else if (seriesId === 'formula-e') {
      initialGear = 1;
    } else {
      if (initialSpeedKmh < 105) initialGear = 2;
      else if (initialSpeedKmh < 145) initialGear = 3;
      else if (initialSpeedKmh < 190) initialGear = 4;
      else if (initialSpeedKmh < 235) initialGear = 5;
      else if (initialSpeedKmh < 275) initialGear = 6;
      else if (initialSpeedKmh < 310) initialGear = 7;
      else initialGear = 8;
    }

    return {
      code: driver.code,
      dist: -startOffset,  // negative = behind start line
      lap: 1,
      baseSpeed: baseSpeedWorld * speedMult,
      currentSpeed: initialSpeed,
      tyre,
      tyreLife: 0,
      inPit: false,
      pitTimer: 0,
      nextPitLap,
      plannedPitLaps,
      pitStopIndex: 0,
      retired: false,
      finished: false,
      position: idx + 1,
      gear: initialGear,
      drs: 0,
      throttle: 98,
      brake: 0,
    };
  });

  // Generate safety car deployment (random lap if applicable)
  let scDeployLap = Infinity;
  let scDuration = 0;
  if (config.hasSafetyCar && totalLaps > 5 && rng.next() > 0.4) {
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
    }

    if (scActive && t >= scEndTime) {
      scActive = false;
    }

    // Update each driver
    for (const ds of driverStates) {
      if (ds.retired || ds.finished) continue;

      // Pit stop logic
      if (ds.inPit) {
        ds.pitTimer -= dt;
        if (ds.pitTimer <= 0) {
          ds.inPit = false;
          ds.tyreLife = 0;
          // Change tyre compound
          ds.tyre = config.tyreCompounds[rng.int(0, config.tyreCompounds.length - 1)];
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
        continue; // Don't move while in pit
      }

      // Check if should pit this lap
      if (ds.lap >= ds.nextPitLap && ds.dist > 0) {
        const lapProgress = (ds.dist % lapDistWorld) / lapDistWorld;
        if (lapProgress > 0.85 && lapProgress < 0.95) {
          ds.inPit = true;
          ds.pitTimer = config.pitStopDurationS * rng.range(0.9, 1.1);
          ds.currentSpeed = 0;
          ds.gear = 0;
          ds.throttle = 0;
          ds.brake = 100;
          ds.drs = 0;
          continue;
        }
      }

      // Track distance
      const trackDist = ((ds.dist % lapDistWorld) + lapDistWorld) % lapDistWorld;

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

      // For drag racing: acceleration curve
      if (seriesId === 'top-fuel') {
        const elapsed = t;
        const accCurve = Math.min(1, elapsed / 2.5);
        targetSpeed = ds.baseSpeed * accCurve * accCurve;
      }

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
        if (speedKmh < 90) ds.gear = 2;
        else if (speedKmh < 150) ds.gear = 3;
        else if (speedKmh < 220) ds.gear = 4;
        else ds.gear = 5;
      } else if (seriesId === 'formula-e') {
        ds.gear = 1;
      } else {
        if (speedKmh < 105) ds.gear = 2;
        else if (speedKmh < 145) ds.gear = 3;
        else if (speedKmh < 190) ds.gear = 4;
        else if (speedKmh < 235) ds.gear = 5;
        else if (speedKmh < 275) ds.gear = 6;
        else if (speedKmh < 310) ds.gear = 7;
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
    }

    // Sort by distance to determine positions
    const activeDriversSorted = [...driverStates]
      .filter(d => !d.retired)
      .sort((a, b) => b.dist - a.dist);

    activeDriversSorted.forEach((ds, idx) => {
      ds.position = idx + 1;
    });

    // Check if every driver has finished or retired
    allFinished = driverStates.every(ds => ds.retired || ds.finished);

    // Build frame
    const driversRecord: Record<string, DriverFrameState> = {};

    for (const ds of driverStates) {
      const trackDist = ((ds.dist % lapDistWorld) + lapDistWorld) % lapDistWorld;
      const pos = positionAtDistance(track.referenceLine, cumDists, trackDist);

      // Calculate speed in km/h (approximate)
      const speedKmh = (ds.currentSpeed / worldUnitsPerMetre) * 3.6;

      driversRecord[ds.code] = {
        x: pos.x,
        y: pos.y,
        position: ds.position,
        lap: Math.max(1, Math.min(ds.lap, totalLaps)),
        dist: ds.dist,
        relDist: (trackDist / lapDistWorld),
        speed: Math.round(speedKmh),
        gear: ds.gear,
        tyre: ds.tyre,
        tyreLife: ds.tyreLife,
        drs: ds.drs,
        throttle: ds.throttle,
        brake: ds.brake,
        inPit: ds.inPit,
        retired: ds.retired,
        finished: ds.finished,
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
    totalLaps,
    sessionInfo: {
      seriesId,
      seriesName: seriesId.toUpperCase(),
      eventName: track.name,
      circuitName: track.name,
      country: track.country,
      year: new Date().getFullYear(),
      round: 1,
      sessionType: sessionType,
    },
  };
}
