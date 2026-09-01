import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const drivers = db.prepare('SELECT driverId, forename, surname, code, nationality FROM drivers ORDER BY surname ASC').all();
  return NextResponse.json(drivers);
}
