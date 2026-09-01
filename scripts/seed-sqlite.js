import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'f1_history.db');
const rawDataDir = path.join(__dirname, '..', 'data', 'raw');

// Remove existing DB if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE circuits (
    circuitId INTEGER PRIMARY KEY,
    circuitRef TEXT,
    name TEXT,
    location TEXT,
    country TEXT,
    lat REAL,
    lng REAL,
    alt INTEGER,
    url TEXT
  );

  CREATE TABLE constructors (
    constructorId INTEGER PRIMARY KEY,
    constructorRef TEXT,
    name TEXT,
    nationality TEXT,
    url TEXT
  );

  CREATE TABLE drivers (
    driverId INTEGER PRIMARY KEY,
    driverRef TEXT,
    number INTEGER,
    code TEXT,
    forename TEXT,
    surname TEXT,
    dob TEXT,
    nationality TEXT,
    url TEXT
  );

  CREATE TABLE seasons (
    year INTEGER PRIMARY KEY,
    url TEXT
  );

  CREATE TABLE races (
    raceId INTEGER PRIMARY KEY,
    year INTEGER,
    round INTEGER,
    circuitId INTEGER,
    name TEXT,
    date TEXT,
    time TEXT,
    url TEXT,
    fp1_date TEXT,
    fp1_time TEXT,
    fp2_date TEXT,
    fp2_time TEXT,
    fp3_date TEXT,
    fp3_time TEXT,
    quali_date TEXT,
    quali_time TEXT,
    sprint_date TEXT,
    sprint_time TEXT,
    FOREIGN KEY(year) REFERENCES seasons(year),
    FOREIGN KEY(circuitId) REFERENCES circuits(circuitId)
  );

  CREATE TABLE driver_standings (
    driverStandingsId INTEGER PRIMARY KEY,
    raceId INTEGER,
    driverId INTEGER,
    points REAL,
    position INTEGER,
    positionText TEXT,
    wins INTEGER,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId)
  );

  CREATE TABLE constructor_standings (
    constructorStandingsId INTEGER PRIMARY KEY,
    raceId INTEGER,
    constructorId INTEGER,
    points REAL,
    position INTEGER,
    positionText TEXT,
    wins INTEGER,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(constructorId) REFERENCES constructors(constructorId)
  );

  CREATE TABLE results (
    resultId INTEGER PRIMARY KEY,
    raceId INTEGER,
    driverId INTEGER,
    constructorId INTEGER,
    number INTEGER,
    grid INTEGER,
    position INTEGER,
    positionText TEXT,
    positionOrder INTEGER,
    points REAL,
    laps INTEGER,
    time TEXT,
    milliseconds INTEGER,
    fastestLap INTEGER,
    rank INTEGER,
    fastestLapTime TEXT,
    fastestLapSpeed REAL,
    statusId INTEGER,
    FOREIGN KEY(raceId) REFERENCES races(raceId),
    FOREIGN KEY(driverId) REFERENCES drivers(driverId),
    FOREIGN KEY(constructorId) REFERENCES constructors(constructorId)
  );
`);

const loadCSV = (filename, tableName) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(rawDataDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${filename} not found, skipping.`);
      return resolve();
    }

    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Convert '\\N' to null
        for (const key in data) {
          if (data[key] === '\\N') {
            data[key] = null;
          }
        }
        rows.push(data);
      })
      .on('end', () => {
        if (rows.length === 0) return resolve();

        const keys = Object.keys(rows[0]);
        const placeholders = keys.map(() => '?').join(', ');
        
        const insert = db.prepare(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`);
        const insertMany = db.transaction((items) => {
          for (const item of items) {
            insert.run(keys.map(k => item[k]));
          }
        });

        try {
          insertMany(rows);
          console.log(`Loaded ${rows.length} rows into ${tableName}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
};

async function seed() {
  console.log('Starting seed process...');
  try {
    await loadCSV('circuits.csv', 'circuits');
    await loadCSV('constructors.csv', 'constructors');
    await loadCSV('drivers.csv', 'drivers');
    await loadCSV('seasons.csv', 'seasons');
    await loadCSV('races.csv', 'races');
    await loadCSV('driver_standings.csv', 'driver_standings');
    await loadCSV('constructor_standings.csv', 'constructor_standings');
    await loadCSV('results.csv', 'results');
    
    // Create some indices for faster querying later
    db.exec(`
      CREATE INDEX idx_races_year ON races(year);
      CREATE INDEX idx_results_raceId ON results(raceId);
      CREATE INDEX idx_results_driverId ON results(driverId);
      CREATE INDEX idx_driver_standings_raceId ON driver_standings(raceId);
      CREATE INDEX idx_driver_standings_driverId ON driver_standings(driverId);
    `);
    
    console.log('Database seeded successfully at data/f1_history.db');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    db.close();
  }
}

seed();
