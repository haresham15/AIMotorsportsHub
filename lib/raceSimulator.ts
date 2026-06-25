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
  pitStopLaps: number[];      // laps at which pit stops typically occur
  tyreCompounds: string[];    // available tyre compounds
  hasDRS: boolean;
  hasSafetyCar: boolean;
  driverCount: number;
  gridSpreadFactor: number;   // how spread out cars are at start (0-1)
}

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
): ReplayData {
  const config = SERIES_CONFIGS[seriesId] || SERIES_CONFIGS.f1;
  const rng = new SeededRNG(seriesId.length * 1000 + track.referenceLine.length);

  const cumDists = computeCumulativeDistances(track.referenceLine);
  const trackLength = cumDists[cumDists.length - 1]; // total track perimeter in world units

  // Scale factor: world units per metre (approximate)
  const worldUnitsPerMetre = trackLength / (track.lengthKm * 1000);
  const lapDistWorld = trackLength;

  // Base speed in world units per second
  const baseSpeedWorld = lapDistWorld / config.lapTimeSeconds * config.baseSpeedFactor;

  // Determine actual lap count (cap for performance)
  const totalLaps = Math.min(track.totalLaps, seriesId === 'top-fuel' ? 1 : 15);
  const totalFrames = totalLaps * config.lapTimeSeconds * REPLAY_FPS;

  // Initialize driver states
  const activeDrivers = drivers.slice(0, config.driverCount);
  const driverStates: DriverSimState[] = activeDrivers.map((driver, idx) => {
    const speedMult = 1 + rng.range(-config.speedVariation, config.speedVariation);
    const startOffset = idx * config.gridSpreadFactor * lapDistWorld;
    const tyre = config.tyreCompounds[rng.int(0, config.tyreCompounds.length - 1)];

    // Determine next pit stop lap
    let nextPitLap = Infinity;
    if (config.pitStopLaps.length > 0) {
      const pitIdx = idx % config.pitStopLaps.length;
      nextPitLap = config.pitStopLaps[pitIdx] + rng.int(-2, 2);
      // Scale pit laps to our reduced lap count
      nextPitLap = Math.min(Math.round(nextPitLap * totalLaps / track.totalLaps), totalLaps - 1);
      nextPitLap = Math.max(2, nextPitLap);
    }

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
      nextPitLap: nextPitLap,
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
  const dt = 1 / REPLAY_FPS;
  const trackStatuses: TrackStatusPeriod[] = [];
  let scActive = false;
  let scStartTime = -1;
  let scEndTime = -1;

  // ── Frame generation loop ───────────────────────────────────────
  for (let fi = 0; fi < totalFrames; fi++) {
    const t = fi * dt;

    // Determine if safety car is active
    const leaderLap = Math.max(...driverStates.filter(d => !d.retired).map(d => d.lap));
    const inSCWindow = leaderLap >= scDeployLap && t < (scStartTime + scDuration);

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
          ds.nextPitLap = Infinity; // Already pitted
        }
        continue; // Don't move while in pit
      }

      // Check if should pit this lap
      if (ds.lap >= ds.nextPitLap && ds.dist > 0) {
        const lapProgress = (ds.dist % lapDistWorld) / lapDistWorld;
        if (lapProgress > 0.85 && lapProgress < 0.95) {
          ds.inPit = true;
          ds.pitTimer = config.pitStopDurationS / REPLAY_FPS * rng.range(0.9, 1.1);
          continue;
        }
      }

      // Speed calculation
      let speed = ds.baseSpeed;

      // SC slows everyone down
      if (scActive) {
        speed *= 0.6;
      }

      // Tyre degradation effect
      const degradation = 1 - (ds.tyreLife * 0.002);
      speed *= Math.max(0.9, degradation);

      // Random variation per frame (simulates track features / overtaking)
      speed *= rng.range(0.97, 1.03);

      // For drag racing: acceleration curve
      if (seriesId === 'top-fuel') {
        const elapsed = t;
        // Simulate 0-330mph acceleration profile
        const accCurve = Math.min(1, elapsed / 2.5);
        speed = ds.baseSpeed * accCurve * accCurve;
      }

      ds.currentSpeed = speed;
      ds.dist += speed * dt;

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
      sessionType: 'Race',
    },
  };
}
