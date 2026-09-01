import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const driver1 = searchParams.get('driver1');
  const driver2 = searchParams.get('driver2');

  if (!driver1 || !driver2) {
    return NextResponse.json({ error: 'driver1 and driver2 are required' }, { status: 400 });
  }

  const db = getDb();
  
  const commonRaces = db.prepare(`
    SELECT r.raceId, r.year, r.name,
           r1.positionOrder as d1_position, r2.positionOrder as d2_position
    FROM results r1
    JOIN results r2 ON r1.raceId = r2.raceId
    JOIN races r ON r1.raceId = r.raceId
    WHERE r1.driverId = ? AND r2.driverId = ?
    ORDER BY r.year DESC, r.round DESC
  `).all(driver1, driver2);

  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN r1.positionOrder < r2.positionOrder THEN 1 ELSE 0 END) as d1_wins,
      SUM(CASE WHEN r2.positionOrder < r1.positionOrder THEN 1 ELSE 0 END) as d2_wins,
      SUM(CASE WHEN r1.positionText = '1' THEN 1 ELSE 0 END) as d1_race_wins,
      SUM(CASE WHEN r2.positionText = '1' THEN 1 ELSE 0 END) as d2_race_wins,
      SUM(CASE WHEN r1.positionOrder <= 3 THEN 1 ELSE 0 END) as d1_podiums,
      SUM(CASE WHEN r2.positionOrder <= 3 THEN 1 ELSE 0 END) as d2_podiums
    FROM results r1
    JOIN results r2 ON r1.raceId = r2.raceId
    WHERE r1.driverId = ? AND r2.driverId = ?
  `).get(driver1, driver2);

  return NextResponse.json({ commonRaces, stats });
}
