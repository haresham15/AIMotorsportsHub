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
  position: number;
  gear: number;
  drs: number;
  throttle: number;
  brake: number;
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

  // Base speed in world units per second
  const baseSpeedWorld = lapDistWorld / config.lapTimeSeconds * config.baseSpeedFactor;

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
  const rawFrameCount = totalLaps * config.lapTimeSeconds * REPLAY_FPS;
  const effectiveFPS = rawFrameCount > MAX_FRAMES
    ? Math.max(5, Math.floor(MAX_FRAMES / (totalLaps * config.lapTimeSeconds)))
    : REPLAY_FPS;
  const totalFrames = totalLaps * config.lapTimeSeconds * effectiveFPS;
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

    return {
      code: driver.code,
      dist: -startOffset,  // negative = behind start line
      lap: 1,
      baseSpeed: baseSpeedWorld * speedMult,
      currentSpeed: baseSpeedWorld * speedMult,
      tyre,
      tyreLife: 0,
      inPit: false,
      pitTimer: 0,
      nextPitLap,
      plannedPitLaps,
      pitStopIndex: 0,
      retired: false,
      position: idx + 1,
      gear: 1,
      drs: 0,
      throttle: 100,
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
      if (ds.retired) continue;

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
        continue; // Don't move while in pit
      }

      // Check if should pit this lap
      if (ds.lap >= ds.nextPitLap && ds.dist > 0) {
        const lapProgress = (ds.dist % lapDistWorld) / lapDistWorld;
        if (lapProgress > 0.85 && lapProgress < 0.95) {
          ds.inPit = true;
          // FIX: pitTimer is decremented by `dt` each frame, so it should be
          // set to the actual pit stop duration in seconds (with some variance).
          // Previously this was `pitStopDurationS / REPLAY_FPS` which made
          // pit stops ~0.04s instead of ~25s.
          ds.pitTimer = config.pitStopDurationS * rng.range(0.9, 1.1);
          continue;
        }
      }

      // Speed calculation
      let speed = ds.baseSpeed;

      // SC slows everyone down
      if (scActive) {
        speed *= 0.6;
      }

      // Tyre degradation effect (clamped to prevent negative/zero speed)
      const degradation = Math.max(0.85, 1 - (ds.tyreLife * 0.002));
      speed *= degradation;

      // Random variation per frame (simulates track features / overtaking)
      speed *= rng.range(0.97, 1.03);

      // For drag racing: acceleration curve
      if (seriesId === 'top-fuel') {
        const elapsed = t;
        // Simulate 0-330mph acceleration profile
        const accCurve = Math.min(1, elapsed / 2.5);
        speed = ds.baseSpeed * accCurve * accCurve;
      }

      // Clamp speed to prevent NaN/Infinity from propagating to canvas
      ds.currentSpeed = Number.isFinite(speed) ? speed : ds.baseSpeed;
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
        ds.retired = true; // Finished
      }

      // Simulated telemetry values
      const lapFraction = (ds.dist % lapDistWorld) / lapDistWorld;
      ds.gear = Math.min(8, Math.max(1, Math.floor(speed / (baseSpeedWorld * 0.15)) + 1));
      ds.throttle = ds.inPit ? 30 : Math.round(rng.range(85, 100));
      ds.brake = ds.inPit ? 50 : (rng.next() > 0.85 ? Math.round(rng.range(40, 100)) : 0);

      // DRS simulation
      if (config.hasDRS && !scActive) {
        ds.drs = (lapFraction > 0.3 && lapFraction < 0.4) || (lapFraction > 0.8 && lapFraction < 0.9) ? 12 : 0;
      } else {
        ds.drs = 0;
      }
    }

    // Sort by distance to determine positions
    const activeDriversSorted = [...driverStates]
      .filter(d => !d.retired || d.lap >= totalLaps)
      .sort((a, b) => b.dist - a.dist);

    activeDriversSorted.forEach((ds, idx) => {
      ds.position = idx + 1;
    });

    // Check if every driver has finished
    allFinished = driverStates.every(ds => ds.retired);

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
        retired: ds.retired && ds.lap >= totalLaps,
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
