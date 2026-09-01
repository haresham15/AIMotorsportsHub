import { getDb } from "../db";

export interface GoatRanking {
  driverId: number;
  name: string;
  peakElo: number;
  currentElo: number;
  races: number;
  wins: number;
  championships: number;
  era: string; // e.g. "1990s - 2000s"
}

// Memory cache so we don't recalculate on every API call
let cachedRankings: GoatRanking[] | null = null;
let lastCalculated = 0;

export function getGoatRankings(): GoatRanking[] {
  // Return cached version if calculated recently (e.g., within 1 hour)
  if (cachedRankings && Date.now() - lastCalculated < 3600000) {
    return cachedRankings;
  }

  const db = getDb();
  
  // 1. Fetch all results chronologically
  const results = db.prepare(`
    SELECT res.raceId, r.year, res.driverId, res.constructorId, res.positionOrder, 
           d.forename, d.surname, c.name as constructorName
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    JOIN drivers d ON res.driverId = d.driverId
    JOIN constructors c ON res.constructorId = c.constructorId
    ORDER BY r.year ASC, r.round ASC, res.positionOrder ASC
  `).all() as any[];

  // 2. Group by race
  const races = new Map<number, any[]>();
  for (const row of results) {
    if (!races.has(row.raceId)) {
      races.set(row.raceId, []);
    }
    races.get(row.raceId)!.push(row);
  }

  // 3. Initialize Elos
  const INITIAL_ELO = 1500;
  const K_FACTOR = 4; // Since we sum against ~20 drivers per race, keep K small

  const driverElos = new Map<number, number>();
  const driverPeaks = new Map<number, number>();
  const constructorElos = new Map<number, number>();
  
  // Stats tracking
  const driverStats = new Map<number, { 
    name: string, 
    races: number, 
    wins: number,
    years: Set<number>
  }>();

  for (const raceResults of races.values()) {
    const N = raceResults.length;
    if (N < 2) continue;

    // Deltas for this race
    const driverDeltas = new Map<number, number>();
    const constructorDeltas = new Map<number, number>();

    // Compare every driver to every other driver
    for (let i = 0; i < N; i++) {
      const p1 = raceResults[i];
      const d1Elo = driverElos.get(p1.driverId) || INITIAL_ELO;
      const c1Elo = constructorElos.get(p1.constructorId) || INITIAL_ELO;
      const eff1 = d1Elo + c1Elo;

      // Stats
      if (!driverStats.has(p1.driverId)) {
        driverStats.set(p1.driverId, { 
          name: `${p1.forename} ${p1.surname}`, 
          races: 0, 
          wins: 0,
          years: new Set()
        });
      }
      const stats = driverStats.get(p1.driverId)!;
      stats.races++;
      stats.years.add(p1.year);
      if (p1.positionOrder === 1) stats.wins++;

      for (let j = i + 1; j < N; j++) {
        const p2 = raceResults[j];
        const d2Elo = driverElos.get(p2.driverId) || INITIAL_ELO;
        const c2Elo = constructorElos.get(p2.constructorId) || INITIAL_ELO;
        const eff2 = d2Elo + c2Elo;

        // p1 finished ahead of p2 (since sorted by positionOrder)
        const expected1 = 1 / (1 + Math.pow(10, (eff2 - eff1) / 400));
        const expected2 = 1 / (1 + Math.pow(10, (eff1 - eff2) / 400));

        const delta1 = K_FACTOR * (1 - expected1);
        const delta2 = K_FACTOR * (0 - expected2);

        // Split delta between driver and constructor (50/50)
        // If same constructor, constructor delta cancels out
        driverDeltas.set(p1.driverId, (driverDeltas.get(p1.driverId) || 0) + delta1 * 0.5);
        constructorDeltas.set(p1.constructorId, (constructorDeltas.get(p1.constructorId) || 0) + delta1 * 0.5);

        driverDeltas.set(p2.driverId, (driverDeltas.get(p2.driverId) || 0) + delta2 * 0.5);
        constructorDeltas.set(p2.constructorId, (constructorDeltas.get(p2.constructorId) || 0) + delta2 * 0.5);
      }
    }

    // Apply deltas
    for (const [dId, delta] of driverDeltas.entries()) {
      const newElo = (driverElos.get(dId) || INITIAL_ELO) + delta;
      driverElos.set(dId, newElo);
      if (newElo > (driverPeaks.get(dId) || INITIAL_ELO)) {
        driverPeaks.set(dId, newElo);
      }
    }
    for (const [cId, delta] of constructorDeltas.entries()) {
      constructorElos.set(cId, (constructorElos.get(cId) || INITIAL_ELO) + delta);
    }
  }

  // 4. Format Output
  const rankings: GoatRanking[] = [];
  
  for (const [dId, stats] of driverStats.entries()) {
    // Determine Era
    const years = Array.from(stats.years).sort();
    const startDecade = Math.floor(years[0] / 10) * 10;
    const endDecade = Math.floor(years[years.length - 1] / 10) * 10;
    let era = `${startDecade}s`;
    if (startDecade !== endDecade) {
      era += ` - ${endDecade}s`;
    }

    rankings.push({
      driverId: dId,
      name: stats.name,
      peakElo: Math.round(driverPeaks.get(dId) || INITIAL_ELO),
      currentElo: Math.round(driverElos.get(dId) || INITIAL_ELO),
      races: stats.races,
      wins: stats.wins,
      championships: 0, // We could calculate this, but omitting for speed/simplicity
      era: era
    });
  }

  // Sort by Peak Elo descending
  rankings.sort((a, b) => b.peakElo - a.peakElo);
  
  cachedRankings = rankings;
  lastCalculated = Date.now();
  
  return rankings;
}
