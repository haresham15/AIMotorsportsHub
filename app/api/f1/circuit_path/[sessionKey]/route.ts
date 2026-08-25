import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60; // Allow more time for fetches

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionKey: string }> }
) {
  const { sessionKey } = await params;
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get('driver_number') || '1' // Default to Verstappen

  try {
    // 1. Fetch all laps for the driver in this session
    const lapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}&driver_number=${driver}`)
    if (!lapsRes.ok) throw new Error('Failed to fetch laps')
    const laps = await lapsRes.json()

    if (!laps || laps.length === 0) {
      return NextResponse.json({ error: 'No laps found' }, { status: 404 })
    }

    // 2. Find a valid fast lap to ensure a clean trace of the circuit
    const validLaps = laps.filter((l: any) => l.lap_duration && l.lap_duration > 50)
    if (validLaps.length === 0) {
      return NextResponse.json({ error: 'No valid laps found' }, { status: 404 })
    }
    const bestLap = validLaps.sort((a: any, b: any) => a.lap_duration - b.lap_duration)[0]

    // 3. Define time window for the lap
    const start = new Date(bestLap.date_start).getTime()
    // Add 1 second buffer to ensure the loop closes
    const end = start + (bestLap.lap_duration + 1) * 1000 
    
    const startIso = new Date(start).toISOString()
    const endIso = new Date(end).toISOString()

    // 4. Fetch the location data for this exact lap
    const queryParams = new URLSearchParams({
      session_key: sessionKey,
      driver_number: driver,
      'date>=': startIso,
      'date<': endIso
    })

    const url = `https://api.openf1.org/v1/location?${queryParams.toString()}`
    const locRes = await fetch(url)
    if (!locRes.ok) throw new Error('Failed to fetch location')
    const locData = await locRes.json()

    if (!locData || locData.length === 0) {
      return NextResponse.json({ error: 'No location data found' }, { status: 404 })
    }

    // 5. Downsample by taking 1 in every 3 points to shrink payload size for real-time trace
    const points = locData
      .filter((_: unknown, i: number) => i % 3 === 0)
      .map((p: any) => ({
        x: p.x,
        y: p.y
      }))

    // Ensure it forms a closed loop
    if (points.length > 0) {
      points.push({ ...points[0] })
    }

    return NextResponse.json(points, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Error fetching OpenF1 circuit path:', error)
    return NextResponse.json({ error: 'Failed to fetch circuit path' }, { status: 500 })
  }
}
