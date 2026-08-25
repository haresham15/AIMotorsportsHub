import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  try {
    // Fetch driver standings
    const driverRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverstandings/?format=json`)
    if (!driverRes.ok) throw new Error('Failed to fetch driver standings')
    const driverData = await driverRes.json()
    const driverStandings = driverData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || []

    // Fetch constructor standings
    const constructorRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/constructorstandings/?format=json`)
    if (!constructorRes.ok) throw new Error('Failed to fetch constructor standings')
    const constructorData = await constructorRes.json()
    const constructorStandings = constructorData.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || []

    return NextResponse.json({
      season: year,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      driverStandings: driverStandings.map((ds: any) => ({
        position: parseInt(ds.position),
        points: parseFloat(ds.points),
        wins: parseInt(ds.wins),
        driverId: ds.Driver.driverId,
        driverNumber: ds.Driver.permanentNumber,
        code: ds.Driver.code,
        firstName: ds.Driver.givenName,
        lastName: ds.Driver.familyName,
        constructorId: ds.Constructors?.[0]?.constructorId,
        constructorName: ds.Constructors?.[0]?.name
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructorStandings: constructorStandings.map((cs: any) => ({
        position: parseInt(cs.position),
        points: parseFloat(cs.points),
        wins: parseInt(cs.wins),
        constructorId: cs.Constructor.constructorId,
        constructorName: cs.Constructor.name
      }))
    })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
  }
}
