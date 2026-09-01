import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  
  if (!year) {
    const db = getDb();
    const seasons = db.prepare('SELECT year, url FROM seasons ORDER BY year DESC').all();
    return NextResponse.json(seasons);
  }

  const db = getDb();
  
  const lastRace = db.prepare(`
    SELECT raceId FROM races WHERE year = ? ORDER BY round DESC LIMIT 1
  `).get(year) as { raceId: number } | undefined;

  if (!lastRace) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 });
  }

  const driverStandings = db.prepare(`
    SELECT ds.position, ds.points, ds.wins, d.forename, d.surname, d.code, d.nationality
    FROM driver_standings ds
    JOIN drivers d ON ds.driverId = d.driverId
    WHERE ds.raceId = ?
    ORDER BY ds.position ASC
  `).all(lastRace.raceId);

  const constructorStandings = db.prepare(`
    SELECT cs.position, cs.points, cs.wins, c.name, c.nationality
    FROM constructor_standings cs
    JOIN constructors c ON cs.constructorId = c.constructorId
    WHERE cs.raceId = ?
    ORDER BY cs.position ASC
  `).all(lastRace.raceId);

  return NextResponse.json({ driverStandings, constructorStandings });
}
