import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'f1_history.db');
    try {
      db = new Database(dbPath, { readonly: true });
    } catch (e) {
      console.error("Failed to connect to SQLite DB at", dbPath);
      throw e;
    }
  }
  return db;
}

export function getSeasons() {
  const db = getDb();
  return db.prepare('SELECT year, url FROM seasons ORDER BY year DESC').all();
}

export function getSeasonDetails(year: number) {
  const db = getDb();
  const races = db.prepare(`
    SELECT r.raceId, r.round, r.name as raceName, r.date, c.name as circuitName, c.country
    FROM races r
    JOIN circuits c ON r.circuitId = c.circuitId
    WHERE r.year = ?
    ORDER BY r.round ASC
  `).all(year);

  // Get the last race of the year to find final standings
  const lastRace = races[races.length - 1] as any;
  let standings: any[] = [];
  
  if (lastRace) {
    standings = db.prepare(`
      SELECT ds.position, d.forename, d.surname, ds.points, ds.wins, c.name as constructorName
      FROM driver_standings ds
      JOIN drivers d ON ds.driverId = d.driverId
      -- We need to guess constructor from results of that race (standings table doesn't have constructorId)
      LEFT JOIN results res ON res.raceId = ds.raceId AND res.driverId = ds.driverId
      LEFT JOIN constructors c ON res.constructorId = c.constructorId
      WHERE ds.raceId = ?
      ORDER BY ds.position ASC
    `).all(lastRace.raceId);
  }

  return { races, standings };
}

export function getDrivers() {
  const db = getDb();
  return db.prepare(`
    SELECT driverId, forename, surname, nationality
    FROM drivers
    ORDER BY surname ASC, forename ASC
  `).all();
}

export function getDriversWithStats() {
  const db = getDb();
  return db.prepare(`
    SELECT d.driverId, d.forename, d.surname, d.nationality,
           COUNT(res.raceId) as totalRaces,
           SUM(CASE WHEN res.positionOrder = 1 THEN 1 ELSE 0 END) as totalWins,
           MAX(r.year) as lastYear,
           MIN(r.year) as firstYear
    FROM drivers d
    LEFT JOIN results res ON d.driverId = res.driverId
    LEFT JOIN races r ON res.raceId = r.raceId
    GROUP BY d.driverId
    ORDER BY totalWins DESC, totalRaces DESC, d.surname ASC
  `).all() as {
    driverId: number;
    forename: string;
    surname: string;
    nationality: string;
    totalRaces: number;
    totalWins: number;
    lastYear: number | null;
    firstYear: number | null;
  }[];
}

export function getHeadToHead(driver1Id: number, driver2Id: number) {
  const db = getDb();
  
  // Find races where both drivers participated
  const racesBoth = db.prepare(`
    SELECT r1.raceId, r.year, r.name as raceName,
           r1.positionOrder as d1_pos, r1.points as d1_points, r1.grid as d1_grid,
           r2.positionOrder as d2_pos, r2.points as d2_points, r2.grid as d2_grid
    FROM results r1
    JOIN results r2 ON r1.raceId = r2.raceId
    JOIN races r ON r1.raceId = r.raceId
    WHERE r1.driverId = ? AND r2.driverId = ?
    ORDER BY r.year DESC, r.round DESC
  `).all(driver1Id, driver2Id);

  let d1Wins = 0;
  let d2Wins = 0;
  let d1Points = 0;
  let d2Points = 0;
  let d1Ahead = 0;
  let d2Ahead = 0;

  for (const race of racesBoth as any[]) {
    d1Points += race.d1_points;
    d2Points += race.d2_points;
    if (race.d1_pos < race.d2_pos) {
      d1Ahead++;
    } else if (race.d2_pos < race.d1_pos) {
      d2Ahead++;
    }
    
    if (race.d1_pos === 1) d1Wins++;
    if (race.d2_pos === 1) d2Wins++;
  }

  return {
    racesTogether: racesBoth.length,
    driver1: { ahead: d1Ahead, points: d1Points, wins: d1Wins },
    driver2: { ahead: d2Ahead, points: d2Points, wins: d2Wins },
    history: racesBoth
  };
}

export function getTrackRecords() {
  const db = getDb();
  // We'll get circuits and the driver with most wins at that circuit
  // Using a CTE or subquery
  return db.prepare(`
    SELECT c.circuitId, c.name, c.country,
           COUNT(r.raceId) as racesHosted
    FROM circuits c
    LEFT JOIN races r ON c.circuitId = r.circuitId
    GROUP BY c.circuitId
    ORDER BY racesHosted DESC
  `).all();
}
