import { NextResponse } from 'next/server'

export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
  // NASCAR open CDN does not provide a single unified standings endpoint 
  // that matches the structure of Ergast (F1).
  // For MVP, we return a graceful empty structure so the ChampionshipStandings 
  // component can display a "coming soon" or "no data" state without crashing.
  
  return NextResponse.json({
    season: new Date().getFullYear().toString(),
    driverStandings: [],
    constructorStandings: []
  })
}
