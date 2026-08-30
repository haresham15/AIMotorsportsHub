import { NextRequest, NextResponse } from 'next/server'
import { parseStandings } from '@/lib/f1Parsers'

export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  try {
    // Fetch driver standings
    const driverRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverstandings/?format=json`)
    if (!driverRes.ok) throw new Error('Failed to fetch driver standings')
    const driverData = await driverRes.json()

    // Fetch constructor standings
    const constructorRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/constructorstandings/?format=json`)
    if (!constructorRes.ok) throw new Error('Failed to fetch constructor standings')
    const constructorData = await constructorRes.json()
    const parsed = parseStandings(driverData, constructorData)

    return NextResponse.json({
      season: year,
      ...parsed
    })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
  }
}
