import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const circuitId = searchParams.get('circuitId');

  try {
    const db = getDb();

    if (!circuitId) {
      const circuits = db.prepare('SELECT circuitId, name, location, country FROM circuits ORDER BY name ASC').all();
      return NextResponse.json(circuits);
    }

    // Get track records (winners, fastest lap)
    const winners = db.prepare(`
      SELECT r.year, d.forename, d.surname, c.name as constructor
      FROM results res
      JOIN races r ON res.raceId = r.raceId
      JOIN drivers d ON res.driverId = d.driverId
      JOIN constructors c ON res.constructorId = c.constructorId
      WHERE r.circuitId = ? AND res.positionOrder = 1
      ORDER BY r.year DESC
      LIMIT 20
    `).all(circuitId);

    // Fastest lap recorded at this track
    const fastestLaps = db.prepare(`
      SELECT r.year, d.forename, d.surname, res.fastestLapTime, res.fastestLapSpeed
      FROM results res
      JOIN races r ON res.raceId = r.raceId
      JOIN drivers d ON res.driverId = d.driverId
      WHERE r.circuitId = ? AND res.fastestLapTime IS NOT NULL
      ORDER BY res.fastestLapSpeed DESC
      LIMIT 10
    `).all(circuitId);

    return NextResponse.json({ winners, fastestLaps });
  } catch (error) {
    console.error('Error fetching historical tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch historical tracks' }, { status: 500 });
  }
}
