import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const drivers = db.prepare('SELECT driverId, forename, surname, code, nationality FROM drivers ORDER BY surname ASC').all();
    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching historical drivers:', error);
    return NextResponse.json({ error: 'Failed to fetch historical drivers' }, { status: 500 });
  }
}
