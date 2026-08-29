import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString()
  
  return NextResponse.json({
    season,
    driverStandings: [],
    constructorStandings: []
  })
}
